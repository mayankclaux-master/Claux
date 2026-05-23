/**
 * Beta Trust Monitoring
 * 
 * Tracks:
 * - Recommendation trust
 * - Execution trust
 * - Dashboard trust
 * - Onboarding trust
 * - Connector trust
 * 
 * Detects:
 * - Distrust patterns
 * - Confusion patterns
 * - Abandonment patterns
 * - Support-heavy tenants
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { realUserBehaviorAnalytics } from './real-user-behavior-analytics';
import { betaSupportOperations } from './beta-support-operations';
import { betaOnboardingSupervision } from './beta-onboarding-supervision';

/**
 * Trust target
 */
export enum TrustTarget {
  RECOMMENDATION = 'recommendation',
  EXECUTION = 'execution',
  DASHBOARD = 'dashboard',
  ONBOARDING = 'onboarding',
  CONNECTOR = 'connector',
}

/**
 * Trust event
 */
export interface TrustEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  target: TrustTarget;
  targetId?: string;
  trustLevel: number; // 0-100
  reason?: string;
}

/**
 * Tenant trust metrics
 */
export interface TenantTrustMetrics {
  tenantId: string;
  recommendationTrust: number;
  executionTrust: number;
  dashboardTrust: number;
  onboardingTrust: number;
  connectorTrust: number;
  overallTrust: number;
  distrustPatterns: string[];
  confusionPatterns: string[];
  abandonmentPatterns: string[];
  isSupportHeavy: boolean;
}

/**
 * Beta trust monitoring
 */
export class BetaTrustMonitoring {
  private logger: Logger;
  private trustEvents: TrustEvent[] = [];
  private tenantMetrics: Map<string, TenantTrustMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record trust event
   */
  recordTrustEvent(params: {
    tenantId: string;
    target: TrustTarget;
    targetId?: string;
    trustLevel: number;
    reason?: string;
  }): void {
    const event: TrustEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.trustEvents.push(event);
    this.updateTenantMetrics(params.tenantId);
    this.logger.info('Trust event recorded', { event });
  }

  /**
   * Update tenant metrics
   */
  private updateTenantMetrics(tenantId: string): void {
    const tenantEvents = this.trustEvents.filter(e => e.tenantId === tenantId);

    // Calculate trust by target
    const recEvents = tenantEvents.filter(e => e.target === TrustTarget.RECOMMENDATION);
    const recommendationTrust = recEvents.length > 0
      ? Math.round(recEvents.reduce((sum, e) => sum + e.trustLevel, 0) / recEvents.length)
      : 85; // Baseline

    const execEvents = tenantEvents.filter(e => e.target === TrustTarget.EXECUTION);
    const executionTrust = execEvents.length > 0
      ? Math.round(execEvents.reduce((sum, e) => sum + e.trustLevel, 0) / execEvents.length)
      : 85; // Baseline

    const dashEvents = tenantEvents.filter(e => e.target === TrustTarget.DASHBOARD);
    const dashboardTrust = dashEvents.length > 0
      ? Math.round(dashEvents.reduce((sum, e) => sum + e.trustLevel, 0) / dashEvents.length)
      : 85; // Baseline

    const onboardEvents = tenantEvents.filter(e => e.target === TrustTarget.ONBOARDING);
    const onboardingTrust = onboardEvents.length > 0
      ? Math.round(onboardEvents.reduce((sum, e) => sum + e.trustLevel, 0) / onboardEvents.length)
      : 85; // Baseline

    const connEvents = tenantEvents.filter(e => e.target === TrustTarget.CONNECTOR);
    const connectorTrust = connEvents.length > 0
      ? Math.round(connEvents.reduce((sum, e) => sum + e.trustLevel, 0) / connEvents.length)
      : 85; // Baseline

    // Overall trust
    const overallTrust = Math.round(
      (recommendationTrust + executionTrust + dashboardTrust + onboardingTrust + connectorTrust) / 5
    );

    // Detect patterns
    const distrustPatterns: string[] = [];
    const confusionPatterns: string[] = [];
    const abandonmentPatterns: string[] = [];

    if (recommendationTrust < 50) {
      distrustPatterns.push('Low recommendation trust');
    }
    if (executionTrust < 50) {
      distrustPatterns.push('Low execution trust');
    }
    if (dashboardTrust < 50) {
      confusionPatterns.push('Dashboard confusion');
    }
    if (onboardingTrust < 50) {
      confusionPatterns.push('Onboarding confusion');
    }
    if (connectorTrust < 50) {
      distrustPatterns.push('Connector distrust');
    }

    // Check support burden
    const supportMetrics = betaSupportOperations.getTenantMetrics(tenantId);
    const isSupportHeavy = supportMetrics ? supportMetrics.totalActions >= 5 : false;
    if (isSupportHeavy) {
      confusionPatterns.push('High support burden');
    }

    // Check onboarding abandonment
    const onboardingRecord = betaOnboardingSupervision.getRecord(tenantId);
    if (onboardingRecord && onboardingRecord.currentStage === 'abandoned') {
      abandonmentPatterns.push('Onboarding abandoned');
    }

    this.tenantMetrics.set(tenantId, {
      tenantId,
      recommendationTrust,
      executionTrust,
      dashboardTrust,
      onboardingTrust,
      connectorTrust,
      overallTrust,
      distrustPatterns,
      confusionPatterns,
      abandonmentPatterns,
      isSupportHeavy,
    });
  }

