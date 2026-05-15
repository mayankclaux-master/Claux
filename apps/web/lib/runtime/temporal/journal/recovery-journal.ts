/**
 * CLAUX Runtime Temporal Layer - Recovery Journal
 * 
 * Append-only journal for recovery events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, RecoveryId, ExecutionId, TemporalTimestamp, RecoveryJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Recovery Journal
 * 
 * Append-only journal for recovery events.
 */
export class RecoveryJournal {
  private entries: Map<RecoveryId, RecoveryJournalEntry[]> = new Map();
  private executionIndex: Map<ExecutionId, RecoveryId[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: RecoveryJournalEntry): void {
    const existingEntries = this.entries.get(entry.recoveryId) || [];
    
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.executionId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${entry.executionId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Append entry
    this.entries.set(entry.recoveryId, [...existingEntries, entry]);
    this.sequenceNumbers.set(entry.executionId, entry.sequenceNumber);

    // Update execution index
    const executionRecoveries = this.executionIndex.get(entry.executionId) || [];
    if (!executionRecoveries.includes(entry.recoveryId)) {
      this.executionIndex.set(entry.executionId, [...executionRecoveries, entry.recoveryId]);
    }
  }

  /**
   * Get entries for recovery
   */
  getEntries(recoveryId: RecoveryId): readonly RecoveryJournalEntry[] {
    return this.entries.get(recoveryId) || [];
  }

  /**
   * Get entries for execution
   */
  getEntriesForExecution(executionId: ExecutionId): readonly RecoveryJournalEntry[] {
    const recoveryIds = this.executionIndex.get(executionId) || [];
    const allEntries: RecoveryJournalEntry[] = [];
    
    for (const recoveryId of recoveryIds) {
      const entries = this.entries.get(recoveryId) || [];
      allEntries.push(...entries);
    }

    return allEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  /**
   * Get entry by event ID
   */
  getEntry(eventId: EventId): RecoveryJournalEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.eventId === eventId);
      if (entry) return entry;
    }
    return undefined;
  }

  /**
   * Get entries by recovery type
   */
  getEntriesByType(executionId: ExecutionId, recoveryType: string): readonly RecoveryJournalEntry[] {
    const entries = this.getEntriesForExecution(executionId);
    return entries.filter(e => e.recoveryType === recoveryType);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(executionId: ExecutionId): number {
    return this.sequenceNumbers.get(executionId) || 0;
  }

  /**
   * Get all recovery IDs for execution
   */
  getRecoveryIdsForExecution(executionId: ExecutionId): readonly RecoveryId[] {
    return this.executionIndex.get(executionId) || [];
  }

  /**
   * Get journal statistics
   */
  getStatistics(executionId: ExecutionId): {
    totalEntries: number;
    totalRecoveries: number;
    currentSequence: number;
    recoveryTypes: Map<string, number>;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const entries = this.getEntriesForExecution(executionId);
    const recoveryTypes = new Map<string, number>();

    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const entry of entries) {
      const count = recoveryTypes.get(entry.recoveryType) || 0;
      recoveryTypes.set(entry.recoveryType, count + 1);

      if (startTime === null || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (endTime === null || entry.timestamp > endTime) {
        endTime = entry.timestamp;
      }
    }

    return {
      totalEntries: entries.length,
      totalRecoveries: this.executionIndex.get(executionId)?.length || 0,
      currentSequence: this.sequenceNumbers.get(executionId) || 0,
      recoveryTypes,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Clear journal for recovery
   */
  clearRecovery(recoveryId: RecoveryId): void {
    const entry = this.entries.get(recoveryId);
    if (entry && entry.length > 0) {
      const executionId = entry[0].executionId;
      const executionRecoveries = this.executionIndex.get(executionId) || [];
      const updatedRecoveries = executionRecoveries.filter(r => r !== recoveryId);
      this.executionIndex.set(executionId, updatedRecoveries);
    }

    this.entries.delete(recoveryId);
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
