/**
 * CLAUX Runtime Telemetry Layer - Runtime Spans
 */

import type { Span, SpanId, TraceId } from './types';
import { SpanError } from './errors';

/**
 * Runtime Span Manager
 */
export class RuntimeSpanManager {
  private spans: Map<SpanId, Span> = new Map();
  private activeSpans: Map<SpanId, Span> = new Map();

  /**
   * Start span
   */
  startSpan(traceId: TraceId, name: string, parentSpanId?: SpanId): Span {
    const spanId = this.generateSpanId();
    const span: Span = {
      spanId,
      traceId,
      parentSpanId,
      name,
      startTime: Date.now(),
      endTime: 0,
      attributes: {},
      status: 'ok',
    };

    this.activeSpans.set(spanId, span);
    return span;
  }

  /**
   * End span
   */
  endSpan(spanId: SpanId, status: 'ok' | 'error' = 'ok'): Span | undefined {
    const span = this.activeSpans.get(spanId);
    if (!span) return undefined;

    const completedSpan: Span = {
      ...span,
      endTime: Date.now(),
      status,
    };

    this.activeSpans.delete(spanId);
    this.spans.set(spanId, completedSpan);
    return completedSpan;
  }

  /**
   * Get span
   */
  getSpan(spanId: SpanId): Span | undefined {
    return this.spans.get(spanId) || this.activeSpans.get(spanId);
  }

  /**
   * Get trace spans
   */
  getTraceSpans(traceId: TraceId): readonly Span[] {
    return Array.from(this.spans.values()).filter(s => s.traceId === traceId);
  }

  /**
   * Clear
   */
  clear(): void {
    this.spans.clear();
    this.activeSpans.clear();
  }

  /**
   * Generate span ID
   */
  private generateSpanId(): SpanId {
    return `span_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
