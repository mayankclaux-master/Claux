/**
 * CLAUX Runtime Execution Engine - Dependency Resolver
 * 
 * Resolves task dependencies and determines execution order.
 * No external dependencies - pure dependency resolution logic.
 */

import type { DAG, DAGNode, TaskId } from '../types';
import { MissingDependencyError } from '../errors';

/**
 * Dependency Resolution Result
 */
export interface DependencyResolutionResult {
  readonly taskId: TaskId;
  readonly dependenciesResolved: boolean;
  readonly missingDependencies: readonly TaskId[];
  readonly blockedBy: readonly TaskId[];
}

/**
 * Dependency Resolver
 * 
 * Resolves task dependencies and determines which tasks can execute.
 */
export class DependencyResolver {
  /**
   * Check if a task's dependencies are all satisfied
   */
  areDependenciesSatisfied(
    dag: DAG,
    taskId: TaskId,
    completedTasks: Set<TaskId>
  ): boolean {
    const node = dag.nodes.find(n => n.taskId === taskId);

    if (!node) {
      throw new Error(`Task ${taskId} not found in DAG`);
    }

    return node.dependencies.every(dep => completedTasks.has(dep));
  }

  /**
   * Get missing dependencies for a task
   */
  getMissingDependencies(
    dag: DAG,
    taskId: TaskId,
    completedTasks: Set<TaskId>
  ): readonly TaskId[] {
    const node = dag.nodes.find(n => n.taskId === taskId);

    if (!node) {
      throw new Error(`Task ${taskId} not found in DAG`);
    }

    return node.dependencies.filter(dep => !completedTasks.has(dep));
  }

  /**
   * Get tasks that are blocking a given task
   */
  getBlockingTasks(
    dag: DAG,
    taskId: TaskId,
    completedTasks: Set<TaskId>
  ): readonly TaskId[] {
    return this.getMissingDependencies(dag, taskId, completedTasks);
  }

  /**
   * Get tasks that depend on a given task
   */
  getDependentTasks(dag: DAG, taskId: TaskId): readonly TaskId[] {
    return dag.edges
      .filter(edge => edge.from === taskId)
      .map(edge => edge.to);
  }

  /**
   * Resolve dependencies for a task
   */
  resolveDependencies(
    dag: DAG,
    taskId: TaskId,
    completedTasks: Set<TaskId>
  ): DependencyResolutionResult {
    const missingDependencies = this.getMissingDependencies(dag, taskId, completedTasks);

    return {
      taskId,
      dependenciesResolved: missingDependencies.length === 0,
      missingDependencies,
      blockedBy: missingDependencies,
    };
  }

  /**
   * Get all tasks that can be executed (dependencies satisfied)
   */
  getRunnableTasks(
    dag: DAG,
    completedTasks: Set<TaskId>,
    inProgressTasks: Set<TaskId>,
    failedTasks: Set<TaskId>,
    cancelledTasks: Set<TaskId>
  ): readonly TaskId[] {
    const runnableTasks: TaskId[] = [];

    for (const node of dag.nodes) {
      // Skip tasks that are already completed, failed, cancelled, or in progress
      if (
        completedTasks.has(node.taskId) ||
        inProgressTasks.has(node.taskId) ||
        failedTasks.has(node.taskId) ||
        cancelledTasks.has(node.taskId)
      ) {
        continue;
      }

      // Check if dependencies are satisfied
      if (this.areDependenciesSatisfied(dag, node.taskId, completedTasks)) {
        runnableTasks.push(node.taskId);
      }
    }

    return runnableTasks;
  }

