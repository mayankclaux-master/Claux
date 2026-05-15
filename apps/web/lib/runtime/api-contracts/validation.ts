/**
 * CLAUX Runtime API Contracts Layer - Validation
 */

import type { APIRequest, APIResponse } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * API Contracts Validator
 */
export class APIContractsValidator {
  /**
   * Validate request
   */
  validateRequest(request: APIRequest): ValidationResult {
    const errors: string[] = [];

    if (!request.requestId) errors.push('Missing requestId');
    if (!request.method) errors.push('Missing method');
    if (!request.path) errors.push('Missing path');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate response
   */
  validateResponse(response: APIResponse): ValidationResult {
    const errors: string[] = [];

    if (!response.responseId) errors.push('Missing responseId');
    if (!response.requestId) errors.push('Missing requestId');

    return { valid: errors.length === 0, errors };
  }
}
