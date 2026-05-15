/**
 * CLAUX Runtime Persistence Layer - Validation
 */

import type { Snapshot, StateDurability, Archive } from './types';

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Persistence Validator
 */
export class PersistenceValidator {
  /**
   * Validate snapshot
   */
  validateSnapshot(snapshot: Snapshot): ValidationResult {
    const errors: string[] = [];

    if (!snapshot.snapshotId) errors.push('Missing snapshotId');
    if (!snapshot.state) errors.push('Missing state');
    if (!snapshot.checksum) errors.push('Missing checksum');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate state durability
   */
  validateStateDurability(durability: StateDurability): ValidationResult {
    const errors: string[] = [];

    if (!durability.stateId) errors.push('Missing stateId');
    if (durability.version < 0) errors.push('Invalid version');
    if (!durability.location) errors.push('Missing location');

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate archive
   */
  validateArchive(archive: Archive): ValidationResult {
    const errors: string[] = [];

    if (!archive.archiveId) errors.push('Missing archiveId');
    if (!archive.data) errors.push('Missing data');

    return { valid: errors.length === 0, errors };
  }
}
