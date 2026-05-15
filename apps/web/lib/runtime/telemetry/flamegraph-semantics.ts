/**
 * CLAUX Runtime Telemetry Layer - Flamegraph Semantics
 */

import type { Span } from './types';

/**
 * Flamegraph Node
 */
export interface FlamegraphNode {
  readonly name: string;
  readonly duration: number;
  readonly depth: number;
  readonly children: readonly FlamegraphNode[];
}

/**
 * Flamegraph Semantics Manager
 */
export class FlamegraphSemanticsManager {
  /**
   * Build flamegraph
   */
  buildFlamegraph(spans: readonly Span[]): FlamegraphNode {
    const root = this.buildTree(spans);
    return this.calculateDurations(root);
  }

  /**
   * Build tree
   */
  private buildTree(spans: readonly Span[]): FlamegraphNode {
    if (spans.length === 0) {
      return { name: 'root', duration: 0, depth: 0, children: [] };
    }

    const roots = spans.filter(s => !s.parentSpanId);
    const children = roots.map(r => this.buildNode(r, spans));

    return {
      name: 'root',
      duration: 0,
      depth: 0,
      children,
    };
  }

  /**
   * Build node
   */
  private buildNode(span: Span, allSpans: readonly Span[]): FlamegraphNode {
    const childSpans = allSpans.filter(s => s.parentSpanId === span.spanId);
    const children = childSpans.map(c => this.buildNode(c, allSpans));

    return {
      name: span.name,
      duration: span.endTime - span.startTime,
      depth: this.calculateDepth(span, allSpans),
      children,
    };
  }

  /**
   * Calculate depth
   */
  private calculateDepth(span: Span, allSpans: readonly Span[]): number {
    let depth = 0;
    let current = span;

    while (current.parentSpanId) {
      depth++;
      const parent = allSpans.find(s => s.spanId === current.parentSpanId);
      if (!parent) break;
      current = parent;
    }

    return depth;
  }

  /**
   * Calculate durations
   */
  private calculateDurations(node: FlamegraphNode): FlamegraphNode {
    const childDurations = node.children.reduce((sum, c) => sum + c.duration, 0);
    return {
      ...node,
      duration: Math.max(node.duration, childDurations),
    };
  }
}