  /**
   * Get the critical path (longest path through the DAG)
   */
  getCriticalPath(dag: DAG, taskDurations: Map<TaskId, number>): readonly TaskId[] {
    const topologicalOrder = this.getTopologicalOrder(dag);
    const longestPath = new Map<TaskId, number>();
    const predecessor = new Map<TaskId, TaskId>();

    // Initialize
    for (const node of dag.nodes) {
      longestPath.set(node.taskId, taskDurations.get(node.taskId) ?? 0);
    }

    // Process in topological order
    for (const nodeId of topologicalOrder) {
      const nodeDuration = taskDurations.get(nodeId) ?? 0;

      // Find incoming edges
      const incomingEdges = dag.edges.filter(edge => edge.to === nodeId);

      for (const edge of incomingEdges) {
        const fromPath = longestPath.get(edge.from) ?? 0;
        const toPath = longestPath.get(nodeId) ?? 0;

        if (fromPath + nodeDuration > toPath) {
          longestPath.set(nodeId, fromPath + nodeDuration);
          predecessor.set(nodeId, edge.from);
        }
      }
    }

    // Reconstruct critical path
    const maxPathNode = dag.nodes.reduce((max, node) => {
      const maxPath = longestPath.get(max.taskId) ?? 0;
      const nodePath = longestPath.get(node.taskId) ?? 0;
      return nodePath > maxPath ? node : max;
    }, dag.nodes[0]!);

    const criticalPath: TaskId[] = [];
    let current = maxPathNode.taskId;

    while (current) {
      criticalPath.unshift(current);
      const next = predecessor.get(current);
      if (next === undefined) break;
      current = next;
    }

    return criticalPath;
  }

  /**
   * Get topological order of tasks
   */
  private getTopologicalOrder(dag: DAG): readonly TaskId[] {
    const inDegree = new Map<TaskId, number>();

    for (const node of dag.nodes) {
      inDegree.set(node.taskId, 0);
    }

    for (const edge of dag.edges) {
      inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }

    const queue: TaskId[] = [];

    for (const node of dag.nodes) {
      if (inDegree.get(node.taskId) === 0) {
        queue.push(node.taskId);
      }
    }

    const order: TaskId[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      order.push(nodeId);

      const outgoingEdges = dag.edges.filter(edge => edge.from === nodeId);

      for (const edge of outgoingEdges) {
        const newInDegree = (inDegree.get(edge.to) ?? 0) - 1;
        inDegree.set(edge.to, newInDegree);

        if (newInDegree === 0) {
          queue.push(edge.to);
        }
      }
    }

    return order;
  }

  /**
   * Validate dependency tree
   */
  validateDependencyTree(dag: DAG): boolean {
    // Check that all dependencies exist
    const nodeIds = new Set(dag.nodes.map(n => n.taskId));

    for (const node of dag.nodes) {
      for (const depId of node.dependencies) {
        if (!nodeIds.has(depId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get dependency depth for a task
   */
  getDependencyDepth(dag: DAG, taskId: TaskId): number {
    const node = dag.nodes.find(n => n.taskId === taskId);

    if (!node || node.dependencies.length === 0) {
      return 0;
    }

    const depths = node.dependencies.map(dep =>
      this.getDependencyDepth(dag, dep)
    );

    return Math.max(...depths) + 1;
  }

  /**
   * Get all ancestors of a task
   */
  getAncestors(dag: DAG, taskId: TaskId): readonly TaskId[] {
    const ancestors = new Set<TaskId>();
    const visited = new Set<TaskId>();

    const collectAncestors = (currentId: TaskId): void => {
      if (visited.has(currentId)) {
        return;
      }

      visited.add(currentId);

      const incomingEdges = dag.edges.filter(edge => edge.to === currentId);

      for (const edge of incomingEdges) {
        ancestors.add(edge.from);
        collectAncestors(edge.from);
      }
    };

    collectAncestors(taskId);

    return Array.from(ancestors);
  }

  /**
   * Get all descendants of a task
   */
  getDescendants(dag: DAG, taskId: TaskId): readonly TaskId[] {
    const descendants = new Set<TaskId>();
    const visited = new Set<TaskId>();

    const collectDescendants = (currentId: TaskId): void => {
      if (visited.has(currentId)) {
        return;
      }

      visited.add(currentId);

      const outgoingEdges = dag.edges.filter(edge => edge.from === currentId);

      for (const edge of outgoingEdges) {
        descendants.add(edge.to);
        collectDescendants(edge.to);
      }
    };

    collectDescendants(taskId);

    return Array.from(descendants);
  }
}
