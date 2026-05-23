/**
 * Safe Rollback Metadata
 * 
 * Tracks rollback-related metadata:
 * - Previous deployment version
 * - Previous migration version
 * - Rollback compatibility
 * - Deployment snapshot
 * - Connector compatibility
 * - Schema compatibility
 * 
 * NO automated rollback. Metadata only for manual rollback decisions.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Rollback metadata entry
 */
export interface RollbackMetadataEntry {
  id: string;
  deploymentVersion: string;
  migrationVersion: string;
  gitCommitHash: string;
  timestamp: number;
  deploymentSnapshot: {
    tables: string[];
    schemas: string[];
    functions: string[];
  };
  connectorCompatibility: {
    connector: string;
    version: string;
    compatible: boolean;
  }[];
  schemaCompatibility: {
    table: string;
    version: string;
    compatible: boolean;
    breakingChanges?: string[];
  }[];
  rollbackCompatibility: {
    canRollback: boolean;
    reason?: string;
    requiresManualIntervention: boolean;
  };
}

/**
 * Rollback metadata service
 */
export class RollbackMetadataService {
  private logger: Logger;
  private metadataHistory: RollbackMetadataEntry[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record rollback metadata for a deployment
   */
  recordRollbackMetadata(params: {
    deploymentVersion: string;
    migrationVersion: string;
    gitCommitHash: string;
    deploymentSnapshot: {
      tables: string[];
      schemas: string[];
      functions: string[];
    };
    connectorCompatibility: {
      connector: string;
      version: string;
      compatible: boolean;
    }[];
    schemaCompatibility: {
      table: string;
      version: string;
      compatible: boolean;
      breakingChanges?: string[];
    }[];
  }): string {
    const entry: RollbackMetadataEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
      rollbackCompatibility: this.calculateRollbackCompatibility(params),
    };

    this.metadataHistory.push(entry);
    this.logger.info('Rollback metadata recorded', { entry });

    return entry.id;
  }

  /**
   * Calculate rollback compatibility
   */
  private calculateRollbackCompatibility(params: {
    deploymentVersion: string;
    migrationVersion: string;
    connectorCompatibility: {
      connector: string;
      version: string;
      compatible: boolean;
    }[];
    schemaCompatibility: {
      table: string;
      version: string;
      compatible: boolean;
      breakingChanges?: string[];
    }[];
  }): {
    canRollback: boolean;
    reason?: string;
    requiresManualIntervention: boolean;
  } {
    // Check if any schema changes are breaking
    const breakingSchemaChanges = params.schemaCompatibility.filter(
      s => !s.compatible && s.breakingChanges && s.breakingChanges.length > 0
    );

    if (breakingSchemaChanges.length > 0) {
      return {
        canRollback: false,
        reason: `Breaking schema changes detected: ${breakingSchemaChanges.map(s => s.table).join(', ')}`,
        requiresManualIntervention: true,
      };
    }

    // Check if any connectors are incompatible
    const incompatibleConnectors = params.connectorCompatibility.filter(c => !c.compatible);

    if (incompatibleConnectors.length > 0) {
      return {
        canRollback: true,
        reason: `Some connectors may be incompatible: ${incompatibleConnectors.map(c => c.connector).join(', ')}`,
        requiresManualIntervention: true,
      };
    }

    // Default: rollback is possible
    return {
      canRollback: true,
      requiresManualIntervention: false,
    };
  }

  /**
   * Get rollback metadata by deployment version
   */
  getMetadataByDeploymentVersion(version: string): RollbackMetadataEntry | undefined {
    return this.metadataHistory.find(entry => entry.deploymentVersion === version);
  }

  /**
   * Get rollback metadata by git commit hash
   */
  getMetadataByCommitHash(commitHash: string): RollbackMetadataEntry | undefined {
    return this.metadataHistory.find(entry => entry.gitCommitHash === commitHash);
  }

  /**
   * Get most recent rollback metadata
   */
  getMostRecentMetadata(): RollbackMetadataEntry | undefined {
    return this.metadataHistory
      .sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  /**
   * Get rollback metadata history
   */
  getMetadataHistory(limit?: number): RollbackMetadataEntry[] {
    const history = [...this.metadataHistory].sort((a, b) => b.timestamp - a.timestamp);
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Check if rollback is possible to a specific version
   */
  canRollbackToVersion(version: string): {
    canRollback: boolean;
    reason?: string;
    requiresManualIntervention: boolean;
    metadata?: RollbackMetadataEntry;
  } {
    const metadata = this.getMetadataByDeploymentVersion(version);

    if (!metadata) {
      return {
        canRollback: false,
        reason: 'No metadata found for this version',
        requiresManualIntervention: true,
      };
    }

    return {
      canRollback: metadata.rollbackCompatibility.canRollback,
      reason: metadata.rollbackCompatibility.reason,
      requiresManualIntervention: metadata.rollbackCompatibility.requiresManualIntervention,
      metadata,
    };
  }

  /**
   * Get rollback compatibility report
   */
  generateRollbackCompatibilityReport(): string {
    const recentMetadata = this.getMetadataHistory(10);

    let report = '=== Rollback Compatibility Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    recentMetadata.forEach(entry => {
      report += `--- Version: ${entry.deploymentVersion} ---\n`;
      report += `Migration: ${entry.migrationVersion}\n`;
      report += `Commit: ${entry.gitCommitHash}\n`;
      report += `Timestamp: ${new Date(entry.timestamp).toISOString()}\n`;
      report += `Can Rollback: ${entry.rollbackCompatibility.canRollback ? 'YES' : 'NO'}\n`;
      
      if (entry.rollbackCompatibility.reason) {
        report += `Reason: ${entry.rollbackCompatibility.reason}\n`;
      }
      
      report += `Requires Manual Intervention: ${entry.rollbackCompatibility.requiresManualIntervention ? 'YES' : 'NO'}\n`;
      
      report += `Connector Compatibility:\n`;
      entry.connectorCompatibility.forEach(c => {
        report += `  ${c.connector}: ${c.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE'} (${c.version})\n`;
      });
      
      report += `Schema Compatibility:\n`;
      entry.schemaCompatibility.forEach(s => {
        report += `  ${s.table}: ${s.compatible ? 'COMPATIBLE' : 'INCOMPATIBLE'} (${s.version})\n`;
        if (s.breakingChanges && s.breakingChanges.length > 0) {
          report += `    Breaking Changes: ${s.breakingChanges.join(', ')}\n`;
        }
      });
      
      report += '\n';
    });

    return report;
  }

  /**
   * Get safe rollback targets (versions that can be safely rolled back to)
   */
  getSafeRollbackTargets(): RollbackMetadataEntry[] {
    return this.metadataHistory
      .filter(entry => entry.rollbackCompatibility.canRollback)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get unsafe rollback targets (versions that require manual intervention)
   */
  getUnsafeRollbackTargets(): RollbackMetadataEntry[] {
    return this.metadataHistory
      .filter(entry => !entry.rollbackCompatibility.canRollback || entry.rollbackCompatibility.requiresManualIntervention)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear metadata history (for testing only)
   */
  clearMetadataHistory(): void {
    this.logger.warn('Rollback metadata history cleared');
    this.metadataHistory = [];
  }
}

/**
 * Singleton instance
 */
export const rollbackMetadataService = new RollbackMetadataService();
