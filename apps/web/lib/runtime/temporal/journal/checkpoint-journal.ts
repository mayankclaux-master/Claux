/**
 * CLAUX Runtime Temporal Layer - Checkpoint Journal
 * 
 * Append-only journal for checkpoint events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, CheckpointId, ExecutionId, TemporalTimestamp, CheckpointJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Checkpoint Journal
 * 
 * Append-only journal for checkpoint events.
 */
export class CheckpointJournal {
  private entries: Map<CheckpointId, CheckpointJournalEntry> = new Map();
  private executionIndex: Map<ExecutionId, CheckpointId[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: CheckpointJournalEntry): void {
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.executionId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${entry.executionId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Store entry
    this.entries.set(entry.checkpointId, entry);
    this.sequenceNumbers.set(entry.executionId, entry.sequenceNumber);

    // Update execution index
    const executionCheckpoints = this.executionIndex.get(entry.executionId) || [];
    if (!executionCheckpoints.includes(entry.checkpointId)) {
      this.executionIndex.set(entry.executionId, [...executionCheckpoints, entry.checkpointId]);
    }
  }

  /**
   * Get entry by checkpoint ID
   */
  getEntry(checkpointId: CheckpointId): CheckpointJournalEntry | undefined {
    return this.entries.get(checkpointId);
  }

  /**
   * Get entries for execution
   */
  getEntriesForExecution(executionId: ExecutionId): readonly CheckpointJournalEntry[] {
    const checkpointIds = this.executionIndex.get(executionId) || [];
    const entries: CheckpointJournalEntry[] = [];
    
    for (const checkpointId of checkpointIds) {
      const entry = this.entries.get(checkpointId);
      if (entry) {
        entries.push(entry);
      }
    }

    return entries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  /**
   * Get latest checkpoint for execution
   */
  getLatestCheckpoint(executionId: ExecutionId): CheckpointJournalEntry | undefined {
    const entries = this.getEntriesForExecution(executionId);
    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  }

  /**
   * Get checkpoint at sequence number
   */
  getCheckpointAtSequence(executionId: ExecutionId, sequenceNumber: number): CheckpointJournalEntry | undefined {
    const entries = this.getEntriesForExecution(executionId);
    return entries.find(e => e.sequenceNumber === sequenceNumber);
  }

  /**
   * Get checkpoint before timestamp
   */
  getCheckpointBefore(executionId: ExecutionId, timestamp: TemporalTimestamp): CheckpointJournalEntry | undefined {
    const entries = this.getEntriesForExecution(executionId);
    return entries.filter(e => e.timestamp <= timestamp).pop();
  }

  /**
   * Get checkpoint after timestamp
   */
  getCheckpointAfter(executionId: ExecutionId, timestamp: TemporalTimestamp): CheckpointJournalEntry | undefined {
    const entries = this.getEntriesForExecution(executionId);
    return entries.find(e => e.timestamp >= timestamp);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(executionId: ExecutionId): number {
    return this.sequenceNumbers.get(executionId) || 0;
  }

  /**
   * Get all checkpoint IDs for execution
   */
  getCheckpointIdsForExecution(executionId: ExecutionId): readonly CheckpointId[] {
    return this.executionIndex.get(executionId) || [];
  }

  /**
   * Get journal statistics
   */
  getStatistics(executionId: ExecutionId): {
    totalCheckpoints: number;
    currentSequence: number;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const entries = this.getEntriesForExecution(executionId);
    
    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const entry of entries) {
      if (startTime === null || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (endTime === null || entry.timestamp > endTime) {
        endTime = entry.timestamp;
      }
    }

    return {
      totalCheckpoints: entries.length,
      currentSequence: this.sequenceNumbers.get(executionId) || 0,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Clear journal for execution
   */
  clearExecution(executionId: ExecutionId): void {
    const checkpointIds = this.executionIndex.get(executionId) || [];
    
    for (const checkpointId of checkpointIds) {
      this.entries.delete(checkpointId);
    }

    this.executionIndex.delete(executionId);
    this.sequenceNumbers.delete(executionId);
  }

  /**
   * Clear all journals
   */
  clear(): void {
    this.entries.clear();
    this.executionIndex.clear();
    this.sequenceNumbers.clear();
  }
}
