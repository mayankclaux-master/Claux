/**
 * CLAUX Runtime Simulation Layer - Validation
 */

import type { SimulationResult, DryRunResult } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Simulation Validator
 */
export class SimulationValidator {
  /**
   * Validate simulation result
   */
  validateSimulationResult(result: SimulationResult): ValidationResult {
    const errors: string[] = [];

    if (!result.simulationId) errors.push('Missing simulationId');
    if (!result.metrics) errors.push('Missing metrics');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate dry run result
   */
  validateDryRunResult(result: DryRunResult): ValidationResult {
    const errors: string[] = [];

    if (!result.executionId) errors.push('Missing executionId');
    if (result.predictedDuration < 0) errors.push('Invalid predictedDuration');

    return { valid: errors.length === 0, errors };
  }
}
