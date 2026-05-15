/**
 * CLAUX Runtime Persistence Layer - Types
 */

export type SnapshotId = string;
export type StateId = string;
export type ArchiveId = string;

/**
 * Snapshot
 */
export interface Snapshot {
  readonly snapshotId: SnapshotId;
  readonly timestamp: number;
  readonly state: Record<string, unknown>;
  readonly checksum: string;
}

/**
 * State Durability
 */
export interface StateDurability {
  readonly stateId: StateId;
  readonly version: number;
  readonly persisted: boolean;
  readonly location: string;
}

/**
 * Archive
 */
export interface Archive {
  readonly archiveId: ArchiveId;
  readonly timestamp: number;
  readonly data: Record<string, unknown>;
  readonly tier: 'hot' | 'warm' | 'cold';
}
