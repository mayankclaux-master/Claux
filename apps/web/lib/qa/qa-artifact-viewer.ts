/**
 * QA Artifact Viewer
 * 
 * Expands artifact viewer with:
 * - Onboarding QA reports
 * - Dashboard integrity reports
 * - Recommendation audit reports
 * - Execution explainability reports
 * - Connector failure reports
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { internalQAScenarioRunner, QAScenarioResult } from './internal-qa-scenario-runner';
import { dashboardTrustVerification, DashboardIntegrityReport } from './dashboard-trust-verification';
import { recommendationQualityValidation } from './recommendation-quality-validation';
import { executionExplainabilityLayer, ExecutionExplanation } from './execution-explainability-layer';

/**
 * Artifact type
 */
export enum QAArtifactType {
  ONBOARDING_QA = 'onboarding_qa',
  DASHBOARD_INTEGRITY = 'dashboard_integrity',
  RECOMMENDATION_AUDIT = 'recommendation_audit',
  EXECUTION_EXPLAINABILITY = 'execution_explainability',
  CONNECTOR_FAILURE = 'connector_failure',
}

/**
 * QA artifact
 */
export interface QAArtifact {
  id: string;
  type: QAArtifactType;
  timestamp: number;
  tenantId: string;
  data: any;
  summary: string;
}

/**
 * QA artifact viewer
 */
export class QAArtifactViewer {
  private logger: Logger;
  private artifacts: QAArtifact[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Add onboarding QA artifact
   */
  addOnboardingQAArtifact(scenarioResult: QAScenarioResult): string {
    const artifact: QAArtifact = {
      id: crypto.randomUUID(),
      type: QAArtifactType.ONBOARDING_QA,
      timestamp: Date.now(),
      tenantId: scenarioResult.tenantId,
      data: scenarioResult,
      summary: `Onboarding QA: ${scenarioResult.scenario} - ${scenarioResult.success ? 'SUCCESS' : 'FAILED'}`,
    };

    this.artifacts.push(artifact);
    this.logger.info('Onboarding QA artifact added', { artifact });

    return artifact.id;
  }

  /**
   * Add dashboard integrity artifact
   */
  addDashboardIntegrityArtifact(report: DashboardIntegrityReport): string {
    const artifact: QAArtifact = {
      id: crypto.randomUUID(),
      type: QAArtifactType.DASHBOARD_INTEGRITY,
      timestamp: Date.now(),
      tenantId: report.tenantId,
      data: report,
      summary: `Dashboard Integrity: ${report.overallIntegrity}% - ${report.criticalIssues.length} critical issues`,
    };

    this.artifacts.push(artifact);
    this.logger.info('Dashboard integrity artifact added', { artifact });

    return artifact.id;
  }

  /**
   * Add recommendation audit artifact
   */
  addRecommendationAuditArtifact(tenantId: string, agent: string): string {
    const score = recommendationQualityValidation.getQualityScore(tenantId, agent);
    const issues = recommendationQualityValidation.getIssuesByTenant(tenantId);

    const artifact: QAArtifact = {
      id: crypto.randomUUID(),
      type: QAArtifactType.RECOMMENDATION_AUDIT,
      timestamp: Date.now(),
      tenantId,
      data: { score, issues },
      summary: `Recommendation Audit: ${agent} - ${score?.overallScore || 0}/100 - ${issues.length} issues`,
    };

    this.artifacts.push(artifact);
    this.logger.info('Recommendation audit artifact added', { artifact });

    return artifact.id;
  }

  /**
   * Add execution explainability artifact
   */
  addExecutionExplainabilityArtifact(executionId: string): string {
    const explanation = executionExplainabilityLayer.getExplanation(executionId);

    if (!explanation) {
      this.logger.warn('Execution explanation not found', { executionId });
      return '';
    }

    const artifact: QAArtifact = {
      id: crypto.randomUUID(),
      type: QAArtifactType.EXECUTION_EXPLAINABILITY,
      timestamp: Date.now(),
      tenantId: explanation.tenantId,
      data: explanation,
      summary: `Execution Explainability: ${executionId} - ${explanation.confidenceScore}% confidence`,
    };

    this.artifacts.push(artifact);
    this.logger.info('Execution explainability artifact added', { artifact });

    return artifact.id;
  }

  /**
   * Add connector failure artifact
   */
  addConnectorFailureArtifact(params: {
    tenantId: string;
    connector: string;
    error: string;
    severity: 'critical' | 'warning' | 'info';
  }): string {
    const artifact: QAArtifact = {
      id: crypto.randomUUID(),
      type: QAArtifactType.CONNECTOR_FAILURE,
      timestamp: Date.now(),
      tenantId: params.tenantId,
      data: params,
      summary: `Connector Failure: ${params.connector} - ${params.severity.toUpperCase()}`,
    };

    this.artifacts.push(artifact);
    this.logger.info('Connector failure artifact added', { artifact });

    return artifact.id;
  }

  /**
   * Get artifact by ID
   */
  getArtifact(id: string): QAArtifact | undefined {
    return this.artifacts.find(a => a.id === id);
  }

  /**
   * Get artifacts by type
   */
  getArtifactsByType(type: QAArtifactType): QAArtifact[] {
    return this.artifacts.filter(a => a.type === type);
  }

  /**
   * Get artifacts by tenant
   */
  getArtifactsByTenant(tenantId: string): QAArtifact[] {
    return this.artifacts.filter(a => a.tenantId === tenantId);
  }

  /**
   * Get all artifacts
   */
  getAllArtifacts(): QAArtifact[] {
    return [...this.artifacts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generate artifact summary report
   */
  generateArtifactSummaryReport(): string {
    const artifacts = this.getAllArtifacts();

    let report = '=== QA Artifact Summary ===\n';
    report += `Total Artifacts: ${artifacts.length}\n\n`;

    const byType: Record<string, number> = {};
    artifacts.forEach(artifact => {
      byType[artifact.type] = (byType[artifact.type] || 0) + 1;
    });

    report += '--- Artifacts by Type ---\n';
    Object.entries(byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Recent Artifacts ---\n';
    artifacts.slice(0, 10).forEach(artifact => {
      report += `${new Date(artifact.timestamp).toISOString()} - ${artifact.type}\n`;
      report += `  Tenant: ${artifact.tenantId}\n`;
      report += `  Summary: ${artifact.summary}\n`;
    });

    return report;
  }

  /**
   * Clear artifacts (for testing only)
   */
  clearArtifacts(): void {
    this.logger.warn('QA artifacts cleared');
    this.artifacts = [];
  }
}

/**
 * Singleton instance
 */
export const qaArtifactViewer = new QAArtifactViewer();
