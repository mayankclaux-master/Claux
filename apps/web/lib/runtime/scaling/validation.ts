/**
 * CLAUX Runtime Scaling Layer - Validation
 */

import type { ScalePrediction, ScaleDecision } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Scaling Validator
 */
export class ScalingValidator {
  /**
   * Validate prediction
   */
  validatePrediction(prediction: ScalePrediction): ValidationResult {
    const errors: string[] = [];

    if (prediction.predictedLoad < 0 || prediction.predictedLoad > 1) errors.push('Invalid predictedLoad');
    if (prediction.recommendedWorkers < 0) errors.push('Invalid recommendedWorkers');
    if (prediction.confidence < 0 || prediction.confidence > 1) errors.push('Invalid confidence');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate decision
   */
  validateDecision(decision: ScaleDecision): ValidationResult {
    const errors: string[] = [];

    if (!decision.action) errors.push('Missing action');
    if (decision.targetWorkers < 0) errors.push('Invalid targetWorkers');

    return { valid: errors.length === 0, errors };
  }
}
