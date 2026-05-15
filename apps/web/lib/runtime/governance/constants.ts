/**
 * CLAUX Runtime Governance Layer - Constants
 */

/**
 * Default Policy Priority
 */
export const DEFAULT_POLICY_PRIORITY = 100;

/**
 * Deny Policy Priority
 */
export const DENY_POLICY_PRIORITY = 1000;

/**
 * Allow Policy Priority
 */
export const ALLOW_POLICY_PRIORITY = 100;

/**
 * Default Rate Limit Window (1 minute)
 */
export const DEFAULT_RATE_LIMIT_WINDOW = 60000;

/**
 * Default Rate Limit
 */
export const DEFAULT_RATE_LIMIT = 100;

/**
 * Default Burst Limit
 */
export const DEFAULT_BURST_LIMIT = 10;

/**
 * Default Quota
 */
export const DEFAULT_QUOTA = 1000;

/**
 * Default Budget Period (1 day)
 */
export const DEFAULT_BUDGET_PERIOD = 86400000;

/**
 * Policy Inheritance Modes
 */
export const POLICY_INHERITANCE_MODES = {
  NONE: 'none',
  MERGE: 'merge',
  OVERRIDE: 'override',
} as const;
