/**
 * CLAUX Runtime Temporal Layer - Event Versioning
 * 
 * Event schema versioning and migration.
 * No external dependencies - pure versioning semantics.
 */

import type { EventVersion, EventType } from '../types';
import { EventVersionError } from '../errors';
import { DEFAULT_EVENT_VERSION } from '../constants';

/**
 * Event Version Manager
 * 
 * Event schema versioning and migration.
 */
export class EventVersionManager {
  private versionRegistry: Map<EventType, EventVersion> = new Map();
  private migrationPaths: Map<`${EventVersion}:${EventVersion}`, (payload: unknown) => unknown> = new Map();

  /**
   * Register event version
   */
  registerVersion(eventType: EventType, version: EventVersion): void {
    this.versionRegistry.set(eventType, version);
  }

  /**
   * Get event version
   */
  getVersion(eventType: EventType): EventVersion {
    return this.versionRegistry.get(eventType) || DEFAULT_EVENT_VERSION;
  }

  /**
   * Register migration path
   */
  registerMigration(fromVersion: EventVersion, toVersion: EventVersion, migrator: (payload: unknown) => unknown): void {
    const key = `${fromVersion}:${toVersion}` as const;
    this.migrationPaths.set(key, migrator);
  }

  /**
   * Migrate event payload
   */
  migratePayload(eventType: EventType, fromVersion: EventVersion, toVersion: EventVersion, payload: unknown): unknown {
    if (fromVersion === toVersion) {
      return payload;
    }

    const key = `${fromVersion}:${toVersion}` as const;
    const migrator = this.migrationPaths.get(key);

    if (!migrator) {
      throw new EventVersionError(
        `No migration path from ${fromVersion} to ${toVersion} for event type ${eventType}`,
        fromVersion
      );
    }

    return migrator(payload);
  }

  /**
   * Validate version compatibility
   */
  validateCompatibility(eventType: EventType, version: EventVersion): boolean {
    const registeredVersion = this.versionRegistry.get(eventType);
    if (!registeredVersion) return true; // No version constraint

    // Simple semantic version compatibility check
    const [major] = version.split('.').map(Number);
    const [registeredMajor] = registeredVersion.split('.').map(Number);

    return major === registeredMajor;
  }

  /**
   * Get all registered versions
   */
  getAllVersions(): Map<EventType, EventVersion> {
    return new Map(this.versionRegistry);
  }

  /**
   * Clear all versions
   */
  clear(): void {
    this.versionRegistry.clear();
    this.migrationPaths.clear();
  }
}
