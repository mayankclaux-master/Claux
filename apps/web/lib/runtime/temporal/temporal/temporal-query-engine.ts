/**
 * CLAUX Runtime Temporal Layer - Temporal Query Engine
 * 
 * Temporal query operations for state-at-time and lineage traversal.
 * No external dependencies - pure query semantics.
 */

import type { ExecutionId, TemporalTimestamp, TemporalWindow, TemporalQueryResult, TemporalEvent, LineageId, CausationId } from '../types';
import { TemporalQueryError } from '../errors';
import { DEFAULT_TEMPORAL_WINDOW_MS } from '../constants';

/**
 * Temporal Query Engine
 * 
 * Temporal query operations for state-at-time and lineage traversal.
 */
export class TemporalQueryEngine {
  /**
   * Query state at time
   */
  queryStateAtTime(executionId: ExecutionId, timestamp: TemporalTimestamp, events: readonly TemporalEvent[]): unknown {
    const relevantEvents = events.filter(e => e.metadata.executionId === executionId && e.metadata.timestamp <= timestamp);
    let state = null;

    for (const event of relevantEvents) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  /**
   * Query execution at time
   */
  queryExecutionAtTime(executionId: ExecutionId, timestamp: TemporalTimestamp, events: readonly TemporalEvent[]): TemporalQueryResult {
    const relevantEvents = events.filter(e => e.metadata.executionId === executionId && e.metadata.timestamp <= timestamp);
    const state = this.queryStateAtTime(executionId, timestamp, events);

    return {
      queryId: `query_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp,
      events: relevantEvents,
      state,
      lineage: [],
      causality: [],
    };
  }

  /**
   * Query in temporal window
   */
  queryInWindow(window: TemporalWindow, events: readonly TemporalEvent[]): TemporalQueryResult {
    let filteredEvents = events;

    if (window.startTime) {
      filteredEvents = filteredEvents.filter(e => e.metadata.timestamp >= window.startTime);
    }

    if (window.endTime) {
      filteredEvents = filteredEvents.filter(e => e.metadata.timestamp <= window.endTime);
    }

    if (window.executionId) {
      filteredEvents = filteredEvents.filter(e => e.metadata.executionId === window.executionId);
    }

    if (window.eventTypes) {
      filteredEvents = filteredEvents.filter(e => window.eventTypes!.includes(e.metadata.eventType));
    }

    return {
      queryId: `query_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      timestamp: Date.now() as TemporalTimestamp,
      events: filteredEvents,
      state: null,
      lineage: [],
      causality: [],
    };
  }

  /**
   * Traverse lineage
   */
  traverseLineage(lineageId: LineageId, getLineageChain: (id: LineageId) => readonly LineageId[]): readonly LineageId[] {
    return getLineageChain(lineageId);
  }

  /**
   * Traverse causality
   */
  traverseCausality(causationId: CausationId, getCausationChain: (id: CausationId) => readonly CausationId[]): readonly CausationId[] {
    return getCausationChain(causationId);
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
   * Get query statistics
   */
  getQueryStatistics(results: readonly TemporalQueryResult[]): {
    totalQueries: number;
    averageEventCount: number;
    averageLatency: number;
  } {
    if (results.length === 0) {
      return { totalQueries: 0, averageEventCount: 0, averageLatency: 0 };
    }

    const totalEvents = results.reduce((sum, r) => sum + r.events.length, 0);
    const avgEvents = totalEvents / results.length;

    return {
      totalQueries: results.length,
      averageEventCount: avgEvents,
      averageLatency: 0,
    };
  }
}
