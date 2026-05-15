/**
 * CLAUX Runtime Governance Layer - Policy Contracts
 */

import type { Policy, PolicyContext, PolicyEvaluationResult } from './types';

/**
 * Policy Contract
 */
export interface PolicyContract {
  readonly policyId: string;
  readonly evaluate: (context: PolicyContext) => PolicyEvaluationResult;
}

/**
 * Policy Registry Contract
 */
export interface PolicyRegistryContract {
  register(policy: Policy): void;
  unregister(policyId: string): void;
  get(policyId: string): Policy | undefined;
  list(): readonly Policy[];
}

/**
 * Policy Evaluator Contract
 */
export interface PolicyEvaluatorContract {
  evaluate(context: PolicyContext): PolicyEvaluationResult;
  evaluateAll(context: PolicyContext): readonly PolicyEvaluationResult[];
}
