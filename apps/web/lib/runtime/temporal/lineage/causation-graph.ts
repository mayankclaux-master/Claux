/**
 * CLAUX Runtime Temporal Layer - Causation Graph
 * 
 * Causation graph construction and traversal.
 * No external dependencies - pure graph semantics.
 */

import type { CausationId, EventId, ExecutionId, TemporalTimestamp, CausationGraphNode, CausationGraph } from '../types';
import { CausalityError } from '../errors';
import { DEFAULT_CAUSALITY_MAX_DEPTH } from '../constants';

/**
 * Causation Graph Manager
 * 
 * Causation graph construction and traversal.
 */
export class CausationGraphManager {
  private graph: CausationGraph = {
    nodes: new Map(),
    edges: [],
  };

  /**
   * Add node to graph
   */
  addNode(node: CausationGraphNode): void {
    this.graph.nodes.set(node.causationId, node);
  }

  /**
   * Add edge to graph
   */
  addEdge(from: CausationId, to: CausationId): void {
    this.graph.edges.push({ from, to });

    // Update node relationships
    const fromNode = this.graph.nodes.get(from);
    const toNode = this.graph.nodes.get(to);

    if (fromNode) {
      fromNode.children = [...fromNode.children, to];
    }

    if (toNode) {
      toNode.parents = [...toNode.parents, from];
    }
  }

  /**
   * Get node
   */
  getNode(causationId: CausationId): CausationGraphNode | undefined {
    return this.graph.nodes.get(causationId);
  }

  /**
   * Get parents of node
   */
  getParents(causationId: CausationId): readonly CausationId[] {
    const node = this.graph.nodes.get(causationId);
    return node?.parents || [];
  }

  /**
   * Get children of node
   */
  getChildren(causationId: CausationId): readonly CausationId[] {
    const node = this.graph.nodes.get(causationId);
    return node?.children || [];
  }

  /**
   * Get ancestors
   */
  getAncestors(causationId: CausationId): readonly CausationId[] {
    const ancestors: CausationId[] = [];
    const visited = new Set<CausationId>();
    const queue = [...this.getParents(causationId)] as CausationId[];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      ancestors.push(current);
      queue.push(...this.getParents(current));
    }

    return ancestors;
  }

  /**
   * Get descendants
   */
  getDescendants(causationId: CausationId): readonly CausationId[] {
    const descendants: CausationId[] = [];
    const visited = new Set<CausationId>();
    const queue = [...this.getChildren(causationId)] as CausationId[];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      descendants.push(current);
      queue.push(...this.getChildren(current));
    }

    return descendants;
  }

  /**
   * Get shortest path
   */
  getShortestPath(from: CausationId, to: CausationId): readonly CausationId[] | undefined {
    if (from === to) return [from];

    const visited = new Set<CausationId>();
    const queue: { causationId: CausationId; path: CausationId[] }[] = [{ causationId: from, path: [from] }];

    while (queue.length > 0) {
      const { causationId, path } = queue.shift()!;

      if (causationId === to) {
        return path;
      }

      if (visited.has(causationId)) continue;

      visited.add(causationId);

      for (const child of this.getChildren(causationId)) {
        if (!visited.has(child)) {
          queue.push({ causationId: child, path: [...path, child] });
        }
      }
    }

    return undefined;
  }

  /**
   * Get graph statistics
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    averageDegree: number;
  } {
    const nodeCount = this.graph.nodes.size;
    const edgeCount = this.graph.edges.length;

    let maxDepth = 0;
    let totalDegree = 0;

    for (const [causationId] of this.graph.nodes) {
      const depth = this.getAncestors(causationId).length;
      if (depth > maxDepth) maxDepth = depth;

      const degree = this.getParents(causationId).length + this.getChildren(causationId).length;
      totalDegree += degree;
    }

    const averageDegree = nodeCount > 0 ? totalDegree / nodeCount : 0;

    return {
      nodeCount,
      edgeCount,
      maxDepth,
      averageDegree,
    };
  }

  /**
   * Clear graph
   */
  clear(): void {
    this.graph = {
      nodes: new Map(),
      edges: [],
    };
  }
}
