/**
 * CLAUX Runtime Temporal Layer - Execution Journal
 * 
 * Append-only journal for execution events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, ExecutionId, EventType, TemporalTimestamp, ExecutionJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Execution Journal
 * 
 * Append-only journal for execution events.
 */
export class ExecutionJournal {
  private entries: Map<ExecutionId, ExecutionJournalEntry[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: ExecutionJournalEntry): void {
    const existingEntries = this.entries.get(entry.executionId) || [];
    
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.executionId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${entry.executionId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Append entry
    this.entries.set(entry.executionId, [...existingEntries, entry]);
    this.sequenceNumbers.set(entry.executionId, entry.sequenceNumber);
  }

  /**
   * Get entries for execution
   */
  getEntries(executionId: ExecutionId): readonly ExecutionJournalEntry[] {
    return this.entries.get(executionId) || [];
  }

  /**
   * Get entry by event ID
   */
  getEntry(eventId: EventId): ExecutionJournalEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.eventId === eventId);
      if (entry) return entry;
    }
    return undefined;
  }

  /**
   * Get entries by event type
   */
  getEntriesByType(executionId: ExecutionId, eventType: EventType): readonly ExecutionJournalEntry[] {
    const entries = this.entries.get(executionId) || [];
    return entries.filter(e => e.eventType === eventType);
  }

  /**
   * Get entries in time range
   */
  getEntriesInTimeRange(
    executionId: ExecutionId,
    startTime: TemporalTimestamp,
    endTime: TemporalTimestamp
  ): readonly ExecutionJournalEntry[] {
    const entries = this.entries.get(executionId) || [];
    return entries.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get entry at sequence number
   */
  getEntryAtSequence(executionId: ExecutionId, sequenceNumber: number): ExecutionJournalEntry | undefined {
    const entries = this.entries.get(executionId) || [];
    return entries.find(e => e.sequenceNumber === sequenceNumber);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(executionId: ExecutionId): number {
    return this.sequenceNumbers.get(executionId) || 0;
  }

  /**
   * Get all execution IDs
   */
  getAllExecutionIds(): readonly ExecutionId[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Get journal statistics
   */
  getStatistics(executionId: ExecutionId): {
    totalEntries: number;
    currentSequence: number;
    eventTypes: Map<EventType, number>;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const entries = this.entries.get(executionId) || [];
    const eventTypes = new Map<EventType, number>();

    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const entry of entries) {
      const count = eventTypes.get(entry.eventType) || 0;
      eventTypes.set(entry.eventType, count + 1);

      if (startTime === null || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (endTime === null || entry.timestamp > endTime) {
        endTime = entry.timestamp;
      }
    }

    return {
      totalEntries: entries.length,
      currentSequence: this.sequenceNumbers.get(executionId) || 0,
      eventTypes,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Clear journal for execution
   */
  clearExecution(executionId: ExecutionId): void {
    this.entries.delete(executionId);
    this.sequenceNumbers.delete(executionId);
  }

  /**
   * Clear all journals
   */
  clear(): void {
    this.entries.clear();
    this.sequenceNumbers.clear();
  }
}
