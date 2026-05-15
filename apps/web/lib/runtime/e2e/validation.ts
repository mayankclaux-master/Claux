/**
 * CLAUX Runtime E2E Layer - Validation
 */

import type { SandboxState, SnapshotState } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * E2E Validator
 */
export class E2EValidator {
  /**
   * Validate sandbox state
   */
  validateSandboxState(state: SandboxState): ValidationResult {
    const errors: string[] = [];

    if (!state.sandboxId) errors.push('Missing sandboxId');
    if (typeof state.isolated !== 'boolean') errors.push('Invalid isolated');
    if (!state.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate snapshot state
   */
  validateSnapshotState(state: SnapshotState): ValidationResult {
    const errors: string[] = [];

    if (!state.snapshotId) errors.push('Missing snapshotId');
    if (!state.state) errors.push('Missing state');
    if (!state.timestamp) errors.push('Missing timestamp');

    return { valid: errors.length === 0, errors };
  }
}
