/**
 * Beta Readiness Command Center
 * 
 * Creates internal command center showing:
 * - Beta tenant health
 * - Onboarding status
 * - Trust scores
 * - Support burden
 * - Execution quality
 * - Alert noise
 * - Intervention frequency
 * - Readiness trend
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { betaTenantAllowlistSystem, ApprovalState } from './beta-tenant-allowlist';
import { betaOnboardingSupervision } from './beta-onboarding-supervision';
import { betaTrustMonitoring } from './beta-trust-monitoring';
import { betaSupportOperations } from './beta-support-operations';
import { seoOutputValidation } from './seo-output-validation';
import { betaSafetyMonitoring } from './beta-safety-monitoring';
import { humanInterventionTracking } from './human-intervention-tracking';
import { launchReadinessDelta } from './launch-readiness-delta';

/**
 * Tenant health status
 */
export enum TenantHealthStatus {
  HEALTHY = 'healthy',
  WARNING = 'warning',
  CRITICAL = 'critical',
  OFFLINE = 'offline',
}

/**
 * Beta tenant health
 */
export interface BetaTenantHealth {
  tenantId: string;
  domain: string;
  approvalState: ApprovalState;
  healthStatus: TenantHealthStatus;
  onboardingStatus: string;
  onboardingFriction: number;
  trustScore: number;
  supportBurden: number;
  executionQuality: number;
  alertNoise: number;
  interventionFrequency: number;
  overallHealth: number; // 0-100
}

/**
 * Beta readiness summary
 */
export interface BetaReadinessSummary {
  timestamp: number;
  totalTenants: number;
  activeTenants: number;
  healthyTenants: number;
  warningTenants: number;
  criticalTenants: number;
  averageOnboardingFriction: number;
  averageTrustScore: number;
  averageSupportBurden: number;
  averageExecutionQuality: number;
  averageAlertNoise: number;
  averageInterventionFrequency: number;
  overallReadinessScore: number; // 0-100
  readinessTrend: 'improving' | 'stable' | 'declining';
  readinessLevel: 'ready' | 'needs_improvement' | 'not_ready';
}

/**
 * Beta readiness command center
 */
export class BetaReadinessCommandCenter {
  private logger: Logger;
  private healthHistory: Map<string, BetaReadinessSummary> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Get tenant health
   */
  getTenantHealth(tenantId: string): BetaTenantHealth | undefined {
    const allowlistEntry = betaTenantAllowlistSystem.getTenantEntry(tenantId);
    if (!allowlistEntry) {
      return undefined;
    }

    const onboardingRecord = betaOnboardingSupervision.getRecord(tenantId);
    const trustMetrics = betaTrustMonitoring.getTenantMetrics(tenantId);
    const supportMetrics = betaSupportOperations.getTenantMetrics(tenantId);
    const safetyMetrics = betaSafetyMonitoring.getTenantMetrics(tenantId);
    const interventionMetrics = humanInterventionTracking.getInterventionsByTenant(tenantId);

    const onboardingFriction = onboardingRecord?.frictionScore || 0;
    const trustScore = trustMetrics?.overallTrust || 85;
    const supportBurden = supportMetrics?.burdenScore || 0;
    const executionQuality = safetyMetrics ? 100 - safetyMetrics.riskScore : 85;
    const alertNoise = supportMetrics?.totalActions || 0;
    const interventionFrequency = interventionMetrics.length;

    // Calculate overall health
    let overallHealth = 100;
    overallHealth -= onboardingFriction * 0.3;
    overallHealth -= (100 - trustScore) * 0.2;
    overallHealth -= supportBurden * 0.2;
    overallHealth -= (100 - executionQuality) * 0.15;
    overallHealth -= Math.min(alertNoise, 50) * 0.1;
    overallHealth -= Math.min(interventionFrequency * 5, 50) * 0.05;

    overallHealth = Math.max(0, Math.round(overallHealth));

    // Determine health status
    let healthStatus: TenantHealthStatus;
    if (overallHealth >= 80) {
      healthStatus = TenantHealthStatus.HEALTHY;
    } else if (overallHealth >= 50) {
      healthStatus = TenantHealthStatus.WARNING;
    } else {
      healthStatus = TenantHealthStatus.CRITICAL;
    }

    const onboardingStatus = onboardingRecord?.currentStage || 'not_started';

    return {
      tenantId,
      domain: allowlistEntry.domain,
      approvalState: allowlistEntry.approvalState,
      healthStatus,
      onboardingStatus,
      onboardingFriction,
      trustScore,
      supportBurden,
      executionQuality,
      alertNoise,
      interventionFrequency,
      overallHealth,
    };
  }

  /**
   * Get all tenant health
   */
  getAllTenantHealth(): BetaTenantHealth[] {
    const allowlist = betaTenantAllowlistSystem['allowlist'] as Map<string, any>;
    const health: BetaTenantHealth[] = [];

    allowlist.forEach((entry, tenantId) => {
      const tenantHealth = this.getTenantHealth(tenantId);
      if (tenantHealth) {
        health.push(tenantHealth);
      }
    });

    return health.sort((a, b) => a.overallHealth - b.overallHealth);
  }

