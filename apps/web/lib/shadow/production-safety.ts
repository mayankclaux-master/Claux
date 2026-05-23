/**
 * Production Safety
 * 
 * Prevents:
 * - Accidental client exposure
 * - Accidental publishing
 * - Accidental indexing
 * - Accidental outreach
 * - Accidental connector mutation
 * 
 * Shadow mode must be READ-ONLY intelligence generation.
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { shadowModeSystem, ExecutionMode } from './shadow-mode-system';

/**
 * Safety check result
 */
export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  operation: string;
  mode: ExecutionMode;
}

/**
 * Production safety service
 */
export class ProductionSafety {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Check if client exposure is allowed
   */
  allowClientExposure(tenantId: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    if (mode === ExecutionMode.SHADOW) {
      return {
        allowed: false,
        reason: 'Client exposure not allowed in shadow mode',
        operation: 'client_exposure',
        mode,
      };
    }

    if (mode === ExecutionMode.MOCK) {
      return {
        allowed: false,
        reason: 'Client exposure not allowed in mock mode',
        operation: 'client_exposure',
        mode,
      };
    }

    // Production mode - allow but log
    this.logger.info('Client exposure allowed in production mode', { tenantId });
    return {
      allowed: true,
      operation: 'client_exposure',
      mode,
    };
  }

  /**
   * Check if publishing is allowed
   */
  allowPublishing(tenantId: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    if (mode === ExecutionMode.SHADOW) {
      return {
        allowed: false,
        reason: 'Publishing not allowed in shadow mode',
        operation: 'publishing',
        mode,
      };
    }

    if (mode === ExecutionMode.MOCK) {
      return {
        allowed: false,
        reason: 'Publishing not allowed in mock mode',
        operation: 'publishing',
        mode,
      };
    }

    // Production mode - publishing should still be explicitly controlled
    this.logger.warn('Publishing requested in production mode - requires explicit approval', { tenantId });
    return {
      allowed: false,
      reason: 'Publishing requires explicit approval even in production mode',
      operation: 'publishing',
      mode,
    };
  }

  /**
   * Check if indexing is allowed
   */
  allowIndexing(tenantId: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    if (mode === ExecutionMode.SHADOW) {
      return {
        allowed: false,
        reason: 'Indexing not allowed in shadow mode',
        operation: 'indexing',
        mode,
      };
    }

    if (mode === ExecutionMode.MOCK) {
      return {
        allowed: false,
        reason: 'Indexing not allowed in mock mode',
        operation: 'indexing',
        mode,
      };
    }

    // Production mode - indexing should still be explicitly controlled
    this.logger.warn('Indexing requested in production mode - requires explicit approval', { tenantId });
    return {
      allowed: false,
      reason: 'Indexing requires explicit approval even in production mode',
      operation: 'indexing',
      mode,
    };
  }

  /**
   * Check if outreach is allowed
   */
  allowOutreach(tenantId: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    if (mode === ExecutionMode.SHADOW) {
      return {
        allowed: false,
        reason: 'Outreach not allowed in shadow mode',
        operation: 'outreach',
        mode,
      };
    }

    if (mode === ExecutionMode.MOCK) {
      return {
        allowed: false,
        reason: 'Outreach not allowed in mock mode',
        operation: 'outreach',
        mode,
      };
    }

    // Production mode - outreach should still be explicitly controlled
    this.logger.warn('Outreach requested in production mode - requires explicit approval', { tenantId });
    return {
      allowed: false,
      reason: 'Outreach requires explicit approval even in production mode',
      operation: 'outreach',
      mode,
    };
  }

