/**
 * Idempotency Protection
 * 
 * Idempotency utility for CLAUX V1.
 * Prevents duplicate execution creation, duplicate task generation, duplicate webhook processing.
 * 
 * CRITICAL: This is the ONLY idempotency protection in CLAUX.
 */

import { randomUUID } from 'crypto';

/**
 * Idempotency key
 */
export type IdempotencyKey = string;

/**
 * Idempotency result
 */
export interface IdempotencyResult<T> {
  success: boolean;
  data?: T;
  cached?: boolean;
  error?: string;
}

/**
 * In-memory idempotency cache (for single-instance deployment)
 * For production, this should be replaced with Redis or similar
 */
const idempotencyCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Cache TTL in milliseconds (5 minutes)
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(): IdempotencyKey {
  return randomUUID();
}

/**
 * Generate idempotency key from context
 */
export function generateIdempotencyKeyFromContext(
  tenantId: string,
  operation: string,
  context: Record<string, unknown>
): IdempotencyKey {
  const contextString = JSON.stringify(context);
  const combined = `${tenantId}:${operation}:${contextString}`;
  
  // Simple hash (for production, use proper hash function)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return `idemp:${Math.abs(hash)}`;
}

/**
 * Check if idempotency key exists
 */
export function hasIdempotencyKey(key: IdempotencyKey): boolean {
  const entry = idempotencyCache.get(key);
  
  if (!entry) {
    return false;
  }
  
  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    idempotencyCache.delete(key);
    return false;
  }
  
  return true;
}

/**
 * Get cached data for idempotency key
 */
export function getIdempotencyData<T>(key: IdempotencyKey): T | null {
  const entry = idempotencyCache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // Check TTL
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    idempotencyCache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set cached data for idempotency key
 */
export function setIdempotencyData<T>(key: IdempotencyKey, data: T): void {
  idempotencyCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Clear idempotency key
 */
export function clearIdempotencyKey(key: IdempotencyKey): void {
  idempotencyCache.delete(key);
}

/**
 * Clear expired idempotency keys
 */
export function clearExpiredIdempotencyKeys(): void {
  const now = Date.now();
  
  for (const [key, entry] of idempotencyCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * Clear all idempotency keys
 */
export function clearAllIdempotencyKeys(): void {
  idempotencyCache.clear();
}

/**
 * Wrap function with idempotency protection
 */
export async function withIdempotency<T>(
  key: IdempotencyKey,
  fn: () => Promise<T>
): Promise<IdempotencyResult<T>> {
  // Check if key exists
  if (hasIdempotencyKey(key)) {
    const cachedData = getIdempotencyData<T>(key);
    
    if (cachedData !== null) {
      return {
        success: true,
        data: cachedData,
        cached: true,
      };
    }
  }
  
  // Execute function
  try {
    const data = await fn();
    
    // Cache result
    setIdempotencyData(key, data);
    
    return {
      success: true,
      data,
      cached: false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wrap function with idempotency protection (auto-generate key)
 */
export async function withAutoIdempotency<T>(
  tenantId: string,
  operation: string,
  context: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<IdempotencyResult<T>> {
  const key = generateIdempotencyKeyFromContext(tenantId, operation, context);
  return withIdempotency(key, fn);
}

/**
 * Idempotency guard for duplicate execution creation
 */
export async function guardDuplicateExecution(
  tenantId: string,
  agentName: string,
  workflowType: string,
  fn: () => Promise<unknown>
): Promise<IdempotencyResult<unknown>> {
  const key = generateIdempotencyKeyFromContext(tenantId, 'execution', {
    agentName,
    workflowType,
  });
  
  return withIdempotency(key, fn);
}

/**
 * Idempotency guard for duplicate task generation
 */
export async function guardDuplicateTask(
  tenantId: string,
  executionId: string,
  taskName: string,
  fn: () => Promise<unknown>
): Promise<IdempotencyResult<unknown>> {
  const key = generateIdempotencyKeyFromContext(tenantId, 'task', {
    executionId,
    taskName,
  });
  
  return withIdempotency(key, fn);
}

/**
 * Idempotency guard for duplicate webhook processing
 */
export async function guardDuplicateWebhook(
  webhookId: string,
  fn: () => Promise<unknown>
): Promise<IdempotencyResult<unknown>> {
  const key = `webhook:${webhookId}`;
  return withIdempotency(key, fn);
}
