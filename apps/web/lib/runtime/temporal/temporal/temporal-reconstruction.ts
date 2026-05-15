/**
 * CLAUX Runtime Temporal Layer - Temporal Reconstruction
 * 
 * Temporal state reconstruction from events.
 * No external dependencies - pure reconstruction semantics.
 */

import type { ExecutionId, TemporalTimestamp, TemporalEvent, Snapshot } from '../types';
import { TemporalReconstructionError } from '../errors';

/**
 * Temporal Reconstruction Manager
 * 
 * Temporal state reconstruction from events.
 */
export class TemporalReconstructionManager {
  /**
   * Reconstruct state from events
   */
  reconstructFromEvents(executionId: ExecutionId, events: readonly TemporalEvent[], initialState: unknown = null): unknown {
    let state = initialState;

    for (const event of events) {
      if (event.metadata.executionId !== executionId) continue;
      state = this.applyEvent(state, event);
    }

    return state;
  }

  /**
   * Reconstruct state at time
   */
  reconstructAtTime(executionId: ExecutionId, timestamp: TemporalTimestamp, events: readonly TemporalEvent[]): unknown {
    const relevantEvents = events.filter(e => e.metadata.executionId === executionId && e.metadata.timestamp <= timestamp);
    return this.reconstructFromEvents(executionId, relevantEvents);
  }

  /**
   * Reconstruct from snapshot and events
   */
  reconstructFromSnapshot(snapshot: Snapshot, events: readonly TemporalEvent[]): unknown {
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
    if (typeof state === 'object' && state !== null && typeof event.payload === 'object' && event.payload !== null) {
      return { ...state as Record<string, unknown>, ...event.payload as Record<string, unknown> };
    }
    return event.payload;
  }

  /**
   * Validate reconstruction
   */
  validateReconstruction(originalState: unknown, reconstructedState: unknown): boolean {
    return JSON.stringify(originalState) === JSON.stringify(reconstructedState);
  }

  /**
   * Get reconstruction statistics
   */
  getReconstructionStatistics(events: readonly TemporalEvent[]): {
    totalEvents: number;
    eventTypes: Map<string, number>;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const eventTypes = new Map<string, number>();
    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const event of events) {
      const count = eventTypes.get(event.metadata.eventType) || 0;
      eventTypes.set(event.metadata.eventType, count + 1);

      if (startTime === null || event.metadata.timestamp < startTime) {
        startTime = event.metadata.timestamp;
      }
      if (endTime === null || event.metadata.timestamp > endTime) {
        endTime = event.metadata.timestamp;
      }
    }

    return {
      totalEvents: events.length,
      eventTypes,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }
}
