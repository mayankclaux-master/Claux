/**
 * CLAUX Runtime Temporal Layer - Audit Integrity
 * 
 * Audit integrity verification and validation.
 * No external dependencies - pure integrity semantics.
 */

import type { AuditId, AuditEntry } from '../types';
import { AuditIntegrityError } from '../errors';

/**
 * Audit Integrity Manager
 * 
 * Audit integrity verification and validation.
 */
export class AuditIntegrityManager {
  /**
   * Calculate checksum
   */
  calculateChecksum(entry: AuditEntry): string {
    const str = entry.auditId + entry.eventId + entry.executionId + entry.timestamp.toString() + entry.auditType + JSON.stringify(entry.payload);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Verify entry checksum
   */
  verifyChecksum(entry: AuditEntry): boolean {
    const expectedChecksum = this.calculateChecksum(entry);
    return expectedChecksum === entry.checksum;
  }

  /**
   * Verify chain integrity
   */
  verifyChainIntegrity(entries: readonly AuditEntry[]): boolean {
    for (const entry of entries) {
      if (!this.verifyChecksum(entry)) {
        return false;
      }
    }

    // Verify chain continuity
    for (let i = 0; i < entries.length - 1; i++) {
      const current = entries[i];
      const next = entries[i + 1];

      if (current.previousAuditId && current.previousAuditId !== next.previousAuditId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify temporal ordering
   */
  verifyTemporalOrdering(entries: readonly AuditEntry[]): boolean {
    for (let i = 1; i < entries.length; i++) {
      if (entries[i].timestamp < entries[i - 1].timestamp) {
        return false;
      }
    }
    return true;
  }

  /**
   * Detect tampering
   */
  detectTampering(entries: readonly AuditEntry[]): readonly AuditId[] {
    const tampered: AuditId[] = [];

    for (const entry of entries) {
      if (!this.verifyChecksum(entry)) {
        tampered.push(entry.auditId);
      }
    }

    return tampered;
  }

  /**
   * Get integrity report
   */
  getIntegrityReport(entries: readonly AuditEntry[]): {
    totalEntries: number;
    validEntries: number;
    tamperedEntries: number;
    chainIntegrityValid: boolean;
    temporalOrderingValid: boolean;
  } {
    const tampered = this.detectTampering(entries);

    return {
      totalEntries: entries.length,
      validEntries: entries.length - tampered.length,
      tamperedEntries: tampered.length,
      chainIntegrityValid: this.verifyChainIntegrity(entries),
      temporalOrderingValid: this.verifyTemporalOrdering(entries),
    };
  }
}
