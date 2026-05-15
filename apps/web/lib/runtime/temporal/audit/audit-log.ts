/**
 * CLAUX Runtime Temporal Layer - Audit Log
 * 
 * Immutable audit log for temporal operations.
 * No external dependencies - pure audit semantics.
 */

import type { AuditId, EventId, ExecutionId, TemporalTimestamp, AuditEntry } from '../types';

/**
 * Audit Log
 * 
 * Immutable audit log for temporal operations.
 */
export class AuditLog {
  private entries: Map<AuditId, AuditEntry> = new Map();
  private executionIndex: Map<ExecutionId, AuditId[]> = new Map();
  private eventIndex: Map<EventId, AuditId> = new Map();
  private chainIndex: Map<string, AuditId[]> = new Map();

  /**
   * Append audit entry
   */
  append(entry: AuditEntry): void {
    this.entries.set(entry.auditId, entry);
    this.eventIndex.set(entry.eventId, entry.auditId);

    const executionAudits = this.executionIndex.get(entry.executionId) || [];
    this.executionIndex.set(entry.executionId, [...executionAudits, entry.auditId]);

    // Update chain
    const chainId = this.getChainId(entry.executionId);
    const chainAudits = this.chainIndex.get(chainId) || [];
    this.chainIndex.set(chainId, [...chainAudits, entry.auditId]);
  }

  /**
   * Get entry by ID
   */
  getEntry(auditId: AuditId): AuditEntry | undefined {
    return this.entries.get(auditId);
  }

  /**
   * Get entry by event
   */
  getEntryByEvent(eventId: EventId): AuditEntry | undefined {
    const auditId = this.eventIndex.get(eventId);
    return auditId ? this.entries.get(auditId) : undefined;
  }

  /**
   * Get entries for execution
   */
  getEntriesForExecution(executionId: ExecutionId): readonly AuditEntry[] {
    const auditIds = this.executionIndex.get(executionId) || [];
    const entries: AuditEntry[] = [];

    for (const auditId of auditIds) {
      const entry = this.entries.get(auditId);
      if (entry) entries.push(entry);
    }

    return entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get chain for execution
   */
  getChain(executionId: ExecutionId): readonly AuditEntry[] {
    const chainId = this.getChainId(executionId);
    const auditIds = this.chainIndex.get(chainId) || [];
    const entries: AuditEntry[] = [];

    for (const auditId of auditIds) {
      const entry = this.entries.get(auditId);
      if (entry) entries.push(entry);
    }

    return entries;
  }

  /**
   * Get chain ID
   */
  private getChainId(executionId: ExecutionId): string {
    return `chain_${executionId}`;
  }

  /**
   * Verify chain integrity
   */
  verifyChainIntegrity(executionId: ExecutionId): boolean {
    const chain = this.getChain(executionId);

    for (let i = 0; i < chain.length - 1; i++) {
      const current = chain[i];
      const next = chain[i + 1];

      if (current.previousAuditId && current.previousAuditId !== next.previousAuditId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get audit statistics
   */
  getStatistics(executionId: ExecutionId): {
    totalEntries: number;
    auditTypes: Map<string, number>;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const entries = this.getEntriesForExecution(executionId);
    const auditTypes = new Map<string, number>();
    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const entry of entries) {
      const count = auditTypes.get(entry.auditType) || 0;
      auditTypes.set(entry.auditType, count + 1);

      if (startTime === null || entry.timestamp < startTime) {
        startTime = entry.timestamp;
      }
      if (endTime === null || entry.timestamp > endTime) {
        endTime = entry.timestamp;
      }
    }

    return {
      totalEntries: entries.length,
      auditTypes,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Clear execution audits
   */
  clearExecution(executionId: ExecutionId): void {
    const auditIds = this.executionIndex.get(executionId) || [];

    for (const auditId of auditIds) {
      const entry = this.entries.get(auditId);
      if (entry) {
        this.eventIndex.delete(entry.eventId);
      }
      this.entries.delete(auditId);
    }

    this.executionIndex.delete(executionId);
    this.chainIndex.delete(this.getChainId(executionId));
  }

  /**
   * Clear all audits
   */
  clear(): void {
    this.entries.clear();
    this.executionIndex.clear();
    this.eventIndex.clear();
    this.chainIndex.clear();
  }
}
