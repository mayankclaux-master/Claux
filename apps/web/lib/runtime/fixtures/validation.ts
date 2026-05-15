/**
 * CLAUX Runtime Fixtures Layer - Validation
 */

import type { Fixture } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Fixtures Validator
 */
export class FixturesValidator {
  /**
   * Validate fixture
   */
  validateFixture(fixture: Fixture): ValidationResult {
    const errors: string[] = [];

    if (!fixture.fixtureId) errors.push('Missing fixtureId');
    if (!fixture.type) errors.push('Missing type');
    if (!fixture.data) errors.push('Missing data');
    if (typeof fixture.deterministic !== 'boolean') errors.push('Invalid deterministic');

    return { valid: errors.length === 0, errors };
  }
}
