/**
 * Log Types
 * 
 * Type definitions for agent_logs table
 * Matches database schema exactly
 */

import type { UUID, ISODateTime, JSONPayload } from './common.types';

/**
 * Log level enum
 * Matches CHECK constraint: log_level IN ('debug', 'info', 'warn', 'error', 'fatal')
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Base log interface
 * Represents the full database row
 */
export interface Log {
  readonly id: UUID;
  readonly execution_id: UUID;
  readonly task_id: UUID | null;
  readonly log_level: LogLevel;
  readonly message: string;
  readonly metadata: JSONPayload;
  readonly context: JSONPayload;
  readonly created_at: ISODateTime;
}

/**
 * Log insert interface
 * Fields required for creating a new log entry
 */
export interface LogInsert {
  readonly execution_id: UUID;
  readonly task_id?: UUID | null;
  readonly log_level: LogLevel;
  readonly message: string;
  readonly metadata?: JSONPayload;
  readonly context?: JSONPayload;
}

/**
 * Log update interface
 * Fields that can be updated on an existing log entry
 * Note: Logs are immutable by design, most fields are optional
 */
export interface LogUpdate {
  readonly log_level?: LogLevel;
  readonly message?: string;
  readonly metadata?: JSONPayload;
  readonly context?: JSONPayload;
}

/**
 * Log select interface
 * Fields that can be selected from the database
 */
export interface LogSelect {
  readonly id?: boolean;
  readonly execution_id?: boolean;
  readonly task_id?: boolean;
  readonly log_level?: boolean;
  readonly message?: boolean;
  readonly metadata?: boolean;
  readonly context?: boolean;
  readonly created_at?: boolean;
}

/**
 * Log filter interface
 * Common filter patterns for querying logs
 */
export interface LogFilter {
  readonly execution_id?: UUID;
  readonly task_id?: UUID;
  readonly log_level?: LogLevel;
  readonly created_after?: ISODateTime;
  readonly created_before?: ISODateTime;
}

/**
 * Log statistics interface
 * Aggregated statistics for logs
 */
export interface LogStats {
  readonly total: number;
  readonly by_level: Readonly<Record<LogLevel, number>>;
  readonly error_count: number;
  readonly fatal_count: number;
}

/**
 * Log aggregation interface
 * Aggregated log entries for summary views
 */
export interface LogAggregation {
  readonly execution_id: UUID;
  readonly task_id: UUID | null;
  readonly log_level_counts: Readonly<Record<LogLevel, number>>;
  readonly first_log_at: ISODateTime;
  readonly last_log_at: ISODateTime;
  readonly sample_messages: ReadonlyArray<string>;
}
