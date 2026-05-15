/**
 * CLAUX Runtime Execution Engine - DAG Builder
 * 
 * Builds Directed Acyclic Graphs from task definitions.
 * No external dependencies - pure graph construction.
 */

import type { DAG, DAGNode, DAGEdge } from '../types';
import { DAGEdgeType } from '../types';
import { DAGValidationError, InvalidDependencyError } from '../errors';

/**
 * Task definition for DAG construction
 */
export interface TaskDefinition {
  readonly taskId: string;
  readonly taskType: string;
  readonly dependencies?: readonly string[];
  readonly conditions?: readonly DAGCondition[];
  readonly retryPolicy?: RetryPolicy;
  readonly priority: number;
}

/**
 * DAG Condition for conditional execution
 */
export interface DAGCondition {
  readonly conditionId: string;
  readonly expression: string;
  readonly targetTaskId: string;
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly exponentialBackoff: boolean;
  readonly retryableErrors: readonly string[];
}

/**
 * DAG Builder
 * 
 * Constructs DAGs from task definitions with validation.
 */
export class DAGBuilder {
  private nodes: Map<string, DAGNode> = new Map();
  private edges: DAGEdge[] = [];

  /**
   * Add a task to the DAG
   */
  addTask(definition: TaskDefinition): void {
    const node: DAGNode = {
      taskId: definition.taskId,
      taskType: definition.taskType,
      dependencies: definition.dependencies || [],
      conditions: definition.conditions,
      retryPolicy: definition.retryPolicy,
      priority: definition.priority,
    };

    this.nodes.set(definition.taskId, node);
  }

  /**
   * Add multiple tasks to the DAG
   */
  addTasks(definitions: readonly TaskDefinition[]): void {
    for (const definition of definitions) {
      this.addTask(definition);
    }
  }

  /**
   * Build the DAG
   */
  build(): DAG {
    this.validateNodes();
    this.buildEdges();
    this.validateEdges();

    const rootNodes = this.findRootNodes();
    const leafNodes = this.findLeafNodes();

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      rootNodes,
      leafNodes,
    };
  }

  /**
   * Validate all nodes
   */
  private validateNodes(): void {
    if (this.nodes.size === 0) {
      throw new DAGValidationError('DAG must have at least one node');
    }

    for (const node of this.nodes.values()) {
      this.validateNodeDependencies(node);
    }
  }

  /**
   * Validate node dependencies
   */
  private validateNodeDependencies(node: DAGNode): void {
    for (const depId of node.dependencies) {
      if (!this.nodes.has(depId)) {
        throw new InvalidDependencyError(node.taskId, depId);
      }
    }
  }

  /**
   * Build edges from node dependencies
   */
  private buildEdges(): void {
    this.edges = [];

    for (const node of this.nodes.values()) {
      for (const depId of node.dependencies) {
        this.edges.push({
          from: depId,
          to: node.taskId,
          edgeType: DAGEdgeType.DEPENDENCY,
        });
      }

      // Add conditional edges if conditions exist
      if (node.conditions) {
        for (const condition of node.conditions) {
          this.edges.push({
            from: node.taskId,
            to: condition.targetTaskId,
            edgeType: DAGEdgeType.CONDITIONAL,
          });
        }
      }
    }
  }

  /**
   * Validate edges
   */
  private validateEdges(): void {
    const edgeSet = new Set<string>();

    for (const edge of this.edges) {
      const edgeKey = `${edge.from}->${edge.to}`;
      
      if (edgeSet.has(edgeKey)) {
        throw new DAGValidationError(`Duplicate edge detected: ${edgeKey}`);
      }

      edgeSet.add(edgeKey);
    }
  }

  /**
   * Find root nodes (nodes with no incoming edges)
   */
  private findRootNodes(): readonly string[] {
    const incomingEdges = new Set<string>();

    for (const edge of this.edges) {
      incomingEdges.add(edge.to);
    }

    const roots: string[] = [];
    for (const nodeId of this.nodes.keys()) {
      if (!incomingEdges.has(nodeId)) {
        roots.push(nodeId);
      }
    }

    return roots;
  }

  /**
   * Find leaf nodes (nodes with no outgoing edges)
   */
  private findLeafNodes(): readonly string[] {
    const outgoingEdges = new Set<string>();

    for (const edge of this.edges) {
      outgoingEdges.add(edge.from);
    }

    const leaves: string[] = [];
    for (const nodeId of this.nodes.keys()) {
      if (!outgoingEdges.has(nodeId)) {
        leaves.push(nodeId);
      }
    }

    return leaves;
  }

  /**
   * Clear the builder state
   */
  clear(): void {
    this.nodes.clear();
    this.edges = [];
  }

  /**
   * Get the current number of nodes
   */
  getNodeCount(): number {
    return this.nodes.size;
  }

  /**
   * Get the current number of edges
   */
  getEdgeCount(): number {
    return this.edges.length;
  }
}
