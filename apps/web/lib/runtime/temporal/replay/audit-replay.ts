/**
 * CLAUX Runtime Temporal Layer - Audit Replay
 * 
 * Audit replay for verification and forensic analysis.
 * No external dependencies - pure replay semantics.
 */

import type { ExecutionId, TemporalEvent, TemporalTimestamp } from '../types';

/**
 * Audit Replay Manager
 * 
 * Audit replay for verification and forensic analysis.
 */
export class AuditReplayManager {
  /**
   * Replay events for audit
   */
  auditReplay(events: readonly TemporalEvent[]): readonly TemporalEvent[] {
    return [...events].sort((a, b) => a.metadata.sequenceNumber - b.metadata.sequenceNumber);
  }

  /**
   * Replay with causality tracking
   */
  auditReplayWithCausality(events: readonly TemporalEvent[]): {
    events: readonly TemporalEvent[];
    causalityMap: Map<string, string[]>;
  } {
    const sorted = this.auditReplay(events);
    const map = new Map<string, string[]>();

    for (const event of sorted) {
      if (event.metadata.causationId) {
        const causationEvents = map.get(event.metadata.causationId) || [];
        map.set(event.metadata.causationId, [...causationEvents, event.metadata.eventId]);
      }
    }

    return {
      events: sorted,
      causalityMap: map,
    };
  }

  /**
   * Replay with correlation tracking
   */
  auditReplayWithCorrelation(events: readonly TemporalEvent[]): {
    events: readonly TemporalEvent[];
    correlationMap: Map<string, string[]>;
  } {
    const sorted = this.auditReplay(events);
    const correlationMap = new Map<string, string[]>();

    for (const event of sorted) {
      if (event.metadata.correlationId) {
        const correlationEvents = correlationMap.get(event.metadata.correlationId) || [];
        correlationMap.set(event.metadata.correlationId, [...correlationEvents, event.metadata.eventId]);
      }
    }

    return {
      events: sorted,
      correlationMap,
    };
  }

  /**
   * Get audit trail
   */
  getAuditTrail(events: readonly TemporalEvent[]): readonly {
    eventId: string;
    eventType: string;
    timestamp: TemporalTimestamp;
    causationId: string | null;
    correlationId: string | null;
  }[] {
    return events.map(e => ({
      eventId: e.metadata.eventId,
      eventType: e.metadata.eventType,
      timestamp: e.metadata.timestamp,
      causationId: e.metadata.causationId,
      correlationId: e.metadata.correlationId,
    }));
  }
}