  /**
   * Get tenant metrics
   */
  getTenantMetrics(tenantId: string): TenantTrustMetrics | undefined {
    return this.tenantMetrics.get(tenantId);
  }

  /**
   * Get all tenant metrics
   */
  getAllTenantMetrics(): TenantTrustMetrics[] {
    return Array.from(this.tenantMetrics.values()).sort((a, b) => a.overallTrust - b.overallTrust);
  }

  /**
   * Get low-trust tenants
   */
  getLowTrustTenants(threshold: number = 50): TenantTrustMetrics[] {
    return Array.from(this.tenantMetrics.values()).filter(m => m.overallTrust < threshold);
  }

  /**
   * Get distrust patterns across all tenants
   */
  getDistrustPatterns(): Array<{ pattern: string; count: number }> {
    const patternCounts: Record<string, number> = {};

    this.tenantMetrics.forEach(metrics => {
      metrics.distrustPatterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });

    return Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get confusion patterns across all tenants
   */
  getConfusionPatterns(): Array<{ pattern: string; count: number }> {
    const patternCounts: Record<string, number> = {};

    this.tenantMetrics.forEach(metrics => {
      metrics.confusionPatterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });

    return Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get abandonment patterns across all tenants
   */
  getAbandonmentPatterns(): Array<{ pattern: string; count: number }> {
    const patternCounts: Record<string, number> = {};

    this.tenantMetrics.forEach(metrics => {
      metrics.abandonmentPatterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
    });

    return Object.entries(patternCounts)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get support-heavy tenants
   */
  getSupportHeavyTenants(): TenantTrustMetrics[] {
    return Array.from(this.tenantMetrics.values()).filter(m => m.isSupportHeavy);
  }

  /**
   * Generate trust monitoring report
   */
  generateTrustReport(): string {
    const metrics = this.getAllTenantMetrics();
    const lowTrust = this.getLowTrustTenants();
    const distrustPatterns = this.getDistrustPatterns();
    const confusionPatterns = this.getConfusionPatterns();
    const abandonmentPatterns = this.getAbandonmentPatterns();
    const supportHeavy = this.getSupportHeavyTenants();

    let report = '=== Beta Trust Monitoring Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Trust Events: ${this.trustEvents.length}\n\n`;

    report += '--- Low Trust Tenants (<50) ---\n';
    lowTrust.forEach(m => {
      report += `${m.tenantId}: ${m.overallTrust}\n`;
      report += `  Recommendation: ${m.recommendationTrust}\n`;
      report += `  Execution: ${m.executionTrust}\n`;
      report += `  Dashboard: ${m.dashboardTrust}\n`;
      report += `  Onboarding: ${m.onboardingTrust}\n`;
      report += `  Connector: ${m.connectorTrust}\n`;
    });

    if (distrustPatterns.length > 0) {
      report += '\n--- Distrust Patterns ---\n';
      distrustPatterns.forEach(p => {
        report += `${p.pattern}: ${p.count} tenants\n`;
      });
    }

    if (confusionPatterns.length > 0) {
      report += '\n--- Confusion Patterns ---\n';
      confusionPatterns.forEach(p => {
        report += `${p.pattern}: ${p.count} tenants\n`;
      });
    }

    if (abandonmentPatterns.length > 0) {
      report += '\n--- Abandonment Patterns ---\n';
      abandonmentPatterns.forEach(p => {
        report += `${p.pattern}: ${p.count} tenants\n`;
      });
    }

    if (supportHeavy.length > 0) {
      report += '\n--- Support-Heavy Tenants ---\n';
      supportHeavy.forEach(m => {
        report += `${m.tenantId}: ${m.overallTrust} trust\n`;
      });
    }

    return report;
  }

  /**
   * Clear events (for testing only)
   */
  clearEvents(): void {
    this.logger.warn('Trust events cleared');
    this.trustEvents = [];
    this.tenantMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const betaTrustMonitoring = new BetaTrustMonitoring();
