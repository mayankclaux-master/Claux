/**
 * CLAUX Runtime Temporal Layer - Snapshot Engine
 * 
 * Snapshot creation and management.
 * No external dependencies - pure snapshot semantics.
 */

import type { SnapshotId, ExecutionId, TemporalTimestamp, Snapshot, SnapshotMetadata } from '../types';
import { SnapshotError } from '../errors';
import { DEFAULT_EVENT_VERSION, DEFAULT_SNAPSHOT_INTERVAL_MS } from '../constants';

/**
 * Snapshot Engine
 * 
 * Snapshot creation and management.
 */
export class SnapshotEngine {
  private snapshots: Map<SnapshotId, Snapshot> = new Map();
  private executionIndex: Map<ExecutionId, SnapshotId[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Create snapshot
   */
  createSnapshot(
    executionId: ExecutionId,
    state: unknown,
    lineage: readonly string[],
    causality: readonly string[],
    eventSequence: number
  ): Snapshot {
    const snapshotId = `snapshot_${executionId}_${Date.now()}` as SnapshotId;
    const timestamp = Date.now() as TemporalTimestamp;
    const checksum = this.calculateChecksum(state, timestamp);

    const metadata: SnapshotMetadata = {
      snapshotId,
      executionId,
      timestamp,
      eventSequence,
      version: DEFAULT_EVENT_VERSION,
      checksum,
    };

    const snapshot: Snapshot = {
      metadata,
      state,
      lineage: [...lineage],
      causality: [...causality],
    };

    this.snapshots.set(snapshotId, snapshot);
    this.sequenceNumbers.set(executionId, eventSequence);

    const executionSnapshots = this.executionIndex.get(executionId) || [];
    this.executionIndex.set(executionId, [...executionSnapshots, snapshotId]);

    return snapshot;
  }

  /**
   * Get snapshot by ID
   */
  getSnapshot(snapshotId: SnapshotId): Snapshot | undefined {
    return this.snapshots.get(snapshotId);
  }

  /**
   * Get snapshots for execution
   */
  getSnapshotsForExecution(executionId: ExecutionId): readonly Snapshot[] {
    const snapshotIds = this.executionIndex.get(executionId) || [];
    const snapshots: Snapshot[] = [];

    for (const snapshotId of snapshotIds) {
      const snapshot = this.snapshots.get(snapshotId);
      if (snapshot) snapshots.push(snapshot);
    }

    return snapshots.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
  }

  /**
   * Get latest snapshot for execution
   */
  getLatestSnapshot(executionId: ExecutionId): Snapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(executionId);
    return snapshots.length > 0 ? snapshots[snapshots.length - 1] : undefined;
  }

  /**
   * Get snapshot at sequence
   */
  getSnapshotAtSequence(executionId: ExecutionId, sequenceNumber: number): Snapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(executionId);
    return snapshots.find(s => s.metadata.eventSequence === sequenceNumber);
  }

  /**
   * Get snapshot before timestamp
   */
  getSnapshotBefore(executionId: ExecutionId, timestamp: TemporalTimestamp): Snapshot | undefined {
    const snapshots = this.getSnapshotsForExecution(executionId);
    return snapshots.filter(s => s.metadata.timestamp <= timestamp).pop();
  }

  /**
   * Validate snapshot integrity
   */
  validateSnapshot(snapshotId: SnapshotId): boolean {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return false;

    const expectedChecksum = this.calculateChecksum(snapshot.state, snapshot.metadata.timestamp);
    return expectedChecksum === snapshot.metadata.checksum;
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(state: unknown, timestamp: TemporalTimestamp): string {
    const str = JSON.stringify(state) + timestamp.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(snapshotId: SnapshotId): void {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return;

    const executionId = snapshot.metadata.executionId;
    const executionSnapshots = this.executionIndex.get(executionId) || [];
    const updatedSnapshots = executionSnapshots.filter(s => s !== snapshotId);
    this.executionIndex.set(executionId, updatedSnapshots);

    this.snapshots.delete(snapshotId);
  }

  /**
   * Clear execution snapshots
   */
  clearExecution(executionId: ExecutionId): void {
    const snapshotIds = this.executionIndex.get(executionId) || [];
    for (const snapshotId of snapshotIds) {
      this.snapshots.delete(snapshotId);
    }
    this.executionIndex.delete(executionId);
    this.sequenceNumbers.delete(executionId);
  }

  /**
   * Clear all snapshots
   */
  clear(): void {
    this.snapshots.clear();
    this.executionIndex.clear();
    this.sequenceNumbers.clear();
  }
}