  /**
   * Check if connector mutation is allowed
   */
  allowConnectorMutation(tenantId: string, connector: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    if (mode === ExecutionMode.SHADOW) {
      return {
        allowed: false,
        reason: 'Connector mutations not allowed in shadow mode',
        operation: 'connector_mutation',
        mode,
      };
    }

    if (mode === ExecutionMode.MOCK) {
      return {
        allowed: false,
        reason: 'Connector mutations not allowed in mock mode',
        operation: 'connector_mutation',
        mode,
      };
    }

    // Production mode - connector mutations should still be explicitly controlled
    this.logger.warn('Connector mutation requested in production mode - requires explicit approval', { tenantId, connector });
    return {
      allowed: false,
      reason: 'Connector mutations require explicit approval even in production mode',
      operation: 'connector_mutation',
      mode,
    };
  }

  /**
   * Check if read-only operation is allowed
   */
  allowReadOnlyOperation(tenantId: string, operation: string): SafetyCheckResult {
    const mode = shadowModeSystem.getExecutionMode();

    // Read-only operations are allowed in all modes
    this.logger.info('Read-only operation allowed', { tenantId, operation, mode });
    return {
      allowed: true,
      operation: 'read_only',
      mode,
    };
  }

  /**
   * Require client exposure safety check
   */
  requireClientExposure(tenantId: string): void {
    const result = this.allowClientExposure(tenantId);
    if (!result.allowed) {
      const error = new Error(result.reason || 'Client exposure not allowed');
      this.logger.error('Client exposure safety check failed', { result });
      throw error;
    }
  }

  /**
   * Require publishing safety check
   */
  requirePublishing(tenantId: string): void {
    const result = this.allowPublishing(tenantId);
    if (!result.allowed) {
      const error = new Error(result.reason || 'Publishing not allowed');
      this.logger.error('Publishing safety check failed', { result });
      throw error;
    }
  }

  /**
   * Require indexing safety check
   */
  requireIndexing(tenantId: string): void {
    const result = this.allowIndexing(tenantId);
    if (!result.allowed) {
      const error = new Error(result.reason || 'Indexing not allowed');
      this.logger.error('Indexing safety check failed', { result });
      throw error;
    }
  }

  /**
   * Require outreach safety check
   */
  requireOutreach(tenantId: string): void {
    const result = this.allowOutreach(tenantId);
    if (!result.allowed) {
      const error = new Error(result.reason || 'Outreach not allowed');
      this.logger.error('Outreach safety check failed', { result });
      throw error;
    }
  }

  /**
   * Require connector mutation safety check
   */
  requireConnectorMutation(tenantId: string, connector: string): void {
    const result = this.allowConnectorMutation(tenantId, connector);
    if (!result.allowed) {
      const error = new Error(result.reason || 'Connector mutation not allowed');
      this.logger.error('Connector mutation safety check failed', { result });
      throw error;
    }
  }

  /**
   * Generate safety report
   */
  generateSafetyReport(): string {
    const mode = shadowModeSystem.getExecutionMode();

    let report = '=== Production Safety Report ===\n';
    report += `Execution Mode: ${mode}\n`;
    report += `Real APIs Allowed: ${shadowModeSystem.areRealAPIsAllowed()}\n`;
    report += `Mutations Allowed: ${shadowModeSystem.areMutationsAllowed()}\n`;
    report += `Publishing Allowed: ${shadowModeSystem.isPublishingAllowed()}\n`;
    report += `Indexing Allowed: ${shadowModeSystem.isIndexingAllowed()}\n`;
    report += `Outreach Allowed: ${shadowModeSystem.isOutreachAllowed()}\n\n`;

    report += '--- Safety Rules ---\n';
    report += 'Client Exposure: ';
    report += mode === ExecutionMode.PRODUCTION ? 'ALLOWED (production only)' : 'BLOCKED\n';
    report += 'Publishing: BLOCKED (requires explicit approval)\n';
    report += 'Indexing: BLOCKED (requires explicit approval)\n';
    report += 'Outreach: BLOCKED (requires explicit approval)\n';
    report += 'Connector Mutations: BLOCKED (requires explicit approval)\n';
    report += 'Read-Only Operations: ALLOWED\n';

    return report;
  }
}

/**
 * Singleton instance
 */
export const productionSafety = new ProductionSafety();
