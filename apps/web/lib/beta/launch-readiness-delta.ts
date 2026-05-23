/**
 * Launch Readiness Delta
 * 
 * Compares:
 * - Internal operator metrics vs external beta metrics
 * 
 * Identifies:
 * - Systems that degrade with real users
 * - Onboarding quality gaps
 * - Trust gaps
 * - Dashboard usability gaps
 * - Recommendation usefulness gaps
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { realUserBehaviorAnalytics, UserType } from './real-user-behavior-analytics';
import { betaOnboardingSupervision } from './beta-onboarding-supervision';
import { betaTrustMonitoring } from './beta-trust-monitoring';
import { seoOutputValidation } from './seo-output-validation';
import { betaSupportOperations } from './beta-support-operations';
import { humanInterventionTracking } from './human-intervention-tracking';

/**
 * Delta metric
 */
export interface DeltaMetric {
  metric: string;
  internalValue: number;
  externalValue: number;
  delta: number; // external - internal
  status: 'improved' | 'degraded' | 'stable';
  significance: 'high' | 'medium' | 'low';
}

/**
 * System gap
 */
export interface SystemGap {
  system: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  internalScore: number;
  externalScore: number;
  delta: number;
}

/**
 * Launch readiness delta report
 */
export interface LaunchReadinessDeltaReport {
  timestamp: number;
  deltaMetrics: DeltaMetric[];
  systemGaps: SystemGap[];
  overallDelta: number;
  readinessAssessment: 'ready' | 'needs_improvement' | 'not_ready';
  criticalGaps: string[];
  recommendations: string[];
}

/**
 * Launch readiness delta
 */
