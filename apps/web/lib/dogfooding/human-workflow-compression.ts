/**
 * Human Workflow Compression
 * 
 * Identifies:
 * - Workflows taking too many clicks
 * - Repetitive operator actions
 * - Repeated debugging patterns
 * - Repeated onboarding interventions
 * - Repeated connector recovery patterns
 * 
 * Generates:
 * - Workflow simplification recommendations
 * - Operational efficiency scoring
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Workflow type
 */
export enum WorkflowType {
  DEBUGGING = 'debugging',
  ONBOARDING_INTERVENTION = 'onboarding_intervention',
  CONNECTOR_RECOVERY = 'connector_recovery',
  TASK_REVIEW = 'task_review',
  RECOMMENDATION_REVIEW = 'recommendation_review',
  ALERT_RESPONSE = 'alert_response',
}

/**
 * Workflow step
 */
export interface WorkflowStep {
  action: string;
  timestamp: number;
  duration: number;
}

/**
 * Workflow record
 */
export interface WorkflowRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  operatorId: string;
  type: WorkflowType;
  steps: WorkflowStep[];
  totalDuration: number;
  totalClicks: number;
  completed: boolean;
}

/**
 * Workflow compression metrics
 */
export interface WorkflowCompressionMetrics {
  type: WorkflowType;
  totalWorkflows: number;
  averageDuration: number;
  averageClicks: number;
  efficiencyScore: number; // 0-100
  repetitivePatterns: string[];
  simplificationRecommendations: string[];
}

/**
 * Human workflow compression
 */
export class HumanWorkflowCompression {
  private logger: Logger;
  private workflows: WorkflowRecord[] = [];
  private workflowMetrics: Map<WorkflowType, WorkflowCompressionMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record workflow
   */
  recordWorkflow(params: {
    tenantId: string;
    operatorId: string;
    type: WorkflowType;
    steps: WorkflowStep[];
    completed: boolean;
  }): void {
    const totalDuration = params.steps.reduce((sum, step) => sum + step.duration, 0);
    const totalClicks = params.steps.length;

    const record: WorkflowRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
      totalDuration,
      totalClicks,
    };

