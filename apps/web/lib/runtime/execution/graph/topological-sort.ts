/**
 * CLAUX Runtime Execution Engine - Topological Sort
 * 
 * Performs topological sorting on DAGs using Kahn's algorithm.
 * No external dependencies - pure graph algorithm.
 */

import type { DAG } from '../types';
import { CycleDetectionError } from '../errors';
import { CycleDetector } from './cycle-detector';

/**
 * Topological Sort Result
 */
export interface TopologicalSortResult {
  readonly sortedNodes: readonly string[];
  readonly valid: boolean;
  readonly cycle?: readonly string[];
}

/**
 * Topological Sort
 * 
 * Performs topological sorting on DAGs using Kahn's algorithm.
 */
export class TopologicalSort {
  private cycleDetector: CycleDetector;

  constructor() {
    this.cycleDetector = new CycleDetector();
  }

  /**
   * Perform topological sort on a DAG
   * 
   * Returns nodes in topological order.
   * Throws error if cycle is detected.
   */
  sort(dag: DAG): TopologicalSortResult {
    // First check for cycles
    if (this.cycleDetector.hasCycles(dag)) {
      const cycle = this.cycleDetector.getFirstCycle(dag);
      return {
        sortedNodes: [],
        valid: false,
        cycle,
      };
    }

    return this.kahnAlgorithm(dag);
  }

  /**
   * Kahn's algorithm for topological sorting
   */
  private kahnAlgorithm(dag: DAG): TopologicalSortResult {
    // Calculate in-degree for each node
    const inDegree = new Map<string, number>();

    for (const node of dag.nodes) {
      inDegree.set(node.taskId, 0);
    }

    for (const edge of dag.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }

    // Initialize queue with nodes having in-degree 0
    const queue: string[] = [];
    for (const node of dag.nodes) {
      if (inDegree.get(node.taskId) === 0) {
        queue.push(node.taskId);
      }
    }

    // Process nodes
    const sortedNodes: string[] = [];
    const processedCount = new Map<string, number>();

    while (queue.length > 0) {
      // Sort queue by priority (higher priority first)
      queue.sort((a, b) => {
        const nodeA = dag.nodes.find(n => n.taskId === a);
        const nodeB = dag.nodes.find(n => n.taskId === b);
        return (nodeB?.priority ?? 0) - (nodeA?.priority ?? 0);
      });

      const nodeId = queue.shift()!;
      sortedNodes.push(nodeId);
      processedCount.set(nodeId, (processedCount.get(nodeId) ?? 0) + 1);

      // Find all outgoing edges from this node
      const outgoingEdges = dag.edges.filter(edge => edge.from === nodeId);

      for (const edge of outgoingEdges) {
        const neighborId = edge.to;
        const newInDegree = (inDegree.get(neighborId) ?? 0) - 1;
        inDegree.set(neighborId, newInDegree);

        if (newInDegree === 0) {
          queue.push(neighborId);
        }
      }
    }

    // Check if topological sort was successful
    if (sortedNodes.length !== dag.nodes.length) {
      // Cycle detected
      const cycle = this.cycleDetector.getFirstCycle(dag);
      return {
        sortedNodes,
        valid: false,
        cycle,
      };
    }

    return {
      sortedNodes,
      valid: true,
    };
  }

  /**
   * Perform topological sort with dependency groups
   * 
   * Returns groups of nodes that can be executed in parallel.
   * Each group contains nodes that have no dependencies on each other.
   */
  sortWithGroups(dag: DAG): readonly string[][] {
    const result = this.sort(dag);

    if (!result.valid) {
      const cycle = result.cycle ?? ['unknown'];
      throw new CycleDetectionError(cycle, 'unknown');
    }

    const sortedNodes = result.sortedNodes;
    const groups: string[][] = [];
    const processedNodes = new Set<string>();

    for (const nodeId of sortedNodes) {
      const node = dag.nodes.find(n => n.taskId === nodeId);
      if (!node) continue;

      // Check if all dependencies are processed
      const dependenciesProcessed = node.dependencies.every(dep =>
        processedNodes.has(dep)
      );

      if (dependenciesProcessed) {
        // Find the current group or create a new one
        let currentGroup: string[] | undefined;

        for (const group of groups) {
          // Check if this node can be added to the current group
          const canAddToGroup = group.every(groupId => {
            const groupNode = dag.nodes.find(n => n.taskId === groupId);
            if (!groupNode) return false;

            // Check if there's a dependency relationship
            const hasDependency =
              node.dependencies.includes(groupId) ||
              groupNode.dependencies.includes(nodeId);

            return !hasDependency;
          });

          if (canAddToGroup) {
            currentGroup = group;
            break;
          }
        }

        if (currentGroup) {
          currentGroup.push(nodeId);
        } else {
          groups.push([nodeId]);
        }

        processedNodes.add(nodeId);
      }
    }

    return groups;
  }

  /**
   * Get execution levels (depth-based grouping)
   * 
   * Returns groups of nodes at each execution depth.
   * Level 0: root nodes
   * Level 1: nodes that depend only on level 0 nodes
   * Level 2: nodes that depend only on level 0-1 nodes
   * etc.
   */
  getExecutionLevels(dag: DAG): readonly string[][] {
    const levels: string[][] = [];
    const nodeLevels = new Map<string, number>();
    const processedNodes = new Set<string>();

    // Initialize all nodes with undefined level
    for (const node of dag.nodes) {
      nodeLevels.set(node.taskId, -1);
    }

    // Calculate levels iteratively
    let changed = true;
    let iterations = 0;
    const maxIterations = dag.nodes.length;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const node of dag.nodes) {
        if (node.dependencies.length === 0) {
          // Root node - level 0
          if (nodeLevels.get(node.taskId) !== 0) {
            nodeLevels.set(node.taskId, 0);
            changed = true;
          }
        } else {
          // Calculate max level of dependencies
          const depLevels = node.dependencies
            .map(dep => nodeLevels.get(dep) ?? -1)
            .filter(level => level >= 0);

          if (depLevels.length === node.dependencies.length) {
            const maxDepLevel = Math.max(...depLevels);
            const newLevel = maxDepLevel + 1;

            if (nodeLevels.get(node.taskId) !== newLevel) {
              nodeLevels.set(node.taskId, newLevel);
              changed = true;
            }
          }
        }
      }
    }

    // Group nodes by level
    const levelGroups = new Map<number, string[]>();

    for (const [nodeId, level] of nodeLevels.entries()) {
      if (level >= 0) {
        if (!levelGroups.has(level)) {
          levelGroups.set(level, []);
        }
        levelGroups.get(level)!.push(nodeId);
      }
    }

    // Convert to sorted array
    const maxLevel = Math.max(...levelGroups.keys());
    for (let i = 0; i <= maxLevel; i++) {
      levels.push(levelGroups.get(i) ?? []);
    }

    return levels;
  }

  /**
   * Validate topological order
   * 
   * Checks if a given order is a valid topological sort of the DAG.
   */
  validateOrder(dag: DAG, order: readonly string[]): boolean {
    if (order.length !== dag.nodes.length) {
      return false;
    }

    const nodePositions = new Map<string, number>();

    for (let i = 0; i < order.length; i++) {
      nodePositions.set(order[i], i);
    }

    // Check that all dependencies come before dependent nodes
    for (const edge of dag.edges) {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);

      if (fromPos === undefined || toPos === undefined) {
        return false;
      }

      if (fromPos >= toPos) {
        return false;
      }
    }

    return true;
  }
}
