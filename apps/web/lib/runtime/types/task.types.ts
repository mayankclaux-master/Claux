/**
 * Task Types
 * 
 * Type definitions for agent_tasks table
 * Matches database schema exactly
 */

import type { UUID, ISODateTime, JSONPayload } from './common.types';

/**
 * Task status enum
 * Matches CHECK constraint: status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'retrying')
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

/**
 * Base task interface
 * Represents the full database row
 */
export interface Task {
  readonly id: UUID;
  readonly execution_id: UUID;
  readonly task_name: string;
  readonly task_type: string;
  readonly status: TaskStatus;
  readonly started_at: ISODateTime | null;
  readonly completed_at: ISODateTime | null;
  readonly failed_at: ISODateTime | null;
  readonly retry_count: number;
  readonly max_retries: number;
  readonly input_payload: JSONPayload;
  output_payload: JSONPayload | null;
  error_payload: JSONPayload | null;
  readonly step_order: number;
  duration_ms: number | null;
  readonly created_at: ISODateTime;
  readonly updated_at: ISODateTime;
}

/**
 * Task insert interface
 * Fields required for creating a new task
 */
export interface TaskInsert {
  readonly execution_id: UUID;
  readonly task_name: string;
  readonly task_type: string;
  readonly status?: TaskStatus;
  readonly started_at?: ISODateTime | null;
  readonly completed_at?: ISODateTime | null;
  readonly failed_at?: ISODateTime | null;
  readonly retry_count?: number;
  readonly max_retries?: number;
  readonly input_payload?: JSONPayload;
  readonly output_payload?: JSONPayload | null;
  readonly error_payload?: JSONPayload | null;
  readonly step_order: number;
  readonly duration_ms?: number | null;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

/**
 * Task update interface
 * Fields that can be updated on an existing task
 */
export interface TaskUpdate {
  readonly status?: TaskStatus;
  readonly started_at?: ISODateTime | null;
  readonly completed_at?: ISODateTime | null;
  readonly failed_at?: ISODateTime | null;
  readonly retry_count?: number;
  readonly max_retries?: number;
  readonly input_payload?: JSONPayload;
  readonly output_payload?: JSONPayload | null;
  readonly error_payload?: JSONPayload | null;
  readonly step_order?: number;
  readonly duration_ms?: number | null;
}

/**
 * Task select interface
 * Fields that can be selected from the database
 */
export interface TaskSelect {
  readonly id?: boolean;
  readonly execution_id?: boolean;
  readonly task_name?: boolean;
  readonly task_type?: boolean;
  readonly status?: boolean;
  readonly started_at?: boolean;
  readonly completed_at?: boolean;
  readonly failed_at?: boolean;
  readonly retry_count?: boolean;
  readonly max_retries?: boolean;
  readonly input_payload?: boolean;
  readonly output_payload?: boolean;
  readonly error_payload?: boolean;
  readonly step_order?: boolean;
  readonly duration_ms?: boolean;
  readonly created_at?: boolean;
  readonly updated_at?: boolean;
}

/**
 * Task filter interface
 * Common filter patterns for querying tasks
 */
export interface TaskFilter {
  readonly execution_id?: UUID;
  readonly task_name?: string;
  readonly task_type?: string;
  readonly status?: TaskStatus;
  readonly step_order?: number;
  readonly created_after?: ISODateTime;
  readonly created_before?: ISODateTime;
}

/**
 * Task statistics interface
 * Aggregated statistics for tasks within an execution
 */
export interface TaskStats {
  readonly total: number;
  readonly by_status: Readonly<Record<TaskStatus, number>>;
  readonly by_type: Readonly<Record<string, number>>;
  readonly total_duration_ms: number;
  readonly avg_duration_ms: number;
  readonly success_rate: number;
}
