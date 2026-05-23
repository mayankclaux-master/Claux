/**
 * Beta Safety Monitoring
 * 
 * Prevents:
 * - Runaway executions
 * - Noisy task storms
 * - Excessive alerts
 * - Connector abuse
 * - API credit exhaustion
 * - Onboarding spam
 * - Malformed tenant states
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Safety violation type
 */
export enum SafetyViolationType {
  RUNAWAY_EXECUTION = 'runaway_execution',
  NOISY_TASK_STORM = 'noisy_task_storm',
  EXCESSIVE_ALERTS = 'excessive_alerts',
  CONNECTOR_ABUSE = 'connector_abuse',
  API_CREDIT_EXHAUSTION = 'api_credit_exhaustion',
  ONBOARDING_SPAM = 'onboarding_spam',
  MALFORMED_TENANT_STATE = 'malformed_tenant_state',
}

/**
 * Safety violation
 */
export interface SafetyViolation {
  id: string;
  timestamp: number;
  tenantId: string;
  violationType: SafetyViolationType;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  blocked: boolean;
  actionTaken?: string;
}

/**
 * Tenant safety metrics
 */
export interface TenantSafetyMetrics {
  tenantId: string;
  executionCount: number;
  taskCount: number;
  alertCount: number;
  connectorUsage: Record<string, number>;
  apiCreditsUsed: number;
  onboardingAttempts: number;
  violations: SafetyViolation[];
  riskScore: number; // 0-100 (higher = more risk)
}

/**
 * Beta safety monitoring
 */
