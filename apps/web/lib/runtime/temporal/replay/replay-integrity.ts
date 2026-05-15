/**
 * CLAUX Runtime Temporal Layer - Replay Integrity
 * 
 * Replay integrity verification and validation.
 * No external dependencies - pure integrity semantics.
 */

import type { ReplayId, ExecutionId, TemporalEvent } from '../types';
import { ReplayValidationError } from '../errors';

/**
 * Replay Integrity Manager
 * 
 * Replay integrity verification and validation.
 */
export class ReplayIntegrityManager {
  /**
   * Validate replay integrity
   */
  validateReplayIntegrity(replayId: ReplayId, originalExecutionId: ExecutionId, replayedExecutionId: ExecutionId): boolean {
    return originalExecutionId !== replayedExecutionId;
  }

  /**
   * Validate event integrity
   */
  validateEventIntegrity(events: readonly TemporalEvent[]): boolean {
    // Check sequence number continuity
    for (let i = 0; i < events.length; i++) {
      if (events[i].metadata.sequenceNumber !== i + 1) {
        return false;
      }
    }

    // Check timestamp monotonicity
    for (let i = 1; i < events.length; i++) {
      if (events[i].metadata.timestamp < events[i - 1].metadata.timestamp) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate causality integrity
   */
  validateCausalityIntegrity(events: readonly TemporalEvent[]): boolean {
    const causationMap = new Map<string, number>();

    for (const event of events) {
      if (event.metadata.causationId) {
        const causationIndex = causationMap.get(event.metadata.causationId);
        if (causationIndex !== undefined && causationIndex >= event.metadata.sequenceNumber) {
          return false;
        }
        causationMap.set(event.metadata.causationId, event.metadata.sequenceNumber);
      }
    }

    return true;
  }

  /**
   * Validate replay safety
   */
  validateReplaySafety(events: readonly TemporalEvent[]): boolean {
    return this.validateEventIntegrity(events) && this.validateCausalityIntegrity(events);
  }

  /**
   * Get integrity report
   */
  getIntegrityReport(replayId: ReplayId, events: readonly TemporalEvent[]): {
    replayId: string;
    eventCount: number;
    eventIntegrityValid: boolean;
    causalityIntegrityValid: boolean;
    overallValid: boolean;
  } {
    return {
      replayId,
      eventCount: events.length,
      eventIntegrityValid: this.validateEventIntegrity(events),
      causalityIntegrityValid: this.validateCausalityIntegrity(events),
      overallValid: this.validateReplaySafety(events),
    };
  }
}
