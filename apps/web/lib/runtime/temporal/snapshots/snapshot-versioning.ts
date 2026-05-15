/**
 * CLAUX Runtime Temporal Layer - Snapshot Versioning
 * 
 * Snapshot schema versioning and migration.
 * No external dependencies - pure versioning semantics.
 */

import type { EventVersion, SnapshotId } from '../types';
import { EventVersionError } from '../errors';
import { DEFAULT_EVENT_VERSION } from '../constants';

/**
 * Snapshot Version Manager
 * 
 * Snapshot schema versioning and migration.
 */
export class SnapshotVersionManager {
  private versionRegistry: Map<SnapshotId, EventVersion> = new Map();
  private migrationPaths: Map<`${EventVersion}:${EventVersion}`, (state: unknown) => unknown> = new Map();

  /**
   * Register snapshot version
   */
  registerVersion(snapshotId: SnapshotId, version: EventVersion): void {
    this.versionRegistry.set(snapshotId, version);
  }

  /**
   * Get snapshot version
   */
  getVersion(snapshotId: SnapshotId): EventVersion {
    return this.versionRegistry.get(snapshotId) || DEFAULT_EVENT_VERSION;
  }

  /**
   * Register migration path
   */
  registerMigration(fromVersion: EventVersion, toVersion: EventVersion, migrator: (state: unknown) => unknown): void {
    const key = `${fromVersion}:${toVersion}` as const;
    this.migrationPaths.set(key, migrator);
  }

  /**
   * Migrate snapshot state
   */
  migrateState(snapshotId: SnapshotId, fromVersion: EventVersion, toVersion: EventVersion, state: unknown): unknown {
    if (fromVersion === toVersion) {
      return state;
    }

    const key = `${fromVersion}:${toVersion}` as const;
    const migrator = this.migrationPaths.get(key);

    if (!migrator) {
      throw new EventVersionError(
        `No migration path from ${fromVersion} to ${toVersion} for snapshot ${snapshotId}`,
        fromVersion
      );
    }

    return migrator(state);
  }

  /**
   * Clear all versions
   */
  clear(): void {
    this.versionRegistry.clear();
    this.migrationPaths.clear();
  }
}
