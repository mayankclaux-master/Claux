/**
 * Event Repository
 * 
 * Data access layer for agent_events table
 * Handles event stream, correlation, and statistics
 */

import type { UUID, Result, PaginationOptions, SortOptions } from '../types/common.types';
import type {
  Event,
  EventInsert,
  EventUpdate,
  EventFilter,
  EventStats,
  EventCorrelation,
} from '../types/event.types';
import { BaseRepository, BaseFilter } from './base.repository';
import { RuntimeDatabaseError, RuntimeDbErrorCode } from '../db';

/**
 * Event filter interface
 * Extends base filter with event-specific fields
 */
export interface EventRepositoryFilter extends BaseFilter {
  readonly execution_id?: UUID;
  readonly event_name?: string;
  readonly event_source?: string;
  readonly event_version?: string;
  readonly correlation_id?: string;
  readonly causation_id?: string;
}

/**
 * Event repository
 * Manages event CRUD operations and queries
 */
export class EventRepository extends BaseRepository<
  Event,
  EventInsert,
  EventUpdate,
  EventRepositoryFilter
> {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    super();
    this.tenantId = tenantId;
  }

  protected getTableName(): string {
    return 'agent_events';
  }

  protected getTenantId(): UUID {
    return this.tenantId;
  }

  /**
   * Create a new event
   */
  async create(data: EventInsert): Promise<Result<Event, RuntimeDatabaseError>> {
    return super.create(data);
  }

  /**
   * Create multiple events in batch
   */
  async createBatch(data: EventInsert[]): Promise<Result<Event[], RuntimeDatabaseError>> {
    return super.createBatch(data);
  }

  /**
   * Fetch event by ID
   */
  async findById(id: UUID): Promise<Result<Event, RuntimeDatabaseError>> {
    return super.findById(id);
  }

  /**
   * Fetch events by execution ID
   */
  async fetchByExecutionId(
    executionId: UUID,
    options?: {
      filter?: Partial<EventRepositoryFilter>;
      pagination?: PaginationOptions;
      sort?: SortOptions;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    this.logOperation('fetchByExecutionId', { executionId, options });

    const filter: EventRepositoryFilter = {
      execution_id: executionId,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: options?.sort || { column: 'created_at', direction: 'asc' },
    });
  }

  /**
   * Fetch events by correlation ID
   */
  async fetchByCorrelationId(
    correlationId: string,
    options?: {
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    this.logOperation('fetchByCorrelationId', { correlationId, options });

    const filter: EventRepositoryFilter = {
      correlation_id: correlationId,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'asc' },
    });
  }

  /**
   * Fetch event stream for an execution
   */
  async fetchEventStream(
    executionId: UUID,
    options?: {
      event_name?: string;
      event_source?: string;
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    this.logOperation('fetchEventStream', { executionId, options });

    const filter: EventRepositoryFilter = {
      execution_id: executionId,
      event_name: options?.event_name,
      event_source: options?.event_source,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'asc' },
    });
  }

  /**
   * Fetch events by event name
   */
  async fetchByEventName(
    eventName: string,
    options?: {
      filter?: Partial<EventRepositoryFilter>;
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    this.logOperation('fetchByEventName', { eventName, options });

    const filter: EventRepositoryFilter = {
      event_name: eventName,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Fetch events by event source
   */
  async fetchByEventSource(
    eventSource: string,
    options?: {
      filter?: Partial<EventRepositoryFilter>;
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    this.logOperation('fetchByEventSource', { eventSource, options });

    const filter: EventRepositoryFilter = {
      event_source: eventSource,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Get event statistics
   */
  async getStatistics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<EventStats, RuntimeDatabaseError>> {
    this.logOperation('getStatistics', options);

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .select('event_name, event_source, event_version, created_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await this.executeEventQuery(() => query);

    if (!result.success) {
      this.logError('getStatistics', result.error, options);
      return result;
    }

    const events = result.data as any[];
    const by_name: Record<string, number> = {};
    const by_source: Record<string, number> = {};
    const by_version: Record<string, number> = {};

    for (const event of events) {
      by_name[event.event_name] = (by_name[event.event_name] || 0) + 1;
      by_source[event.event_source] = (by_source[event.event_source] || 0) + 1;
      by_version[event.event_version] = (by_version[event.event_version] || 0) + 1;
    }

    const stats: EventStats = {
      total: events.length,
      by_name: by_name as Readonly<Record<string, number>>,
      by_source: by_source as Readonly<Record<string, number>>,
      by_version: by_version as Readonly<Record<string, number>>,
    };

    return { success: true, data: stats };
  }

  /**
   * Get event correlation chain
   */
  async getCorrelationChain(
    correlationId: string
  ): Promise<Result<EventCorrelation, RuntimeDatabaseError>> {
    this.logOperation('getCorrelationChain', { correlationId });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .select()
      .eq('tenant_id', this.tenantId)
      .eq('correlation_id', correlationId)
      .order('created_at', { ascending: true });

    const result = await this.executeEventQuery(() => query);

    if (!result.success) {
      this.logError('getCorrelationChain', result.error, { correlationId });
      return result;
    }

    const events = result.data as Event[];
    
    if (events.length === 0) {
      return {
        success: false,
        error: new RuntimeDatabaseError(
          RuntimeDbErrorCode.NOT_FOUND,
          `No events found for correlation ID: ${correlationId}`
        ),
      };
    }

    const correlation: EventCorrelation = {
      correlation_id: correlationId,
      events,
      root_event: events[0],
      leaf_events: events.filter(e => !e.causation_id),
    };

    return { success: true, data: correlation };
  }

  /**
   * Execute query with proper typing
   */
  private async executeEventQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeQuery } = require('../db');
    return executeQuery(queryFn, this.getQueryConfig());
  }
}
