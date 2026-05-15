/**
 * CLAUX Runtime Governance Layer - Compliance Policies
 */

import type { ComplianceRule, PolicyContext } from './types';
import { ComplianceError } from './errors';

/**
 * Compliance Policy Manager
 */
export class CompliancePolicyManager {
  private rules: Map<string, ComplianceRule> = new Map();

  /**
   * Register rule
   */
  registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.ruleId, rule);
  }

  /**
   * Evaluate context
   */
  evaluate(context: PolicyContext): readonly ComplianceRule[] {
    const violations: ComplianceRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.check(context)) {
        violations.push(rule);
      }
    }

    return violations;
  }

  /**
   * Check compliance
   */
  isCompliant(context: PolicyContext): boolean {
    return this.evaluate(context).length === 0;
  }

  /**
   * Get rule
   */
  getRule(ruleId: string): ComplianceRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.rules.clear();
  }
}
