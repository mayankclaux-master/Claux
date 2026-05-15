/**
 * CLAUX Runtime Temporal Layer - Lineage Journal
 * 
 * Append-only journal for lineage events.
 * No external dependencies - pure journal semantics.
 */

import type { EventId, LineageId, ExecutionId, TemporalTimestamp, LineageJournalEntry } from '../types';
import { EventAppendError } from '../errors';

/**
 * Lineage Journal
 * 
 * Append-only journal for lineage events.
 */
export class LineageJournal {
  private entries: Map<LineageId, LineageJournalEntry[]> = new Map();
  private executionIndex: Map<ExecutionId, LineageId[]> = new Map();
  private parentIndex: Map<LineageId, LineageId[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Append entry to journal
   */
  append(entry: LineageJournalEntry): void {
    const existingEntries = this.entries.get(entry.lineageId) || [];
    
    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(entry.executionId) || 0;
    if (entry.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${entry.executionId}: expected ${currentSequence + 1}, got ${entry.sequenceNumber}`,
        entry.eventId
      );
    }

    // Append entry
    this.entries.set(entry.lineageId, [...existingEntries, entry]);
    this.sequenceNumbers.set(entry.executionId, entry.sequenceNumber);

    // Update execution index
    const executionLineages = this.executionIndex.get(entry.executionId) || [];
    if (!executionLineages.includes(entry.lineageId)) {
      this.executionIndex.set(entry.executionId, [...executionLineages, entry.lineageId]);
    }

    // Update parent index
    if (entry.parentId) {
      const parentChildren = this.parentIndex.get(entry.parentId) || [];
      if (!parentChildren.includes(entry.lineageId)) {
        this.parentIndex.set(entry.parentId, [...parentChildren, entry.lineageId]);
      }
    }
  }

  /**
   * Get entries for lineage
   */
  getEntries(lineageId: LineageId): readonly LineageJournalEntry[] {
    return this.entries.get(lineageId) || [];
  }

  /**
   * Get entries for execution
   */
  getEntriesForExecution(executionId: ExecutionId): readonly LineageJournalEntry[] {
    const lineageIds = this.executionIndex.get(executionId) || [];
    const allEntries: LineageJournalEntry[] = [];
    
    for (const lineageId of lineageIds) {
      const entries = this.entries.get(lineageId) || [];
      allEntries.push(...entries);
    }

    return allEntries.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }

  /**
   * Get entry by event ID
   */
  getEntry(eventId: EventId): LineageJournalEntry | undefined {
    for (const entries of this.entries.values()) {
      const entry = entries.find(e => e.eventId === eventId);
      if (entry) return entry;
    }
    return undefined;
  }

  /**
   * Get children of lineage
   */
  getChildren(lineageId: LineageId): readonly LineageId[] {
    return this.parentIndex.get(lineageId) || [];
  }

  /**
   * Get parent of lineage
   */
  getParent(lineageId: LineageId): LineageId | undefined {
    const entries = this.entries.get(lineageId);
    return entries?.[0]?.parentId || undefined;
  }

  /**
   * Get lineage chain
   */
  getLineageChain(lineageId: LineageId): readonly LineageId[] {
    const chain: LineageId[] = [];
    let currentId = lineageId;

    while (currentId) {
      chain.push(currentId);
      const entries = this.entries.get(currentId);
      currentId = entries?.[0]?.parentId || '' as LineageId;
      if (!currentId || chain.length > 1000) break; // Prevent infinite loops
    }

    return chain;
  }

  /**
   * Get lineage depth
   */
  getLineageDepth(lineageId: LineageId): number {
    return this.getLineageChain(lineageId).length;
  }

  /**
   * Get entries by lineage type
   */
  getEntriesByType(executionId: ExecutionId, lineageType: string): readonly LineageJournalEntry[] {
    const entries = this.getEntriesForExecution(executionId);
    return entries.filter(e => e.lineageType === lineageType);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(executionId: ExecutionId): number {
    return this.sequenceNumbers.get(executionId) || 0;
  }

  /**
   * Get all lineage IDs for execution
   */
  getLineageIdsForExecution(executionId: ExecutionId): readonly LineageId[] {
    return this.executionIndex.get(executionId) || [];
  }

  /**
   * Get journal statistics
   */
  getStatistics(executionId: ExecutionId): {
    totalEntries: number;
    totalLineages: number;
    currentSequence: number;
    lineageTypes: Map<string, number>;
    maxDepth: number;
  } {
    const entries = this.getEntriesForExecution(executionId);
    const lineageTypes = new Map<string, number>();
    let maxDepth = 0;

    for (const entry of entries) {
      const count = lineageTypes.get(entry.lineageType) || 0;
      lineageTypes.set(entry.lineageType, count + 1);

      const depth = this.getLineageDepth(entry.lineageId);
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }

    return {
      totalEntries: entries.length,
      totalLineages: this.executionIndex.get(executionId)?.length || 0,
      currentSequence: this.sequenceNumbers.get(executionId) || 0,
      lineageTypes,
      maxDepth,
    };
  }

  /**
   * Clear journal for lineage
   */
  clearLineage(lineageId: LineageId): void {
    const entry = this.entries.get(lineageId);
    if (entry && entry.length > 0) {
      const executionId = entry[0].executionId;
      const executionLineages = this.executionIndex.get(executionId) || [];
      const updatedLineages = executionLineages.filter(l => l !== lineageId);
      this.executionIndex.set(executionId, updatedLineages);

      const parentId = entry[0].parentId;
      if (parentId) {
        const parentChildren = this.parentIndex.get(parentId) || [];
        const updatedChildren = parentChildren.filter(l => l !== lineageId);
        this.parentIndex.set(parentId, updatedChildren);
      }
    }

    this.entries.delete(lineageId);
  }

  /**
   * Clear all journals
   */
  clear(): void {
    this.entries.clear();
    this.executionIndex.clear();
    this.parentIndex.clear();
    this.sequenceNumbers.clear();
  }
}
