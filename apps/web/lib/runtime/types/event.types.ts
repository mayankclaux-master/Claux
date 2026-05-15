/**
 * Event Types
 * 
 * Type definitions for agent_events table
 * Matches database schema exactly
 */

import type { UUID, ISODateTime, JSONPayload } from './common.types';

/**
 * Base event interface
 * Represents the full database row
 */
export interface Event {
  readonly id: UUID;
  readonly tenant_id: UUID;
  readonly execution_id: UUID | null;
  readonly event_name: string;
  readonly event_source: string;
  readonly payload: JSONPayload;
  readonly event_version: string;
  readonly correlation_id: string | null;
  readonly causation_id: string | null;
  readonly created_at: ISODateTime;
}

/**
 * Event insert interface
 * Fields required for creating a new event
 */
export interface EventInsert {
  readonly tenant_id: UUID;
  readonly execution_id?: UUID | null;
  readonly event_name: string;
  readonly event_source: string;
  readonly payload?: JSONPayload;
  readonly event_version?: string;
  readonly correlation_id?: string | null;
  readonly causation_id?: string | null;
}

/**
 * Event update interface
 * Fields that can be updated on an existing event
 * Note: Events are immutable by design, most fields are optional
 */
export interface EventUpdate {
  readonly event_name?: string;
  readonly event_source?: string;
  readonly payload?: JSONPayload;
  readonly event_version?: string;
  readonly correlation_id?: string | null;
  readonly causation_id?: string | null;
}

/**
 * Event select interface
 * Fields that can be selected from the database
 */
export interface EventSelect {
  readonly id?: boolean;
  readonly tenant_id?: boolean;
  readonly execution_id?: boolean;
  readonly event_name?: boolean;
  readonly event_source?: boolean;
  readonly payload?: boolean;
  readonly event_version?: boolean;
  readonly correlation_id?: boolean;
  readonly causation_id?: boolean;
  readonly created_at?: boolean;
}

/**
 * Event filter interface
 * Common filter patterns for querying events
 */
export interface EventFilter {
  readonly tenant_id?: UUID;
  readonly execution_id?: UUID;
  readonly event_name?: string;
  readonly event_source?: string;
  readonly event_version?: string;
  readonly correlation_id?: string;
  readonly causation_id?: string;
  readonly created_after?: ISODateTime;
  readonly created_before?: ISODateTime;
}

/**
 * Event statistics interface
 * Aggregated statistics for events
 */
export interface EventStats {
  readonly total: number;
  readonly by_name: Readonly<Record<string, number>>;
  readonly by_source: Readonly<Record<string, number>>;
  readonly by_version: Readonly<Record<string, number>>;
}

/**
 * Event correlation interface
 * Represents a chain of causally related events
 */
export interface EventCorrelation {
  readonly correlation_id: string;
  readonly events: ReadonlyArray<Event>;
  readonly root_event: Event;
  readonly leaf_events: ReadonlyArray<Event>;
}
