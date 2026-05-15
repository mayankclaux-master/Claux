/**
 * CLAUX Runtime E2E Layer - Snapshots
 */

import type { SnapshotState, SnapshotId } from './types';

/**
 * Snapshot Manager
 */
export class SnapshotManager {
  private snapshots: Map<string, SnapshotState> = new Map();

  /**
   * Create snapshot
   */
  create(state: Record<string, unknown>): SnapshotState {
    const snapshotId = this.generateSnapshotId();
    const snapshotState: SnapshotState = {
      snapshotId,
      state: { ...state },
      timestamp: Date.now(),
    };

    this.snapshots.set(snapshotId, snapshotState);
    return snapshotState;
  }

  /**
   * Get snapshot
   */
  get(snapshotId: string): SnapshotState | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Restore snapshot
   */
  restore(snapshotId: string): Record<string, unknown> | undefined {
    const snapshot = this.snapshots.get(snapshotId);
    return snapshot ? { ...snapshot.state } : undefined;
  }

  /**
   * Delete snapshot
   */
  delete(snapshotId: string): void {
    this.snapshots.delete(snapshotId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.snapshots.clear();
  }

  /**
   * Generate snapshot ID
   */
  private generateSnapshotId(): SnapshotId {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
