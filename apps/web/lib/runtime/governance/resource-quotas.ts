/**
 * CLAUX Runtime Governance Layer - Resource Quotas
 */

import type { ResourceQuota, TenantId } from './types';
import { QuotaError } from './errors';
import { DEFAULT_QUOTA } from './constants';

/**
 * Resource Quota Manager
 */
export class ResourceQuotaManager {
  private quotas: Map<TenantId, Map<string, ResourceQuota>> = new Map();

  /**
   * Set quota
   */
  setQuota(tenantId: TenantId, quota: ResourceQuota): void {
    const tenantQuotas = this.quotas.get(tenantId) || new Map();
    tenantQuotas.set(quota.resource, quota);
    this.quotas.set(tenantId, tenantQuotas);
  }

  /**
   * Check quota
   */
  checkQuota(tenantId: TenantId, resource: string): boolean {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return true;

    const quota = tenantQuotas.get(resource);
    if (!quota) return true;

    return quota.current < quota.limit;
  }

  /**
   * Increment usage
   */
  incrementUsage(tenantId: TenantId, resource: string): void {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return;

    const quota = tenantQuotas.get(resource);
    if (!quota) return;

    const updated: ResourceQuota = {
      ...quota,
      current: quota.current + 1,
    };
    tenantQuotas.set(resource, updated);
  }

  /**
   * Decrement usage
   */
  decrementUsage(tenantId: TenantId, resource: string): void {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return;

    const quota = tenantQuotas.get(resource);
    if (!quota) return;

    const updated: ResourceQuota = {
      ...quota,
      current: Math.max(0, quota.current - 1),
    };
    tenantQuotas.set(resource, updated);
  }

  /**
   * Get remaining
   */
  getRemaining(tenantId: TenantId, resource: string): number {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return DEFAULT_QUOTA;

    const quota = tenantQuotas.get(resource);
    if (!quota) return DEFAULT_QUOTA;

    return Math.max(0, quota.limit - quota.current);
  }

  /**
   * Clear tenant quotas
   */
  clearTenantQuotas(tenantId: TenantId): void {
    this.quotas.delete(tenantId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.quotas.clear();
  }
}
