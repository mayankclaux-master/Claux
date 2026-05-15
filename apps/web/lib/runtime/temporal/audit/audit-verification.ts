/**
 * CLAUX Runtime Temporal Layer - Audit Verification
 * 
 * Audit verification for compliance and correctness.
 * No external dependencies - pure verification semantics.
 */

import type { AuditEntry, ExecutionId } from '../types';

/**
 * Audit Verifier
 * 
 * Audit verification for compliance and correctness.
 */
export class AuditVerifier {
  /**
   * Verify audit completeness
   */
  verifyCompleteness(entries: readonly AuditEntry[]): boolean {
    return entries.length > 0;
  }

  /**
   * Verify audit compliance
   */
  verifyCompliance(entries: readonly AuditEntry[], requiredAuditTypes: readonly string[]): boolean {
    const presentTypes = new Set(entries.map(e => e.auditType));

    for (const requiredType of requiredAuditTypes) {
      if (!presentTypes.has(requiredType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify audit sequence
   */
  verifySequence(entries: readonly AuditEntry[]): boolean {
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
   * Verify audit coverage
   */
  verifyCoverage(entries: readonly AuditEntry[], expectedEventIds: readonly string[]): boolean {
    const auditedEventIds = new Set(entries.map(e => e.eventId));

    for (const expectedEventId of expectedEventIds) {
      if (!auditedEventIds.has(expectedEventId)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verify audit consistency
   */
  verifyConsistency(entries: readonly AuditEntry[]): boolean {
    const executionIds = new Set(entries.map(e => e.executionId));
    return executionIds.size === 1;
  }

  /**
   * Get verification report
   */
  getVerificationReport(entries: readonly AuditEntry[], requiredAuditTypes: readonly string[]): {
    completenessValid: boolean;
    complianceValid: boolean;
    sequenceValid: boolean;
    consistencyValid: boolean;
    overallValid: boolean;
  } {
    return {
      completenessValid: this.verifyCompleteness(entries),
      complianceValid: this.verifyCompliance(entries, requiredAuditTypes),
      sequenceValid: this.verifySequence(entries),
      consistencyValid: this.verifyConsistency(entries),
      overallValid: this.verifyCompleteness(entries) && 
                   this.verifyCompliance(entries, requiredAuditTypes) &&
                   this.verifySequence(entries) &&
                   this.verifyConsistency(entries),
    };
  }
}
