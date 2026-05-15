/**
 * CLAUX Runtime Isolation Layer - Tenant Metrics
 */

import type { TenantId } from './types';

/**
 * Tenant Metrics
 */
export interface TenantMetrics {
  readonly tenantId: TenantId;
  readonly executions: number;
  readonly errors: number;
  readonly latency: number;
  readonly resourceUsage: number;
}

/**
 * Tenant Metrics Manager
 */
export class TenantMetricsManager {
  private metrics: Map<TenantId, TenantMetrics> = new Map();

  /**
   * Record execution
   */
  recordExecution(tenantId: TenantId, latency: number, resourceUsage: number): void {
    const current = this.metrics.get(tenantId) || this.defaultMetrics(tenantId);

    const updated: TenantMetrics = {
      ...current,
      executions: current.executions + 1,
      latency: (current.latency + latency) / 2,
      resourceUsage: (current.resourceUsage + resourceUsage) / 2,
    };

    this.metrics.set(tenantId, updated);
  }

  /**
   * Record error
   */
  recordError(tenantId: TenantId): void {
    const current = this.metrics.get(tenantId) || this.defaultMetrics(tenantId);

    const updated: TenantMetrics = {
      ...current,
      errors: current.errors + 1,
    };

    this.metrics.set(tenantId, updated);
  }

  /**
   * Get metrics
   */
  get(tenantId: TenantId): TenantMetrics | undefined {
    return this.metrics.get(tenantId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Default metrics
   */
  private defaultMetrics(tenantId: TenantId): TenantMetrics {
    return {
      tenantId,
      executions: 0,
      errors: 0,
      latency: 0,
      resourceUsage: 0,
    };
  }
}
