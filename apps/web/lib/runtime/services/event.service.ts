/**
 * Event Service
 * 
 * Business logic for event publishing and correlation tracking
 * Handles event streams and correlation chains
 */

import type { UUID, ISODateTime, Result } from '../types/common.types';
import type { Event, EventInsert } from '../types/event.types';
import { EventRepository } from '../repositories';
import { RuntimeDatabaseError } from '../db';
import {
  generateCorrelationId,
  generateCausationId,
  logServiceOperation,
  logServiceError,
  wrapRepositoryError,
  ServiceConfig,
  ServiceContext,
} from './types';

/**
 * Event service configuration
 */
export interface EventServiceConfig extends ServiceConfig {}

/**
 * Event service
 * Manages event publishing and correlation tracking
 */
export class EventService {
  private repository: EventRepository;
  private config: EventServiceConfig;

  constructor(config: EventServiceConfig) {
    this.config = config;
    this.repository = new EventRepository(config.tenantId);
  }

  /**
   * Publish a single event
   */
  async publishEvent(
    data: Omit<EventInsert, 'created_at' | 'updated_at'> & {
      correlationId?: string;
      causationId?: string;
    }
  ): Promise<Result<Event, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'EventService',
      operation: 'publishEvent',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { data });

    const insertData: EventInsert = {
      ...data,
      correlation_id: data.correlationId || generateCorrelationId(),
      causation_id: data.causationId || null,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(context, (result as { success: false; error: RuntimeDatabaseError }).error, { data });
      return { success: false, error: wrapRepositoryError((result as { success: false; error: RuntimeDatabaseError }).error, 'EventService', 'publishEvent') };
    }

    logServiceOperation(context, { eventId: result.data.id, correlationId: insertData.correlation_id });
    return result;
  }

  /**
   * Publish multiple events in batch
   */
  async publishEventsBatch(
    data: Array<Omit<EventInsert, 'created_at' | 'updated_at'> & {
      correlationId?: string;
      causationId?: string;
    }>
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'EventService',
      operation: 'publishEventsBatch',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { count: data.length });

    const correlationId = generateCorrelationId();
    let causationId: string | null = null;

    const insertData: EventInsert[] = data.map((d, index) => {
      causationId = causationId ? generateCausationId(causationId) : null;
      return {
        ...d,
        correlation_id: d.correlationId || correlationId,
        causation_id: d.causationId || causationId,
      };
    });

    const result = await this.repository.createBatch(insertData);

    if (!result.success) {
      logServiceError(context, (result as { success: false; error: RuntimeDatabaseError }).error, { count: data.length });
      return { success: false, error: wrapRepositoryError((result as { success: false; error: RuntimeDatabaseError }).error, 'EventService', 'publishEventsBatch') };
    }

    logServiceOperation(context, { eventIds: result.data.map(e => e.id), correlationId });
    return result;
  }

  /**
   * Get events for an execution
   */
  async getExecutionEvents(
    executionId: UUID,
    options?: {
      eventName?: string;
      eventSource?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'EventService',
      operation: 'getExecutionEvents',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { executionId, options });

    const result = await this.repository.fetchEventStream(executionId, {
      event_name: options?.eventName,
      event_source: options?.eventSource,
      pagination: options?.limit || options?.offset ? { limit: options.limit, offset: options.offset } : undefined,
    });

    if (!result.success) {
      logServiceError(context, (result as { success: false; error: RuntimeDatabaseError }).error, { executionId, options });
    }

    return result;
  }

  /**
   * Get correlation chain for events
   */
  async getCorrelationChain(
    correlationId: string
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'EventService',
      operation: 'getCorrelationChain',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { correlationId });

    const result = await this.repository.fetchByCorrelationId(correlationId);

    if (!result.success) {
      logServiceError(context, (result as { success: false; error: RuntimeDatabaseError }).error, { correlationId });
    }

    return result;
  }

  /**
   * Stream events for an execution (chronological)
   */
  async streamExecutionEvents(
    executionId: UUID,
    options?: {
      eventName?: string;
      eventSource?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Event[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'EventService',
      operation: 'streamExecutionEvents',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { executionId, options });

    const result = await this.repository.fetchEventStream(executionId, {
      event_name: options?.eventName,
      event_source: options?.eventSource,
      pagination: options?.limit || options?.offset ? { limit: options.limit, offset: options.offset } : undefined,
    });

    if (!result.success) {
      logServiceError(context, (result as { success: false; error: RuntimeDatabaseError }).error, { executionId, options });
    }

    return result;
  }
}
