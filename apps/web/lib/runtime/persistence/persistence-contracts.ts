/**
 * CLAUX Runtime Persistence Layer - Contracts
 */

import type { Snapshot, StateDurability } from './types';

/**
 * Persistence Contract
 */
export interface PersistenceContract {
  readonly persist: (state: Record<string, unknown>) => Promise<StateDurability>;
  readonly restore: (stateId: string) => Promise<Record<string, unknown> | null>;
}

/**
 * Snapshot Contract
 */
export interface SnapshotContract {
  readonly create: (state: Record<string, unknown>) => Promise<Snapshot>;
  readonly restore: (snapshotId: string) => Promise<Record<string, unknown> | null>;
}
