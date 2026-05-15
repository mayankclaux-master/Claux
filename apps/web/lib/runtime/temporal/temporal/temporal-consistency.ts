/**
 * CLAUX Runtime Temporal Layer - Temporal Consistency
 * 
 * Temporal consistency validation and enforcement.
 * No external dependencies - pure consistency semantics.
 */

import type { TemporalTimestamp, TemporalEvent, ExecutionId } from '../types';
import { TemporalConsistencyError } from '../errors';
import { TEMPORAL_CONSISTENCY_LEVELS } from '../constants';

/**
 * Temporal Consistency Manager
 * 
 * Temporal consistency validation and enforcement.
 */
export class TemporalConsistencyManager {
  /**
   * Validate event ordering
   */
  validateEventOrdering(events: readonly TemporalEvent[]): boolean {
    for (let i = 1; i < events.length; i++) {
      if (events[i].metadata.sequenceNumber <= events[i - 1].metadata.sequenceNumber) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate temporal ordering
   */
  validateTemporalOrdering(events: readonly TemporalEvent[]): boolean {
    for (let i = 1; i < events.length; i++) {
      if (events[i].metadata.timestamp < events[i - 1].metadata.timestamp) {
        return false;
      }
    }
    return true;
  }

  /**
   * Validate causality consistency
   */
  validateCausalityConsistency(events: readonly TemporalEvent[]): boolean {
    const causationMap = new Map<string, TemporalTimestamp>();

    for (const event of events) {
      if (event.metadata.causationId) {
        const causationTime = causationMap.get(event.metadata.causationId);
        if (causationTime && event.metadata.timestamp < causationTime) {
          return false;
        }
        causationMap.set(event.metadata.causationId, event.metadata.timestamp);
      }
    }

    return true;
  }

  /**
   * Validate consistency level
   */
  validateConsistencyLevel(events: readonly TemporalEvent[], level: string): boolean {
    switch (level) {
      case TEMPORAL_CONSISTENCY_LEVELS.STRICT:
        return this.validateEventOrdering(events) && 
               this.validateTemporalOrdering(events) && 
               this.validateCausalityConsistency(events);
      case TEMPORAL_CONSISTENCY_LEVELS.CAUSAL:
        return this.validateCausalityConsistency(events);
      case TEMPORAL_CONSISTENCY_LEVELS.EVENTUAL:
        return true;
      default:
        return true;
    }
  }

  /**
   * Detect inconsistencies
   */
  detectInconsistencies(events: readonly TemporalEvent[]): string[] {
    const inconsistencies: string[] = [];

    if (!this.validateEventOrdering(events)) {
      inconsistencies.push('Event ordering violation');
    }

    if (!this.validateTemporalOrdering(events)) {
      inconsistencies.push('Temporal ordering violation');
    }

    if (!this.validateCausalityConsistency(events)) {
      inconsistencies.push('Causality consistency violation');
    }

    return inconsistencies;
  }

  /**
   * Enforce consistency
   */
  enforceConsistency(events: readonly TemporalEvent[], level: string): readonly TemporalEvent[] {
    const sorted = [...events].sort((a, b) => a.metadata.sequenceNumber - b.metadata.sequenceNumber);

    if (level === TEMPORAL_CONSISTENCY_LEVELS.STRICT) {
      return sorted.filter(e => e.metadata.timestamp >= 0);
    }

    return sorted;
  }
}