export class LaunchReadinessDelta {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Generate delta report
   */
  generateDeltaReport(): LaunchReadinessDeltaReport {
    this.logger.info('Generating launch readiness delta report');

    const deltaMetrics: DeltaMetric[] = [];
    const systemGaps: SystemGap[] = [];

    // Compare behavior metrics
    const internalBehavior = realUserBehaviorAnalytics.getMetrics(UserType.INTERNAL_OPERATOR);
    const externalBehavior = realUserBehaviorAnalytics.getMetrics(UserType.EXTERNAL_BETA);

    if (internalBehavior && externalBehavior) {
      deltaMetrics.push({
        metric: 'Recommendation Acceptance Rate',
        internalValue: internalBehavior.acceptanceRate,
        externalValue: externalBehavior.acceptanceRate,
        delta: externalBehavior.acceptanceRate - internalBehavior.acceptanceRate,
        status: externalBehavior.acceptanceRate >= internalBehavior.acceptanceRate ? 'improved' : 'degraded',
        significance: Math.abs(externalBehavior.acceptanceRate - internalBehavior.acceptanceRate) > 10 ? 'high' : 'medium',
      });

      deltaMetrics.push({
        metric: 'Abandonment Rate',
        internalValue: internalBehavior.abandonmentRate,
        externalValue: externalBehavior.abandonmentRate,
        delta: externalBehavior.abandonmentRate - internalBehavior.abandonmentRate,
        status: externalBehavior.abandonmentRate <= internalBehavior.abandonmentRate ? 'improved' : 'degraded',
        significance: Math.abs(externalBehavior.abandonmentRate - internalBehavior.abandonmentRate) > 10 ? 'high' : 'medium',
      });

      deltaMetrics.push({
        metric: 'Trust Rate',
        internalValue: internalBehavior.trustRate,
        externalValue: externalBehavior.trustRate,
        delta: externalBehavior.trustRate - internalBehavior.trustRate,
        status: externalBehavior.trustRate >= internalBehavior.trustRate ? 'improved' : 'degraded',
        significance: Math.abs(externalBehavior.trustRate - internalBehavior.trustRate) > 10 ? 'high' : 'medium',
      });

      // Identify gaps
      if (externalBehavior.acceptanceRate < internalBehavior.acceptanceRate - 15) {
        systemGaps.push({
          system: 'Recommendation Engine',
          description: 'External users accept recommendations at significantly lower rate than internal operators',
          severity: 'warning',
          internalScore: internalBehavior.acceptanceRate,
          externalScore: externalBehavior.acceptanceRate,
          delta: externalBehavior.acceptanceRate - internalBehavior.acceptanceRate,
        });
      }

      if (externalBehavior.abandonmentRate > internalBehavior.abandonmentRate + 15) {
        systemGaps.push({
          system: 'Dashboard UX',
          description: 'External users abandon workflows at significantly higher rate than internal operators',
          severity: 'warning',
          internalScore: internalBehavior.abandonmentRate,
          externalScore: externalBehavior.abandonmentRate,
          delta: externalBehavior.abandonmentRate - internalBehavior.abandonmentRate,
        });
      }
    }

    // Compare onboarding friction
    const internalOnboarding = betaOnboardingSupervision.getRecord('internal');
    const externalOnboardings = betaOnboardingSupervision.getAllRecords().filter(r => r.tenantId !== 'internal');
    
    if (externalOnboardings.length > 0) {
      const avgExternalFriction = Math.round(
        externalOnboardings.reduce((sum, r) => sum + r.frictionScore, 0) / externalOnboardings.length
      );
      const internalFriction = internalOnboarding?.frictionScore || 20; // Baseline

      deltaMetrics.push({
        metric: 'Onboarding Friction',
        internalValue: internalFriction,
        externalValue: avgExternalFriction,
        delta: avgExternalFriction - internalFriction,
        status: avgExternalFriction <= internalFriction ? 'improved' : 'degraded',
        significance: Math.abs(avgExternalFriction - internalFriction) > 20 ? 'high' : 'medium',
      });

      if (avgExternalFriction > internalFriction + 20) {
        systemGaps.push({
          system: 'Onboarding Flow',
          description: 'External users experience significantly higher onboarding friction than internal operators',
          severity: 'critical',
          internalScore: internalFriction,
          externalScore: avgExternalFriction,
          delta: avgExternalFriction - internalFriction,
        });
      }
    }

    // Compare trust scores
    const lowTrustTenants = betaTrustMonitoring.getLowTrustTenants(50);
    if (lowTrustTenants.length > 0) {
      const avgExternalTrust = Math.round(
        lowTrustTenants.reduce((sum, t) => sum + t.overallTrust, 0) / lowTrustTenants.length
      );
      const internalTrust = 85; // Baseline

      deltaMetrics.push({
        metric: 'Overall Trust',
        internalValue: internalTrust,
        externalValue: avgExternalTrust,
        delta: avgExternalTrust - internalTrust,
        status: avgExternalTrust >= internalTrust ? 'improved' : 'degraded',
        significance: Math.abs(avgExternalTrust - internalTrust) > 15 ? 'high' : 'medium',
      });

      if (avgExternalTrust < internalTrust - 20) {
        systemGaps.push({
          system: 'Trust System',
          description: 'External users show significantly lower trust than internal operators',
          severity: 'critical',
          internalScore: internalTrust,
          externalScore: avgExternalTrust,
          delta: avgExternalTrust - internalTrust,
        });
      }
    }

    // Compare SEO output quality
    const agentMetrics = seoOutputValidation.getAllAgentMetrics();
    if (agentMetrics.length > 0) {
      const avgQuality = Math.round(
        agentMetrics.reduce((sum, m) => sum + m.averageQuality, 0) / agentMetrics.length
      );
      const internalQuality = 85; // Baseline

      deltaMetrics.push({
        metric: 'SEO Output Quality',
        internalValue: internalQuality,
        externalValue: avgQuality,
        delta: avgQuality - internalQuality,
        status: avgQuality >= internalQuality ? 'improved' : 'degraded',
        significance: Math.abs(avgQuality - internalQuality) > 10 ? 'high' : 'medium',
      });

      if (avgQuality < internalQuality - 15) {
        systemGaps.push({
          system: 'SEO Agents',
          description: 'SEO output quality for external users is significantly lower than internal baseline',
          severity: 'warning',
          internalScore: internalQuality,
          externalScore: avgQuality,
          delta: avgQuality - internalQuality,
        });
      }
    }

    // Calculate overall delta
    const degradedMetrics = deltaMetrics.filter(m => m.status === 'degraded');
    const overallDelta = degradedMetrics.length > 0
      ? Math.round(degradedMetrics.reduce((sum, m) => sum + Math.abs(m.delta), 0) / degradedMetrics.length)
      : 0;

    // Determine readiness assessment
    const criticalGaps = systemGaps.filter(g => g.severity === 'critical');
    let readinessAssessment: 'ready' | 'needs_improvement' | 'not_ready';
    if (criticalGaps.length === 0 && overallDelta < 15) {
      readinessAssessment = 'ready';
    } else if (criticalGaps.length <= 1 && overallDelta < 25) {
      readinessAssessment = 'needs_improvement';
    } else {
      readinessAssessment = 'not_ready';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    systemGaps.forEach(gap => {
      recommendations.push(`Address ${gap.system}: ${gap.description}`);
    });

    if (overallDelta > 20) {
      recommendations.push('Overall delta with external users is high - consider extended beta period');
    }

    const criticalGapDescriptions = systemGaps.filter(g => g.severity === 'critical').map(g => g.description);

    const report: LaunchReadinessDeltaReport = {
      timestamp: Date.now(),
      deltaMetrics,
      systemGaps,
      overallDelta,
      readinessAssessment,
      criticalGaps: criticalGapDescriptions,
      recommendations,
    };

    this.logger.info('Launch readiness delta report generated', { report });

    return report;
  }

  /**
   * Generate formatted delta report
   */
  generateFormattedReport(): string {
    const report = this.generateDeltaReport();

    let output = '=== Launch Readiness Delta Report ===\n';
    output += `Generated: ${new Date(report.timestamp).toISOString()}\n`;
    output += `Overall Delta: ${report.overallDelta}\n`;
    output += `Readiness Assessment: ${report.readinessAssessment.toUpperCase()}\n\n`;

    output += '--- Delta Metrics ---\n';
    report.deltaMetrics.forEach(m => {
      output += `${m.metric}:\n`;
      output += `  Internal: ${m.internalValue}\n`;
      output += `  External: ${m.externalValue}\n`;
      output += `  Delta: ${m.delta > 0 ? '+' : ''}${m.delta}\n`;
      output += `  Status: ${m.status}\n`;
      output += `  Significance: ${m.significance}\n`;
    });

    if (report.systemGaps.length > 0) {
      output += '\n--- System Gaps ---\n';
      report.systemGaps.forEach(gap => {
        output += `${gap.system} (${gap.severity.toUpperCase()}):\n`;
        output += `  ${gap.description}\n`;
        output += `  Internal: ${gap.internalScore}, External: ${gap.externalScore}\n`;
        output += `  Delta: ${gap.delta}\n`;
      });
    }

    if (report.criticalGaps.length > 0) {
      output += '\n--- Critical Gaps ---\n';
      report.criticalGaps.forEach(gap => {
        output += `• ${gap}\n`;
      });
    }

    if (report.recommendations.length > 0) {
      output += '\n--- Recommendations ---\n';
      report.recommendations.forEach(rec => {
        output += `• ${rec}\n`;
      });
    }

    return output;
  }
}

/**
 * Singleton instance
 */
export const launchReadinessDelta = new LaunchReadinessDelta();
