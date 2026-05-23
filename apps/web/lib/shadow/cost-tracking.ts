/**
 * Cost Tracking
 * 
 * Tracks:
 * - API usage
 * - API credits
 * - Estimated execution cost
 * - Connector usage frequency
 * - Retry cost impact
 * 
 * Per tenant and global.
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { ExecutionMode } from './shadow-mode-system';

/**
 * Cost entry
 */
export interface CostEntry {
  id: string;
  timestamp: number;
  tenantId: string;
  connector: string;
  operation: string;
  mode: ExecutionMode;
  apiCalls: number;
  creditsUsed: number;
  estimatedCost: number;
  currency: string;
  retryCount: number;
  retryCost: number;
  metadata?: Record<string, any>;
}

/**
 * Cost statistics
 */
export interface CostStatistics {
  totalCost: number;
  totalCredits: number;
  totalApiCalls: number;
  totalRetryCost: number;
  byConnector: Record<string, { cost: number; credits: number; apiCalls: number }>;
  byTenant: Record<string, { cost: number; credits: number; apiCalls: number }>;
  byMode: Record<string, { cost: number; credits: number; apiCalls: number }>;
}

/**
 * Cost tracking service
 */
export class CostTracking {
  private logger: Logger;
  private costEntries: CostEntry[] = [];
  private connectorCostRates: Map<string, number> = new Map();

  constructor() {
    this.logger = createLogger();
    this.initializeCostRates();
  }

  /**
   * Initialize cost rates per connector
   */
  private initializeCostRates(): void {
    // Cost per API call in USD
    this.connectorCostRates.set('google_search_console', 0.001);
    this.connectorCostRates.set('google_analytics', 0.001);
    this.connectorCostRates.set('google_business_profile', 0.002);
    this.connectorCostRates.set('dataforseo', 0.005);
    this.connectorCostRates.set('serpapi', 0.003);
  }

  /**
   * Track cost for an execution
   */
  trackCost(params: {
    tenantId: string;
    connector: string;
    operation: string;
    mode: ExecutionMode;
    apiCalls: number;
    retryCount: number;
    metadata?: Record<string, any>;
  }): string {
    const costRate = this.connectorCostRates.get(params.connector) || 0;
    const baseCost = params.apiCalls * costRate;
    const retryCost = params.retryCount * costRate * 1.5; // Retries cost 1.5x
    const totalCost = baseCost + retryCost;
    const creditsUsed = params.apiCalls + params.retryCount;

    const entry: CostEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      tenantId: params.tenantId,
      connector: params.connector,
      operation: params.operation,
      mode: params.mode,
      apiCalls: params.apiCalls,
      creditsUsed,
      estimatedCost: totalCost,
      currency: 'USD',
      retryCount: params.retryCount,
      retryCost,
      metadata: params.metadata,
    };

    this.costEntries.push(entry);
    this.logger.info('Cost tracked', { entry });

