/**
 * CLAUX Runtime Scenarios Layer - Validation
 */

import type { ScenarioResult, ScenarioDefinition } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Scenarios Validator
 */
export class ScenariosValidator {
  /**
   * Validate scenario result
   */
  validateScenarioResult(result: ScenarioResult): ValidationResult {
    const errors: string[] = [];

    if (!result.scenarioId) errors.push('Missing scenarioId');
    if (!result.executionId) errors.push('Missing executionId');
    if (typeof result.success !== 'boolean') errors.push('Invalid success');
    if (typeof result.duration !== 'number') errors.push('Invalid duration');
    if (!result.telemetry) errors.push('Missing telemetry');
    if (!Array.isArray(result.checkpoints)) errors.push('Invalid checkpoints');
    if (!Array.isArray(result.replayHistory)) errors.push('Invalid replayHistory');
    if (!result.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate scenario definition
   */
  validateScenarioDefinition(definition: ScenarioDefinition): ValidationResult {
    const errors: string[] = [];

    if (!definition.scenarioId) errors.push('Missing scenarioId');
    if (!definition.name) errors.push('Missing name');
    if (!definition.description) errors.push('Missing description');
    if (!definition.type) errors.push('Missing type');

    return { valid: errors.length === 0, errors };
  }
}
