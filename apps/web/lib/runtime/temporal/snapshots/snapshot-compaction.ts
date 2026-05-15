/**
 * CLAUX Runtime Temporal Layer - Snapshot Compaction
 * 
 * Snapshot compaction and optimization.
 * No external dependencies - pure compaction semantics.
 */

import type { SnapshotId, ExecutionId, Snapshot } from '../types';
import { DEFAULT_COMPACTION_THRESHOLD } from '../constants';

/**
 * Snapshot Compaction Manager
 * 
 * Snapshot compaction and optimization.
 */
export class SnapshotCompactionManager {
  /**
   * Compact snapshots for execution
   */
  compactSnapshots(snapshots: readonly Snapshot[], keepCount: number = 5): Snapshot[] {
    if (snapshots.length <= keepCount) {
      return [...snapshots];
    }

    // Keep latest N snapshots
    return snapshots.slice(-keepCount);
  }

  /**
   * Compact by time interval
   */
  compactByInterval(snapshots: readonly Snapshot[], intervalMs: number = 3600000): Snapshot[] {
    if (snapshots.length === 0) return [];

    const compacted: Snapshot[] = [];
    let lastTimestamp = 0;

    for (const snapshot of snapshots) {
      if (snapshot.metadata.timestamp - lastTimestamp >= intervalMs || lastTimestamp === 0) {
        compacted.push(snapshot);
        lastTimestamp = snapshot.metadata.timestamp;
      }
    }

    return compacted;
  }

  /**
   * Merge nearby snapshots
   */
  mergeSnapshots(snapshots: readonly Snapshot[]): Snapshot[] {
    if (snapshots.length === 0) return [];

    // Keep only state-changing snapshots
    const merged: Snapshot[] = [];
    let lastState: unknown = null;

    for (const snapshot of snapshots) {
      if (JSON.stringify(snapshot.state) !== JSON.stringify(lastState)) {
        merged.push(snapshot);
        lastState = snapshot.state;
      }
    }

    return merged;
  }

  /**
   * Get compaction statistics
   */
  getCompactionStatistics(original: readonly Snapshot[], compacted: readonly Snapshot[]): {
    originalCount: number;
    compactedCount: number;
    spaceSaved: number;
    compactionRatio: number;
  } {
    const spaceSaved = original.length - compacted.length;
    const compactionRatio = original.length > 0 ? compacted.length / original.length : 1;

    return {
      originalCount: original.length,
      compactedCount: compacted.length,
      spaceSaved,
      compactionRatio,
    };
  }
}
