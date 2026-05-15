/**
 * CLAUX Runtime Temporal Layer - Event Append
 * 
 * Event append operations with causality preservation.
 * No external dependencies - pure append semantics.
 */

import type { EventId, ExecutionId, CausationId, EventType, TemporalTimestamp } from '../types';
import { EventAppendError } from '../errors';

/**
 * Event Append Manager
 * 
 * Event append operations with causality preservation.
 */
export class EventAppendManager {
  private causationIndex: Map<CausationId, EventId[]> = new Map();
  private correlationIndex: Map<string, EventId[]> = new Map();

  /**
   * Validate event append
   */
  validateAppend(
    eventId: EventId,
    executionId: ExecutionId,
    causationId: CausationId | null,
    correlationId: string | null,
    sequenceNumber: number,
    expectedSequence: number
  ): void {
    if (sequenceNumber !== expectedSequence) {
      throw new EventAppendError(
        `Invalid sequence number for execution ${executionId}: expected ${expectedSequence}, got ${sequenceNumber}`,
        eventId
      );
    }

    if (causationId && !this.causationIndex.has(causationId)) {
      throw new EventAppendError(
        `Causation ID ${causationId} not found for event ${eventId}`,
        eventId
      );
    }
  }

  /**
   * Record causation relationship
   */
  recordCausation(causationId: CausationId, eventId: EventId): void {
    const causationEvents = this.causationIndex.get(causationId) || [];
    this.causationIndex.set(causationId, [...causationEvents, eventId]);
  }

  /**
   * Record correlation relationship
   */
  recordCorrelation(correlationId: string, eventId: EventId): void {
    const correlationEvents = this.correlationIndex.get(correlationId) || [];
    this.correlationIndex.set(correlationId, [...correlationEvents, eventId]);
  }

  /**
   * Get events by causation
   */
  getEventsByCausation(causationId: CausationId): readonly EventId[] {
    return this.causationIndex.get(causationId) || [];
  }

  /**
   * Get events by correlation
   */
  getEventsByCorrelation(correlationId: string): readonly EventId[] {
    return this.correlationIndex.get(correlationId) || [];
  }

  /**
   * Get causation chain
   */
  getCausationChain(eventId: EventId): readonly CausationId[] {
    const chain: CausationId[] = [];
    
    for (const [causationId, eventIds] of this.causationIndex) {
      if (eventIds.includes(eventId)) {
        chain.push(causationId);
      }
    }

    return chain;
  }

  /**
   * Clear all relationships
   */
  clear(): void {
    this.causationIndex.clear();
    this.correlationIndex.clear();
  }
}
