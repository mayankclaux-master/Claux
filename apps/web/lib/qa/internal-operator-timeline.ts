/**
 * Internal Operator Timeline
 * 
 * Creates unified operational timeline showing:
 * - Onboarding events
 * - Executions
 * - Retries
 * - Connector failures
 * - OAuth failures
 * - Generated tasks
 * - Dashboard refreshes
 * - Cache invalidations
 * - Admin actions
 * 
 * All trace-linked and tenant-linked.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Timeline event type
 */
export enum TimelineEventType {
  ONBOARDING = 'onboarding',
  EXECUTION = 'execution',
  RETRY = 'retry',
  CONNECTOR_FAILURE = 'connector_failure',
  OAUTH_FAILURE = 'oauth_failure',
  TASK_GENERATED = 'task_generated',
  DASHBOARD_REFRESH = 'dashboard_refresh',
  CACHE_INVALIDATION = 'cache_invalidation',
  ADMIN_ACTION = 'admin_action',
}

/**
 * Timeline event
 */
export interface TimelineEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  type: TimelineEventType;
  description: string;
  traceId?: string;
  metadata?: Record<string, any>;
  userId?: string;
  duration?: number;
}

/**
 * Timeline filter
 */
export interface TimelineFilter {
  tenantId?: string;
  type?: TimelineEventType;
  traceId?: string;
  userId?: string;
  since?: number;
  until?: number;
}

/**
 * Internal operator timeline
 */
export class InternalOperatorTimeline {
  private logger: Logger;
  private events: TimelineEvent[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Add timeline event
   */
  addEvent(params: {
    tenantId: string;
    type: TimelineEventType;
    description: string;
    traceId?: string;
    metadata?: Record<string, any>;
    userId?: string;
    duration?: number;
  }): string {
    const event: TimelineEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.events.push(event);
    this.logger.info('Timeline event added', { event });

    return event.id;
  }

  /**
   * Get events by filter
   */
  getEvents(filter?: TimelineFilter): TimelineEvent[] {
    let events = [...this.events];

    if (filter) {
      if (filter.tenantId) {
        events = events.filter(e => e.tenantId === filter.tenantId);
      }
      if (filter.type) {
        events = events.filter(e => e.type === filter.type);
      }
      if (filter.traceId) {
        events = events.filter(e => e.traceId === filter.traceId);
      }
      if (filter.userId) {
        events = events.filter(e => e.userId === filter.userId);
      }
      if (filter.since !== undefined) {
        events = events.filter(e => e.timestamp >= (filter.since as number));
      }
      if (filter.until !== undefined) {
        events = events.filter(e => e.timestamp <= (filter.until as number));
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get events by tenant
   */
  getEventsByTenant(tenantId: string): TimelineEvent[] {
    return this.getEvents({ tenantId });
  }

  /**
   * Get events by trace ID
   */
  getEventsByTraceId(traceId: string): TimelineEvent[] {
    return this.getEvents({ traceId });
  }

  /**
   * Get events by type
   */
  getEventsByType(type: TimelineEventType): TimelineEvent[] {
    return this.getEvents({ type });
  }

  /**
   * Get event statistics
   */
  getEventStatistics(filter?: TimelineFilter): {
    totalEvents: number;
    byType: Record<string, number>;
    byTenant: Record<string, number>;
    averageDuration: number;
  } {
    const events = this.getEvents(filter);
    const total = events.length;

    const byType: Record<string, number> = {};
    const byTenant: Record<string, number> = {};

    let totalDuration = 0;
    let durationCount = 0;

    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
      byTenant[event.tenantId] = (byTenant[event.tenantId] || 0) + 1;

      if (event.duration !== undefined) {
        totalDuration += event.duration;
        durationCount++;
      }
    });

    const averageDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return {
      totalEvents: total,
      byType,
      byTenant,
      averageDuration: Math.round(averageDuration),
    };
  }

  /**
   * Generate timeline report
   */
  generateTimelineReport(filter?: TimelineFilter): string {
    const events = this.getEvents(filter);
    const stats = this.getEventStatistics(filter);

    let report = '=== Internal Operator Timeline ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Events: ${stats.totalEvents}\n`;
    report += `Average Duration: ${stats.averageDuration}ms\n\n`;

    report += '--- Events by Type ---\n';
    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Events by Tenant ---\n';
    Object.entries(stats.byTenant).forEach(([tenantId, count]) => {
      report += `${tenantId}: ${count}\n`;
    });

    report += '\n--- Recent Events ---\n';
    events.slice(0, 20).forEach(event => {
      report += `${new Date(event.timestamp).toISOString()} - ${event.type}\n`;
      report += `  Tenant: ${event.tenantId}\n`;
      report += `  Description: ${event.description}\n`;
      if (event.traceId) {
        report += `  Trace ID: ${event.traceId}\n`;
      }
      if (event.duration !== undefined) {
        report += `  Duration: ${event.duration}ms\n`;
      }
      if (event.userId) {
        report += `  User: ${event.userId}\n`;
      }
    });

    return report;
  }

  /**
   * Generate trace timeline
   */
  generateTraceTimeline(traceId: string): string {
    const events = this.getEventsByTraceId(traceId);

    let report = `=== Trace Timeline: ${traceId} ===\n`;
    report += `Events: ${events.length}\n\n`;

    events.sort((a, b) => a.timestamp - b.timestamp).forEach(event => {
      report += `${new Date(event.timestamp).toISOString()} - ${event.type}\n`;
      report += `  Tenant: ${event.tenantId}\n`;
      report += `  Description: ${event.description}\n`;
      if (event.duration !== undefined) {
        report += `  Duration: ${event.duration}ms\n`;
      }
    });

    return report;
  }

  /**
   * Clear events (for testing only)
   */
  clearEvents(): void {
    this.logger.warn('Timeline events cleared');
    this.events = [];
  }
}

/**
 * Singleton instance
 */
export const internalOperatorTimeline = new InternalOperatorTimeline();
