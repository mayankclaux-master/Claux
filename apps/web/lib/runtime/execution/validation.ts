/**
 * CLAUX Runtime Execution Engine - Validation
 * 
 * Validation utilities for execution engine.
 * No external dependencies - pure validation logic.
 */

import { ValidationError } from '../errors';

/**
 * Validation Result
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Validation Rules
 */
export interface ValidationRule {
  readonly name: string;
  readonly description: string;
  readonly severity: 'error' | 'warning';
  validate(context: ValidationContext): boolean;
}

/**
 * Validation Context
 */
export interface ValidationContext {
  readonly dag: unknown;
  readonly graphState?: unknown;
  readonly executionId?: string;
}

/**
 * Validator
 * 
 * Validates execution engine state and configuration.
 */
export class Validator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  /**
   * Register validation rule
   */
  registerRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Unregister validation rule
   */
  unregisterRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  /**
   * Validate DAG
   */
  validateDAG(dag: unknown): ValidationResult {
    const context: ValidationContext = { dag };
    return this.validate(context);
  }

  /**
   * Validate execution graph state
   */
  validateGraphState(graphState: unknown): ValidationResult {
    // TODO: Implement using correct types
    // Currently graphState type not available
    return {
      isValid: false,
      errors: ['Graph state validation not implemented'],
      warnings: [],
    };
  }

  /**
   * Validate with context
   */
  validate(context: ValidationContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const rule of this.rules) {
      try {
        const isValid = rule.validate(context);

        if (!isValid) {
          if (rule.severity === 'error') {
            errors.push(`${rule.name}: ${rule.description}`);
          } else {
            warnings.push(`${rule.name}: ${rule.description}`);
          }
        }
      } catch (error) {
        errors.push(`${rule.name}: Validation error - ${error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Register default validation rules
   */
  private registerDefaultRules(): void {
    // TODO: Implement using correct DAG type
    // Currently DAG type not available
  }

  /**
   * Get registered rules
   */
  getRules(): readonly ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Clear all rules
   */
  clearRules(): void {
    this.rules = [];
  }
}

/**
 * Quick validation helper
 */
export function validateDAG(dag: unknown): ValidationResult {
  // TODO: Implement using correct DAG type
  // Currently DAG type not available
  return {
    isValid: false,
    errors: ['DAG validation not implemented'],
    warnings: [],
  };
}

/**
 * Quick graph state validation helper
 */
export function validateGraphState(graphState: unknown): ValidationResult {
  // TODO: Implement using correct ExecutionGraphState type
  // Currently ExecutionGraphState type not available
  return {
    isValid: false,
    errors: ['Graph state validation not implemented'],
    warnings: [],
  };
}
