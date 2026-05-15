/**
 * CLAUX Runtime Isolation Layer - Cross-Tenant Protection
 */

import type { TenantId } from './types';
import { CrossTenantViolationError } from './errors';

/**
 * Cross-Tenant Protection Manager
 */
export class CrossTenantProtectionManager {
  private accessRules: Map<TenantId, Set<TenantId>> = new Map();

  /**
   * Allow access
   */
  allow(sourceTenantId: TenantId, targetTenantId: TenantId): void {
    const rules = this.accessRules.get(sourceTenantId) || new Set();
    rules.add(targetTenantId);
    this.accessRules.set(sourceTenantId, rules);
  }

  /**
   * Check access
   */
  check(sourceTenantId: TenantId, targetTenantId: TenantId): boolean {
    if (sourceTenantId === targetTenantId) return true;

    const rules = this.accessRules.get(sourceTenantId);
    if (!rules) return false;

    return rules.has(targetTenantId);
  }

  /**
   * Revoke access
   */
  revoke(sourceTenantId: TenantId, targetTenantId: TenantId): void {
    const rules = this.accessRules.get(sourceTenantId);
    if (!rules) return;

    rules.delete(targetTenantId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.accessRules.clear();
  }
}
