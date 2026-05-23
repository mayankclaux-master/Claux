/**
 * Deployment Audit Logger
 * 
 * Tracks deployment events:
 * - Deployment timestamp
 * - Git commit hash
 * - Environment
 * - Migration version
 * - Build version
 * - Verification results
 * - Readiness score
 * - Deployment warnings
 * - Deployment blockers
 * - Rollback events
 * 
 * Append-only history for audit trail.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Deployment audit entry
 */
export interface DeploymentAuditEntry {
  id: string;
  timestamp: number;
  environment: 'development' | 'staging' | 'production';
  gitCommitHash: string;
  migrationVersion: string;
  buildVersion: string;
  verificationPassed: boolean;
  readinessScore: number;
  warnings: string[];
  blockers: string[];
  rollbackEvent?: {
    fromVersion: string;
    toVersion: string;
    reason: string;
    timestamp: number;
  };
  metadata?: Record<string, any>;
}

/**
 * Deployment audit service
 */
export class DeploymentAuditService {
  private logger: Logger;
  private auditLog: DeploymentAuditEntry[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Log a deployment event
   */
  logDeployment(params: {
    environment: 'development' | 'staging' | 'production';
    gitCommitHash: string;
    migrationVersion: string;
    buildVersion: string;
    verificationPassed: boolean;
    readinessScore: number;
    warnings: string[];
    blockers: string[];
    metadata?: Record<string, any>;
  }): string {
    const entry: DeploymentAuditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.auditLog.push(entry);
    this.logger.info('Deployment audit entry created', { entry });

    return entry.id;
  }

  /**
   * Log a rollback event
   */
  logRollback(params: {
    fromVersion: string;
    toVersion: string;
    reason: string;
    environment: 'development' | 'staging' | 'production';
  }): string {
    // Find the most recent deployment for this environment
    const recentDeployment = this.auditLog
      .filter(e => e.environment === params.environment)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!recentDeployment) {
      this.logger.warn('No recent deployment found for rollback', { params });
      throw new Error('No recent deployment found for rollback');
    }

    const rollbackEntry: DeploymentAuditEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      environment: params.environment,
      gitCommitHash: recentDeployment.gitCommitHash,
      migrationVersion: recentDeployment.migrationVersion,
      buildVersion: recentDeployment.buildVersion,
      verificationPassed: recentDeployment.verificationPassed,
      readinessScore: recentDeployment.readinessScore,
      warnings: recentDeployment.warnings,
      blockers: recentDeployment.blockers,
      rollbackEvent: {
        fromVersion: params.fromVersion,
        toVersion: params.toVersion,
        reason: params.reason,
        timestamp: Date.now(),
      },
    };

    this.auditLog.push(rollbackEntry);
    this.logger.info('Rollback audit entry created', { rollbackEntry });

