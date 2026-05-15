/**
 * CLAUX Runtime Temporal Layer - Event Replay
 * 
 * Event replay operations for temporal reconstruction.
 * No external dependencies - pure replay semantics.
 */

import type { EventId, ExecutionId, TemporalEvent, TemporalTimestamp } from '../types';
import { EventReplayError } from '../errors';

/**
 * Event Replay Manager
 * 
 * Event replay operations for temporal reconstruction.
 */
export class EventReplayManager {
  /**
   * Replay events for execution
   */
  replayEvents(events: readonly TemporalEvent[], fromSequence: number = 0): TemporalEvent[] {
    return events.filter(e => e.metadata.sequenceNumber >= fromSequence);
  }

  /**
   * Replay events in time range
   */
  replayEventsInTimeRange(events: readonly TemporalEvent[], startTime: TemporalTimestamp, endTime: TemporalTimestamp): TemporalEvent[] {
    return events.filter(e => e.metadata.timestamp >= startTime && e.metadata.timestamp <= endTime);
  }

  /**
   * Replay events by causation
   */
  replayEventsByCausation(events: readonly TemporalEvent[], causationId: string): TemporalEvent[] {
    return events.filter(e => e.metadata.causationId === causationId);
  }

  /**
   * Replay events by type
   */
  replayEventsByType(events: readonly TemporalEvent[], eventType: string): TemporalEvent[] {
    return events.filter(e => e.metadata.eventType === eventType);
  }

  /**
   * Validate replay sequence
   */
  validateReplaySequence(events: readonly TemporalEvent[], expectedSequence: number): void {
    for (const event of events) {
      if (event.metadata.sequenceNumber < expectedSequence) {
        throw new EventReplayError(
          `Event ${event.metadata.eventId} has sequence ${event.metadata.sequenceNumber} below expected ${expectedSequence}`,
          event.metadata.eventId
        );
      }
    }
  }

  /**
   * Get replay statistics
   */
  getReplayStatistics(events: readonly TemporalEvent[]): {
    totalEvents: number;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
    eventTypes: Map<string, number>;
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
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
      eventTypes,
    };
  }
}
