/**
 * CLAUX Runtime Telemetry Layer - Trace Propagation
 */

import type { TraceId } from './types';

/**
 * Trace Context
 */
export interface TraceContext {
  readonly traceId: TraceId;
  readonly spanId: string;
  readonly baggage: Record<string, string>;
}

/**
 * Trace Propagation Manager
 */
export class TracePropagationManager {
  private activeContexts: Map<string, TraceContext> = new Map();

  /**
   * Create trace context
   */
  createContext(traceId: TraceId, spanId: string, baggage: Record<string, string> = {}): TraceContext {
    const context: TraceContext = {
      traceId,
      spanId,
      baggage,
    };

    this.activeContexts.set(spanId, context);
    return context;
  }

  /**
   * Get context
   */
  getContext(spanId: string): TraceContext | undefined {
    return this.activeContexts.get(spanId);
  }

  /**
   * Extract from headers
   */
  extractFromHeaders(headers: Record<string, string>): TraceContext | undefined {
    const traceId = headers['x-trace-id'];
    const spanId = headers['x-span-id'];

    if (!traceId || !spanId) return undefined;

    return this.createContext(traceId, spanId, headers);
  }

  /**
   * Inject to headers
   */
  injectToHeaders(context: TraceContext): Record<string, string> {
    return {
      'x-trace-id': context.traceId,
      'x-span-id': context.spanId,
      ...context.baggage,
    };
  }

  /**
   * Clear
   */
  clear(): void {
    this.activeContexts.clear();
  }
}
