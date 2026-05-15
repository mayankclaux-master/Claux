/**
 * CLAUX Runtime Temporal Layer - Replay Journal
 * 
 * Append-only journal for replay events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, ReplayId, ExecutionId, TemporalTimestamp, ReplayJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Replay Journal
 * 
 * Append-only journal for replay events.
 */
export class ReplayJournal {
  private entries: Map<ReplayId, ReplayJournalEntry[]> = new Map();
  private originalExecutionIndex: Map<ExecutionId, ReplayId[]> = new Map();
  private replayedExecutionIndex: Map<ExecutionId, ReplayId> = new Map();
  private sequenceNumbers: Map<ReplayId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: ReplayJournalEntry): void {
    const existingEntries = this.entries.get(entry.replayId) || [];
    
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.replayId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for replay ${entry.replayId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Append entry
    this.entries.set(entry.replayId, [...existingEntries, entry]);
    this.sequenceNumbers.set(entry.replayId, entry.sequenceNumber);

    // Update original execution index
    const originalReplays = this.originalExecutionIndex.get(entry.originalExecutionId) || [];
    if (!originalReplays.includes(entry.replayId)) {
      this.originalExecutionIndex.set(entry.originalExecutionId, [...originalReplays, entry.replayId]);
    }
  }

  /**
   * Set replayed execution ID
   */
  setReplayedExecution(replayId: ReplayId, replayedExecutionId: ExecutionId): void {
    this.replayedExecutionIndex.set(replayedExecutionId, replayId);
  }

  /**
   * Get entries for replay
   */
  getEntries(replayId: ReplayId): readonly ReplayJournalEntry[] {
    return this.entries.get(replayId) || [];
  }

  /**
   * Get entries for original execution
   */
  getEntriesForOriginalExecution(executionId: ExecutionId): readonly ReplayJournalEntry[] {
    const replayIds = this.originalExecutionIndex.get(executionId) || [];
    const allEntries: ReplayJournalEntry[] = [];
    
    for (const replayId of replayIds) {
      const entries = this.entries.get(replayId) || [];
      allEntries.push(...entries);
    }

    return allEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  /**
   * Get replay ID for replayed execution
   */
  getReplayIdForExecution(executionId: ExecutionId): ReplayId | undefined {
    return this.replayedExecutionIndex.get(executionId);
  }

  /**
   * Get entry by event ID
   */
  getEntry(eventId: EventId): ReplayJournalEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.eventId === eventId);
      if (entry) return entry;
    }
    return undefined;
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(replayId: ReplayId): number {
    return this.sequenceNumbers.get(replayId) || 0;
  }

  /**
   * Get all replay IDs for original execution
   */
  getReplayIdsForOriginalExecution(executionId: ExecutionId): readonly ReplayId[] {
    return this.originalExecutionIndex.get(executionId) || [];
  }

  /**
   * Get journal statistics
   */
  getStatistics(replayId: ReplayId): {
    totalEntries: number;
    currentSequence: number;
    originalExecutionId: ExecutionId;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const entries = this.entries.get(replayId) || [];
    
    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;
    let originalExecutionId: ExecutionId | null = null;

    for (const entry of entries) {
      if (originalExecutionId === null) {
        originalExecutionId = entry.originalExecutionId;
      }

      if (startTime === null || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (endTime === null || entry.replayTimestamp > endTime) {
        endTime = entry.replayTimestamp;
      }
    }

    return {
      totalEntries: entries.length,
      currentSequence: this.sequenceNumbers.get(replayId) || 0,
      originalExecutionId: originalExecutionId || '' as ExecutionId,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Clear journal for replay
   */
  clearReplay(replayId: ReplayId): void {
    const entry = this.entries.get(replayId);
    if (entry && entry.length > 0) {
      const originalExecutionId = entry[0].originalExecutionId;
      const originalReplays = this.originalExecutionIndex.get(originalExecutionId) || [];
      const updatedReplays = originalReplays.filter(r => r !== replayId);
      this.originalExecutionIndex.set(originalExecutionId, updatedReplays);
    }

    this.entries.delete(replayId);
    this.sequenceNumbers.delete(replayId);
  }

  /**
   * Clear all journals
   */
  clear(): void {
    this.entries.clear();
    this.originalExecutionIndex.clear();
    this.replayedExecutionIndex.clear();
    this.sequenceNumbers.clear();
  }
}
