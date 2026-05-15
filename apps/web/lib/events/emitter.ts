/**
 * Event Emitter
 * Central event emission system for CLAUX
 */

import { AgentRuntimeDatabase } from '../runtime/database';
import { EventConfig } from '../runtime/types';
import { EventEmitterConfig, ClauxEvent } from './types';

export class EventEmitter {
  private db: AgentRuntimeDatabase;
  private defaultConfig: EventEmitterConfig;

  constructor(db: AgentRuntimeDatabase, defaultConfig: EventEmitterConfig) {
    this.db = db;
    this.defaultConfig = defaultConfig;
  }

  /**
   * Emit a strongly-typed event
   */
  async emit<T extends ClauxEvent>(
    event: Omit<T, 'id' | 'created_at' | 'event_version'> & {
      event_version?: string;
    }
  ): Promise<T> {
    const config: EventConfig = {
      tenant_id: event.tenant_id,
      event_name: event.event_name,
      event_source: event.event_source,
      payload: event.payload as any,
      execution_id: (event as any).execution_id,
      correlation_id: undefined,
      causation_id: (event.causation_id || this.defaultConfig.causation_id) ?? undefined,
      event_version: event.event_version || '1.0',
    };

    const dbEvent = await this.db.createEvent(config);

    return {
      ...event,
      id: dbEvent.id,
      created_at: dbEvent.created_at,
      event_version: dbEvent.event_version,
    } as T;
  }

  /**
   * Emit an event with execution context
   */
  async emitWithContext<T extends ClauxEvent>(
    event: Omit<T, 'id' | 'created_at' | 'event_version'> & {
      event_version?: string;
    },
    executionId: string
  ): Promise<T> {
    return this.emit({
      ...event,
      execution_id: executionId as any,
    });
  }

  /**
   * Create a correlation ID for event chains
   */
  static createCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Create a causation ID for event causality tracking
   */
  static createCausationId(parentEventId: string): string {
    return `caus_${parentEventId}_${Date.now()}`;
  }
}
