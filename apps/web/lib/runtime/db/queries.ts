/**
 * Runtime Query Helpers
 * 
 * Centralized query execution helpers with strong typing
 * Provides retry-safe wrappers and standardized error handling
 */

import type { Result } from '../types/common.types';
import type { PaginationOptions, SortOptions } from '../types/common.types';
import { RuntimeDatabaseError, mapSupabaseError, isRetryableError, RuntimeDbErrorCode } from './errors';

/**
 * Query configuration options
 */
export interface QueryConfig {
  readonly retryCount?: number;
  readonly retryDelayMs?: number;
  readonly timeoutMs?: number;
  readonly logContext?: Record<string, unknown>;
}

/**
 * Default query configuration
 */
const DEFAULT_QUERY_CONFIG: QueryConfig = {
  retryCount: 3,
  retryDelayMs: 100,
  timeoutMs: 30000,
  logContext: {},
};

/**
 * Execute query with retry logic
 */
export async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T, RuntimeDatabaseError>> {
  const mergedConfig = { ...DEFAULT_QUERY_CONFIG, ...config };
  let lastError: Error | null = null;

  const retryCount = mergedConfig.retryCount ?? 3;
  const retryDelayMs = mergedConfig.retryDelayMs ?? 100;
  const timeoutMs = mergedConfig.timeoutMs ?? 30000;

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const result = await executeWithTimeout(
        queryFn,
        timeoutMs
      );

      if (result.error) {
        lastError = result.error;
        
        // Check if error is retryable
        const mappedError = mapSupabaseError(result.error);
        if (isRetryableError(mappedError) && attempt < mergedConfig.retryCount!) {
          await delay(mergedConfig.retryDelayMs! * (attempt + 1));
          continue;
        }
        
        return { success: false, error: mappedError };
      }

      if (result.data === null) {
        return { success: false, error: new RuntimeDatabaseError(
          RuntimeDbErrorCode.NOT_FOUND,
          'Query returned no data',
          { context: mergedConfig.logContext }
        ) };
      }

      return { success: true, data: result.data };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const mappedError = mapSupabaseError(error);
      
      if (isRetryableError(mappedError) && attempt < retryCount) {
        await delay(retryDelayMs * (attempt + 1));
        continue;
      }
      
      return { success: false, error: mappedError };
    }
  }

  return {
    success: false,
    error: mapSupabaseError(lastError || new Error('Query failed after retries')),
  };
}

/**
 * Execute single record query
 */
export async function executeSingleQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T, RuntimeDatabaseError>> {
  const result = await executeQuery(queryFn, config);
  
  if (!result.success) {
    return result;
  }

  if (result.data === null) {
    return {
      success: false,
      error: new RuntimeDatabaseError(
        RuntimeDbErrorCode.NOT_FOUND,
        'Single record query returned no data',
        { context: config?.logContext }
      ),
    };
  }

  return result;
}

/**
 * Execute maybe single record query (allows null)
 */
export async function executeMaybeSingleQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T | null, RuntimeDatabaseError>> {
  return executeQuery(queryFn, config);
}

/**
 * Execute insert query
 */
export async function executeInsertQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T, RuntimeDatabaseError>> {
  return executeQuery(queryFn, config);
}

/**
 * Execute update query
 */
export async function executeUpdateQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T, RuntimeDatabaseError>> {
  return executeQuery(queryFn, config);
}

/**
 * Execute delete query
 */
export async function executeDeleteQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: QueryConfig
): Promise<Result<T, RuntimeDatabaseError>> {
  return executeQuery(queryFn, config);
}

/**
 * Execute batch query (multiple operations in transaction)
 * Note: This requires the caller to manage transaction boundaries
 */
export async function executeBatchQuery<T>(
  queryFn: () => Promise<Array<{ data: T | null; error: Error | null }>>,
  config?: QueryConfig
): Promise<Result<T[], RuntimeDatabaseError>> {
  try {
    const timeoutMs = config?.timeoutMs ?? DEFAULT_QUERY_CONFIG.timeoutMs ?? 30000;
    const results = await executeWithTimeout(
      queryFn,
      timeoutMs
    );

    const errors = results.filter(r => r.error !== null);
    if (errors.length > 0) {
      return {
        success: false,
        error: mapSupabaseError(errors[0].error),
      };
    }

    const data = results
      .map(r => r.data)
      .filter((d): d is T => d !== null);

    return { success: true, data };
  } catch (error) {
    return { success: false, error: mapSupabaseError(error) };
  }
}

/**
 * Apply pagination to query builder
 */
export function applyPagination<T>(
  query: any,
  pagination?: PaginationOptions
): any {
  if (!pagination) {
    return query;
  }

  let result = query;
  
  if (pagination.limit !== undefined) {
    result = result.limit(pagination.limit);
  }
  
  if (pagination.offset !== undefined && pagination.limit !== undefined) {
    result = result.range(pagination.offset, pagination.offset + pagination.limit - 1);
  }
  
  return result;
}

/**
 * Apply sorting to query builder
 */
export function applySorting<T>(
  query: any,
  sort?: SortOptions
): any {
  if (!sort) {
    return query;
  }

  return query.order(sort.column, {
    ascending: sort.direction === 'asc',
  });
}

/**
 * Apply both pagination and sorting
 */
export function applyQueryOptions<T>(
  query: any,
  options?: { pagination?: PaginationOptions; sort?: SortOptions }
): any {
  let result = query;
  
  if (options?.sort) {
    result = applySorting(result, options.sort);
  }
  
  if (options?.pagination) {
    result = applyPagination(result, options.pagination);
  }
  
  return result;
}

/**
 * Execute query with timeout
 */
function executeWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Query timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

/**
 * Delay helper for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transaction preparation utilities
 * For use with PostgreSQL transactions
 */
export interface TransactionOptions {
  readonly isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readonly readOnly?: boolean;
  readonly deferrable?: boolean;
}

/**
 * Begin transaction SQL
 */
export function beginTransactionSQL(options?: TransactionOptions): string {
  const parts = ['BEGIN'];
  
  if (options?.isolationLevel) {
    parts.push(`ISOLATION LEVEL ${options.isolationLevel}`);
  }
  
  if (options?.readOnly) {
    parts.push('READ ONLY');
  }
  
  if (options?.deferrable) {
    parts.push('DEFERRABLE');
  }
  
  return parts.join(' ') + ';';
}

/**
 * Commit transaction SQL
 */
export const commitTransactionSQL = 'COMMIT;';

/**
 * Rollback transaction SQL
 */
export const rollbackTransactionSQL = 'ROLLBACK;';

/**
 * Savepoint SQL
 */
export function createSavepointSQL(name: string): string {
  return `SAVEPOINT ${name};`;
}

/**
 * Release savepoint SQL
 */
export function releaseSavepointSQL(name: string): string {
  return `RELEASE SAVEPOINT ${name};`;
}

/**
 * Rollback to savepoint SQL
 */
export function rollbackToSavepointSQL(name: string): string {
  return `ROLLBACK TO SAVEPOINT ${name};`;
}
