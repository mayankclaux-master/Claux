/**
 * CLAUX Runtime Governance Layer - Types
 */

export type PolicyId = string;
export type TenantId = string;
export type PolicyScope = string;

/**
 * Policy Effect
 */
export type PolicyEffect = 'allow' | 'deny' | 'conditional';

/**
 * Policy Action
 */
export type PolicyAction = string;

/**
 * Policy Resource
 */
export type PolicyResource = string;

/**
 * Policy
 */
export interface Policy {
  readonly policyId: PolicyId;
  readonly name: string;
  readonly effect: PolicyEffect;
  readonly actions: readonly PolicyAction[];
  readonly resources: readonly PolicyResource[];
  readonly conditions?: readonly PolicyCondition[];
  readonly scope?: PolicyScope;
  readonly priority: number;
}

/**
 * Policy Condition
 */
export interface PolicyCondition {
  readonly operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  readonly key: string;
  readonly value: unknown;
}

/**
 * Policy Evaluation Context
 */
export interface PolicyContext {
  readonly tenantId?: TenantId;
  readonly userId?: string;
  readonly action: PolicyAction;
  readonly resource: PolicyResource;
  readonly metadata: Record<string, unknown>;
}

/**
 * Policy Evaluation Result
 */
export interface PolicyEvaluationResult {
  readonly policyId: PolicyId;
  readonly effect: PolicyEffect;
  readonly matched: boolean;
  readonly reason?: string;
}

/**
 * Rate Limit
 */
export interface RateLimit {
  readonly limit: number;
  readonly window: number;
  readonly burst?: number;
}

/**
 * Resource Quota
 */
export interface ResourceQuota {
  readonly resource: string;
  readonly limit: number;
  readonly current: number;
}

/**
 * Cost Budget
 */
export interface CostBudget {
  readonly budgetId: string;
  readonly tenantId: TenantId;
  readonly limit: number;
  readonly period: number;
  readonly current: number;
}

/**
 * Compliance Rule
 */
export interface ComplianceRule {
  readonly ruleId: string;
  readonly name: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly check: (context: PolicyContext) => boolean;
}
