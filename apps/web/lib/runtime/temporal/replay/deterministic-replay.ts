/**
 * CLAUX Runtime Temporal Layer - Deterministic Replay
 * 
 * Deterministic replay of events for state reconstruction.
 * No external dependencies - pure replay semantics.
 */

import type { ExecutionId, ReplayId, TemporalEvent, TemporalTimestamp } from '../types';
import { ReplayValidationError } from '../errors';
import { DEFAULT_REPLAY_TOLERANCE_MS } from '../constants';

/**
 * Deterministic Replay Manager
 * 
 * Deterministic replay of events for state reconstruction.
 */
export class DeterministicReplayManager {
  /**
   * Replay events deterministically
   */
  replayEvents(events: readonly TemporalEvent[], initialState: unknown = null): unknown {
    let state = initialState;

    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  /**
   * Replay from sequence
   */
  replayFromSequence(events: readonly TemporalEvent[], fromSequence: number, initialState: unknown = null): unknown {
    const relevantEvents = events.filter(e => e.metadata.sequenceNumber >= fromSequence);
    return this.replayEvents(relevantEvents, initialState);
  }

  /**
   * Replay with checkpoint
   */
  replayWithCheckpoint(events: readonly TemporalEvent[], checkpointState: unknown, checkpointSequence: number): unknown {
    const relevantEvents = events.filter(e => e.metadata.sequenceNumber > checkpointSequence);
    return this.replayEvents(relevantEvents, checkpointState);
  }

  /**
   * Validate replay determinism
   */
  validateDeterminism(originalEvents: readonly TemporalEvent[], replayedEvents: readonly TemporalEvent[]): boolean {
    if (originalEvents.length !== replayedEvents.length) return false;

    for (let i = 0; i < originalEvents.length; i++) {
      const original = originalEvents[i];
      const replayed = replayedEvents[i];

      if (original.metadata.eventType !== replayed.metadata.eventType) return false;
      if (JSON.stringify(original.payload) !== JSON.stringify(replayed.payload)) return false;
    }

    return true;
  }

  /**
   * Validate replay timing
   */
  validateTiming(originalEvents: readonly TemporalEvent[], replayedEvents: readonly TemporalEvent[], toleranceMs: number = DEFAULT_REPLAY_TOLERANCE_MS): boolean {
    if (originalEvents.length !== replayedEvents.length) return false;

    for (let i = 0; i < originalEvents.length; i++) {
      const original = originalEvents[i];
      const replayed = replayedEvents[i];

      const timeDiff = Math.abs(original.metadata.timestamp - replayed.metadata.timestamp);
      if (timeDiff > toleranceMs) return false;
    }

    return true;
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
   * Get replay statistics
   */
  getReplayStatistics(events: readonly TemporalEvent[]): {
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
