/**
 * CLAUX Runtime Governance Layer - Tenant Policy
 */

import type { Policy, PolicyContext, TenantId } from './types';
import { PolicyError } from './errors';

/**
 * Tenant Policy Manager
 */
export class TenantPolicyManager {
  private tenantPolicies: Map<TenantId, Policy[]> = new Map();
  private globalPolicies: Policy[] = [];

  /**
   * Register tenant policy
   */
  registerTenantPolicy(tenantId: TenantId, policy: Policy): void {
    const policies = this.tenantPolicies.get(tenantId) || [];
    policies.push(policy);
    this.tenantPolicies.set(tenantId, policies);
  }

  /**
   * Register global policy
   */
  registerGlobalPolicy(policy: Policy): void {
    this.globalPolicies.push(policy);
  }

  /**
   * Get tenant policies
   */
  getTenantPolicies(tenantId: TenantId): readonly Policy[] {
    return this.tenantPolicies.get(tenantId) || [];
  }

  /**
   * Get all policies for tenant (global + tenant)
   */
  getAllPolicies(tenantId: TenantId): readonly Policy[] {
    return [...this.globalPolicies, ...(this.tenantPolicies.get(tenantId) || [])];
  }

  /**
   * Clear tenant policies
   */
  clearTenantPolicies(tenantId: TenantId): void {
    this.tenantPolicies.delete(tenantId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.tenantPolicies.clear();
    this.globalPolicies = [];
  }
}
