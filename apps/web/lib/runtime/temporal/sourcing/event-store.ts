/**
 * CLAUX Runtime Temporal Layer - Event Store
 * 
 * Append-only event store for temporal operations.
 * No external dependencies - pure event store semantics.
 */

import type { EventId, ExecutionId, TemporalEvent, EventType, TemporalTimestamp } from '../types';
import { EventAppendError } from '../errors';

/**
 * Event Store
 * 
 * Append-only event store for temporal operations.
 */
export class EventStore {
  private events: Map<EventId, TemporalEvent> = new Map();
  private executionIndex: Map<ExecutionId, EventId[]> = new Map();
  private typeIndex: Map<EventType, EventId[]> = new Map();
  private sequenceNumbers: Map<ExecutionId, number> = new Map();

  /**
   * Append event to store
   */
  append(event: TemporalEvent): void {
    if (this.events.has(event.metadata.eventId)) {
      throw new EventAppendError(`Event ${event.metadata.eventId} already exists`, event.metadata.eventId);
    }

    // Verify sequence number
    const currentSequence = this.sequenceNumbers.get(event.metadata.executionId) || 0;
    if (event.metadata.sequenceNumber !== currentSequence + 1) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${event.metadata.executionId}: expected ${currentSequence + 1}, got ${event.metadata.sequenceNumber}`,
        event.metadata.eventId
      );
    }

    // Store event
    this.events.set(event.metadata.eventId, event);
    this.sequenceNumbers.set(event.metadata.executionId, event.metadata.sequenceNumber);

    // Update execution index
    const executionEvents = this.executionIndex.get(event.metadata.executionId) || [];
    this.executionIndex.set(event.metadata.executionId, [...executionEvents, event.metadata.eventId]);

    // Update type index
    const typeEvents = this.typeIndex.get(event.metadata.eventType) || [];
    this.typeIndex.set(event.metadata.eventType, [...typeEvents, event.metadata.eventId]);
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: EventId): TemporalEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get events for execution
   */
  getEventsForExecution(executionId: ExecutionId): readonly TemporalEvent[] {
    const eventIds = this.executionIndex.get(executionId) || [];
    const events: TemporalEvent[] = [];
    
    for (const eventId of eventIds) {
      const event = this.events.get(eventId);
      if (event) events.push(event);
    }

    return events.sort((a, b) => a.metadata.sequenceNumber - b.metadata.sequenceNumber);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: EventType): readonly TemporalEvent[] {
    const eventIds = this.typeIndex.get(eventType) || [];
    const events: TemporalEvent[] = [];
    
    for (const eventId of eventIds) {
      const event = this.events.get(eventId);
      if (event) events.push(event);
    }

    return events.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
  }

  /**
   * Get events in time range
   */
  getEventsInTimeRange(startTime: TemporalTimestamp, endTime: TemporalTimestamp): readonly TemporalEvent[] {
    const events: TemporalEvent[] = [];
    
    for (const event of this.events.values()) {
      if (event.metadata.timestamp >= startTime && event.metadata.timestamp <= endTime) {
        events.push(event);
      }
    }

    return events.sort((a, b) => a.metadata.timestamp - b.metadata.timestamp);
  }

  /**
   * Get event at sequence number
   */
  getEventAtSequence(executionId: ExecutionId, sequenceNumber: number): TemporalEvent | undefined {
    const events = this.getEventsForExecution(executionId);
    return events.find(e => e.metadata.sequenceNumber === sequenceNumber);
  }

  /**
   * Get current sequence number
   */
  getCurrentSequence(executionId: ExecutionId): number {
    return this.sequenceNumbers.get(executionId) || 0;
  }

  /**
   * Get all event IDs
   */
  getAllEventIds(): readonly EventId[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get store statistics
   */
  getStatistics(): {
    totalEvents: number;
    totalExecutions: number;
    totalEventTypes: number;
    eventTypes: Map<EventType, number>;
  } {
    const eventTypes = new Map<EventType, number>();

    for (const event of this.events.values()) {
      const count = eventTypes.get(event.metadata.eventType) || 0;
      eventTypes.set(event.metadata.eventType, count + 1);
    }

    return {
      totalEvents: this.events.size,
      totalExecutions: this.executionIndex.size,
      totalEventTypes: this.typeIndex.size,
      eventTypes,
    };
  }

  /**
   * Clear store for execution
   */
  clearExecution(executionId: ExecutionId): void {
    const eventIds = this.executionIndex.get(executionId) || [];
    
    for (const eventId of eventIds) {
      const event = this.events.get(eventId);
      if (event) {
        const typeEvents = this.typeIndex.get(event.metadata.eventType) || [];
        const updatedTypeEvents = typeEvents.filter(e => e !== eventId);
        this.typeIndex.set(event.metadata.eventType, updatedTypeEvents);
      }
      this.events.delete(eventId);
    }

    this.executionIndex.delete(executionId);
    this.sequenceNumbers.delete(executionId);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events.clear();
    this.executionIndex.clear();
    this.typeIndex.clear();
    this.sequenceNumbers.clear();
  }
}
