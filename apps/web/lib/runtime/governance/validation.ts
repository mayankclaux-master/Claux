/**
 * CLAUX Runtime Governance Layer - Validation
 */

import type { Policy, PolicyContext } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Governance Validator
 */
export class GovernanceValidator {
  /**
   * Validate policy
   */
  validatePolicy(policy: Policy): ValidationResult {
    const errors: string[] = [];

    if (!policy.policyId) errors.push('Missing policyId');
    if (!policy.name) errors.push('Missing name');
    if (!policy.effect) errors.push('Missing effect');
    if (!policy.actions || policy.actions.length === 0) errors.push('Missing actions');
    if (!policy.resources || policy.resources.length === 0) errors.push('Missing resources');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate context
   */
  validateContext(context: PolicyContext): ValidationResult {
    const errors: string[] = [];

    if (!context.action) errors.push('Missing action');
    if (!context.resource) errors.push('Missing resource');

    return { valid: errors.length === 0, errors };
  }
}
