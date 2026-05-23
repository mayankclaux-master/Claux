/**
 * Operational Friction Detection
 * 
 * Detects:
 * - Excessive retries
 * - Excessive onboarding duration
 * - Noisy task generation
 * - Duplicate tasks
 * - Overwhelming dashboards
 * - Execution spam
 * - Connector instability patterns
 * 
 * Generates operational friction reports.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Friction type
 */
export enum FrictionType {
  EXCESSIVE_RETRIES = 'excessive_retries',
  EXCESSIVE_ONBOARDING_DURATION = 'excessive_onboarding_duration',
  NOISY_TASK_GENERATION = 'noisy_task_generation',
  DUPLICATE_TASKS = 'duplicate_tasks',
  OVERWHELMING_DASHBOARD = 'overwhelming_dashboard',
  EXECUTION_SPAM = 'execution_spam',
  CONNECTOR_INSTABILITY = 'connector_instability',
}

/**
 * Friction event
 */
export interface FrictionEvent {
  id: string;
  type: FrictionType;
  timestamp: number;
  tenantId: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  metrics: Record<string, number>;
  recommendation?: string;
}

/**
 * Operational friction detection service
 */
export class OperationalFrictionDetection {
  private logger: Logger;
  private frictionEvents: FrictionEvent[] = [];
  private retryCounts: Map<string, number> = new Map();
  private onboardingDurations: Map<string, number> = new Map();
  private taskGenerationCounts: Map<string, number> = new Map();
  private executionCounts: Map<string, number> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track retry
   */
  trackRetry(tenantId: string, operation: string): void {
    const key = `${tenantId}:${operation}`;
    const count = (this.retryCounts.get(key) || 0) + 1;
    this.retryCounts.set(key, count);

    // Check for excessive retries
    if (count >= 5) {
      this.createFrictionEvent({
        type: FrictionType.EXCESSIVE_RETRIES,
        tenantId,
        severity: 'warning',
        description: `Excessive retries detected for ${operation}`,
        metrics: { retryCount: count },
        recommendation: 'Investigate connector stability or API limits',
      });
    }
  }

  /**
   * Track onboarding duration
   */
  trackOnboardingDuration(tenantId: string, duration: number): void {
    this.onboardingDurations.set(tenantId, duration);

    // Check for excessive onboarding duration (10 minutes)
    if (duration > 600000) {
      this.createFrictionEvent({
        type: FrictionType.EXCESSIVE_ONBOARDING_DURATION,
        tenantId,
        severity: 'warning',
        description: `Onboarding took ${Math.round(duration / 1000)}s, which is excessive`,
        metrics: { duration },
        recommendation: 'Review onboarding process for inefficiencies',
      });
    }
  }

  /**
   * Track task generation
   */
  trackTaskGeneration(tenantId: string, taskCount: number): void {
    const key = tenantId;
    const count = (this.taskGenerationCounts.get(key) || 0) + taskCount;
    this.taskGenerationCounts.set(key, count);

    // Check for noisy task generation (more than 50 tasks in an execution)
    if (taskCount > 50) {
      this.createFrictionEvent({
        type: FrictionType.NOISY_TASK_GENERATION,
        tenantId,
        severity: 'warning',
        description: `Noisy task generation: ${taskCount} tasks generated`,
        metrics: { taskCount },
        recommendation: 'Review task generation logic for noise',
      });
    }
  }

  /**
   * Track execution
   */
  trackExecution(tenantId: string): void {
    const key = tenantId;
    const count = (this.executionCounts.get(key) || 0) + 1;
    this.executionCounts.set(key, count);

    // Check for execution spam (more than 10 executions in 1 minute)
    if (count > 10) {
      this.createFrictionEvent({
        type: FrictionType.EXECUTION_SPAM,
        tenantId,
        severity: 'critical',
        description: `Execution spam detected: ${count} executions`,
        metrics: { executionCount: count },
        recommendation: 'Investigate automated execution triggers',
      });
    }
  }

  /**
   * Detect duplicate tasks
   */
  detectDuplicateTasks(tenantId: string, tasks: string[]): void {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    tasks.forEach(task => {
      const normalized = task.toLowerCase().trim();
      if (seen.has(normalized)) {
        duplicates.push(task);
      }
      seen.add(normalized);
    });

    if (duplicates.length > 0) {
      this.createFrictionEvent({
        type: FrictionType.DUPLICATE_TASKS,
        tenantId,
        severity: 'warning',
        description: `Duplicate tasks detected: ${duplicates.length} duplicates`,
        metrics: { duplicateCount: duplicates.length },
        recommendation: 'Review task deduplication logic',
      });
    }
  }

