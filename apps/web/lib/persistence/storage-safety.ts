/**
 * Storage Safety
 * 
 * Storage safety utilities for CLAUX V1.
 * Integrates timeout protection, retry wrapper, payload validation, and malformed payload rejection.
 * 
 * CRITICAL: This is the ONLY storage safety utility in CLAUX.
 */

import { withTimeout, DEFAULT_TIMEOUTS } from '../utils/timeout';
import { withRetry, shouldRetryNetworkError, shouldRetry5xxError } from '../utils/retry';
import { validateOrThrow, uuidSchema } from '../validation/zod-validator';
import { createLogger } from '../utils/logger';

/**
 * Storage safety options
 */
export interface StorageSafetyOptions {
  enableTimeout?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Default storage safety options
 */
const DEFAULT_STORAGE_SAFETY_OPTIONS: Required<StorageSafetyOptions> = {
  enableTimeout: true,
  enableRetry: true,
  maxRetries: 3,
  timeoutMs: DEFAULT_TIMEOUTS.DATABASE,
};

/**
 * Validate tenant ID
 */
export function validateTenantId(tenantId: unknown): string {
  return validateOrThrow(uuidSchema, tenantId);
}

/**
 * Validate trace ID
 */
export function validateTraceId(traceId: unknown): string {
  return validateOrThrow(uuidSchema, traceId);
}

/**
 * Validate execution ID
 */
export function validateExecutionId(executionId: unknown): string {
  return validateOrThrow(uuidSchema, executionId);
}

/**
 * Validate payload structure
 */
export function validatePayloadStructure(payload: unknown, requiredFields: string[]): void {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Payload must be an object');
  }

  const payloadObj = payload as Record<string, unknown>;

  for (const field of requiredFields) {
    if (!(field in payloadObj)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Validate artifact size
 */
export function validateArtifactSize(artifactData: Record<string, unknown>, maxSizeBytes: number): void {
  const size = JSON.stringify(artifactData).length;
  
  if (size > maxSizeBytes) {
    throw new Error(`Artifact size exceeds limit: ${size} bytes (max: ${maxSizeBytes} bytes)`);
  }
}

/**
 * Wrap storage operation with safety
 */
export async function withStorageSafety<T>(
  operation: () => Promise<T>,
  options: StorageSafetyOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_STORAGE_SAFETY_OPTIONS, ...options };
  const logger = createLogger();

  let operationWithTimeout = operation;

  // Add timeout protection
  if (opts.enableTimeout) {
    operationWithTimeout = () => withTimeout(operation, { timeoutMs: opts.timeoutMs });
  }

  // Add retry protection
  if (opts.enableRetry) {
    operationWithTimeout = () => withRetry(operationWithTimeout, {
      maxRetries: opts.maxRetries,
      shouldRetry: (error: unknown) => {
        return shouldRetryNetworkError(error) || shouldRetry5xxError(error);
      },
    });
  }

  try {
    return await operationWithTimeout();
  } catch (error) {
    logger.error('Storage operation failed', { error });
    throw error;
  }
}

/**
 * Batch insert with safety
 */
export async function batchInsertWithSafety<T>(
  items: T[],
  insertFn: (item: T) => Promise<void>,
  options: StorageSafetyOptions = {}
): Promise<void> {
  const logger = createLogger();
  const BATCH_SIZE = 100;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    
    logger.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(items.length / BATCH_SIZE)}`, {
      batchSize: batch.length,
    });

    for (const item of batch) {
      await withStorageSafety(() => insertFn(item), options);
    }
  }
}

/**
 * Paginated query with safety
 */
export async function paginatedQueryWithSafety<T>(
  queryFn: (offset: number, limit: number) => Promise<T[]>,
  options: {
    pageSize?: number;
    maxPages?: number;
    storageSafetyOptions?: StorageSafetyOptions;
  } = {}
): Promise<T[]> {
  const logger = createLogger();
  const { pageSize = 100, maxPages = 100, storageSafetyOptions = {} } = options;
  
  const allResults: T[] = [];
  let offset = 0;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const results = await withStorageSafety(() => queryFn(offset, pageSize), storageSafetyOptions);
    
    if (results.length === 0) {
      break;
    }

    allResults.push(...results);
    offset += pageSize;
    pageCount++;

    logger.info(`Fetched page ${pageCount}`, { totalResults: allResults.length });
  }

  return allResults;
}

/**
 * Validate and sanitize payload
 */
export function validateAndSanitizePayload<T extends Record<string, unknown>>(
  payload: unknown,
  schema: Record<string, (value: unknown) => boolean>
): T {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Payload must be an object');
  }

  const payloadObj = payload as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, validator] of Object.entries(schema)) {
    if (key in payloadObj) {
      if (!validator(payloadObj[key])) {
        throw new Error(`Invalid value for field: ${key}`);
      }
      sanitized[key] = payloadObj[key];
    }
  }

  return sanitized as T;
}

/**
 * Storage safety validators
 */
export const StorageValidators = {
  isString: (value: unknown): value is string => typeof value === 'string',
  isNumber: (value: unknown): value is number => typeof value === 'number',
  isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',
  isObject: (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null,
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
  isOptionalString: (value: unknown): value is string | undefined => typeof value === 'string' || value === undefined,
  isOptionalNumber: (value: unknown): value is number | undefined => typeof value === 'number' || value === undefined,
  isUrl: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  isDate: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return !isNaN(Date.parse(value));
  },
  isJson: (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
};
