/**
 * CLAUX Runtime Verification Layer - Validation
 */

import type { VerificationResult, ReplayComparison } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Verification Validator
 */
export class VerificationValidator {
  /**
   * Validate verification result
   */
  validateVerificationResult(result: VerificationResult): ValidationResult {
    const errors: string[] = [];

    if (!result.verificationId) errors.push('Missing verificationId');
    if (typeof result.valid !== 'boolean') errors.push('Invalid valid');
    if (!Array.isArray(result.errors)) errors.push('Invalid errors');
    if (!result.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate replay comparison
   */
  validateReplayComparison(comparison: ReplayComparison): ValidationResult {
    const errors: string[] = [];

    if (!comparison.replayId) errors.push('Missing replayId');
    if (!comparison.originalExecutionId) errors.push('Missing originalExecutionId');
    if (typeof comparison.matches !== 'boolean') errors.push('Invalid matches');
    if (!Array.isArray(comparison.differences)) errors.push('Invalid differences');
    if (!comparison.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }
}