    return entry.id;
  }

  /**
   * Get cost entry by ID
   */
  getCostEntry(id: string): CostEntry | undefined {
    return this.costEntries.find(entry => entry.id === id);
  }

  /**
   * Get cost entries by tenant
   */
  getCostEntriesByTenant(tenantId: string): CostEntry[] {
    return this.costEntries.filter(entry => entry.tenantId === tenantId);
  }

  /**
   * Get cost entries by connector
   */
  getCostEntriesByConnector(connector: string): CostEntry[] {
    return this.costEntries.filter(entry => entry.connector === connector);
  }

  /**
   * Get cost entries by mode
   */
  getCostEntriesByMode(mode: ExecutionMode): CostEntry[] {
    return this.costEntries.filter(entry => entry.mode === mode);
  }

  /**
   * Get cost statistics
   */
  getCostStatistics(filter?: {
    tenantId?: string;
    connector?: string;
    mode?: ExecutionMode;
    since?: number;
    until?: number;
  }): CostStatistics {
    let entries = [...this.costEntries];

    if (filter) {
      if (filter.tenantId) {
        entries = entries.filter(entry => entry.tenantId === filter.tenantId);
      }
      if (filter.connector) {
        entries = entries.filter(entry => entry.connector === filter.connector);
      }
      if (filter.mode) {
        entries = entries.filter(entry => entry.mode === filter.mode);
      }
      if (filter.since !== undefined) {
        entries = entries.filter(entry => entry.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        entries = entries.filter(entry => entry.timestamp <= (filter.until as number));
      }
    }

    const totalCost = entries.reduce((sum, entry) => sum + entry.estimatedCost, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.creditsUsed, 0);
    const totalApiCalls = entries.reduce((sum, entry) => sum + entry.apiCalls, 0);
    const totalRetryCost = entries.reduce((sum, entry) => sum + entry.retryCost, 0);

    const byConnector: Record<string, { cost: number; credits: number; apiCalls: number }> = {};
    const byTenant: Record<string, { cost: number; credits: number; apiCalls: number }> = {};
    const byMode: Record<string, { cost: number; credits: number; apiCalls: number }> = {};

    entries.forEach(entry => {
      // By connector
      if (!byConnector[entry.connector]) {
        byConnector[entry.connector] = { cost: 0, credits: 0, apiCalls: 0 };
      }
      byConnector[entry.connector].cost += entry.estimatedCost;
      byConnector[entry.connector].credits += entry.creditsUsed;
      byConnector[entry.connector].apiCalls += entry.apiCalls;

      // By tenant
      if (!byTenant[entry.tenantId]) {
        byTenant[entry.tenantId] = { cost: 0, credits: 0, apiCalls: 0 };
      }
      byTenant[entry.tenantId].cost += entry.estimatedCost;
      byTenant[entry.tenantId].credits += entry.creditsUsed;
      byTenant[entry.tenantId].apiCalls += entry.apiCalls;

      // By mode
      if (!byMode[entry.mode]) {
        byMode[entry.mode] = { cost: 0, credits: 0, apiCalls: 0 };
      }
      byMode[entry.mode].cost += entry.estimatedCost;
      byMode[entry.mode].credits += entry.creditsUsed;
      byMode[entry.mode].apiCalls += entry.apiCalls;
    });

    return {
      totalCost,
      totalCredits,
      totalApiCalls,
      totalRetryCost,
      byConnector,
      byTenant,
      byMode,
    };
  }

  /**
   * Get cost summary for a tenant
   */
  getTenantCostSummary(tenantId: string): {
    totalCost: number;
    totalCredits: number;
    totalApiCalls: number;
    totalRetryCost: number;
    byConnector: Record<string, { cost: number; credits: number; apiCalls: number }>;
  } {
    const stats = this.getCostStatistics({ tenantId });
    return {
      totalCost: stats.totalCost,
      totalCredits: stats.totalCredits,
      totalApiCalls: stats.totalApiCalls,
      totalRetryCost: stats.totalRetryCost,
      byConnector: stats.byConnector,
    };
  }

  /**
   * Get cost summary for a connector
   */
  getConnectorCostSummary(connector: string): {
    totalCost: number;
    totalCredits: number;
    totalApiCalls: number;
    totalRetryCost: number;
    byTenant: Record<string, { cost: number; credits: number; apiCalls: number }>;
  } {
    const stats = this.getCostStatistics({ connector });
    return {
      totalCost: stats.totalCost,
      totalCredits: stats.totalCredits,
      totalApiCalls: stats.totalApiCalls,
      totalRetryCost: stats.totalRetryCost,
      byTenant: stats.byTenant,
    };
  }

  /**
   * Get connector usage frequency
   */
  getConnectorUsageFrequency(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Record<string, number> {
    const now = Date.now();
    let cutoff: number;

    switch (timeframe) {
      case 'hour':
        cutoff = now - 60 * 60 * 1000;
        break;
      case 'day':
        cutoff = now - 24 * 60 * 60 * 1000;
        break;
      case 'week':
        cutoff = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'month':
        cutoff = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    const recentEntries = this.costEntries.filter(entry => entry.timestamp >= cutoff);
    const frequency: Record<string, number> = {};

    recentEntries.forEach(entry => {
      frequency[entry.connector] = (frequency[entry.connector] || 0) + entry.apiCalls;
    });

    return frequency;
  }

  /**
   * Get retry cost impact
   */
  getRetryCostImpact(): {
    totalRetryCost: number;
    totalBaseCost: number;
    retryPercentage: number;
    byConnector: Record<string, { retryCost: number; baseCost: number; percentage: number }>;
  } {
    const totalRetryCost = this.costEntries.reduce((sum, entry) => sum + entry.retryCost, 0);
    const totalBaseCost = this.costEntries.reduce((sum, entry) => sum + (entry.estimatedCost - entry.retryCost), 0);
    const retryPercentage = totalBaseCost > 0 ? (totalRetryCost / totalBaseCost) * 100 : 0;

    const byConnector: Record<string, { retryCost: number; baseCost: number; percentage: number }> = {};

    this.costEntries.forEach(entry => {
      if (!byConnector[entry.connector]) {
        byConnector[entry.connector] = { retryCost: 0, baseCost: 0, percentage: 0 };
      }
      byConnector[entry.connector].retryCost += entry.retryCost;
      byConnector[entry.connector].baseCost += (entry.estimatedCost - entry.retryCost);
    });

    Object.keys(byConnector).forEach(connector => {
      const data = byConnector[connector];
      data.percentage = data.baseCost > 0 ? (data.retryCost / data.baseCost) * 100 : 0;
    });

    return {
      totalRetryCost,
      totalBaseCost,
      retryPercentage: Math.round(retryPercentage),
      byConnector,
    };
  }

  /**
   * Export cost entries as JSON
   */
  exportCostEntriesAsJSON(filter?: {
    tenantId?: string;
    connector?: string;
    mode?: ExecutionMode;
    since?: number;
    until?: number;
  }): string {
    let entries = [...this.costEntries];

    if (filter) {
      if (filter.tenantId) {
        entries = entries.filter(entry => entry.tenantId === filter.tenantId);
      }
      if (filter.connector) {
        entries = entries.filter(entry => entry.connector === filter.connector);
      }
      if (filter.mode) {
        entries = entries.filter(entry => entry.mode === filter.mode);
      }
      if (filter.since !== undefined) {
        entries = entries.filter(entry => entry.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        entries = entries.filter(entry => entry.timestamp <= (filter.until as number));
      }
    }

    entries.sort((a, b) => b.timestamp - a.timestamp);
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Generate cost report
   */
  generateCostReport(): string {
    const stats = this.getCostStatistics();
    const retryImpact = this.getRetryCostImpact();
    const recentEntries = [...this.costEntries].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);

    let report = '=== Cost Tracking Report ===\n';
    report += `Total Cost: $${stats.totalCost.toFixed(4)}\n`;
    report += `Total Credits: ${stats.totalCredits}\n`;
    report += `Total API Calls: ${stats.totalApiCalls}\n`;
    report += `Total Retry Cost: $${stats.totalRetryCost.toFixed(4)}\n\n`;

    report += '--- By Connector ---\n';
    Object.entries(stats.byConnector).forEach(([connector, data]) => {
      report += `${connector}: $${data.cost.toFixed(4)} (${data.credits} credits, ${data.apiCalls} calls)\n`;
    });

    report += '\n--- By Tenant ---\n';
    Object.entries(stats.byTenant).forEach(([tenantId, data]) => {
      report += `${tenantId}: $${data.cost.toFixed(4)} (${data.credits} credits, ${data.apiCalls} calls)\n`;
    });

    report += '\n--- By Mode ---\n';
    Object.entries(stats.byMode).forEach(([mode, data]) => {
      report += `${mode}: $${data.cost.toFixed(4)} (${data.credits} credits, ${data.apiCalls} calls)\n`;
    });

    report += '\n--- Retry Cost Impact ---\n';
    report += `Total Retry Cost: $${retryImpact.totalRetryCost.toFixed(4)}\n`;
    report += `Total Base Cost: $${retryImpact.totalBaseCost.toFixed(4)}\n`;
    report += `Retry Percentage: ${retryImpact.retryPercentage}%\n\n`;

    report += '--- By Connector Retry Impact ---\n';
    Object.entries(retryImpact.byConnector).forEach(([connector, data]) => {
      report += `${connector}: $${data.retryCost.toFixed(4)} / $${data.baseCost.toFixed(4)} (${data.percentage.toFixed(1)}%)\n`;
    });

    report += '\n--- Recent Cost Entries ---\n';
    recentEntries.forEach(entry => {
      report += `${new Date(entry.timestamp).toISOString()} - ${entry.connector}\n`;
      report += `  Tenant: ${entry.tenantId}\n`;
      report += `  Cost: $${entry.estimatedCost.toFixed(4)}\n`;
      report += `  Credits: ${entry.creditsUsed}\n`;
      report += `  API Calls: ${entry.apiCalls}\n`;
      report += `  Retries: ${entry.retryCount}\n`;
    });

    return report;
  }

  /**
   * Clear cost entries (for testing only)
   */
  clearCostEntries(): void {
    this.logger.warn('Cost entries cleared');
    this.costEntries = [];
  }
}

/**
 * Singleton instance
 */
export const costTracking = new CostTracking();
