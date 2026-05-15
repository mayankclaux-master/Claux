/**
 * CLAUX Runtime Temporal Layer - Task Journal
 * 
 * Append-only journal for task events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, TaskId, ExecutionId, EventType, TemporalTimestamp, TaskJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Task Journal
 * 
 * Append-only journal for task events.
 */
export class TaskJournal {
  private entries: Map<TaskId, TaskJournalEntry[]> = new Map();
  private executionIndex: Map<ExecutionId, TaskId[]> = new Map();
  private sequenceNumbers: Map<TaskId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: TaskJournalEntry): void {
    const existingEntries = this.entries.get(entry.taskId) || [];
    
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.taskId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for task ${entry.taskId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Append entry
    this.entries.set(entry.taskId, [...existingEntries, entry]);
    this.sequenceNumbers.set(entry.taskId, entry.sequenceNumber);

    // Update execution index
    const executionTasks = this.executionIndex.get(entry.executionId) || [];
    if (!executionTasks.includes(entry.taskId)) {
      this.executionIndex.set(entry.executionId, [...executionTasks, entry.taskId]);
    }
  }

  /**
   * Get entries for task
   */
  getEntries(taskId: TaskId): readonly TaskJournalEntry[] {
    return this.entries.get(taskId) || [];
  }

  /**
   * Get entries for execution
   */
  getEntriesForExecution(executionId: ExecutionId): readonly TaskJournalEntry[] {
    const taskIds = this.executionIndex.get(executionId) || [];
    const allEntries: TaskJournalEntry[] = [];
    
    for (const taskId of taskIds) {
      const entries = this.entries.get(taskId) || [];
      allEntries.push(...entries);
    }

    return allEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  /**
   * Get entry by event ID
   */
  getEntry(eventId: EventId): TaskJournalEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.eventId === eventId);
      if (entry) return entry;
    }
    return undefined;
  }

  /**
   * Get entries by event type
   */
  getEntriesByType(taskId: TaskId, eventType: EventType): readonly TaskJournalEntry[] {
    const entries = this.entries.get(taskId) || [];
    return entries.filter(e => e.eventType === eventType);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(taskId: TaskId): number {
    return this.sequenceNumbers.get(taskId) || 0;
  }

  /**
   * Get all task IDs for execution
   */
  getTaskIdsForExecution(executionId: ExecutionId): readonly TaskId[] {
    return this.executionIndex.get(executionId) || [];
  }

  /**
   * Get journal statistics
   */
  getStatistics(taskId: TaskId): {
    totalEntries: number;
    currentSequence: number;
    eventTypes: Map<EventType, number>;
  } {
    const entries = this.entries.get(taskId) || [];
    const eventTypes = new Map<EventType, number>();

    for (const entry of entries) {
      const count = eventTypes.get(entry.eventType) || 0;
      eventTypes.set(entry.eventType, count + 1);
    }

    return {
      totalEntries: entries.length,
      currentSequence: this.sequenceNumbers.get(taskId) || 0,
      eventTypes,
    };
  }

  /**
   * Clear journal for task
   */
  clearTask(taskId: TaskId): void {
    const entry = this.entries.get(taskId);
    if (entry && entry.length > 0) {
      const executionId = entry[0].executionId;
      const executionTasks = this.executionIndex.get(executionId) || [];
      const updatedTasks = executionTasks.filter(t => t !== taskId);
      this.executionIndex.set(executionId, updatedTasks);
    }

    this.entries.delete(taskId);
    this.sequenceNumbers.delete(taskId);
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
