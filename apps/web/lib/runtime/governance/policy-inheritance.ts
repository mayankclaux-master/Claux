/**
 * CLAUX Runtime Governance Layer - Policy Inheritance
 */

import type { Policy, TenantId } from './types';
import { PolicyInheritanceError } from './errors';
import { POLICY_INHERITANCE_MODES } from './constants';

/**
 * Policy Inheritance Manager
 */
export class PolicyInheritanceManager {
  private parentPolicies: Map<TenantId, TenantId> = new Map();
  private policies: Map<TenantId, Policy[]> = new Map();

  /**
   * Set parent
   */
  setParent(tenantId: TenantId, parentId: TenantId): void {
    this.parentPolicies.set(tenantId, parentId);
  }

  /**
   * Set policies
   */
  setPolicies(tenantId: TenantId, policies: Policy[]): void {
    this.policies.set(tenantId, policies);
  }

  /**
   * Get inherited policies
   */
  getInheritedPolicies(tenantId: TenantId, mode: string = POLICY_INHERITANCE_MODES.MERGE): readonly Policy[] {
    const ownPolicies = this.policies.get(tenantId) || [];
    const parentId = this.parentPolicies.get(tenantId);

    if (!parentId) return ownPolicies;

    const parentPolicies = this.getInheritedPolicies(parentId, mode);

    switch (mode) {
      case POLICY_INHERITANCE_MODES.MERGE:
        return [...parentPolicies, ...ownPolicies];
      case POLICY_INHERITANCE_MODES.OVERRIDE:
        return ownPolicies.length > 0 ? ownPolicies : parentPolicies;
      case POLICY_INHERITANCE_MODES.NONE:
        return ownPolicies;
      default:
        return ownPolicies;
    }
  }

  /**
   * Clear
   */
  clear(): void {
    this.parentPolicies.clear();
    this.policies.clear();
  }
}
