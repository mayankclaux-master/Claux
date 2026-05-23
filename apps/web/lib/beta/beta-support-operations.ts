/**
 * Beta Support Operations
 * 
 * Creates support tooling for:
 * - Onboarding rescue
 * - Connector recovery
 * - OAuth recovery
 * - Execution debugging
 * - Dashboard confusion
 * - Recommendation clarification
 * 
 * All support actions must be:
 * - Audited
 * - Trace-linked
 * - Tenant-linked
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Support action type
 */
export enum SupportActionType {
  ONBOARDING_RESCUE = 'onboarding_rescue',
  CONNECTOR_RECOVERY = 'connector_recovery',
  OAUTH_RECOVERY = 'oauth_recovery',
  EXECUTION_DEBUGGING = 'execution_debugging',
  DASHBOARD_CONFUSION = 'dashboard_confusion',
  RECOMMENDATION_CLARIFICATION = 'recommendation_clarification',
}

/**
 * Support action
 */
export interface SupportAction {
  id: string;
  timestamp: number;
  tenantId: string;
  actionType: SupportActionType;
  supportAgent: string;
  reason: string;
  resolution?: string;
  duration?: number;
  executionId?: string;
  connector?: string;
  traceId: string;
  resolved: boolean;
}

/**
 * Support burden metrics
 */
export interface SupportBurdenMetrics {
  tenantId: string;
  totalActions: number;
  byType: Record<string, number>;
  averageDuration: number;
  resolvedCount: number;
  unresolvedCount: number;
  burdenScore: number; // 0-100 (higher = more burden)
}

/**
 * Beta support operations
 */
export class BetaSupportOperations {
  private logger: Logger;
  private actions: SupportAction[] = [];
  private tenantMetrics: Map<string, SupportBurdenMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Create support action
   */
  createAction(params: {
    tenantId: string;
    actionType: SupportActionType;
    supportAgent: string;
    reason: string;
    executionId?: string;
    connector?: string;
  }): string {
    const action: SupportAction = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      traceId: crypto.randomUUID(),
      resolved: false,
      ...params,
    };

    this.actions.push(action);
    this.updateTenantMetrics(params.tenantId);
    this.logger.info('Support action created', { action });

    return action.id;
  }

  /**
   * Resolve support action
   */
  resolveAction(actionId: string, resolution: string, duration: number): void {
    const action = this.actions.find(a => a.id === actionId);
    if (action) {
      action.resolution = resolution;
      action.duration = duration;
      action.resolved = true;
      this.updateTenantMetrics(action.tenantId);
      this.logger.info('Support action resolved', { actionId, resolution, duration });
    }
  }

  /**
   * Update tenant metrics
   */
  private updateTenantMetrics(tenantId: string): void {
    const tenantActions = this.actions.filter(a => a.tenantId === tenantId);
    const total = tenantActions.length;

    const byType: Record<string, number> = {};
    tenantActions.forEach(a => {
      byType[a.actionType] = (byType[a.actionType] || 0) + 1;
    });

    const resolvedActions = tenantActions.filter(a => a.resolved);
    const averageDuration = resolvedActions.length > 0
      ? Math.round(resolvedActions.reduce((sum, a) => sum + (a.duration || 0), 0) / resolvedActions.length)
      : 0;

    const resolvedCount = resolvedActions.length;
    const unresolvedCount = total - resolvedCount;

    // Burden score: based on total actions and unresolved count
    const burdenScore = Math.min(100, (total * 10) + (unresolvedCount * 20));

    this.tenantMetrics.set(tenantId, {
      tenantId,
      totalActions: total,
      byType,
      averageDuration,
      resolvedCount,
      unresolvedCount,
      burdenScore,
    });
  }

  /**
   * Get support actions by tenant
   */
  getActionsByTenant(tenantId: string): SupportAction[] {
    return this.actions.filter(a => a.tenantId === tenantId);
  }

  /**
   * Get support actions by type
   */
  getActionsByType(actionType: SupportActionType): SupportAction[] {
    return this.actions.filter(a => a.actionType === actionType);
  }

  /**
   * Get support actions by agent
   */
  getActionsByAgent(supportAgent: string): SupportAction[] {
    return this.actions.filter(a => a.supportAgent === supportAgent);
  }

  /**
   * Get tenant metrics
   */
  getTenantMetrics(tenantId: string): SupportBurdenMetrics | undefined {
    return this.tenantMetrics.get(tenantId);
  }

  /**
   * Get all tenant metrics
   */
  getAllTenantMetrics(): SupportBurdenMetrics[] {
    return Array.from(this.tenantMetrics.values()).sort((a, b) => b.burdenScore - a.burdenScore);
  }

  /**
   * Get high-burden tenants
   */
  getHighBurdenTenants(threshold: number = 50): SupportBurdenMetrics[] {
    return Array.from(this.tenantMetrics.values()).filter(m => m.burdenScore >= threshold);
  }

  /**
   * Get support-heavy tenants (frequent support)
   */
  getSupportHeavyTenants(threshold: number = 5): SupportBurdenMetrics[] {
    return Array.from(this.tenantMetrics.values()).filter(m => m.totalActions >= threshold);
  }

  /**
   * Generate support burden report
   */
  generateSupportBurdenReport(): string {
    const metrics = this.getAllTenantMetrics();
    const highBurden = this.getHighBurdenTenants();
    const supportHeavy = this.getSupportHeavyTenants();

    let report = '=== Beta Support Burden Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Support Actions: ${this.actions.length}\n\n`;

    report += '--- High Burden Tenants (>=50) ---\n';
    highBurden.forEach(m => {
      report += `${m.tenantId}: ${m.burdenScore}\n`;
      report += `  Total Actions: ${m.totalActions}\n`;
      report += `  Unresolved: ${m.unresolvedCount}\n`;
      report += `  Avg Duration: ${m.averageDuration}ms\n`;
    });

    if (supportHeavy.length > 0) {
      report += '\n--- Support-Heavy Tenants (>=5 actions) ---\n';
      supportHeavy.forEach(m => {
        report += `${m.tenantId}: ${m.totalActions} actions\n`;
        report += `  Burden Score: ${m.burdenScore}\n`;
        report += `  By Type:\n`;
        Object.entries(m.byType).forEach(([type, count]) => {
          report += `    ${type}: ${count}\n`;
        });
      });
    }

    return report;
  }

  /**
   * Generate support audit report
   */
  generateAuditReport(): string {
    let report = '=== Beta Support Audit Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Actions: ${this.actions.length}\n\n`;

    report += '--- Recent Support Actions ---\n';
    this.actions.slice(-20).forEach(action => {
      report += `${action.id} - ${action.actionType}\n`;
      report += `  Tenant: ${action.tenantId}\n`;
      report += `  Agent: ${action.supportAgent}\n`;
      report += `  Reason: ${action.reason}\n`;
      report += `  Trace ID: ${action.traceId}\n`;
      report += `  Resolved: ${action.resolved ? 'YES' : 'NO'}\n`;
      if (action.resolution) {
        report += `  Resolution: ${action.resolution}\n`;
      }
      if (action.duration) {
        report += `  Duration: ${action.duration}ms\n`;
      }
    });

    return report;
  }

  /**
   * Clear actions (for testing only)
   */
  clearActions(): void {
    this.logger.warn('Support actions cleared');
    this.actions = [];
    this.tenantMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const betaSupportOperations = new BetaSupportOperations();
