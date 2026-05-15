/**
 * CLAUX Runtime Persistence Layer - Replay Persistence
 */

import type { Snapshot, SnapshotId } from './types';

/**
 * Replay Persistence Manager
 */
export class ReplayPersistenceManager {
  private replays: Map<SnapshotId, Snapshot> = new Map();
  private replaySequences: Map<string, SnapshotId[]> = new Map();

  /**
   * Save replay state
   */
  saveReplay(replayId: string, state: Record<string, unknown>): Snapshot {
    const snapshotId = this.generateSnapshotId();
    const checksum = this.calculateChecksum(state);

    const snapshot: Snapshot = {
      snapshotId,
      timestamp: Date.now(),
      state,
      checksum,
    };

    this.replays.set(snapshotId, snapshot);

    const sequence = this.replaySequences.get(replayId) || [];
    sequence.push(snapshotId);
    this.replaySequences.set(replayId, sequence);

    return snapshot;
  }

  /**
   * Load replay state
   */
  loadReplay(replayId: string): readonly Snapshot[] {
    const snapshotIds = this.replaySequences.get(replayId) || [];
    return snapshotIds.map(id => this.replays.get(id)).filter((s): s is Snapshot => s !== undefined);
  }

  /**
   * Clear
   */
  clear(): void {
    this.replays.clear();
    this.replaySequences.clear();
  }

  /**
   * Generate snapshot ID
   */
  private generateSnapshotId(): SnapshotId {
    return `replay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(state: Record<string, unknown>): string {
    const str = JSON.stringify(state);
    return Buffer.from(str).toString('base64').substring(0, 32);
  }
}
