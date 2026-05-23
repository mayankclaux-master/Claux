/**
 * Shadow Mode System
 * 
 * Global SHADOW_MODE execution layer for safe real API validation.
 * 
 * Features:
 * - Real APIs execute
 * - Results persist
 * - Dashboard visibility optional
 * - NO client-facing mutations/actions
 * - NO automatic publishing
 * - NO automatic indexing
 * - NO automatic outreach
 * 
 * Shadow mode is READ-ONLY intelligence generation.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Execution mode
 */
export enum ExecutionMode {
  MOCK = 'mock',
  SHADOW = 'shadow',
  PRODUCTION = 'production',
}

/**
 * Shadow mode configuration
 */
export interface ShadowModeConfig {
  enabled: boolean;
  executionMode: ExecutionMode;
  allowRealAPIs: boolean;
  allowPersistence: boolean;
  allowDashboardVisibility: boolean;
  allowMutations: boolean;
  allowPublishing: boolean;
  allowIndexing: boolean;
  allowOutreach: boolean;
}

/**
 * Shadow mode execution result
 */
export interface ShadowExecutionResult {
  executionId: string;
  mode: ExecutionMode;
  timestamp: number;
  tenantId: string;
  connector: string;
  operation: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  persisted: boolean;
}

/**
 * Shadow mode system
 */
export class ShadowModeSystem {
  private logger: Logger;
  private config: ShadowModeConfig;
  private executionHistory: ShadowExecutionResult[] = [];

  constructor() {
    this.logger = createLogger();
    this.config = this.initializeConfig();
  }

  /**
   * Initialize shadow mode configuration
   */
  private initializeConfig(): ShadowModeConfig {
    const envMode = process.env.NEXT_PUBLIC_EXECUTION_MODE || 'mock';
    
    return {
      enabled: true,
      executionMode: this.parseExecutionMode(envMode),
      allowRealAPIs: envMode !== 'mock',
      allowPersistence: true,
      allowDashboardVisibility: envMode === 'shadow' || envMode === 'production',
      allowMutations: false, // Never allow mutations in shadow mode
      allowPublishing: false, // Never allow publishing in shadow mode
      allowIndexing: false, // Never allow indexing in shadow mode
      allowOutreach: false, // Never allow outreach in shadow mode
    };
  }

  /**
   * Parse execution mode from environment
   */
  private parseExecutionMode(mode: string): ExecutionMode {
    switch (mode.toLowerCase()) {
      case 'shadow':
        return ExecutionMode.SHADOW;
      case 'production':
        return ExecutionMode.PRODUCTION;
      case 'mock':
      default:
        return ExecutionMode.MOCK;
    }
  }

  /**
   * Get current execution mode
   */
  getExecutionMode(): ExecutionMode {
    return this.config.executionMode;
  }

  /**
   * Check if shadow mode is enabled
   */
  isShadowMode(): boolean {
    return this.config.executionMode === ExecutionMode.SHADOW;
  }

  /**
   * Check if production mode is enabled
   */
  isProductionMode(): boolean {
    return this.config.executionMode === ExecutionMode.PRODUCTION;
  }

  /**
   * Check if mock mode is enabled
   */
  isMockMode(): boolean {
    return this.config.executionMode === ExecutionMode.MOCK;
  }

  /**
   * Check if real APIs are allowed
   */
  areRealAPIsAllowed(): boolean {
    return this.config.allowRealAPIs;
  }

  /**
   * Check if mutations are allowed
   */
  areMutationsAllowed(): boolean {
    return this.config.allowMutations;
  }

  /**
   * Check if publishing is allowed
   */
  isPublishingAllowed(): boolean {
    return this.config.allowPublishing;
  }

  /**
   * Check if indexing is allowed
   */
  isIndexingAllowed(): boolean {
    return this.config.allowIndexing;
  }

  /**
   * Check if outreach is allowed
   */
  isOutreachAllowed(): boolean {
    return this.config.allowOutreach;
  }

