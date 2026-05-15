/**
 * Runtime Database Layer Index
 * 
 * Central export point for all runtime database functionality
 */

// Error handling
export {
  RuntimeDbErrorCode,
  RuntimeDatabaseError,
  mapSupabaseError,
  isConstraintViolation,
  isNotFoundError,
  isRetryableError,
} from './errors';

export type { RuntimeDbError } from './errors';

// Authenticated client
export {
  createRuntimeAuthClient,
  createRuntimeClientWithToken,
  getRuntimeAuthClient,
  resetRuntimeClientPool,
} from './client';

export type {
  RuntimeAuthClient,
  RuntimeTableClient,
  RuntimeQueryBuilder,
  RuntimeInsertBuilder,
  RuntimeUpdateBuilder,
  RuntimeDeleteBuilder,
  RuntimeSingleResult,
  RuntimeMaybeSingleResult,
} from './client';

// Admin client
export {
  createRuntimeAdminClient,
  getRuntimeAdminClient,
  resetRuntimeAdminClientPool,
} from './admin';

export type {
  RuntimeAdminClient,
  RuntimeAdminTableClient,
  RuntimeAdminQueryBuilder,
  RuntimeAdminInsertBuilder,
  RuntimeAdminUpdateBuilder,
  RuntimeAdminDeleteBuilder,
  RuntimeRpcResult,
  RuntimeAdminSingleResult,
  RuntimeAdminMaybeSingleResult,
} from './admin';

// Query helpers
export {
  executeQuery,
  executeSingleQuery,
  executeMaybeSingleQuery,
  executeInsertQuery,
  executeUpdateQuery,
  executeDeleteQuery,
  executeBatchQuery,
  applyPagination,
  applySorting,
  applyQueryOptions,
  beginTransactionSQL,
  commitTransactionSQL,
  rollbackTransactionSQL,
  createSavepointSQL,
  releaseSavepointSQL,
  rollbackToSavepointSQL,
} from './queries';

export type { QueryConfig, TransactionOptions } from './queries';