    this.workflows.push(record);
    this.updateWorkflowMetrics(params.type);
    this.logger.info('Workflow recorded', { record });
  }

  /**
   * Update workflow metrics
   */
  private updateWorkflowMetrics(type: WorkflowType): void {
    const typeWorkflows = this.workflows.filter(w => w.type === type);
    const total = typeWorkflows.length;

    const averageDuration = total > 0
      ? Math.round(typeWorkflows.reduce((sum, w) => sum + w.totalDuration, 0) / total)
      : 0;

    const averageClicks = total > 0
      ? Math.round(typeWorkflows.reduce((sum, w) => sum + w.totalClicks, 0) / total)
      : 0;

    // Efficiency score: lower duration and clicks = higher efficiency
    const durationScore = Math.max(0, 100 - (averageDuration / 1000)); // 1 second = 1 point penalty
    const clickScore = Math.max(0, 100 - (averageClicks * 5)); // 1 click = 5 point penalty
    const efficiencyScore = Math.round((durationScore + clickScore) / 2);

    // Detect repetitive patterns
    const repetitivePatterns = this.detectRepetitivePatterns(type);

    // Generate simplification recommendations
    const simplificationRecommendations = this.generateSimplificationRecommendations(type, averageDuration, averageClicks);

    this.workflowMetrics.set(type, {
      type,
      totalWorkflows: total,
      averageDuration,
      averageClicks,
      efficiencyScore,
      repetitivePatterns,
      simplificationRecommendations,
    });
  }

  /**
   * Detect repetitive patterns
   */
  private detectRepetitivePatterns(type: WorkflowType): string[] {
    const typeWorkflows = this.workflows.filter(w => w.type === type);
    const patterns: string[] = [];

    // Detect repeated debugging patterns
    if (type === WorkflowType.DEBUGGING) {
      const errorPatterns: Record<string, number> = {};
      typeWorkflows.forEach(w => {
        w.steps.forEach(step => {
          if (step.action.includes('error')) {
            errorPatterns[step.action] = (errorPatterns[step.action] || 0) + 1;
          }
        });
      });

      Object.entries(errorPatterns).forEach(([pattern, count]) => {
        if (count >= 3) {
          patterns.push(`Repeated error pattern: ${pattern} (${count} times)`);
        }
      });
    }

    // Detect repeated onboarding interventions
    if (type === WorkflowType.ONBOARDING_INTERVENTION) {
      const interventionSteps: Record<string, number> = {};
      typeWorkflows.forEach(w => {
        w.steps.forEach(step => {
          interventionSteps[step.action] = (interventionSteps[step.action] || 0) + 1;
        });
      });

      Object.entries(interventionSteps).forEach(([step, count]) => {
        if (count >= 5) {
          patterns.push(`Repeated intervention step: ${step} (${count} times)`);
        }
      });
    }

    // Detect repeated connector recovery patterns
    if (type === WorkflowType.CONNECTOR_RECOVERY) {
      const recoveryActions: Record<string, number> = {};
      typeWorkflows.forEach(w => {
        w.steps.forEach(step => {
          recoveryActions[step.action] = (recoveryActions[step.action] || 0) + 1;
        });
      });

      Object.entries(recoveryActions).forEach(([action, count]) => {
        if (count >= 3) {
          patterns.push(`Repeated recovery action: ${action} (${count} times)`);
        }
      });
    }

    return patterns;
  }

  /**
   * Generate simplification recommendations
   */
  private generateSimplificationRecommendations(type: WorkflowType, avgDuration: number, avgClicks: number): string[] {
    const recommendations: string[] = [];

    if (avgDuration > 30000) { // More than 30 seconds
      recommendations.push(`Workflow takes too long (${Math.round(avgDuration / 1000)}s avg). Consider automation or UI simplification.`);
    }

    if (avgClicks > 10) {
      recommendations.push(`Workflow requires too many clicks (${avgClicks} avg). Consider consolidating steps.`);
    }

    if (type === WorkflowType.DEBUGGING) {
      recommendations.push('Consider adding one-click debug actions for common issues.');
    }

    if (type === WorkflowType.ONBOARDING_INTERVENTION) {
      recommendations.push('Consider automating common onboarding interventions.');
    }

    if (type === WorkflowType.CONNECTOR_RECOVERY) {
      recommendations.push('Consider adding automatic connector recovery for common issues.');
    }

    return recommendations;
  }

  /**
   * Identify workflows taking too many clicks
   */
  identifyHighClickWorkflows(threshold: number = 10): WorkflowRecord[] {
    return this.workflows.filter(w => w.totalClicks > threshold);
  }

  /**
   * Identify repetitive operator actions
 */
  identifyRepetitiveActions(threshold: number = 5): Array<{ action: string; count: number }> {
    const actionCounts: Record<string, number> = {};

    this.workflows.forEach(w => {
      w.steps.forEach(step => {
        actionCounts[step.action] = (actionCounts[step.action] || 0) + 1;
      });
    });

    return Object.entries(actionCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get workflow metrics
   */
  getWorkflowMetrics(type: WorkflowType): WorkflowCompressionMetrics | undefined {
    return this.workflowMetrics.get(type);
  }

  /**
   * Get all workflow metrics
   */
  getAllWorkflowMetrics(): WorkflowCompressionMetrics[] {
    return Array.from(this.workflowMetrics.values()).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  }

  /**
   * Generate operational efficiency score
   */
  generateOperationalEfficiencyScore(): number {
    const metrics = this.getAllWorkflowMetrics();
    if (metrics.length === 0) return 100;

    return Math.round(
      metrics.reduce((sum, m) => sum + m.efficiencyScore, 0) / metrics.length
    );
  }

  /**
   * Generate compression report
   */
  generateCompressionReport(): string {
    const metrics = this.getAllWorkflowMetrics();
    const highClickWorkflows = this.identifyHighClickWorkflows();
    const repetitiveActions = this.identifyRepetitiveActions();
    const overallEfficiency = this.generateOperationalEfficiencyScore();

    let report = '=== Human Workflow Compression Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Workflows: ${this.workflows.length}\n`;
    report += `Overall Efficiency Score: ${overallEfficiency}/100\n\n`;

    report += '--- Workflow Metrics by Type ---\n';
    metrics.forEach(m => {
      report += `${m.type}:\n`;
      report += `  Total Workflows: ${m.totalWorkflows}\n`;
      report += `  Avg Duration: ${m.averageDuration}ms\n`;
      report += `  Avg Clicks: ${m.averageClicks}\n`;
      report += `  Efficiency: ${m.efficiencyScore}%\n`;
      if (m.repetitivePatterns.length > 0) {
        report += `  Repetitive Patterns:\n`;
        m.repetitivePatterns.forEach(p => report += `    - ${p}\n`);
      }
      if (m.simplificationRecommendations.length > 0) {
        report += `  Simplification Recommendations:\n`;
        m.simplificationRecommendations.forEach(r => report += `    - ${r}\n`);
      }
    });

    if (highClickWorkflows.length > 0) {
      report += '\n--- High-Click Workflows ---\n';
      highClickWorkflows.slice(0, 10).forEach(w => {
        report += `${w.type}: ${w.totalClicks} clicks\n`;
      });
    }

    if (repetitiveActions.length > 0) {
      report += '\n--- Repetitive Actions ---\n';
      repetitiveActions.slice(0, 10).forEach(r => {
        report += `${r.action}: ${r.count} times\n`;
      });
    }

    return report;
  }

  /**
   * Clear workflows (for testing only)
   */
  clearWorkflows(): void {
    this.logger.warn('Workflow records cleared');
    this.workflows = [];
    this.workflowMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const humanWorkflowCompression = new HumanWorkflowCompression();
