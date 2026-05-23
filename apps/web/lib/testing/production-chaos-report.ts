/**
 * Production Chaos Report
 * 
 * Generate tenant isolation report, execution reliability report, cache integrity report, connector survivability report, Vercel survivability report, DB scalability report, overall production readiness report.
 * Store all as artifacts.
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
import { platformReliabilityScoring } from './platform-reliability-scoring';

/**
 * Report section
 */
export interface ReportSection {
  title: string;
  content: string;
  status: 'pass' | 'warning' | 'fail';
  metrics: Record<string, number | string>;
}

/**
 * Production chaos report data
 */
export interface ProductionChaosReportData {
  reportId: string;
  timestamp: number;
  overallReadiness: number;
  launchVerdict: 'ready' | 'caution' | 'not-ready';
  sections: {
    tenantIsolation: ReportSection;
    executionReliability: ReportSection;
    cacheIntegrity: ReportSection;
    connectorSurvivability: ReportSection;
    vercelSurvivability: ReportSection;
    dbScalability: ReportSection;
    cronReliability: ReportSection;
    onboardingReliability: ReportSection;
  };
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    blockers: string[];
    warnings: string[];
    recommendations: string[];
  };
}

/**
 * Production chaos report generator
 */
export class ProductionChaosReport {
  private logger: Logger;
  private report: ProductionChaosReportData;

  constructor() {
    this.logger = createLogger();
    this.report = {
      reportId: crypto.randomUUID(),
      timestamp: Date.now(),
      overallReadiness: 0,
      launchVerdict: 'not-ready',
      sections: {
        tenantIsolation: { title: '', content: '', status: 'fail', metrics: {} },
        executionReliability: { title: '', content: '', status: 'fail', metrics: {} },
        cacheIntegrity: { title: '', content: '', status: 'fail', metrics: {} },
        connectorSurvivability: { title: '', content: '', status: 'fail', metrics: {} },
        vercelSurvivability: { title: '', content: '', status: 'fail', metrics: {} },
        dbScalability: { title: '', content: '', status: 'fail', metrics: {} },
        cronReliability: { title: '', content: '', status: 'fail', metrics: {} },
        onboardingReliability: { title: '', content: '', status: 'fail', metrics: {} },
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        blockers: [],
        warnings: [],
        recommendations: [],
      },
    };
  }

  /**
   * Generate full production chaos report
   */
  async generateReport(): Promise<ProductionChaosReportData> {
    this.logger.info('Generating production chaos report');

    // Run all tests and collect results
    await this.generateTenantIsolationReport();
    await this.generateExecutionReliabilityReport();
    await this.generateCacheIntegrityReport();
    await this.generateConnectorSurvivabilityReport();
    await this.generateVercelSurvivabilityReport();
    await this.generateDBScalabilityReport();
    await this.generateCronReliabilityReport();
    await this.generateOnboardingReliabilityReport();

    // Generate overall summary
    await this.generateOverallSummary();

    this.report.timestamp = Date.now();

    this.logger.info('Production chaos report generated', { 
      reportId: this.report.reportId,
      overallReadiness: this.report.overallReadiness,
      launchVerdict: this.report.launchVerdict 
    });

    return this.report;
  }

