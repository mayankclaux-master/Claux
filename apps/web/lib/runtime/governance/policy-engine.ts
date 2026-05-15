/**
 * CLAUX Runtime Governance Layer - Policy Engine
 */

import type { Policy, PolicyContext, PolicyEvaluationResult, PolicyCondition } from './types';
import { PolicyError } from './errors';
import { DENY_POLICY_PRIORITY, ALLOW_POLICY_PRIORITY } from './constants';

/**
 * Policy Engine
 */
export class PolicyEngine {
  private policies: Map<string, Policy> = new Map();

  /**
   * Register policy
   */
  register(policy: Policy): void {
    this.policies.set(policy.policyId, policy);
  }

  /**
   * Unregister policy
   */
  unregister(policyId: string): void {
    this.policies.delete(policyId);
  }

  /**
   * Get policy
   */
  get(policyId: string): Policy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * List policies
   */
  list(): readonly Policy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Evaluate context
   */
  evaluate(context: PolicyContext): PolicyEvaluationResult {
    const matched = this.findMatchingPolicy(context);

    if (!matched) {
      return {
        policyId: 'default',
        effect: 'deny',
        matched: false,
        reason: 'No matching policy',
      };
    }

    return {
      policyId: matched.policyId,
      effect: matched.effect,
      matched: true,
      reason: matched.effect === 'deny' ? 'Explicit deny' : 'Explicit allow',
    };
  }

  /**
   * Evaluate all policies
   */
  evaluateAll(context: PolicyContext): readonly PolicyEvaluationResult[] {
    const results: PolicyEvaluationResult[] = [];

    for (const policy of this.policies.values()) {
      const result = this.evaluatePolicy(policy, context);
      if (result.matched) {
        results.push(result);
      }
    }

    return this.sortByPriority(results);
  }

  /**
   * Find matching policy
   */
  private findMatchingPolicy(context: PolicyContext): Policy | null {
    const matched = this.evaluateAll(context);
    if (matched.length === 0) return null;

    // Deny takes precedence
    const deny = matched.find(r => r.effect === 'deny');
    if (deny) return this.policies.get(deny.policyId)!;

    // Return highest priority allow
    return this.policies.get(matched[0].policyId)!;
  }

  /**
   * Evaluate single policy
   */
  private evaluatePolicy(policy: Policy, context: PolicyContext): PolicyEvaluationResult {
    if (!this.matchesAction(policy, context.action)) {
      return { policyId: policy.policyId, effect: policy.effect, matched: false };
    }

    if (!this.matchesResource(policy, context.resource)) {
      return { policyId: policy.policyId, effect: policy.effect, matched: false };
    }

    if (policy.conditions && !this.matchesConditions([...policy.conditions], context.metadata)) {
      return { policyId: policy.policyId, effect: policy.effect, matched: false };
    }

    return { policyId: policy.policyId, effect: policy.effect, matched: true };
  }

  /**
   * Match action
   */
  private matchesAction(policy: Policy, action: string): boolean {
    return policy.actions.includes(action) || policy.actions.includes('*');
  }

  /**
   * Match resource
   */
  private matchesResource(policy: Policy, resource: string): boolean {
    return policy.resources.includes(resource) || policy.resources.includes('*');
  }

  /**
   * Match conditions
   */
  private matchesConditions(conditions: PolicyCondition[] | undefined, metadata: Record<string, unknown>): boolean {
    if (!conditions) return true;

    for (const condition of conditions) {
      const value = metadata[condition.key];
      if (!this.evaluateCondition(condition, value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: PolicyCondition, value: unknown): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(condition.value as string);
      default:
        return false;
    }
  }

  /**
   * Sort by priority
   */
  private sortByPriority(results: readonly PolicyEvaluationResult[]): PolicyEvaluationResult[] {
    return [...results].sort((a, b) => {
      const policyA = this.policies.get(a.policyId)!;
      const policyB = this.policies.get(b.policyId)!;
      return policyB.priority - policyA.priority;
    });
  }

  /**
   * Clear
   */
  clear(): void {
    this.policies.clear();
  }
}
