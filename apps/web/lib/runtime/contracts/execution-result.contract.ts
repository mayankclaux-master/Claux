/**
 * Canonical Execution Result Contract
 * 
 * This contract defines the standardized execution result format for all runtime executions.
 * All runtime operations MUST return results in this format.
 * 
 * CRITICAL: This is the ONLY result format allowed to flow from RuntimeService to consumers.
 */

import type { UUID } from '../types/common.types';
import type { ProviderResponse } from './provider-response.contract';
import type { ProviderError } from './provider-error.contract';

/**
 * Execution result status
 */
export enum ExecutionResultStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  RETRY = 'retry',
  ABORT = 'abort',
}

/**
 * Execution result
 * Canonical result format for all runtime executions
 */
export interface ExecutionResult<T = unknown> {
  readonly status: ExecutionResultStatus;
  readonly data: T | null;
  readonly error: ProviderError | null;
  readonly providerResponse: ProviderResponse<T> | null;
  readonly tenantId: UUID;
  readonly executionId: UUID;
  readonly taskId: UUID;
  readonly retryable: boolean;
  readonly retryAfter?: number;
  readonly metadata: ExecutionResultMetadata;
}

/**
 * Execution result metadata
 */
export interface ExecutionResultMetadata {
  readonly executionTimeMs: number;
  readonly timestamp: string;
  readonly provider: string;
  readonly operation: string;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly cost?: {
    readonly currency: string;
    readonly amount: number;
  };
  readonly tokens?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Create a successful execution result
 */
export function createExecutionResult<T>(
  data: T,
  providerResponse: ProviderResponse<T>,
  tenantId: UUID,
  executionId: UUID,
  taskId: UUID,
  metadata: ExecutionResultMetadata
): ExecutionResult<T> {
  return {
    status: ExecutionResultStatus.SUCCESS,
    data,
    error: null,
    providerResponse,
    tenantId,
    executionId,
    taskId,
    retryable: false,
    metadata,
  };
}

/**
 * Create a failed execution result
 */
export function createExecutionErrorResult(
  error: ProviderError,
  providerResponse: ProviderResponse<null>,
  tenantId: UUID,
  executionId: UUID,
  taskId: UUID,
  metadata: ExecutionResultMetadata
): ExecutionResult<null> {
  return {
    status: error.retryable ? ExecutionResultStatus.RETRY : ExecutionResultStatus.FAILURE,
    data: null,
    error,
    providerResponse,
    tenantId,
    executionId,
    taskId,
    retryable: error.retryable,
    retryAfter: error.retryable ? 1000 : undefined, // Default 1s retry delay
    metadata,
  };
}

/**
 * Create an abort execution result
 */
export function createExecutionAbortResult(
  error: ProviderError,
  tenantId: UUID,
  executionId: UUID,
  taskId: UUID,
  metadata: ExecutionResultMetadata
): ExecutionResult<null> {
  return {
    status: ExecutionResultStatus.ABORT,
    data: null,
    error,
    providerResponse: null,
    tenantId,
    executionId,
    taskId,
    retryable: false,
    metadata,
  };
}
