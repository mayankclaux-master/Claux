/**
 * Common Types
 * 
 * Shared type definitions used across runtime types
 */

/**
 * UUID string type
 * Represents a UUID as a string (PostgreSQL UUID type)
 */
export type UUID = string;

/**
 * ISO datetime string type
 * Represents a datetime in ISO 8601 format (PostgreSQL TIMESTAMPTZ)
 */
export type ISODateTime = string;

/**
 * JSON payload type
 * Represents a JSON object (PostgreSQL JSONB)
 */
export type JSONPayload = Readonly<Record<string, unknown>>;

/**
 * Numeric type for cost
 * Represents a decimal number with 10 digits total, 4 decimal places
 */
export type Cost = number;

/**
 * Token count type
 * Represents an integer count of tokens
 */
export type TokenCount = number;

/**
 * Duration in milliseconds
 */
export type DurationMs = number;

/**
 * Retry count type
 */
export type RetryCount = number;

/**
 * Step order type
 * Represents the order of a task in a workflow
 */
export type StepOrder = number;

/**
 * Pagination options
 */
export interface PaginationOptions {
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  readonly column: string;
  readonly direction: 'asc' | 'desc';
}

/**
 * Query options combining pagination and sort
 */
export interface QueryOptions {
  readonly pagination?: PaginationOptions;
  readonly sort?: SortOptions;
}

/**
 * Database error interface
 */
export interface DatabaseError {
  readonly code: string;
  readonly message: string;
  readonly details?: string;
  readonly hint?: string;
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = DatabaseError> =
  | { success: true; data: T }
  | { success: false; error: E };
