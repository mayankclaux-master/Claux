/**
 * CLAUX Runtime Testing Layer - Validation
 */

import type { ChaosTestResult, FaultScenario } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Testing Validator
 */
export class TestingValidator {
  /**
   * Validate chaos test result
   */
  validateChaosTestResult(result: ChaosTestResult): ValidationResult {
    const errors: string[] = [];

    if (!result.testId) errors.push('Missing testId');
    if (result.recoveryTime < 0) errors.push('Invalid recoveryTime');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate fault scenario
   */
  validateFaultScenario(scenario: FaultScenario): ValidationResult {
    const errors: string[] = [];

    if (!scenario.scenarioId) errors.push('Missing scenarioId');
    if (!scenario.type) errors.push('Missing type');

    return { valid: errors.length === 0, errors };
  }
}
