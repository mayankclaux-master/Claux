/**
 * CLAUX Runtime Execution Engine - Cycle Detector
 * 
 * Detects cycles in DAGs using DFS-based algorithm.
 * No external dependencies - pure graph algorithm.
 */

import type { DAG } from '../types';

/**
 * Cycle Detector
 * 
 * Detects cycles in directed graphs using DFS with coloring.
 */
export class CycleDetector {
  /**
   * Detect cycles in a DAG
   * 
   * Returns an array of cycles found (each cycle is an array of node IDs).
   * Returns empty array if no cycles found.
   */
  detectCycles(dag: DAG): readonly string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const parentMap = new Map<string, string>();

    for (const node of dag.nodes) {
      if (!visited.has(node.taskId)) {
        this.detectCyclesDFS(
          dag,
          node.taskId,
          visited,
          recursionStack,
          parentMap,
          cycles
        );
      }
    }

    return cycles;
  }

  /**
   * DFS-based cycle detection
   */
  private detectCyclesDFS(
    dag: DAG,
    nodeId: string,
    visited: Set<string>,
    recursionStack: Set<string>,
    parentMap: Map<string, string>,
    cycles: string[][]
  ): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    // Find all outgoing edges from this node
    const outgoingEdges = dag.edges.filter(edge => edge.from === nodeId);

    for (const edge of outgoingEdges) {
      const neighborId = edge.to;

      if (!visited.has(neighborId)) {
        parentMap.set(neighborId, nodeId);
        this.detectCyclesDFS(
          dag,
          neighborId,
          visited,
          recursionStack,
          parentMap,
          cycles
        );
      } else if (recursionStack.has(neighborId)) {
        // Cycle detected - reconstruct the cycle path
        const cycle = this.reconstructCycle(parentMap, nodeId, neighborId);
        cycles.push(cycle);
      }
    }

    recursionStack.delete(nodeId);
  }

  /**
   * Reconstruct cycle path from parent map
   */
  private reconstructCycle(
    parentMap: Map<string, string>,
    startNode: string,
    endNode: string
  ): string[] {
    const cycle: string[] = [endNode];
    let current = startNode;

    while (current !== endNode && current !== undefined) {
      cycle.unshift(current);
      const next = parentMap.get(current);
      if (next === undefined) break;
      current = next;
    }

    cycle.unshift(endNode); // Close the cycle
    return cycle;
  }

  /**
   * Check if a DAG has any cycles
   * 
   * Returns true if cycles exist, false otherwise.
   */
  hasCycles(dag: DAG): boolean {
    const cycles = this.detectCycles(dag);
    return cycles.length > 0;
  }

  /**
   * Get the first cycle found in a DAG
   * 
   * Returns the cycle as an array of node IDs, or undefined if no cycle found.
   */
  getFirstCycle(dag: DAG): string[] | undefined {
    const cycles = this.detectCycles(dag);
    return cycles.length > 0 ? cycles[0] : undefined;
  }

  /**
   * Get all cycles in a DAG
   * 
   * Returns an array of cycles (each cycle is an array of node IDs).
   */
  getAllCycles(dag: DAG): readonly string[][] {
    return this.detectCycles(dag);
  }

  /**
   * Validate that a DAG is acyclic
   * 
   * Returns true if the DAG is valid (no cycles), false otherwise.
   */
  validateAcyclic(dag: DAG): boolean {
    return !this.hasCycles(dag);
  }
}