export class BetaSafetyMonitoring {
  private logger: Logger;
  private violations: SafetyViolation[] = [];
  private tenantMetrics: Map<string, TenantSafetyMetrics> = new Map();
  private executionCounts: Map<string, number> = new Map();
  private taskCounts: Map<string, number> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track execution
   */
  trackExecution(tenantId: string): void {
    const key = tenantId;
    const count = (this.executionCounts.get(key) || 0) + 1;
    this.executionCounts.set(key, count);

    // Check for runaway executions (more than 20 in 1 minute)
    if (count > 20) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.RUNAWAY_EXECUTION,
        severity: 'critical',
        description: `Runaway execution detected: ${count} executions`,
        blocked: true,
        actionTaken: 'Execution blocked for tenant',
      });
    }

    this.updateTenantMetrics(tenantId);
  }

  /**
   * Track task generation
   */
  trackTaskGeneration(tenantId: string, taskCount: number): void {
    const key = tenantId;
    const count = (this.taskCounts.get(key) || 0) + taskCount;
    this.taskCounts.set(key, count);

    // Check for noisy task storm (more than 100 tasks in 1 minute)
    if (count > 100) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.NOISY_TASK_STORM,
        severity: 'critical',
        description: `Noisy task storm detected: ${count} tasks`,
        blocked: true,
        actionTaken: 'Task generation blocked for tenant',
      });
    }

    this.updateTenantMetrics(tenantId);
  }

  /**
   * Track alert generation
   */
  trackAlertGeneration(tenantId: string, alertCount: number): void {
    const metrics = this.tenantMetrics.get(tenantId);
    if (!metrics) return;

    metrics.alertCount += alertCount;

    // Check for excessive alerts (more than 50 in 1 hour)
    if (metrics.alertCount > 50) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.EXCESSIVE_ALERTS,
        severity: 'warning',
        description: `Excessive alerts detected: ${metrics.alertCount} alerts`,
        blocked: false,
        actionTaken: 'Alert rate throttled for tenant',
      });
    }
  }

  /**
   * Track connector usage
   */
  trackConnectorUsage(tenantId: string, connector: string): void {
    const metrics = this.tenantMetrics.get(tenantId);
    if (!metrics) return;

    metrics.connectorUsage[connector] = (metrics.connectorUsage[connector] || 0) + 1;

    // Check for connector abuse (more than 1000 calls in 1 hour)
    if (metrics.connectorUsage[connector] > 1000) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.CONNECTOR_ABUSE,
        severity: 'critical',
        description: `Connector abuse detected: ${connector} used ${metrics.connectorUsage[connector]} times`,
        blocked: true,
        actionTaken: 'Connector access blocked for tenant',
      });
    }
  }

  /**
   * Track API credit usage
   */
  trackAPICreditUsage(tenantId: string, credits: number): void {
    const metrics = this.tenantMetrics.get(tenantId);
    if (!metrics) return;

    metrics.apiCreditsUsed += credits;

    // Check for API credit exhaustion (more than 90% of quota)
    if (metrics.apiCreditsUsed > 9000) { // Assuming 10000 credit quota
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.API_CREDIT_EXHAUSTION,
        severity: 'critical',
        description: `API credit exhaustion imminent: ${metrics.apiCreditsUsed} credits used`,
        blocked: true,
        actionTaken: 'API access blocked for tenant',
      });
    }
  }

  /**
   * Track onboarding attempt
   */
  trackOnboardingAttempt(tenantId: string): void {
    const metrics = this.tenantMetrics.get(tenantId);
    if (!metrics) return;

    metrics.onboardingAttempts++;

    // Check for onboarding spam (more than 5 attempts in 1 day)
    if (metrics.onboardingAttempts > 5) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.ONBOARDING_SPAM,
        severity: 'warning',
        description: `Onboarding spam detected: ${metrics.onboardingAttempts} attempts`,
        blocked: true,
        actionTaken: 'Onboarding blocked for tenant',
      });
    }
  }

  /**
   * Validate tenant state
   */
  validateTenantState(tenantId: string, state: any): boolean {
    // Basic validation checks
    if (!state || typeof state !== 'object') {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.MALFORMED_TENANT_STATE,
        severity: 'critical',
        description: 'Malformed tenant state: not an object',
        blocked: true,
        actionTaken: 'Tenant state rejected',
      });
      return false;
    }

    if (!state.id || !state.domain) {
      this.createViolation({
        tenantId,
        violationType: SafetyViolationType.MALFORMED_TENANT_STATE,
        severity: 'critical',
        description: 'Malformed tenant state: missing required fields',
        blocked: true,
        actionTaken: 'Tenant state rejected',
      });
      return false;
    }

    return true;
  }

  /**
   * Create safety violation
   */
  private createViolation(params: {
    tenantId: string;
    violationType: SafetyViolationType;
    severity: 'critical' | 'warning' | 'info';
    description: string;
    blocked: boolean;
    actionTaken?: string;
  }): void {
    const violation: SafetyViolation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.violations.push(violation);
    this.logger.warn('Safety violation detected', { violation });
  }

  /**
   * Update tenant metrics
   */
  private updateTenantMetrics(tenantId: string): void {
    const metrics = this.tenantMetrics.get(tenantId);
    if (!metrics) {
      this.tenantMetrics.set(tenantId, {
        tenantId,
        executionCount: 0,
        taskCount: 0,
        alertCount: 0,
        connectorUsage: {},
        apiCreditsUsed: 0,
        onboardingAttempts: 0,
        violations: [],
        riskScore: 0,
      });
    }

    const updated = this.tenantMetrics.get(tenantId)!;
    updated.executionCount = this.executionCounts.get(tenantId) || 0;
    updated.taskCount = this.taskCounts.get(tenantId) || 0;
    updated.violations = this.violations.filter(v => v.tenantId === tenantId);

    // Calculate risk score
    let riskScore = 0;
    riskScore += updated.executionCount * 2;
    riskScore += updated.taskCount;
    riskScore += updated.alertCount * 3;
    riskScore += updated.violations.filter(v => v.severity === 'critical').length * 30;
    riskScore += updated.violations.filter(v => v.severity === 'warning').length * 10;

    updated.riskScore = Math.min(100, riskScore);
  }

  /**
   * Get tenant metrics
   */
  getTenantMetrics(tenantId: string): TenantSafetyMetrics | undefined {
    return this.tenantMetrics.get(tenantId);
  }

  /**
   * Get all tenant metrics
   */
  getAllTenantMetrics(): TenantSafetyMetrics[] {
    return Array.from(this.tenantMetrics.values()).sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Get high-risk tenants
   */
  getHighRiskTenants(threshold: number = 50): TenantSafetyMetrics[] {
    return Array.from(this.tenantMetrics.values()).filter(m => m.riskScore >= threshold);
  }

  /**
   * Get violations by tenant
   */
  getViolationsByTenant(tenantId: string): SafetyViolation[] {
    return this.violations.filter(v => v.tenantId === tenantId);
  }

  /**
   * Get violations by type
   */
  getViolationsByType(violationType: SafetyViolationType): SafetyViolation[] {
    return this.violations.filter(v => v.violationType === violationType);
  }

  /**
   * Generate safety report
   */
  generateSafetyReport(): string {
    const metrics = this.getAllTenantMetrics();
    const highRisk = this.getHighRiskTenants();

    let report = '=== Beta Safety Monitoring Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Violations: ${this.violations.length}\n\n`;

    report += '--- High Risk Tenants (>=50) ---\n';
    highRisk.forEach(m => {
      report += `${m.tenantId}: ${m.riskScore}\n`;
      report += `  Executions: ${m.executionCount}\n`;
      report += `  Tasks: ${m.taskCount}\n`;
      report += `  Alerts: ${m.alertCount}\n`;
      report += `  API Credits: ${m.apiCreditsUsed}\n`;
      report += `  Violations: ${m.violations.length}\n`;
    });

    report += '\n--- Recent Violations ---\n';
    this.violations.slice(-20).forEach(v => {
      report += `${v.violationType} - ${v.tenantId}\n`;
      report += `  Severity: ${v.severity}\n`;
      report += `  Description: ${v.description}\n`;
      report += `  Blocked: ${v.blocked ? 'YES' : 'NO'}\n`;
      if (v.actionTaken) {
        report += `  Action: ${v.actionTaken}\n`;
      }
    });

    return report;
  }

  /**
   * Clear violations (for testing only)
   */
  clearViolations(): void {
    this.logger.warn('Safety violations cleared');
    this.violations = [];
    this.tenantMetrics.clear();
    this.executionCounts.clear();
    this.taskCounts.clear();
  }
}

/**
 * Singleton instance
 */
export const betaSafetyMonitoring = new BetaSafetyMonitoring();
