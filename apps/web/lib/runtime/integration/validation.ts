/**
 * CLAUX Runtime Integration Layer - Validation
 */

import type { IntegrationResult } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Integration Validator
 */
export class IntegrationValidator {
  /**
   * Validate integration result
   */
  validateIntegrationResult(result: IntegrationResult): ValidationResult {
    const errors: string[] = [];

    if (!result.integrationId) errors.push('Missing integrationId');
    if (typeof result.valid !== 'boolean') errors.push('Invalid valid');
    if (!Array.isArray(result.errors)) errors.push('Invalid errors');
    if (!result.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }
}
