/**
 * CLAUX Runtime Scaling Layer - Scale Policies
 */

import type { ScalePolicyId } from './types';
import { DEFAULT_MIN_WORKERS, DEFAULT_MAX_WORKERS } from './constants';

/**
 * Scale Policy
 */
export interface ScalePolicy {
  readonly policyId: ScalePolicyId;
  readonly name: string;
  readonly minWorkers: number;
  readonly maxWorkers: number;
  readonly scaleUpThreshold: number;
  readonly scaleDownThreshold: number;
}

/**
 * Scale Policies Manager
 */
export class ScalePoliciesManager {
  private policies: Map<ScalePolicyId, ScalePolicy> = new Map();
  private activePolicy: ScalePolicyId | null = null;

  /**
   * Register policy
   */
  register(policy: ScalePolicy): void {
    this.policies.set(policy.policyId, policy);
  }

  /**
   * Activate policy
   */
  activate(policyId: ScalePolicyId): void {
    this.activePolicy = policyId;
  }

  /**
   * Get active policy
   */
  getActivePolicy(): ScalePolicy | null {
    if (!this.activePolicy) return null;
    return this.policies.get(this.activePolicy) || null;
  }

  /**
   * Get policy
   */
  getPolicy(policyId: ScalePolicyId): ScalePolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Create default policy
   */
  createDefaultPolicy(): ScalePolicy {
    return {
      policyId: 'default',
      name: 'Default Policy',
      minWorkers: DEFAULT_MIN_WORKERS,
      maxWorkers: DEFAULT_MAX_WORKERS,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.3,
    };
  }

  /**
   * Clear
   */
  clear(): void {
    this.policies.clear();
    this.activePolicy = null;
  }
}
