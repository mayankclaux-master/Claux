/**
 * CLAUX Runtime Temporal Layer - Forensic Reconstruction
 * 
 * Forensic reconstruction from audit logs.
 * No external dependencies - pure reconstruction semantics.
 */

import type { ExecutionId, TemporalEvent, LineageId, CausationId, ForensicReconstructionResult } from '../types';
import { ForensicReconstructionError } from '../errors';

/**
 * Forensic Reconstruction Manager
 * 
 * Forensic reconstruction from audit logs.
 */
export class ForensicReconstructionManager {
  /**
   * Reconstruct execution from audit
   */
  reconstructFromAudit(
    executionId: ExecutionId,
    events: readonly TemporalEvent[],
    lineageChain: readonly LineageId[],
    causalityChain: readonly CausationId[]
  ): ForensicReconstructionResult {
    let state = null;

    for (const event of events) {
      if (event.metadata.executionId === executionId) {
        state = this.applyEvent(state, event);
      }
    }

    return {
      executionId,
      reconstructedState: state,
      timeline: events,
      causalityChain: [...causalityChain],
      lineageChain: [...lineageChain],
      confidence: this.calculateConfidence(events),
    };
  }

  /**
   * Reconstruct with missing events
   */
  reconstructWithMissingEvents(
    executionId: ExecutionId,
    events: readonly TemporalEvent[],
    missingEventIds: readonly string[]
  ): ForensicReconstructionResult {
    const filteredEvents = events.filter(e => !missingEventIds.includes(e.metadata.eventId));
    const confidence = 1 - (missingEventIds.length / events.length);

    return {
      executionId,
      reconstructedState: this.reconstructFromEvents(executionId, filteredEvents),
      timeline: filteredEvents,
      causalityChain: [],
      lineageChain: [],
      confidence,
    };
  }

  /**
   * Reconstruct from events
   */
  private reconstructFromEvents(executionId: ExecutionId, events: readonly TemporalEvent[]): unknown {
    let state = null;

    for (const event of events) {
      if (event.metadata.executionId === executionId) {
        state = this.applyEvent(state, event);
      }
    }

    return state;
  }

  /**
   * Apply event to state
   */
  private applyEvent(state: unknown, event: TemporalEvent): unknown {
    if (typeof state === 'object' && state !== null && typeof event.payload === 'object' && event.payload !== null) {
      return { ...state as Record<string, unknown>, ...event.payload as Record<string, unknown> };
    }
    return event.payload;
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(events: readonly TemporalEvent[]): number {
    if (events.length === 0) return 0;

    // Simple confidence calculation based on sequence continuity
    let sequenceGaps = 0;
    for (let i = 1; i < events.length; i++) {
      if (events[i].metadata.sequenceNumber !== events[i - 1].metadata.sequenceNumber + 1) {
        sequenceGaps++;
      }
    }

    return 1 - (sequenceGaps / events.length);
  }

  /**
   * Get reconstruction statistics
   */
  getReconstructionStatistics(result: ForensicReconstructionResult): {
    executionId: string;
    eventCount: number;
    lineageDepth: number;
    causalityDepth: number;
    confidence: number;
  } {
    return {
      executionId: result.executionId,
      eventCount: result.timeline.length,
      lineageDepth: result.lineageChain.length,
      causalityDepth: result.causalityChain.length,
      confidence: result.confidence,
    };
  }
}
