/**
 * CLAUX Runtime Temporal Layer - Temporal Window
 * 
 * Temporal window operations for time-based queries.
 * No external dependencies - pure window semantics.
 */

import type { ExecutionId, EventType, TemporalTimestamp, TemporalWindow, TemporalEvent } from '../types';

/**
 * Temporal Window Manager
 * 
 * Temporal window operations for time-based queries.
 */
export class TemporalWindowManager {
  /**
   * Create temporal window
   */
  createWindow(
    startTime: TemporalTimestamp,
    endTime: TemporalTimestamp,
    executionId: ExecutionId | null,
    eventTypes: readonly EventType[] | null
  ): TemporalWindow {
    return {
      startTime,
      endTime,
      executionId,
      eventTypes,
    };
  }

  /**
   * Filter events by window
   */
  filterByWindow(events: readonly TemporalEvent[], window: TemporalWindow): TemporalEvent[] {
    let filtered = [...events];

    if (window.startTime) {
      filtered = filtered.filter(e => e.metadata.timestamp >= window.startTime);
    }

    if (window.endTime) {
      filtered = filtered.filter(e => e.metadata.timestamp <= window.endTime);
    }

    if (window.executionId) {
      filtered = filtered.filter(e => e.metadata.executionId === window.executionId);
    }

    if (window.eventTypes) {
      filtered = filtered.filter(e => window.eventTypes!.includes(e.metadata.eventType));
    }

    return filtered;
  }

  /**
   * Get window statistics
   */
  getWindowStatistics(events: readonly TemporalEvent[], window: TemporalWindow): {
    totalEvents: number;
    filteredEvents: number;
    eventTypes: Map<string, number>;
    timeRange: { start: TemporalTimestamp; end: TemporalTimestamp } | null;
  } {
    const filtered = this.filterByWindow(events, window);
    const eventTypes = new Map<string, number>();

    let startTime: TemporalTimestamp | null = null;
    let endTime: TemporalTimestamp | null = null;

    for (const event of filtered) {
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
      filteredEvents: filtered.length,
      eventTypes,
      timeRange: startTime !== null && endTime !== null ? { start: startTime, end: endTime } : null,
    };
  }

  /**
   * Slide window
   */
  slideWindow(window: TemporalWindow, offsetMs: number): TemporalWindow {
    return {
      ...window,
      startTime: window.startTime + offsetMs,
      endTime: window.endTime + offsetMs,
    };
  }

  /**
   * Expand window
   */
  expandWindow(window: TemporalWindow, expandMs: number): TemporalWindow {
    return {
      ...window,
      startTime: window.startTime - expandMs,
      endTime: window.endTime + expandMs,
    };
  }
}
