/**
 * Shadow Execution Labels
 * 
 * Every execution must indicate:
 * - mock
 * - shadow
 * - production
 * 
 * Persist execution mode everywhere.
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { ExecutionMode } from './shadow-mode-system';

/**
 * Execution label
 */
export interface ExecutionLabel {
  executionId: string;
  mode: ExecutionMode;
  timestamp: number;
  tenantId: string;
  userId?: string;
  traceId?: string;
  connector?: string;
  operation?: string;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Labeled execution result
 */
export interface LabeledExecutionResult {
  executionId: string;
  label: ExecutionLabel;
  result: any;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Shadow execution labels service
 */
export class ShadowExecutionLabels {
  private logger: Logger;
  private labels: ExecutionLabel[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Create execution label
   */
  createLabel(params: {
    mode: ExecutionMode;
    tenantId: string;
    userId?: string;
    traceId?: string;
    connector?: string;
    operation?: string;
    source: string;
    metadata?: Record<string, any>;
  }): ExecutionLabel {
    const label: ExecutionLabel = {
      executionId: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.labels.push(label);
    this.logger.info('Execution label created', { label });

    return label;
  }

  /**
   * Execute with label
   */
  async executeWithLabel(params: {
    mode: ExecutionMode;
    tenantId: string;
    userId?: string;
    traceId?: string;
    connector?: string;
    operation?: string;
    source: string;
    metadata?: Record<string, any>;
    handler: () => Promise<any>;
  }): Promise<LabeledExecutionResult> {
    const label = this.createLabel(params);
    const startTime = Date.now();

    const result: LabeledExecutionResult = {
      executionId: label.executionId,
      label,
      result: null,
      duration: 0,
      success: false,
    };

    try {
      const data = await params.handler();
      result.result = data;
      result.success = true;
      result.duration = Date.now() - startTime;

      this.logger.info('Labeled execution completed successfully', { result });
    } catch (error) {
      result.success = false;
      result.error = String(error);
      result.duration = Date.now() - startTime;

      this.logger.error('Labeled execution failed', { result, error });
    }

    return result;
  }

  /**
   * Get label by execution ID
   */
  getLabel(executionId: string): ExecutionLabel | undefined {
    return this.labels.find(label => label.executionId === executionId);
  }

  /**
   * Get labels by mode
   */
  getLabelsByMode(mode: ExecutionMode): ExecutionLabel[] {
    return this.labels.filter(label => label.mode === mode);
  }

  /**
   * Get labels by tenant
   */
  getLabelsByTenant(tenantId: string): ExecutionLabel[] {
    return this.labels.filter(label => label.tenantId === tenantId);
  }

  /**
   * Get labels by connector
   */
  getLabelsByConnector(connector: string): ExecutionLabel[] {
    return this.labels.filter(label => label.connector === connector);
  }

  /**
   * Get labels by trace ID
   */
  getLabelsByTraceId(traceId: string): ExecutionLabel[] {
    return this.labels.filter(label => label.traceId === traceId);
  }

  /**
   * Get label statistics
   */
  getLabelStatistics(): {
    totalLabels: number;
    byMode: Record<string, number>;
    byConnector: Record<string, number>;
    bySource: Record<string, number>;
    byTenant: Record<string, number>;
  } {
    const total = this.labels.length;

    const byMode: Record<string, number> = {};
    const byConnector: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byTenant: Record<string, number> = {};

    this.labels.forEach(label => {
      byMode[label.mode] = (byMode[label.mode] || 0) + 1;
      if (label.connector) {
        byConnector[label.connector] = (byConnector[label.connector] || 0) + 1;
      }
      bySource[label.source] = (bySource[label.source] || 0) + 1;
      byTenant[label.tenantId] = (byTenant[label.tenantId] || 0) + 1;
    });

    return {
      totalLabels: total,
      byMode,
      byConnector,
      bySource,
      byTenant,
    };
  }

  /**
   * Export labels as JSON
   */
  exportLabelsAsJSON(filter?: {
    mode?: ExecutionMode;
    tenantId?: string;
    connector?: string;
    since?: number;
    until?: number;
  }): string {
    let labels = [...this.labels];

    if (filter) {
      if (filter.mode) {
        labels = labels.filter(label => label.mode === filter.mode);
      }
      if (filter.tenantId) {
        labels = labels.filter(label => label.tenantId === filter.tenantId);
      }
      if (filter.connector) {
        labels = labels.filter(label => label.connector === filter.connector);
      }
      if (filter.since !== undefined) {
        labels = labels.filter(label => label.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        labels = labels.filter(label => label.timestamp <= (filter.until as number));
      }
    }

    labels.sort((a, b) => b.timestamp - a.timestamp);
    return JSON.stringify(labels, null, 2);
  }

  /**
   * Generate labels report
   */
  generateLabelsReport(): string {
    const stats = this.getLabelStatistics();
    const recentLabels = [...this.labels].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    let report = '=== Shadow Execution Labels Report ===\n';
    report += `Total Labels: ${stats.totalLabels}\n\n`;

    report += '--- By Mode ---\n';
    Object.entries(stats.byMode).forEach(([mode, count]) => {
      report += `${mode}: ${count}\n`;
    });

    report += '\n--- By Connector ---\n';
    Object.entries(stats.byConnector).forEach(([connector, count]) => {
      report += `${connector}: ${count}\n`;
    });

    report += '\n--- By Source ---\n';
    Object.entries(stats.bySource).forEach(([source, count]) => {
      report += `${source}: ${count}\n`;
    });

    report += '\n--- By Tenant ---\n';
    Object.entries(stats.byTenant).forEach(([tenantId, count]) => {
      report += `${tenantId}: ${count}\n`;
    });

    report += '\n--- Recent Labels ---\n';
    recentLabels.forEach(label => {
      report += `${new Date(label.timestamp).toISOString()} - ${label.mode}\n`;
      report += `  Execution ID: ${label.executionId}\n`;
      report += `  Tenant: ${label.tenantId}\n`;
      report += `  Source: ${label.source}\n`;
      if (label.connector) {
        report += `  Connector: ${label.connector}\n`;
      }
      if (label.operation) {
        report += `  Operation: ${label.operation}\n`;
      }
      if (label.traceId) {
        report += `  Trace ID: ${label.traceId}\n`;
      }
    });

    return report;
  }

  /**
   * Clear labels (for testing only)
   */
  clearLabels(): void {
    this.logger.warn('Execution labels cleared');
    this.labels = [];
  }
}

/**
 * Singleton instance
 */
export const shadowExecutionLabels = new ShadowExecutionLabels();
