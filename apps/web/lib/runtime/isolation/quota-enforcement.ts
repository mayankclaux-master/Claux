/**
 * CLAUX Runtime Isolation Layer - Quota Enforcement
 */

import type { TenantId } from './types';
import { QuotaEnforcementError } from './errors';

/**
 * Quota
 */
export interface Quota {
  readonly tenantId: TenantId;
  readonly resource: string;
  readonly limit: number;
  readonly used: number;
}

/**
 * Quota Enforcement Manager
 */
export class QuotaEnforcementManager {
  private quotas: Map<TenantId, Map<string, Quota>> = new Map();

  /**
   * Set quota
   */
  set(tenantId: TenantId, resource: string, limit: number): void {
    const tenantQuotas = this.quotas.get(tenantId) || new Map();
    const quota: Quota = {
      tenantId,
      resource,
      limit,
      used: 0,
    };
    tenantQuotas.set(resource, quota);
    this.quotas.set(tenantId, tenantQuotas);
  }

  /**
   * Check quota
   */
  check(tenantId: TenantId, resource: string, amount: number): boolean {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return true;

    const quota = tenantQuotas.get(resource);
    if (!quota) return true;

    return quota.used + amount <= quota.limit;
  }

  /**
   * Use quota
   */
  use(tenantId: TenantId, resource: string, amount: number): void {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return;

    const quota = tenantQuotas.get(resource);
    if (!quota) return;

    if (!this.check(tenantId, resource, amount)) {
      throw new QuotaEnforcementError(`Quota exceeded for ${resource}`);
    }

    const updated: Quota = {
      ...quota,
      used: quota.used + amount,
    };

    tenantQuotas.set(resource, updated);
  }

  /**
   * Release quota
   */
  release(tenantId: TenantId, resource: string, amount: number): void {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return;

    const quota = tenantQuotas.get(resource);
    if (!quota) return;

    const updated: Quota = {
      ...quota,
      used: Math.max(0, quota.used - amount),
    };

    tenantQuotas.set(resource, updated);
  }

  /**
   * Get remaining
   */
  getRemaining(tenantId: TenantId, resource: string): number {
    const tenantQuotas = this.quotas.get(tenantId);
    if (!tenantQuotas) return 0;

    const quota = tenantQuotas.get(resource);
    if (!quota) return 0;

    return Math.max(0, quota.limit - quota.used);
  }

  /**
   * Clear
   */
  clear(): void {
    this.quotas.clear();
  }
}
