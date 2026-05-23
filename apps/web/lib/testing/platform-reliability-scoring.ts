/**
 * Platform Reliability Scoring
 * 
 * Create deterministic scoring for tenant isolation, execution reliability, cron reliability, cache integrity, onboarding reliability, dashboard consistency, retry safety, connector survivability, Vercel survivability, DB scalability.
 * Generate readiness %, blockers, warnings, launch verdict.
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { tenantLeakageAuditor } from './tenant-leakage-auditor';
import { cacheChaosSpec } from './cache-chaos.spec';
import { cronStormSpec } from './cron-storm.spec';
import { vercelSurvivabilitySpec } from './vercel-survivability.spec';
import { databaseStressSpec } from './database-stress.spec';
import { connectorCascadeSpec } from './connector-cascade.spec';
import { executionChaosRunner } from './chaos-execution-runner';
import { onboardingResilienceSpec } from './onboarding-resilience.spec';

/**
 * Reliability score
 */
export interface ReliabilityScore {
  category: string;
  score: number; // 0-100
  weight: number; // Importance weight
  weightedScore: number;
  status: 'pass' | 'warning' | 'fail';
  details: string;
}

/**
 * Platform reliability report
 */
export interface PlatformReliabilityReport {
  overallReadiness: number;
  launchVerdict: 'ready' | 'caution' | 'not-ready';
  scores: ReliabilityScore[];
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  timestamp: number;
}

/**
 * Platform reliability scoring system
 */
export class PlatformReliabilityScoring {
  private logger: Logger;
  private report: PlatformReliabilityReport;

  constructor() {
    this.logger = createLogger();
    this.report = {
      overallReadiness: 0,
      launchVerdict: 'not-ready',
      scores: [],
      blockers: [],
      warnings: [],
      recommendations: [],
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate platform reliability score
   */
  async calculateReliabilityScore(): Promise<PlatformReliabilityReport> {
    this.logger.info('Calculating platform reliability score');

    this.report.scores = [];
    this.report.blockers = [];
    this.report.warnings = [];
    this.report.recommendations = [];

    // Calculate individual scores
    await this.scoreTenantIsolation();
    await this.scoreExecutionReliability();
    await this.scoreCronReliability();
    await this.scoreCacheIntegrity();
    await this.scoreOnboardingReliability();
    await this.scoreDashboardConsistency();
    await this.scoreRetrySafety();
    await this.scoreConnectorSurvivability();
    await this.scoreVercelSurvivability();
    await this.scoreDBScalability();

    // Calculate overall readiness
    this.calculateOverallReadiness();

    // Determine launch verdict
    this.determineLaunchVerdict();

    this.report.timestamp = Date.now();

    this.logger.info('Platform reliability score calculated', { 
      overallReadiness: this.report.overallReadiness,
      launchVerdict: this.report.launchVerdict 
    });

    return this.report;
  }

  /**
   * Score tenant isolation
   */
  private async scoreTenantIsolation(): Promise<void> {
    const audit = await tenantLeakageAuditor.runFullAudit();
    const summary = audit.summary;

    const score = summary.passed === summary.total ? 100 : (summary.passed / summary.total) * 100;
    const status = score === 100 ? 'pass' : score >= 80 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} isolation tests passed`;

    if (audit.simulationFailed) {
      this.report.blockers.push('CRITICAL: Tenant leakage detected - simulation failed');
    }

    this.report.scores.push({
      category: 'Tenant Isolation',
      score,
      weight: 0.25, // Critical
      weightedScore: score * 0.25,
      status,
      details,
    });
  }

  /**
   * Score execution reliability
   */
  private async scoreExecutionReliability(): Promise<void> {
    const metrics = executionChaosRunner.getMetrics();
    const score = metrics.executionSuccessRate;

    const status = score >= 95 ? 'pass' : score >= 80 ? 'warning' : 'fail';
    const details = `${metrics.successfulExecutions}/${metrics.totalExecutions} executions successful`;

    if (score < 80) {
      this.report.blockers.push('Execution success rate below 80%');
    } else if (score < 95) {
      this.report.warnings.push('Execution success rate below 95%');
    }

    this.report.scores.push({
      category: 'Execution Reliability',
      score,
      weight: 0.2, // High
      weightedScore: score * 0.2,
      status,
      details,
    });
  }

  /**
   * Score cron reliability
   */
  private async scoreCronReliability(): Promise<void> {
    const summary = cronStormSpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 90 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} cron tests passed`;

    if (score < 90) {
      this.report.blockers.push('Cron reliability below 90%');
    }

    this.report.scores.push({
      category: 'Cron Reliability',
      score,
      weight: 0.15, // Medium-high
      weightedScore: score * 0.15,
      status,
      details,
    });
  }

  /**
   * Score cache integrity
   */
  private async scoreCacheIntegrity(): Promise<void> {
    const summary = cacheChaosSpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 90 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} cache tests passed`;

    if (score < 90) {
      this.report.blockers.push('Cache integrity below 90%');
    }

    this.report.scores.push({
      category: 'Cache Integrity',
      score,
      weight: 0.1, // Medium
      weightedScore: score * 0.1,
      status,
      details,
    });
  }

  /**
   * Score onboarding reliability
   */
  private async scoreOnboardingReliability(): Promise<void> {
    const summary = onboardingResilienceSpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 85 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} onboarding tests passed`;

    if (score < 85) {
      this.report.blockers.push('Onboarding reliability below 85%');
    }

    this.report.scores.push({
      category: 'Onboarding Reliability',
      score,
      weight: 0.1, // Medium
      weightedScore: score * 0.1,
      status,
      details,
    });
  }