  /**
   * Detect overwhelming dashboard
   */
  detectOverwhelmingDashboard(tenantId: string, metricCount: number): void {
    // Check for overwhelming dashboard (more than 100 metrics)
    if (metricCount > 100) {
      this.createFrictionEvent({
        type: FrictionType.OVERWHELMING_DASHBOARD,
        tenantId,
        severity: 'warning',
        description: `Overwhelming dashboard: ${metricCount} metrics displayed`,
        metrics: { metricCount },
        recommendation: 'Consider dashboard simplification or grouping',
      });
    }
  }

  /**
   * Detect connector instability
   */
  detectConnectorInstability(tenantId: string, connector: string, failureRate: number): void {
    // Check for connector instability (failure rate > 20%)
    if (failureRate > 20) {
      this.createFrictionEvent({
        type: FrictionType.CONNECTOR_INSTABILITY,
        tenantId,
        severity: 'critical',
        description: `Connector instability detected: ${connector} at ${failureRate}% failure rate`,
        metrics: { failureRate },
        recommendation: 'Investigate connector health and API limits',
      });
    }
  }

  /**
   * Create friction event
   */
  private createFrictionEvent(params: {
    type: FrictionType;
    tenantId: string;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    metrics: Record<string, number>;
    recommendation?: string;
  }): void {
    const event: FrictionEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.frictionEvents.push(event);
    this.logger.warn('Operational friction detected', { event });
  }

  /**
   * Get friction events by tenant
   */
  getFrictionEventsByTenant(tenantId: string): FrictionEvent[] {
    return this.frictionEvents.filter(e => e.tenantId === tenantId);
  }

  /**
   * Get friction events by type
   */
  getFrictionEventsByType(type: FrictionType): FrictionEvent[] {
    return this.frictionEvents.filter(e => e.type === type);
  }

  /**
   * Get friction events by severity
   */
  getFrictionEventsBySeverity(severity: 'critical' | 'warning' | 'info'): FrictionEvent[] {
    return this.frictionEvents.filter(e => e.severity === severity);
  }

  /**
   * Get friction statistics
   */
  getFrictionStatistics(): {
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byTenant: Record<string, number>;
  } {
    const total = this.frictionEvents.length;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byTenant: Record<string, number> = {};

    this.frictionEvents.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      bySeverity[event.severity] = (bySeverity[event.severity] || 0) + 1;
      byTenant[event.tenantId] = (byTenant[event.tenantId] || 0) + 1;
    });

    return {
      totalEvents: total,
      byType,
      bySeverity,
      byTenant,
    };
  }

  /**
   * Generate friction report
   */
  generateFrictionReport(): string {
    const stats = this.getFrictionStatistics();
    const recentEvents = [...this.frictionEvents].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    let report = '=== Operational Friction Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Friction Events: ${stats.totalEvents}\n\n`;

    report += '--- Friction by Type ---\n';
    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Friction by Severity ---\n';
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      report += `${severity}: ${count}\n`;
    });

    report += '\n--- Friction by Tenant ---\n';
    Object.entries(stats.byTenant).forEach(([tenantId, count]) => {
      report += `${tenantId}: ${count}\n`;
    });

    report += '\n--- Recent Friction Events ---\n';
    recentEvents.forEach(event => {
      report += `${new Date(event.timestamp).toISOString()} - ${event.type}\n`;
      report += `  Tenant: ${event.tenantId}\n`;
      report += `  Severity: ${event.severity}\n`;
      report += `  Description: ${event.description}\n`;
      if (event.recommendation) {
        report += `  Recommendation: ${event.recommendation}\n`;
      }
    });

    return report;
  }

  /**
   * Clear friction events (for testing only)
   */
  clearFrictionEvents(): void {
    this.logger.warn('Friction events cleared');
    this.frictionEvents = [];
    this.retryCounts.clear();
    this.onboardingDurations.clear();
    this.taskGenerationCounts.clear();
    this.executionCounts.clear();
  }
}

/**
 * Singleton instance
 */
export const operationalFrictionDetection = new OperationalFrictionDetection();
