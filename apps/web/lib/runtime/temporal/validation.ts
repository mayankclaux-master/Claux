/**
 * CLAUX Runtime Temporal Layer - Validation
 * 
 * Validation for temporal operations.
 * No external dependencies - pure validation semantics.
 */

import type { ExecutionId, ReplayId, SnapshotId, EventId } from './types';

/**
 * ValidationResult
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * Temporal Validator
 * 
 * Validation for temporal operations.
 */
export class TemporalValidator {
  /**
   * Validate event ID
   */
  validateEventId(eventId: EventId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!eventId || eventId.trim() === '') {
      errors.push('Event ID is required');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate execution ID
   */
  validateExecutionId(executionId: ExecutionId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!executionId || executionId.trim() === '') {
      errors.push('Execution ID is required');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate replay ID
   */
  validateReplayId(replayId: ReplayId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!replayId || replayId.trim() === '') {
      errors.push('Replay ID is required');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate snapshot ID
   */
  validateSnapshotId(snapshotId: SnapshotId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!snapshotId || snapshotId.trim() === '') {
      errors.push('Snapshot ID is required');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate sequence number
   */
  validateSequenceNumber(sequenceNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (sequenceNumber < 1) {
      errors.push('Sequence number must be at least 1');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate timestamp
   */
  validateTimestamp(timestamp: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (timestamp < 0) {
      errors.push('Timestamp cannot be negative');
    }

    if (timestamp > Date.now() + 86400000) {
      warnings.push('Timestamp is more than 24 hours in the future');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate event append
   */
  validateEventAppend(eventId: EventId, executionId: ExecutionId, sequenceNumber: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const eventIdResult = this.validateEventId(eventId);
    errors.push(...eventIdResult.errors);
    warnings.push(...eventIdResult.warnings);

    const executionIdResult = this.validateExecutionId(executionId);
    errors.push(...executionIdResult.errors);
    warnings.push(...executionIdResult.warnings);

    const sequenceResult = this.validateSequenceNumber(sequenceNumber);
    errors.push(...sequenceResult.errors);
    warnings.push(...sequenceResult.warnings);

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate snapshot creation
   */
  validateSnapshotCreation(snapshotId: SnapshotId, executionId: ExecutionId): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const snapshotIdResult = this.validateSnapshotId(snapshotId);
    errors.push(...snapshotIdResult.errors);
    warnings.push(...snapshotIdResult.warnings);

    const executionIdResult = this.validateExecutionId(executionId);
    errors.push(...executionIdResult.errors);
    warnings.push(...executionIdResult.warnings);

    return { valid: errors.length === 0, errors, warnings };
  }
}
