/**
 * CLAUX Runtime Execution Engine - DAG Validator
 * 
 * Validates DAG structure and properties.
 * No external dependencies - pure validation logic.
 */

import type { DAG, DAGNode } from '../types';
import { DAGValidationError, CycleDetectionError, InvalidDependencyError } from '../errors';
import { CycleDetector } from './cycle-detector';

/**
 * DAG Validation Result
 */
export interface DAGValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

/**
 * DAG Validator
 * 
 * Validates DAG structure and properties.
 */
export class DAGValidator {
  private cycleDetector: CycleDetector;

  constructor() {
    this.cycleDetector = new CycleDetector();
  }

  /**
   * Validate a DAG
   */
  validate(dag: DAG): DAGValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      this.validateStructure(dag);
      this.validateNodes(dag);
      this.validateEdges(dag);
      this.validateConnectivity(dag);
      this.validateCycles(dag);
    } catch (error) {
      if (error instanceof DAGValidationError) {
        errors.push(error.message);
      } else if (error instanceof CycleDetectionError) {
        errors.push(error.message);
      } else {
        errors.push(`Unexpected validation error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Add warnings for non-critical issues
    this.checkForWarnings(dag, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate basic structure
   */
  private validateStructure(dag: DAG): void {
    if (!dag.nodes || dag.nodes.length === 0) {
      throw new DAGValidationError('DAG must have at least one node');
    }

    if (!dag.edges) {
      throw new DAGValidationError('DAG must have edges array');
    }

    if (!dag.rootNodes || dag.rootNodes.length === 0) {
      throw new DAGValidationError('DAG must have at least one root node');
    }

    if (!dag.leafNodes || dag.leafNodes.length === 0) {
      throw new DAGValidationError('DAG must have at least one leaf node');
    }
  }

  /**
   * Validate nodes
   */
  private validateNodes(dag: DAG): void {
    const nodeIds = new Set<string>();

    for (const node of dag.nodes) {
      // Check for duplicate node IDs
      if (nodeIds.has(node.taskId)) {
        throw new DAGValidationError(`Duplicate node ID: ${node.taskId}`);
      }
      nodeIds.add(node.taskId);

      // Validate node properties
      this.validateNode(node, nodeIds);
    }

    // Validate root nodes exist in node set
    for (const rootId of dag.rootNodes) {
      if (!nodeIds.has(rootId)) {
        throw new DAGValidationError(`Root node ${rootId} does not exist in nodes`);
      }
    }

    // Validate leaf nodes exist in node set
    for (const leafId of dag.leafNodes) {
      if (!nodeIds.has(leafId)) {
        throw new DAGValidationError(`Leaf node ${leafId} does not exist in nodes`);
      }
    }
  }

  /**
   * Validate individual node
   */
  private validateNode(node: DAGNode, nodeIds: Set<string>): void {
    if (!node.taskId || node.taskId.trim() === '') {
      throw new DAGValidationError('Node must have a non-empty taskId');
    }

    if (!node.taskType || node.taskType.trim() === '') {
      throw new DAGValidationError(`Node ${node.taskId} must have a non-empty taskType`);
    }

    if (!node.dependencies) {
      throw new DAGValidationError(`Node ${node.taskId} must have dependencies array`);
    }

    // Validate dependencies exist
    for (const depId of node.dependencies) {
      if (!nodeIds.has(depId)) {
        throw new InvalidDependencyError(node.taskId, depId);
      }
    }

    // Validate priority
    if (node.priority < 0 || node.priority > 100) {
      throw new DAGValidationError(`Node ${node.taskId} has invalid priority: ${node.priority} (must be 0-100)`);
    }

    // Validate retry policy if present
    if (node.retryPolicy) {
      this.validateRetryPolicy(node.taskId, node.retryPolicy);
    }
  }

  /**
   * Validate retry policy
   */
  private validateRetryPolicy(taskId: string, policy: { readonly maxAttempts: number; readonly backoffMs: number }): void {
    if (policy.maxAttempts < 1) {
      throw new DAGValidationError(`Node ${taskId} retry policy maxAttempts must be >= 1`);
    }

    if (policy.backoffMs < 0) {
      throw new DAGValidationError(`Node ${taskId} retry policy backoffMs must be >= 0`);
    }
  }

  /**
   * Validate edges
   */
  private validateEdges(dag: DAG): void {
    const nodeIds = new Set(dag.nodes.map(n => n.taskId));
    const edgeSet = new Set<string>();

    for (const edge of dag.edges) {
      // Check for duplicate edges
      const edgeKey = `${edge.from}->${edge.to}`;
      if (edgeSet.has(edgeKey)) {
        throw new DAGValidationError(`Duplicate edge detected: ${edgeKey}`);
      }
      edgeSet.add(edgeKey);

      // Validate edge endpoints exist
      if (!nodeIds.has(edge.from)) {
        throw new DAGValidationError(`Edge from non-existent node: ${edge.from}`);
      }

      if (!nodeIds.has(edge.to)) {
        throw new DAGValidationError(`Edge to non-existent node: ${edge.to}`);
      }

      // Validate no self-loops
      if (edge.from === edge.to) {
        throw new DAGValidationError(`Self-loop detected: ${edge.from} -> ${edge.to}`);
      }
    }
  }

  /**
   * Validate connectivity
   */
  private validateConnectivity(dag: DAG): void {
    // All nodes should be reachable from root nodes
    const reachableFromRoot = new Set<string>();

    for (const rootId of dag.rootNodes) {
      this.collectReachableNodes(dag, rootId, reachableFromRoot);
    }

    for (const node of dag.nodes) {
      if (!reachableFromRoot.has(node.taskId)) {
        throw new DAGValidationError(`Node ${node.taskId} is not reachable from any root node`);
      }
    }

    // All nodes should be able to reach leaf nodes
    const canReachLeaf = new Set<string>();

    for (const leafId of dag.leafNodes) {
      this.collectNodesThatCanReach(dag, leafId, canReachLeaf);
    }

    for (const node of dag.nodes) {
      if (!canReachLeaf.has(node.taskId)) {
        throw new DAGValidationError(`Node ${node.taskId} cannot reach any leaf node`);
      }
    }
  }

  /**
   * Collect nodes reachable from a starting node
   */
  private collectReachableNodes(dag: DAG, nodeId: string, visited: Set<string>): void {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);

    for (const edge of dag.edges) {
      if (edge.from === nodeId) {
        this.collectReachableNodes(dag, edge.to, visited);
      }
    }
  }

  /**
   * Collect nodes that can reach a target node
   */
  private collectNodesThatCanReach(dag: DAG, targetId: string, visited: Set<string>): void {
    if (visited.has(targetId)) {
      return;
    }

    visited.add(targetId);

    for (const edge of dag.edges) {
      if (edge.to === targetId) {
        this.collectNodesThatCanReach(dag, edge.from, visited);
      }
    }
  }

  /**
   * Validate no cycles exist
   */
  private validateCycles(dag: DAG): void {
    const cycles = this.cycleDetector.detectCycles(dag);

    if (cycles.length > 0) {
      throw new CycleDetectionError(cycles[0]);
    }
  }

  /**
   * Check for non-critical warnings
   */
  private checkForWarnings(dag: DAG, warnings: string[]): void {
    // Warn about single-node DAGs
    if (dag.nodes.length === 1) {
      warnings.push('DAG has only one node - consider if a DAG is necessary');
    }

    // Warn about deep DAGs
    const maxDepth = this.calculateMaxDepth(dag);
    if (maxDepth > 20) {
      warnings.push(`DAG has depth ${maxDepth} - consider restructuring for better performance`);
    }

    // Warn about wide DAGs
    const maxWidth = this.calculateMaxWidth(dag);
    if (maxWidth > 50) {
      warnings.push(`DAG has width ${maxWidth} - consider restructuring for better performance`);
    }

    // Warn about nodes with no dependencies (should be root nodes)
    const nodesWithoutDeps = dag.nodes.filter(n => n.dependencies.length === 0);
    if (nodesWithoutDeps.length !== dag.rootNodes.length) {
      warnings.push('Nodes without dependencies should be root nodes');
    }
  }

  /**
   * Calculate maximum depth of DAG
   */
  private calculateMaxDepth(dag: DAG): number {
    const depths = new Map<string, number>();

    // Initialize depths
    for (const node of dag.nodes) {
      depths.set(node.taskId, 0);
    }

    // Calculate depths using topological order
    let changed = true;
    let iterations = 0;
    const maxIterations = dag.nodes.length;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const edge of dag.edges) {
        const fromDepth = depths.get(edge.from) ?? 0;
        const toDepth = depths.get(edge.to) ?? 0;

        if (toDepth < fromDepth + 1) {
          depths.set(edge.to, fromDepth + 1);
          changed = true;
        }
      }
    }

    return Math.max(...depths.values());
  }

  /**
   * Calculate maximum width of DAG (max nodes at any depth)
   */
  private calculateMaxWidth(dag: DAG): number {
    const depths = new Map<string, number>();

    // Calculate depths
    let changed = true;
    let iterations = 0;
    const maxIterations = dag.nodes.length;

    for (const node of dag.nodes) {
      depths.set(node.taskId, 0);
    }

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const edge of dag.edges) {
        const fromDepth = depths.get(edge.from) ?? 0;
        const toDepth = depths.get(edge.to) ?? 0;

        if (toDepth < fromDepth + 1) {
          depths.set(edge.to, fromDepth + 1);
          changed = true;
        }
      }
    }

    // Count nodes at each depth
    const depthCounts = new Map<number, number>();

    for (const depth of depths.values()) {
      depthCounts.set(depth, (depthCounts.get(depth) ?? 0) + 1);
    }

    return Math.max(...depthCounts.values());
  }
}
