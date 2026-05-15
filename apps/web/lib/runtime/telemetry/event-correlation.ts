/**
 * CLAUX Runtime Telemetry Layer - Event Correlation
 */

import type { Span, TraceId } from './types';

/**
 * Correlation Graph
 */
interface CorrelationGraph {
  readonly traceId: TraceId;
  readonly spans: readonly Span[];
  readonly relationships: readonly Relationship[];
}

/**
 * Relationship
 */
interface Relationship {
  readonly parent: string;
  readonly child: string;
  readonly type: 'parent-child' | 'causality';
}

/**
 * Event Correlation Manager
 */
export class EventCorrelationManager {
  private graphs: Map<TraceId, CorrelationGraph> = new Map();

  /**
   * Build correlation graph
   */
  buildGraph(spans: readonly Span[]): CorrelationGraph {
    if (spans.length === 0) {
      return { traceId: '', spans: [], relationships: [] };
    }

    const traceId = spans[0].traceId;
    const relationships: Relationship[] = [];

    for (const span of spans) {
      if (span.parentSpanId) {
        relationships.push({
          parent: span.parentSpanId,
          child: span.spanId,
          type: 'parent-child',
        });
      }
    }

    const graph: CorrelationGraph = {
      traceId,
      spans,
      relationships,
    };

    this.graphs.set(traceId, graph);
    return graph;
  }

  /**
   * Get graph
   */
  getGraph(traceId: TraceId): CorrelationGraph | undefined {
    return this.graphs.get(traceId);
  }

  /**
   * Find related spans
   */
  findRelated(spanId: string): readonly Span[] {
    for (const graph of this.graphs.values()) {
      const span = graph.spans.find(s => s.spanId === spanId);
      if (span) {
        return graph.spans;
      }
    }
    return [];
  }

  /**
   * Clear
   */
  clear(): void {
    this.graphs.clear();
  }
}
