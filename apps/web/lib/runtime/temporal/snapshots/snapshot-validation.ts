/**
 * CLAUX Runtime Temporal Layer - Snapshot Validation
 * 
 * Snapshot integrity and consistency validation.
 * No external dependencies - pure validation semantics.
 */

import type { Snapshot, TemporalEvent, ExecutionId } from '../types';
import { SnapshotError } from '../errors';

/**
 * Snapshot Validator
 * 
 * Snapshot integrity and consistency validation.
 */
export class SnapshotValidator {
  /**
   * Validate snapshot integrity
   */
  validateIntegrity(snapshot: Snapshot): boolean {
    const expectedChecksum = this.calculateChecksum(snapshot.state, snapshot.metadata.timestamp);
    return expectedChecksum === snapshot.metadata.checksum;
  }

  /**
   * Validate snapshot lineage
   */
  validateLineage(snapshot: Snapshot, expectedLineage: readonly string[]): boolean {
    if (snapshot.lineage.length !== expectedLineage.length) return false;

    for (let i = 0; i < expectedLineage.length; i++) {
      if (snapshot.lineage[i] !== expectedLineage[i]) return false;
    }

    return true;
  }

  /**
   * Validate snapshot causality
   */
  validateCausality(snapshot: Snapshot, expectedCausality: readonly string[]): boolean {
    if (snapshot.causality.length !== expectedCausality.length) return false;

    for (let i = 0; i < expectedCausality.length; i++) {
      if (snapshot.causality[i] !== expectedCausality[i]) return false;
    }

    return true;
  }

  /**
   * Validate snapshot against events
   */
  validateAgainstEvents(snapshot: Snapshot, events: readonly TemporalEvent[]): boolean {
    // Verify snapshot sequence number is within event range
    const eventSequenceNumbers = events.map(e => e.metadata.sequenceNumber);
    const maxSequence = Math.max(...eventSequenceNumbers, 0);

    return snapshot.metadata.eventSequence <= maxSequence;
  }

  /**
   * Validate snapshot reconstruction
   */
  validateReconstruction(snapshot: Snapshot, reconstructedState: unknown): boolean {
    return JSON.stringify(snapshot.state) === JSON.stringify(reconstructedState);
  }

  /**
   * Calculate checksum
   */
  private calculateChecksum(state: unknown, timestamp: number): string {
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
   * Get validation report
   */
  getValidationReport(snapshot: Snapshot): {
    integrityValid: boolean;
    lineageValid: boolean;
    causalityValid: boolean;
    checksum: string;
  } {
    return {
      integrityValid: this.validateIntegrity(snapshot),
      lineageValid: this.validateLineage(snapshot, snapshot.lineage),
      causalityValid: this.validateCausality(snapshot, snapshot.causality),
      checksum: snapshot.metadata.checksum,
    };
  }
}