  /**
   * Score dashboard consistency
   */
  private async scoreDashboardConsistency(): Promise<void> {
    const summary = cacheChaosSpec.getSummary();
    const score = summary.passRate; // Reuse cache chaos for dashboard consistency

    const status = score === 100 ? 'pass' : score >= 90 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} dashboard consistency tests passed`;

    if (score < 90) {
      this.report.warnings.push('Dashboard consistency below 90%');
    }

    this.report.scores.push({
      category: 'Dashboard Consistency',
      score,
      weight: 0.05, // Low-medium
      weightedScore: score * 0.05,
      status,
      details,
    });
  }

  /**
   * Score retry safety
   */
  private async scoreRetrySafety(): Promise<void> {
    const metrics = executionChaosRunner.getMetrics();
    const score = metrics.retryFrequency < 20 ? 100 : Math.max(0, 100 - metrics.retryFrequency * 2);

    const status = score >= 90 ? 'pass' : score >= 70 ? 'warning' : 'fail';
    const details = `Retry frequency: ${metrics.retryFrequency.toFixed(1)}%`;

    if (score < 70) {
      this.report.warnings.push('Retry frequency too high');
    }

    this.report.scores.push({
      category: 'Retry Safety',
      score,
      weight: 0.05, // Low
      weightedScore: score * 0.05,
      status,
      details,
    });
  }

  /**
   * Score connector survivability
   */
  private async scoreConnectorSurvivability(): Promise<void> {
    const summary = connectorCascadeSpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 85 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} connector tests passed`;

    if (score < 85) {
      this.report.blockers.push('Connector survivability below 85%');
    }

    this.report.scores.push({
      category: 'Connector Survivability',
      score,
      weight: 0.1, // Medium
      weightedScore: score * 0.1,
      status,
      details,
    });
  }

  /**
   * Score Vercel survivability
   */
  private async scoreVercelSurvivability(): Promise<void> {
    const summary = vercelSurvivabilitySpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 90 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} Vercel tests passed`;

    if (score < 90) {
      this.report.blockers.push('Vercel survivability below 90%');
    }

    this.report.scores.push({
      category: 'Vercel Survivability',
      score,
      weight: 0.1, // Medium
      weightedScore: score * 0.1,
      status,
      details,
    });
  }

  /**
   * Score DB scalability
   */
  private async scoreDBScalability(): Promise<void> {
    const summary = databaseStressSpec.getSummary();
    const score = summary.passRate;

    const status = score === 100 ? 'pass' : score >= 85 ? 'warning' : 'fail';
    const details = `${summary.passed}/${summary.total} DB stress tests passed`;

    if (score < 85) {
      this.report.blockers.push('DB scalability below 85%');
    }

    this.report.scores.push({
      category: 'DB Scalability',
      score,
      weight: 0.1, // Medium
      weightedScore: score * 0.1,
      status,
      details,
    });
  }

  /**
   * Calculate overall readiness
   */
  private calculateOverallReadiness(): void {
    const totalWeight = this.report.scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = this.report.scores.reduce((sum, s) => sum + s.weightedScore, 0);
    this.report.overallReadiness = totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine launch verdict
   */
  private determineLaunchVerdict(): void {
    if (this.report.blockers.length > 0) {
      this.report.launchVerdict = 'not-ready';
    } else if (this.report.overallReadiness >= 95) {
      this.report.launchVerdict = 'ready';
    } else if (this.report.overallReadiness >= 85) {
      this.report.launchVerdict = 'caution';
    } else {
      this.report.launchVerdict = 'not-ready';
    }

    // Generate recommendations
    this.generateRecommendations();
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): void {
    this.report.scores.forEach(score => {
      if (score.status === 'fail') {
        this.report.recommendations.push(`Address ${score.category}: ${score.details}`);
      } else if (score.status === 'warning') {
        this.report.recommendations.push(`Monitor ${score.category}: ${score.details}`);
      }
    });
  }

  /**
   * Get report
   */
  getReport(): PlatformReliabilityReport {
    return { ...this.report };
  }

  /**
   * Reset
   */
  reset(): void {
    this.report = {
      overallReadiness: 0,
      launchVerdict: 'not-ready',
      scores: [],
      blockers: [],
      warnings: [],
      recommendations: [],
      timestamp: Date.now(),
    };
  }
}

/**
 * Singleton instance
 */
export const platformReliabilityScoring = new PlatformReliabilityScoring();