  /**
   * Generate readiness summary
   */
  generateReadinessSummary(): BetaReadinessSummary {
    const allHealth = this.getAllTenantHealth();
    const total = allHealth.length;

    const activeTenants = allHealth.filter(h => h.approvalState === ApprovalState.APPROVED).length;
    const healthyTenants = allHealth.filter(h => h.healthStatus === TenantHealthStatus.HEALTHY).length;
    const warningTenants = allHealth.filter(h => h.healthStatus === TenantHealthStatus.WARNING).length;
    const criticalTenants = allHealth.filter(h => h.healthStatus === TenantHealthStatus.CRITICAL).length;

    const averageOnboardingFriction = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.onboardingFriction, 0) / total)
      : 0;

    const averageTrustScore = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.trustScore, 0) / total)
      : 85;

    const averageSupportBurden = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.supportBurden, 0) / total)
      : 0;

    const averageExecutionQuality = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.executionQuality, 0) / total)
      : 85;

    const averageAlertNoise = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.alertNoise, 0) / total)
      : 0;

    const averageInterventionFrequency = total > 0
      ? Math.round(allHealth.reduce((sum, h) => sum + h.interventionFrequency, 0) / total)
      : 0;

    // Calculate overall readiness score
    let overallReadinessScore = 100;
    overallReadinessScore -= averageOnboardingFriction * 0.2;
    overallReadinessScore -= (100 - averageTrustScore) * 0.2;
    overallReadinessScore -= averageSupportBurden * 0.15;
    overallReadinessScore -= (100 - averageExecutionQuality) * 0.15;
    overallReadinessScore -= Math.min(averageAlertNoise, 50) * 0.15;
    overallReadinessScore -= Math.min(averageInterventionFrequency * 5, 50) * 0.15;

    overallReadinessScore = Math.max(0, Math.round(overallReadinessScore));

    // Determine trend
    const previousSummary = this.healthHistory.get('latest');
    let readinessTrend: 'improving' | 'stable' | 'declining';
    if (previousSummary) {
      const delta = overallReadinessScore - previousSummary.overallReadinessScore;
      if (delta > 5) {
        readinessTrend = 'improving';
      } else if (delta < -5) {
        readinessTrend = 'declining';
      } else {
        readinessTrend = 'stable';
      }
    } else {
      readinessTrend = 'stable';
    }

    // Determine readiness level
    let readinessLevel: 'ready' | 'needs_improvement' | 'not_ready';
    if (overallReadinessScore >= 85 && criticalTenants === 0) {
      readinessLevel = 'ready';
    } else if (overallReadinessScore >= 70 && criticalTenants <= 1) {
      readinessLevel = 'needs_improvement';
    } else {
      readinessLevel = 'not_ready';
    }

    const summary: BetaReadinessSummary = {
      timestamp: Date.now(),
      totalTenants: total,
      activeTenants,
      healthyTenants,
      warningTenants,
      criticalTenants,
      averageOnboardingFriction,
      averageTrustScore,
      averageSupportBurden,
      averageExecutionQuality,
      averageAlertNoise,
      averageInterventionFrequency,
      overallReadinessScore,
      readinessTrend,
      readinessLevel,
    };

    this.healthHistory.set('latest', summary);
    this.logger.info('Beta readiness summary generated', { summary });

    return summary;
  }

  /**
   * Generate command center report
   */
  generateCommandCenterReport(): string {
    const summary = this.generateReadinessSummary();
    const allHealth = this.getAllTenantHealth();
    const deltaReport = launchReadinessDelta.generateDeltaReport();

    let report = '=== Beta Readiness Command Center ===\n';
    report += `Generated: ${new Date(summary.timestamp).toISOString()}\n`;
    report += `Overall Readiness: ${summary.overallReadinessScore}%\n`;
    report += `Readiness Level: ${summary.readinessLevel.toUpperCase()}\n`;
    report += `Readiness Trend: ${summary.readinessTrend.toUpperCase()}\n\n`;

    report += '--- Tenant Health Summary ---\n';
    report += `Total Tenants: ${summary.totalTenants}\n`;
    report += `Active Tenants: ${summary.activeTenants}\n`;
    report += `Healthy: ${summary.healthyTenants}\n`;
    report += `Warning: ${summary.warningTenants}\n`;
    report += `Critical: ${summary.criticalTenants}\n\n`;

    report += '--- Average Metrics ---\n';
    report += `Onboarding Friction: ${summary.averageOnboardingFriction}\n`;
    report += `Trust Score: ${summary.averageTrustScore}\n`;
    report += `Support Burden: ${summary.averageSupportBurden}\n`;
    report += `Execution Quality: ${summary.averageExecutionQuality}\n`;
    report += `Alert Noise: ${summary.averageAlertNoise}\n`;
    report += `Intervention Frequency: ${summary.averageInterventionFrequency}\n\n`;

    report += '--- Tenant Health Details ---\n';
    allHealth.forEach(h => {
      report += `${h.tenantId} (${h.domain}):\n`;
      report += `  Health: ${h.healthStatus} (${h.overallHealth}%)\n`;
      report += `  Onboarding: ${h.onboardingStatus} (friction: ${h.onboardingFriction})\n`;
      report += `  Trust: ${h.trustScore}\n`;
      report += `  Support Burden: ${h.supportBurden}\n`;
      report += `  Execution Quality: ${h.executionQuality}\n`;
    });

    report += '\n--- Internal vs External Delta ---\n';
    report += deltaReport;

    return report;
  }

  /**
   * Clear history (for testing only)
   */
  clearHistory(): void {
    this.logger.warn('Command center history cleared');
    this.healthHistory.clear();
  }
}

/**
 * Singleton instance
 */
export const betaReadinessCommandCenter = new BetaReadinessCommandCenter();
