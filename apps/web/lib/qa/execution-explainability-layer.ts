/**
 * Execution Explainability Layer
 * 
 * Every execution must now expose:
 * - Why it ran
 * - What connectors were used
 * - What data sources were used
 * - What failed
 * - What succeeded
 * - Why tasks were generated
 * - Why recommendations were generated
 * - Confidence scoring
 * 
 * Human operators must understand executions easily.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Execution explanation
 */
export interface ExecutionExplanation {
  executionId: string;
  timestamp: number;
  tenantId: string;
  triggerReason: string;
  connectorsUsed: string[];
  dataSourcesUsed: string[];
  steps: ExecutionStep[];
  failures: ExecutionFailure[];
  successes: ExecutionSuccess[];
  taskGenerationReason: string;
  recommendationGenerationReason: string;
  confidenceScore: number; // 0-100
  summary: string;
}

/**
 * Execution step
 */
export interface ExecutionStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration: number;
  dataUsed?: string[];
}

/**
 * Execution failure
 */
export interface ExecutionFailure {
  step: string;
  error: string;
  severity: 'critical' | 'warning' | 'info';
  impact: string;
  recoveryAction?: string;
}

/**
 * Execution success
 */
export interface ExecutionSuccess {
  step: string;
  result: string;
  dataProduced: string[];
  confidence: number;
}

/**
 * Execution explainability layer
 */
export class ExecutionExplainabilityLayer {
  private logger: Logger;
  private explanations: Map<string, ExecutionExplanation> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Create execution explanation
   */
  createExplanation(params: {
    executionId: string;
    tenantId: string;
    triggerReason: string;
    connectorsUsed: string[];
    dataSourcesUsed: string[];
    steps: ExecutionStep[];
    failures: ExecutionFailure[];
    successes: ExecutionSuccess[];
    taskGenerationReason: string;
    recommendationGenerationReason: string;
    confidenceScore: number;
    summary: string;
  }): ExecutionExplanation {
    const explanation: ExecutionExplanation = {
      timestamp: Date.now(),
      ...params,
    };

    this.explanations.set(params.executionId, explanation);
    this.logger.info('Execution explanation created', { executionId: params.executionId });

    return explanation;
  }

  /**
   * Get explanation by execution ID
   */
  getExplanation(executionId: string): ExecutionExplanation | undefined {
    return this.explanations.get(executionId);
  }

  /**
   * Get explanations by tenant
   */
  getExplanationsByTenant(tenantId: string): ExecutionExplanation[] {
    return Array.from(this.explanations.values())
      .filter(e => e.tenantId === tenantId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generate human-readable explanation
   */
  generateHumanReadableExplanation(executionId: string): string {
    const explanation = this.explanations.get(executionId);

    if (!explanation) {
      return 'No explanation found for this execution.';
    }

    let output = '=== Execution Explanation ===\n';
    output += `Execution ID: ${explanation.executionId}\n`;
    output += `Timestamp: ${new Date(explanation.timestamp).toISOString()}\n`;
    output += `Tenant: ${explanation.tenantId}\n`;
    output += `Confidence Score: ${explanation.confidenceScore}%\n\n`;

    output += '--- Why This Execution Ran ---\n';
    output += `${explanation.triggerReason}\n\n`;

    output += '--- Connectors Used ---\n';
    explanation.connectorsUsed.forEach(connector => {
      output += `• ${connector}\n`;
    });
    output += '\n';

    output += '--- Data Sources Used ---\n';
    explanation.dataSourcesUsed.forEach(source => {
      output += `• ${source}\n`;
    });
    output += '\n';

    output += '--- Execution Steps ---\n';
    explanation.steps.forEach(step => {
      const status = step.status.toUpperCase();
      output += `${status} - ${step.name}\n`;
      output += `  ${step.description}\n`;
      output += `  Duration: ${step.duration}ms\n`;
      if (step.dataUsed) {
        output += `  Data Used: ${step.dataUsed.join(', ')}\n`;
      }
    });
    output += '\n';

    if (explanation.failures.length > 0) {
      output += '--- What Failed ---\n';
      explanation.failures.forEach(failure => {
        const severity = failure.severity.toUpperCase();
        output += `[${severity}] ${failure.step}\n`;
        output += `  Error: ${failure.error}\n`;
        output += `  Impact: ${failure.impact}\n`;
        if (failure.recoveryAction) {
          output += `  Recovery: ${failure.recoveryAction}\n`;
        }
      });
      output += '\n';
    }

    if (explanation.successes.length > 0) {
      output += '--- What Succeeded ---\n';
      explanation.successes.forEach(success => {
        output += `✓ ${success.step}\n`;
        output += `  Result: ${success.result}\n`;
        output += `  Data Produced: ${success.dataProduced.join(', ')}\n`;
        output += `  Confidence: ${success.confidence}%\n`;
      });
      output += '\n';
    }

    output += '--- Why Tasks Were Generated ---\n';
    output += `${explanation.taskGenerationReason}\n\n`;

    output += '--- Why Recommendations Were Generated ---\n';
    output += `${explanation.recommendationGenerationReason}\n\n`;

    output += '--- Summary ---\n';
    output += `${explanation.summary}\n`;

    return output;
  }

  /**
   * Generate execution summary for dashboard
   */
  generateDashboardSummary(executionId: string): {
    executionId: string;
    timestamp: number;
    triggerReason: string;
    status: 'success' | 'partial' | 'failed';
    confidenceScore: number;
    connectorCount: number;
    stepCount: number;
    failureCount: number;
    successCount: number;
  } | null {
    const explanation = this.explanations.get(executionId);

    if (!explanation) {
      return null;
    }

    const hasCriticalFailures = explanation.failures.some(f => f.severity === 'critical');
    const hasFailures = explanation.failures.length > 0;

    let status: 'success' | 'partial' | 'failed';
    if (hasCriticalFailures) {
      status = 'failed';
    } else if (hasFailures) {
      status = 'partial';
    } else {
      status = 'success';
    }

    return {
      executionId: explanation.executionId,
      timestamp: explanation.timestamp,
      triggerReason: explanation.triggerReason,
      status,
      confidenceScore: explanation.confidenceScore,
      connectorCount: explanation.connectorsUsed.length,
      stepCount: explanation.steps.length,
      failureCount: explanation.failures.length,
      successCount: explanation.successes.length,
    };
  }

  /**
   * Clear explanations (for testing only)
   */
  clearExplanations(): void {
    this.logger.warn('Execution explanations cleared');
    this.explanations.clear();
  }
}

/**
 * Singleton instance
 */
export const executionExplainabilityLayer = new ExecutionExplainabilityLayer();