  /**
   * Execute a shadow operation
   */
  async executeShadowOperation(params: {
    tenantId: string;
    connector: string;
    operation: string;
    handler: () => Promise<any>;
  }): Promise<ShadowExecutionResult> {
    const executionId = crypto.randomUUID();
    const startTime = Date.now();

    this.logger.info('Executing shadow operation', {
      executionId,
      mode: this.config.executionMode,
      tenantId: params.tenantId,
      connector: params.connector,
      operation: params.operation,
    });

    const result: ShadowExecutionResult = {
      executionId,
      mode: this.config.executionMode,
      timestamp: startTime,
      tenantId: params.tenantId,
      connector: params.connector,
      operation: params.operation,
      success: false,
      duration: 0,
      persisted: false,
    };

    try {
      // Execute the operation
      const data = await params.handler();
      
      result.success = true;
      result.data = data;
      result.duration = Date.now() - startTime;

      // Persist if allowed
      if (this.config.allowPersistence) {
        this.executionHistory.push(result);
        result.persisted = true;
      }

      this.logger.info('Shadow operation completed successfully', { result });
    } catch (error) {
      result.success = false;
      result.error = String(error);
      result.duration = Date.now() - startTime;

      // Still persist failures for tracking
      if (this.config.allowPersistence) {
        this.executionHistory.push(result);
        result.persisted = true;
      }

      this.logger.error('Shadow operation failed', { result, error });
    }

    return result;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(filter?: {
    tenantId?: string;
    connector?: string;
    mode?: ExecutionMode;
    since?: number;
  }): ShadowExecutionResult[] {
    let history = [...this.executionHistory];

    if (filter) {
      if (filter.tenantId) {
        history = history.filter(e => e.tenantId === filter.tenantId);
      }
      if (filter.connector) {
        history = history.filter(e => e.connector === filter.connector);
      }
      if (filter.mode) {
        history = history.filter(e => e.mode === filter.mode);
      }
      if (filter.since !== undefined) {
        history = history.filter(e => e.timestamp >= (filter.since as number));
      }
    }

    return history.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get execution statistics
   */
  getExecutionStatistics(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageDuration: number;
    byConnector: Record<string, number>;
    byMode: Record<string, number>;
  } {
    const total = this.executionHistory.length;
    const successful = this.executionHistory.filter(e => e.success).length;
    const failed = total - successful;
    const avgDuration = total > 0
      ? this.executionHistory.reduce((sum, e) => sum + e.duration, 0) / total
      : 0;

    const byConnector: Record<string, number> = {};
    const byMode: Record<string, number> = {};

    this.executionHistory.forEach(e => {
      byConnector[e.connector] = (byConnector[e.connector] || 0) + 1;
      byMode[e.mode] = (byMode[e.mode] || 0) + 1;
    });

    return {
      totalExecutions: total,
      successfulExecutions: successful,
      failedExecutions: failed,
      averageDuration: Math.round(avgDuration),
      byConnector,
      byMode,
    };
  }

  /**
   * Clear execution history (for testing only)
   */
  clearExecutionHistory(): void {
    this.logger.warn('Execution history cleared');
    this.executionHistory = [];
  }

  /**
   * Generate shadow mode report
   */
  generateShadowModeReport(): string {
    const stats = this.getExecutionStatistics();
    const recentExecutions = this.getExecutionHistory().slice(0, 10);

    let report = '=== Shadow Mode Report ===\n';
    report += `Execution Mode: ${this.config.executionMode}\n`;
    report += `Real APIs Allowed: ${this.config.allowRealAPIs}\n`;
    report += `Mutations Allowed: ${this.config.allowMutations}\n`;
    report += `Publishing Allowed: ${this.config.allowPublishing}\n`;
    report += `Indexing Allowed: ${this.config.allowIndexing}\n`;
    report += `Outreach Allowed: ${this.config.allowOutreach}\n\n`;

    report += '--- Statistics ---\n';
    report += `Total Executions: ${stats.totalExecutions}\n`;
    report += `Successful: ${stats.successfulExecutions}\n`;
    report += `Failed: ${stats.failedExecutions}\n`;
    report += `Average Duration: ${stats.averageDuration}ms\n\n`;

    report += '--- By Connector ---\n';
    Object.entries(stats.byConnector).forEach(([connector, count]) => {
      report += `${connector}: ${count}\n`;
    });

    report += '\n--- By Mode ---\n';
    Object.entries(stats.byMode).forEach(([mode, count]) => {
      report += `${mode}: ${count}\n`;
    });

    report += '\n--- Recent Executions ---\n';
    recentExecutions.forEach(e => {
      report += `${new Date(e.timestamp).toISOString()} - ${e.connector} - ${e.operation}\n`;
      report += `  Status: ${e.success ? 'SUCCESS' : 'FAILED'}\n`;
      report += `  Duration: ${e.duration}ms\n`;
      if (e.error) {
        report += `  Error: ${e.error}\n`;
      }
    });

    return report;
  }
}

/**
 * Singleton instance
 */
export const shadowModeSystem = new ShadowModeSystem();
