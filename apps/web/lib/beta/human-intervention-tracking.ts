/**
 * Human Intervention Tracking
 * 
 * Tracks all manual interventions:
 * - Onboarding intervention
 * - Connector intervention
 * - Execution intervention
 * - Dashboard intervention
 * - Recommendation override
 * - Task override
 * 
 * Measures:
 * - Intervention frequency
 * - Intervention causes
 * - Systems requiring redesign
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Intervention type
 */
export enum InterventionType {
  ONBOARDING = 'onboarding',
  CONNECTOR = 'connector',
  EXECUTION = 'execution',
  DASHBOARD = 'dashboard',
  RECOMMENDATION_OVERRIDE = 'recommendation_override',
  TASK_OVERRIDE = 'task_override',
}

/**
 * Intervention record
 */
export interface InterventionRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  interventionType: InterventionType;
  operatorId: string;
  reason: string;
  executionId?: string;
  connector?: string;
  recommendationId?: string;
  taskId?: string;
  duration?: number;
  successful: boolean;
}

/**
 * Intervention metrics
 */
export interface InterventionMetrics {
  interventionType: InterventionType;
  totalInterventions: number;
  averageDuration: number;
  successRate: number; // 0-100
  commonCauses: Array<{ cause: string; count: number }>;
  systemsNeedingRedesign: string[];
}

/**
 * Human intervention tracking
 */
export class HumanInterventionTracking {
  private logger: Logger;
  private interventions: InterventionRecord[] = [];
  private metrics: Map<InterventionType, InterventionMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record intervention
   */
  recordIntervention(params: {
    tenantId: string;
    interventionType: InterventionType;
    operatorId: string;
    reason: string;
    executionId?: string;
    connector?: string;
    recommendationId?: string;
    taskId?: string;
    duration?: number;
    successful: boolean;
  }): void {
    const record: InterventionRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.interventions.push(record);
    this.updateMetrics(params.interventionType);
    this.logger.info('Intervention recorded', { record });
  }

  /**
   * Update metrics for intervention type
   */
  private updateMetrics(interventionType: InterventionType): void {
    const typeInterventions = this.interventions.filter(i => i.interventionType === interventionType);
    const total = typeInterventions.length;

    const successfulInterventions = typeInterventions.filter(i => i.successful);
    const averageDuration = successfulInterventions.length > 0
      ? Math.round(successfulInterventions.reduce((sum, i) => sum + (i.duration || 0), 0) / successfulInterventions.length)
      : 0;

    const successRate = total > 0 ? Math.round((successfulInterventions.length / total) * 100) : 100;

    // Identify common causes
    const causeCounts: Record<string, number> = {};
    typeInterventions.forEach(i => {
      causeCounts[i.reason] = (causeCounts[i.reason] || 0) + 1;
    });

    const commonCauses = Object.entries(causeCounts)
      .map(([cause, count]) => ({ cause, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Identify systems needing redesign (high intervention frequency)
    const systemsNeedingRedesign: string[] = [];
    if (total > 10) {
      systemsNeedingRedesign.push(`${interventionType} system requires redesign (${total} interventions)`);
    }

    this.metrics.set(interventionType, {
      interventionType,
      totalInterventions: total,
      averageDuration,
      successRate,
      commonCauses,
      systemsNeedingRedesign,
    });
  }

  /**
   * Get interventions by tenant
   */
  getInterventionsByTenant(tenantId: string): InterventionRecord[] {
    return this.interventions.filter(i => i.tenantId === tenantId);
  }

  /**
   * Get interventions by type
   */
  getInterventionsByType(interventionType: InterventionType): InterventionRecord[] {
    return this.interventions.filter(i => i.interventionType === interventionType);
  }

  /**
   * Get interventions by operator
   */
  getInterventionsByOperator(operatorId: string): InterventionRecord[] {
    return this.interventions.filter(i => i.operatorId === operatorId);
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(interventionType: InterventionType): InterventionMetrics | undefined {
    return this.metrics.get(interventionType);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): InterventionMetrics[] {
    return Array.from(this.metrics.values()).sort((a, b) => b.totalInterventions - a.totalInterventions);
  }

  /**
   * Get intervention-heavy systems
   */
  getInterventionHeavySystems(threshold: number = 10): InterventionMetrics[] {
    return Array.from(this.metrics.values()).filter(m => m.totalInterventions >= threshold);
  }

  /**
   * Get systems needing redesign
   */
  getSystemsNeedingRedesign(): string[] {
    const systems: string[] = [];
    this.metrics.forEach(m => {
      m.systemsNeedingRedesign.forEach(s => systems.push(s));
    });
    return systems;
  }

  /**
   * Get intervention frequency
   */
  getInterventionFrequency(): {
    total: number;
    byType: Record<string, number>;
    byTenant: Record<string, number>;
    byOperator: Record<string, number>;
  } {
    const total = this.interventions.length;

    const byType: Record<string, number> = {};
    this.interventions.forEach(i => {
      byType[i.interventionType] = (byType[i.interventionType] || 0) + 1;
    });

    const byTenant: Record<string, number> = {};
    this.interventions.forEach(i => {
      byTenant[i.tenantId] = (byTenant[i.tenantId] || 0) + 1;
    });

    const byOperator: Record<string, number> = {};
    this.interventions.forEach(i => {
      byOperator[i.operatorId] = (byOperator[i.operatorId] || 0) + 1;
    });

    return {
      total,
      byType,
      byTenant,
      byOperator,
    };
  }

  /**
   * Generate intervention report
   */
  generateInterventionReport(): string {
    const metrics = this.getAllMetrics();
    const frequency = this.getInterventionFrequency();
    const interventionHeavy = this.getInterventionHeavySystems();
    const systemsNeedingRedesign = this.getSystemsNeedingRedesign();

    let report = '=== Human Intervention Tracking Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Interventions: ${frequency.total}\n\n`;

    report += '--- Intervention Frequency ---\n';
    report += `By Type:\n`;
    Object.entries(frequency.byType).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });

    report += `By Tenant:\n`;
    Object.entries(frequency.byTenant).forEach(([tenantId, count]) => {
      report += `  ${tenantId}: ${count}\n`;
    });

    report += `By Operator:\n`;
    Object.entries(frequency.byOperator).forEach(([operatorId, count]) => {
      report += `  ${operatorId}: ${count}\n`;
    });

    report += '\n--- Intervention Metrics by Type ---\n';
    metrics.forEach(m => {
      report += `${m.interventionType}:\n`;
      report += `  Total: ${m.totalInterventions}\n`;
      report += `  Avg Duration: ${m.averageDuration}ms\n`;
      report += `  Success Rate: ${m.successRate}%\n`;
      report += `  Common Causes:\n`;
      m.commonCauses.forEach(c => {
        report += `    ${c.cause}: ${c.count}\n`;
      });
    });

    if (interventionHeavy.length > 0) {
      report += '\n--- Intervention-Heavy Systems (>=10) ---\n';
      interventionHeavy.forEach(m => {
        report += `${m.interventionType}: ${m.totalInterventions} interventions\n`;
      });
    }

    if (systemsNeedingRedesign.length > 0) {
      report += '\n--- Systems Needing Redesign ---\n';
      systemsNeedingRedesign.forEach(s => {
        report += `• ${s}\n`;
      });
    }

    return report;
  }

  /**
   * Clear interventions (for testing only)
   */
  clearInterventions(): void {
    this.logger.warn('Intervention records cleared');
    this.interventions = [];
    this.metrics.clear();
  }
}

/**
 * Singleton instance
 */
export const humanInterventionTracking = new HumanInterventionTracking();
