/**
 * Runtime Database Error Types
 * 
 * Standardized error handling for runtime database operations
 */

/**
 * Runtime database error codes
 * Maps to Supabase/PostgreSQL error codes
 */
export enum RuntimeDbErrorCode {
  // Constraint violations
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
  CHECK_VIOLATION = '23514',
  
  // Connection/auth errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  AUTH_FAILED = 'AUTH_FAILED',
  PERMISSION_DENIED = '42501',
  
  // Not found
  NOT_FOUND = 'NOT_FOUND',
  
  // Validation
  INVALID_INPUT = 'INVALID_INPUT',
  TYPE_MISMATCH = 'TYPE_MISMATCH',
  
  // Concurrency
  DEADLOCK = '40P01',
  SERIALIZATION_FAILURE = '40001',
  
  // Unknown
  UNKNOWN = 'UNKNOWN',
}

/**
 * Runtime database error interface
 * Extends base DatabaseError with runtime-specific context
 */
export interface RuntimeDbError {
  readonly code: RuntimeDbErrorCode;
  readonly message: string;
  readonly table?: string;
  readonly column?: string;
  readonly constraint?: string;
  readonly details?: string;
  readonly hint?: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Error class for runtime database operations
 */
export class RuntimeDatabaseError extends Error implements RuntimeDbError {
  readonly code: RuntimeDbErrorCode;
  readonly table?: string;
  readonly column?: string;
  readonly constraint?: string;
  readonly details?: string;
  readonly hint?: string;
  readonly context?: Record<string, unknown>;

  constructor(
    code: RuntimeDbErrorCode,
    message: string,
    options?: {
      table?: string;
      column?: string;
      constraint?: string;
      details?: string;
      hint?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'RuntimeDatabaseError';
    this.code = code;
    this.table = options?.table;
    this.column = options?.column;
    this.constraint = options?.constraint;
    this.details = options?.details;
    this.hint = options?.hint;
    this.context = options?.context;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): RuntimeDbError {
    return {
      code: this.code,
      message: this.message,
      table: this.table,
      column: this.column,
      constraint: this.constraint,
      details: this.details,
      hint: this.hint,
      context: this.context,
    };
  }
}

/**
 * Map Supabase error to runtime database error
 */
export function mapSupabaseError(error: unknown): RuntimeDatabaseError {
  if (error instanceof RuntimeDatabaseError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  // Extract error code from Supabase error
  const supabaseError = error as { code?: string; details?: string; hint?: string; message?: string };
  const code = supabaseError.code || RuntimeDbErrorCode.UNKNOWN;
  const details = supabaseError.details;
  const hint = supabaseError.hint;

  // Map common PostgreSQL error codes
  const runtimeCode = mapPostgresCode(code);

  return new RuntimeDatabaseError(runtimeCode, message, {
    details,
    hint,
    context: { originalError: error },
  });
}

/**
 * Map PostgreSQL error code to runtime error code
 */
function mapPostgresCode(code: string): RuntimeDbErrorCode {
  const codeMap: Partial<Record<string, RuntimeDbErrorCode>> = {
    '23505': RuntimeDbErrorCode.UNIQUE_VIOLATION,
    '23503': RuntimeDbErrorCode.FOREIGN_KEY_VIOLATION,
    '23502': RuntimeDbErrorCode.NOT_NULL_VIOLATION,
    '23514': RuntimeDbErrorCode.CHECK_VIOLATION,
    '42501': RuntimeDbErrorCode.PERMISSION_DENIED,
    '40P01': RuntimeDbErrorCode.DEADLOCK,
    '40001': RuntimeDbErrorCode.SERIALIZATION_FAILURE,
  };

  return codeMap[code] || RuntimeDbErrorCode.UNKNOWN;
}

/**
 * Check if error is a constraint violation
 */
export function isConstraintViolation(error: unknown): error is RuntimeDatabaseError {
  return error instanceof RuntimeDatabaseError && (
    error.code === RuntimeDbErrorCode.UNIQUE_VIOLATION ||
    error.code === RuntimeDbErrorCode.FOREIGN_KEY_VIOLATION ||
    error.code === RuntimeDbErrorCode.NOT_NULL_VIOLATION ||
    error.code === RuntimeDbErrorCode.CHECK_VIOLATION
  );
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): error is RuntimeDatabaseError {
  return error instanceof RuntimeDatabaseError && error.code === RuntimeDbErrorCode.NOT_FOUND;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RuntimeDatabaseError) {
    return (
      error.code === RuntimeDbErrorCode.DEADLOCK ||
      error.code === RuntimeDbErrorCode.SERIALIZATION_FAILURE ||
      error.code === RuntimeDbErrorCode.CONNECTION_FAILED
    );
  }
  return false;
}
