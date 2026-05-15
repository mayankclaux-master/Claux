/**
 * CLAUX Runtime Hardening Layer - Validation
 */

import type { HardeningCheckResult } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Hardening Validator
 */
export class HardeningValidator {
  /**
   * Validate hardening check result
   */
  validateHardeningCheckResult(result: HardeningCheckResult): ValidationResult {
    const errors: string[] = [];

    if (!result.hardeningId) errors.push('Missing hardeningId');
    if (!result.checkType) errors.push('Missing checkType');
    if (typeof result.passed !== 'boolean') errors.push('Invalid passed');
    if (!Array.isArray(result.details)) errors.push('Invalid details');
    if (!result.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }
}