    return rollbackEntry.id;
  }

  /**
   * Get audit log by ID
   */
  getAuditEntry(id: string): DeploymentAuditEntry | undefined {
    return this.auditLog.find(entry => entry.id === id);
  }

  /**
   * Get audit log by git commit hash
   */
  getAuditByCommitHash(commitHash: string): DeploymentAuditEntry | undefined {
    return this.auditLog.find(entry => entry.gitCommitHash === commitHash);
  }

  /**
   * Get audit log by environment
   */
  getAuditByEnvironment(environment: 'development' | 'staging' | 'production'): DeploymentAuditEntry[] {
    return this.auditLog
      .filter(entry => entry.environment === environment)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get recent deployments
   */
  getRecentDeployments(limit: number = 10): DeploymentAuditEntry[] {
    return this.auditLog
      .filter(entry => !entry.rollbackEvent) // Exclude rollback events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get rollback history
   */
  getRollbackHistory(limit: number = 10): DeploymentAuditEntry[] {
    return this.auditLog
      .filter(entry => entry.rollbackEvent)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get deployment statistics
   */
  getDeploymentStatistics(): {
    totalDeployments: number;
    deploymentsByEnvironment: Record<string, number>;
    successfulDeployments: number;
    failedDeployments: number;
    rollbackCount: number;
    averageReadinessScore: number;
  } {
    const deployments = this.auditLog.filter(entry => !entry.rollbackEvent);
    const rollbacks = this.auditLog.filter(entry => entry.rollbackEvent);

    const deploymentsByEnvironment: Record<string, number> = {
      development: 0,
      staging: 0,
      production: 0,
    };

    deployments.forEach(entry => {
      deploymentsByEnvironment[entry.environment]++;
    });

    const successfulDeployments = deployments.filter(entry => entry.verificationPassed).length;
    const failedDeployments = deployments.filter(entry => !entry.verificationPassed).length;

    const averageReadinessScore = deployments.length > 0
      ? deployments.reduce((sum, entry) => sum + entry.readinessScore, 0) / deployments.length
      : 0;

    return {
      totalDeployments: deployments.length,
      deploymentsByEnvironment,
      successfulDeployments,
      failedDeployments,
      rollbackCount: rollbacks.length,
      averageReadinessScore: Math.round(averageReadinessScore),
    };
  }

  /**
   * Export audit log as JSON
   */
  exportAuditLogAsJSON(filter?: {
    environment?: 'development' | 'staging' | 'production';
    since?: number;
    until?: number;
  }): string {
    let logs = [...this.auditLog];

    if (filter) {
      if (filter.environment) {
        logs = logs.filter(entry => entry.environment === filter.environment);
      }
      if (filter.since !== undefined) {
        logs = logs.filter(entry => entry.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        logs = logs.filter(entry => entry.timestamp <= (filter.until as number));
      }
    }

    logs.sort((a, b) => b.timestamp - a.timestamp);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Generate audit report
   */
  generateAuditReport(): string {
    const stats = this.getDeploymentStatistics();
    const recentDeployments = this.getRecentDeployments(5);
    const recentRollbacks = this.getRollbackHistory(5);

    let report = '=== Deployment Audit Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '--- Statistics ---\n';
    report += `Total Deployments: ${stats.totalDeployments}\n`;
    report += `Development: ${stats.deploymentsByEnvironment.development}\n`;
    report += `Staging: ${stats.deploymentsByEnvironment.staging}\n`;
    report += `Production: ${stats.deploymentsByEnvironment.production}\n`;
    report += `Successful: ${stats.successfulDeployments}\n`;
    report += `Failed: ${stats.failedDeployments}\n`;
    report += `Rollbacks: ${stats.rollbackCount}\n`;
    report += `Average Readiness Score: ${stats.averageReadinessScore}%\n\n`;

    report += '--- Recent Deployments ---\n';
    recentDeployments.forEach(deployment => {
      report += `${new Date(deployment.timestamp).toISOString()} - ${deployment.environment}\n`;
      report += `  Commit: ${deployment.gitCommitHash}\n`;
      report += `  Readiness: ${deployment.readinessScore}%\n`;
      report += `  Status: ${deployment.verificationPassed ? 'PASSED' : 'FAILED'}\n`;
      if (deployment.blockers.length > 0) {
        report += `  Blockers: ${deployment.blockers.join(', ')}\n`;
      }
    });

    if (recentRollbacks.length > 0) {
      report += '\n--- Recent Rollbacks ---\n';
      recentRollbacks.forEach(rollback => {
        report += `${new Date(rollback.timestamp).toISOString()} - ${rollback.environment}\n`;
        report += `  From: ${rollback.rollbackEvent?.fromVersion}\n`;
        report += `  To: ${rollback.rollbackEvent?.toVersion}\n`;
        report += `  Reason: ${rollback.rollbackEvent?.reason}\n`;
      });
    }

    return report;
  }

  /**
   * Clear audit log (for testing only - should never be called in production)
   */
  clearAuditLog(): void {
    this.logger.warn('Audit log cleared - this should never happen in production');
    this.auditLog = [];
  }
}

/**
 * Singleton instance
 */
export const deploymentAuditService = new DeploymentAuditService();
