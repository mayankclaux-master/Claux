/**
 * CLAUX Runtime Temporal Layer - Snapshot Rebuilder
 * 
 * Rebuild state from events and snapshots.
 * No external dependencies - pure rebuild semantics.
 */

import type { TemporalEvent, Snapshot, ExecutionId } from '../types';
import { TemporalReconstructionError } from '../errors';

/**
 * Snapshot Rebuilder
 * 
 * Rebuild state from events and snapshots.
 */
export class SnapshotRebuilder {
  /**
   * Rebuild state from events
   */
  rebuildFromEvents(events: readonly TemporalEvent[], initialState: unknown = null): unknown {
    let state = initialState;

    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  /**
   * Rebuild state from snapshot and events
   */
  rebuildFromSnapshotAndEvents(snapshot: Snapshot, events: readonly TemporalEvent[]): unknown {
    let state = snapshot.state;

    for (const event of events) {
      if (event.metadata.sequenceNumber > snapshot.metadata.eventSequence) {
        state = this.applyEvent(state, event);
      }
    }

    return state;
  }

  /**
   * Apply event to state
   */
  private applyEvent(state: unknown, event: TemporalEvent): unknown {
    // Simplified event application - in production would use actual event handlers
    if (typeof state === 'object' && state !== null && typeof event.payload === 'object' && event.payload !== null) {
      return { ...state as Record<string, unknown>, ...event.payload as Record<string, unknown> };
    }
    return event.payload;
  }

  /**
   * Validate rebuild consistency
   */
  validateRebuildConsistency(originalState: unknown, rebuiltState: unknown): boolean {
    return JSON.stringify(originalState) === JSON.stringify(rebuiltState);
  }

  /**
   * Get rebuild statistics
   */
  getRebuildStatistics(events: readonly TemporalEvent[]): {
    totalEvents: number;
    eventTypes: Map<string, number>;
  } {
    const eventTypes = new Map<string, number>();

    for (const event of events) {
      const count = eventTypes.get(event.metadata.eventType) || 0;
      eventTypes.set(event.metadata.eventType, count + 1);
    }

    return {
      totalEvents: events.length,
      eventTypes,
    };
  }
}
