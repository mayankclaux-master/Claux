/**
 * Execution Types
 * 
 * Type definitions for agent_executions table
 * Matches database schema exactly
 */

import type { UUID, ISODateTime, JSONPayload } from './common.types';

/**
 * Execution status enum
 * Matches CHECK constraint: status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'retrying')
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

/**
 * Execution source enum
 * Matches CHECK constraint: execution_source IN ('manual', 'scheduled', 'event', 'webhook', 'api')
 */
export enum ExecutionSource {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  API = 'api',
}

/**
 * Base execution interface
 * Represents the full database row
 */
export interface Execution {
  readonly id: UUID;
  readonly tenant_id: UUID;
  readonly agent_name: string;
  readonly workflow_type: string;
  readonly status: ExecutionStatus;
  readonly started_at: ISODateTime | null;
  readonly completed_at: ISODateTime | null;
  readonly failed_at: ISODateTime | null;
  readonly retry_count: number;
  readonly max_retries: number;
  readonly execution_source: ExecutionSource;
  readonly initiated_by: string | null;
  readonly metadata: JSONPayload;
  readonly total_cost: number;
  readonly total_tokens: number;
  readonly inngest_run_id: string | null;
  readonly error_message: string | null;
  readonly created_at: ISODateTime;
  readonly updated_at: ISODateTime;
}

/**
 * Execution insert interface
 * Fields required for creating a new execution
 */
export interface ExecutionInsert {
  readonly tenant_id: UUID;
  readonly agent_name: string;
  readonly workflow_type: string;
  readonly status?: ExecutionStatus;
  readonly started_at?: ISODateTime | null;
  readonly completed_at?: ISODateTime | null;
  readonly failed_at?: ISODateTime | null;
  readonly retry_count?: number;
  readonly max_retries?: number;
  readonly execution_source?: ExecutionSource;
  readonly initiated_by?: string | null;
  readonly metadata?: JSONPayload;
  readonly total_cost?: number;
  readonly total_tokens?: number;
  readonly inngest_run_id?: string | null;
  readonly error_message?: string | null;
}

/**
 * Execution update interface
 * Fields that can be updated on an existing execution
 */
export interface ExecutionUpdate {
  readonly status?: ExecutionStatus;
  readonly started_at?: ISODateTime | null;
  readonly completed_at?: ISODateTime | null;
  readonly failed_at?: ISODateTime | null;
  readonly retry_count?: number;
  readonly max_retries?: number;
  readonly execution_source?: ExecutionSource;
  readonly initiated_by?: string | null;
  readonly metadata?: JSONPayload;
  readonly total_cost?: number;
  readonly total_tokens?: number;
  readonly inngest_run_id?: string | null;
  readonly error_message?: string | null;
}

/**
 * Execution select interface
 * Fields that can be selected from the database
 */
export interface ExecutionSelect {
  readonly id?: boolean;
  readonly tenant_id?: boolean;
  readonly agent_name?: boolean;
  readonly workflow_type?: boolean;
  readonly status?: boolean;
  readonly started_at?: boolean;
  readonly completed_at?: boolean;
  readonly failed_at?: boolean;
  readonly retry_count?: boolean;
  readonly max_retries?: boolean;
  readonly execution_source?: boolean;
  readonly initiated_by?: boolean;
  readonly metadata?: boolean;
  readonly total_cost?: boolean;
  readonly total_tokens?: boolean;
  readonly inngest_run_id?: boolean;
  readonly error_message?: boolean;
  readonly created_at?: boolean;
  readonly updated_at?: boolean;
}

/**
 * Execution filter interface
 * Common filter patterns for querying executions
 */
export interface ExecutionFilter {
  readonly tenant_id?: UUID;
  readonly agent_name?: string;
  readonly status?: ExecutionStatus;
  readonly workflow_type?: string;
  readonly execution_source?: ExecutionSource;
  readonly inngest_run_id?: string;
  readonly started_after?: ISODateTime;
  readonly started_before?: ISODateTime;
  readonly created_after?: ISODateTime;
  readonly created_before?: ISODateTime;
}

/**
 * Execution statistics interface
 * Aggregated statistics for executions
 */
export interface ExecutionStats {
  readonly total: number;
  readonly by_status: Readonly<Record<ExecutionStatus, number>>;
  readonly by_source: Readonly<Record<ExecutionSource, number>>;
  readonly total_cost: number;
  readonly total_tokens: number;
  readonly avg_duration_ms: number;
}