  /**
   * Generate tenant isolation report
   */
  private async generateTenantIsolationReport(): Promise<void> {
    const audit = await tenantLeakageAuditor.runFullAudit();
    const summary = audit.summary;
    const passRate = summary.total > 0 ? (summary.passed / summary.total) * 100 : 0;

    this.report.sections.tenantIsolation = {
      title: 'Tenant Isolation Report',
      content: this.formatTenantIsolationContent(audit.results),
      status: audit.simulationFailed ? 'fail' : passRate === 100 ? 'pass' : 'warning',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${passRate.toFixed(1)}%`,
        simulationFailed: audit.simulationFailed ? 'true' : 'false',
      },
    };
  }

  /**
   * Format tenant isolation content
   */
  private formatTenantIsolationContent(results: any[]): string {
    return results.map(r => 
      `- ${r.category}: ${r.passed ? 'PASS' : 'FAIL'} - ${r.details}`
    ).join('\n');
  }

  /**
   * Generate execution reliability report
   */
  private async generateExecutionReliabilityReport(): Promise<void> {
    const metrics = executionChaosRunner.getMetrics();

    this.report.sections.executionReliability = {
      title: 'Execution Reliability Report',
      content: this.formatExecutionReliabilityContent(metrics),
      status: metrics.executionSuccessRate >= 95 ? 'pass' : metrics.executionSuccessRate >= 80 ? 'warning' : 'fail',
      metrics: {
        totalExecutions: metrics.totalExecutions,
        successfulExecutions: metrics.successfulExecutions,
        failedExecutions: metrics.failedExecutions,
        successRate: `${metrics.executionSuccessRate.toFixed(1)}%`,
        retryFrequency: `${metrics.retryFrequency.toFixed(1)}%`,
        timeoutFrequency: `${metrics.timeoutFrequency.toFixed(1)}%`,
        lockContention: `${metrics.lockContention.toFixed(1)}%`,
        recoverySuccessRate: `${metrics.recoverySuccessRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format execution reliability content
   */
  private formatExecutionReliabilityContent(metrics: any): string {
    return `
- Total Executions: ${metrics.totalExecutions}
- Successful: ${metrics.successfulExecutions}
- Failed: ${metrics.failedExecutions}
- Success Rate: ${metrics.executionSuccessRate.toFixed(1)}%
- Retry Frequency: ${metrics.retryFrequency.toFixed(1)}%
- Timeout Frequency: ${metrics.timeoutFrequency.toFixed(1)}%
- Lock Contention: ${metrics.lockContention.toFixed(1)}%
- Recovery Success Rate: ${metrics.recoverySuccessRate.toFixed(1)}%
`.trim();
  }

  /**
   * Generate cache integrity report
   */
  private async generateCacheIntegrityReport(): Promise<void> {
    const summary = cacheChaosSpec.getSummary();

    this.report.sections.cacheIntegrity = {
      title: 'Cache Integrity Report',
      content: this.formatCacheIntegrityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 90 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format cache integrity content
   */
  private formatCacheIntegrityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Tests: Rapid Execution Updates, Concurrent Dashboard Refreshes, Onboarding Completion Races, Cache Invalidation Storms, Stale Trend Recalculations
`.trim();
  }

  /**
   * Generate connector survivability report
   */
  private async generateConnectorSurvivabilityReport(): Promise<void> {
    const summary = connectorCascadeSpec.getSummary();

    this.report.sections.connectorSurvivability = {
      title: 'Connector Survivability Report',
      content: this.formatConnectorSurvivabilityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 85 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format connector survivability content
   */
  private formatConnectorSurvivabilityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Tests: Total Outages, Partial Outages, Slow APIs, OAuth Expiration, Auth Revocation, Malformed Payloads, 429 Storms, Retry Caps, No Infinite Retries, Safe Failures
`.trim();
  }

  /**
   * Generate Vercel survivability report
   */
  private async generateVercelSurvivabilityReport(): Promise<void> {
    const summary = vercelSurvivabilitySpec.getSummary();

    this.report.sections.vercelSurvivability = {
      title: 'Vercel Survivability Report',
      content: this.formatVercelSurvivabilityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 90 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format Vercel survivability content
   */
  private formatVercelSurvivabilityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Tests: Timeout Boundaries, Memory Spikes, Huge Payloads, Artifact Overload, Cold Starts, Execution Bursts
`.trim();
  }

  /**
   * Generate DB scalability report
   */
  private async generateDBScalabilityReport(): Promise<void> {
    const summary = databaseStressSpec.getSummary();

    this.report.sections.dbScalability = {
      title: 'DB Scalability Report',
      content: this.formatDBScalabilityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 85 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
        totalQueries: summary.totalQueries,
        avgQueryTime: `${summary.avgQueryTime.toFixed(2)}ms`,
      },
    };
  }

  /**
   * Format DB scalability content
   */
  private formatDBScalabilityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Total Queries: ${summary.totalQueries}
- Avg Query Time: ${summary.avgQueryTime.toFixed(2)}ms
- Tests: Snapshot Writes, Ranking History Writes, Task Creation, Execution Audit Writes, Artifact Writes, Trend Queries, Dashboard Queries
`.trim();
  }

  /**
   * Generate cron reliability report
   */
  private async generateCronReliabilityReport(): Promise<void> {
    const summary = cronStormSpec.getSummary();

    this.report.sections.cronReliability = {
      title: 'Cron Reliability Report',
      content: this.formatCronReliabilityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 90 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format cron reliability content
   */
  private formatCronReliabilityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Tests: Overlapping Schedules, Duplicate Triggers, Delayed Recovery, Retry Storms, Stale Locks, Execution Crashes
`.trim();
  }

  /**
   * Generate onboarding reliability report
   */
  private async generateOnboardingReliabilityReport(): Promise<void> {
    const summary = onboardingResilienceSpec.getSummary();

    this.report.sections.onboardingReliability = {
      title: 'Onboarding Reliability Report',
      content: this.formatOnboardingReliabilityContent(summary),
      status: summary.passRate === 100 ? 'pass' : summary.passRate >= 85 ? 'warning' : 'fail',
      metrics: {
        totalTests: summary.total,
        passedTests: summary.passed,
        failedTests: summary.failed,
        passRate: `${summary.passRate.toFixed(1)}%`,
      },
    };
  }

  /**
   * Format onboarding reliability content
   */
  private formatOnboardingReliabilityContent(summary: any): string {
    return `
- Total Tests: ${summary.total}
- Passed: ${summary.passed}
- Failed: ${summary.failed}
- Pass Rate: ${summary.passRate.toFixed(1)}%
- Tests: Partial Recovery, Connector Recovery, Retry-Safe, Idempotency, No Duplicate Workspaces, No Deadlocks
`.trim();
  }

  /**
   * Generate overall summary
   */
  private async generateOverallSummary(): Promise<void> {
    const reliabilityReport = await platformReliabilityScoring.calculateReliabilityScore();

    this.report.overallReadiness = reliabilityReport.overallReadiness;
    this.report.launchVerdict = reliabilityReport.launchVerdict;

    // Calculate total tests
    const sections = Object.values(this.report.sections);
    this.report.summary.totalTests = sections.reduce((sum, s) => sum + (s.metrics.totalTests as number || 0), 0);
    this.report.summary.passedTests = sections.reduce((sum, s) => sum + (s.metrics.passedTests as number || 0), 0);
    this.report.summary.failedTests = sections.reduce((sum, s) => sum + (s.metrics.failedTests as number || 0), 0);

    this.report.summary.blockers = reliabilityReport.blockers;
    this.report.summary.warnings = reliabilityReport.warnings;
    this.report.summary.recommendations = reliabilityReport.recommendations;
  }

  /**
   * Get report
   */
  getReport(): ProductionChaosReportData {
    return { ...this.report };
  }

  /**
   * Export report as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.report, null, 2);
  }

  /**
   * Export report as markdown
   */
  exportAsMarkdown(): string {
    const lines: string[] = [];

    lines.push('# Production Chaos Report');
    lines.push('');
    lines.push(`**Report ID:** ${this.report.reportId}`);
    lines.push(`**Timestamp:** ${new Date(this.report.timestamp).toISOString()}`);
    lines.push(`**Overall Readiness:** ${this.report.overallReadiness.toFixed(1)}%`);
    lines.push(`**Launch Verdict:** ${this.report.launchVerdict.toUpperCase()}`);
    lines.push('');

    lines.push('## Summary');
    lines.push('');
    lines.push(`- Total Tests: ${this.report.summary.totalTests}`);
    lines.push(`- Passed: ${this.report.summary.passedTests}`);
    lines.push(`- Failed: ${this.report.summary.failedTests}`);
    lines.push('');

    if (this.report.summary.blockers.length > 0) {
      lines.push('### Blockers');
      lines.push('');
      this.report.summary.blockers.forEach((b: string) => lines.push(`- ${b}`));
      lines.push('');
    }

    if (this.report.summary.warnings.length > 0) {
      lines.push('### Warnings');
      lines.push('');
      this.report.summary.warnings.forEach((w: string) => lines.push(`- ${w}`));
      lines.push('');
    }

    if (this.report.summary.recommendations.length > 0) {
      lines.push('### Recommendations');
      lines.push('');
      this.report.summary.recommendations.forEach((r: string) => lines.push(`- ${r}`));
      lines.push('');
    }

    lines.push('## Detailed Reports');
    lines.push('');

    Object.values(this.report.sections).forEach((section: ReportSection) => {
      lines.push(`### ${section.title}`);
      lines.push('');
      lines.push(`**Status:** ${section.status.toUpperCase()}`);
      lines.push('');
      lines.push('```');
      lines.push(section.content);
      lines.push('```');
      lines.push('');
      lines.push('**Metrics:**');
      Object.entries(section.metrics).forEach(([key, value]) => {
        lines.push(`- ${key}: ${value}`);
      });
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Reset
   */
  reset(): void {
    this.report = {
      reportId: crypto.randomUUID(),
      timestamp: Date.now(),
      overallReadiness: 0,
      launchVerdict: 'not-ready',
      sections: {
        tenantIsolation: { title: '', content: '', status: 'fail', metrics: {} },
        executionReliability: { title: '', content: '', status: 'fail', metrics: {} },
        cacheIntegrity: { title: '', content: '', status: 'fail', metrics: {} },
        connectorSurvivability: { title: '', content: '', status: 'fail', metrics: {} },
        vercelSurvivability: { title: '', content: '', status: 'fail', metrics: {} },
        dbScalability: { title: '', content: '', status: 'fail', metrics: {} },
        cronReliability: { title: '', content: '', status: 'fail', metrics: {} },
        onboardingReliability: { title: '', content: '', status: 'fail', metrics: {} },
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        blockers: [],
        warnings: [],
        recommendations: [],
      },
    };
  }
}

/**
 * Singleton instance
 */
export const productionChaosReport = new ProductionChaosReport();
