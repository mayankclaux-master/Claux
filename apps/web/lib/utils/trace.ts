/**
 * Trace System
 * 
 * Trace ID utility for CLAUX V1.
 * Every execution gets traceId, every API call gets traceId, every connector call gets traceId.
 * Logs become searchable.
 * 
 * CRITICAL: This is the ONLY trace system in CLAUX.
 */

import { randomUUID } from 'crypto';

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return randomUUID();
}

/**
 * Validate trace ID format
 */
export function isValidTraceId(traceId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(traceId);
}

/**
 * Extract trace ID from headers
 */
export function extractTraceIdFromHeaders(headers: Headers): string | null {
  const traceId = headers.get('x-trace-id');
  if (traceId && isValidTraceId(traceId)) {
    return traceId;
  }
  return null;
}

/**
 * Add trace ID to headers
 */
export function addTraceIdToHeaders(headers: Headers, traceId: string): Headers {
  headers.set('x-trace-id', traceId);
  return headers;
}

/**
 * Trace context
 */
export interface TraceContext {
  traceId: string;
  tenantId?: string;
  executionId?: string;
  taskId?: string;
  userId?: string;
}

/**
 * Create trace context
 */
export function createTraceContext(
  traceId: string,
  tenantId?: string,
  executionId?: string,
  taskId?: string,
  userId?: string
): TraceContext {
  return {
    traceId,
    tenantId,
    executionId,
    taskId,
    userId,
  };
}

/**
 * Serialize trace context
 */
export function serializeTraceContext(context: TraceContext): string {
  return JSON.stringify(context);
}

/**
 * Deserialize trace context
 */
export function deserializeTraceContext(serialized: string): TraceContext | null {
  try {
    return JSON.parse(serialized) as TraceContext;
  } catch {
    return null;
  }
}

/**
 * Trace context storage (in-memory per request)
 */
const traceContextStorage = new Map<string, TraceContext>();

/**
 * Store trace context
 */
export function storeTraceContext(traceId: string, context: TraceContext): void {
  traceContextStorage.set(traceId, context);
}

/**
 * Retrieve trace context
 */
export function retrieveTraceContext(traceId: string): TraceContext | null {
  return traceContextStorage.get(traceId) || null;
}

/**
 * Clear trace context
 */
export function clearTraceContext(traceId: string): void {
  traceContextStorage.delete(traceId);
}

/**
 * Clear all trace contexts
 */
export function clearAllTraceContexts(): void {
  traceContextStorage.clear();
}
