/**
 * CLAUX Runtime Temporal Layer - Execution Lineage
 * 
 * Execution lineage tracking and ancestry.
 * No external dependencies - pure lineage semantics.
 */

import type { LineageId, ExecutionId, ReplayId, RecoveryId, ExecutionLineage } from '../types';
import { LineageError } from '../errors';
import { DEFAULT_LINEAGE_MAX_DEPTH } from '../constants';

/**
 * Execution Lineage Manager
 * 
 * Execution lineage tracking and ancestry.
 */
export class ExecutionLineageManager {
  private lineages: Map<LineageId, ExecutionLineage> = new Map();
  private executionIndex: Map<ExecutionId, LineageId> = new Map();

  /**
   * Create execution lineage
   */
  createLineage(
    lineageId: LineageId,
    executionId: ExecutionId,
    parentExecutionId: ExecutionId | null,
    replayId: ReplayId | null,
    recoveryId: RecoveryId | null
  ): ExecutionLineage {
    const depth = parentExecutionId ? (this.getLineageDepth(parentExecutionId) + 1) : 1;

    if (depth > DEFAULT_LINEAGE_MAX_DEPTH) {
      throw new LineageError(`Lineage depth exceeds maximum ${DEFAULT_LINEAGE_MAX_DEPTH}`, lineageId);
    }

    const lineage: ExecutionLineage = {
      lineageId,
      executionId,
      parentExecutionId,
      replayId,
      recoveryId,
      children: [],
      depth,
    };

    this.lineages.set(lineageId, lineage);
    this.executionIndex.set(executionId, lineageId);

    // Add to parent's children
    if (parentExecutionId) {
      const parentLineageId = this.executionIndex.get(parentExecutionId);
      if (parentLineageId) {
        const parentLineage = this.lineages.get(parentLineageId);
        if (parentLineage) {
          parentLineage.children = [...parentLineage.children, executionId];
        }
      }
    }

    return lineage;
  }

  /**
   * Get lineage by ID
   */
  getLineage(lineageId: LineageId): ExecutionLineage | undefined {
    return this.lineages.get(lineageId);
  }

  /**
   * Get lineage for execution
   */
  getLineageForExecution(executionId: ExecutionId): ExecutionLineage | undefined {
    const lineageId = this.executionIndex.get(executionId);
    return lineageId ? this.lineages.get(lineageId) : undefined;
  }

  /**
   * Get lineage chain
   */
  getLineageChain(executionId: ExecutionId): readonly ExecutionId[] {
    const chain: ExecutionId[] = [];
    let currentId = executionId;

    while (currentId) {
      chain.push(currentId);
      const lineage = this.getLineageForExecution(currentId);
      currentId = lineage?.parentExecutionId || '' as ExecutionId;
      if (!currentId || chain.length > DEFAULT_LINEAGE_MAX_DEPTH) break;
    }

    return chain.reverse();
  }

  /**
   * Get lineage depth
   */
  getLineageDepth(executionId: ExecutionId): number {
    return this.getLineageChain(executionId).length;
  }

  /**
   * Get children of execution
   */
  getChildren(executionId: ExecutionId): readonly ExecutionId[] {
    const lineage = this.getLineageForExecution(executionId);
    return lineage?.children || [];
  }

  /**
   * Get all descendants
   */
  getDescendants(executionId: ExecutionId): readonly ExecutionId[] {
    const descendants: ExecutionId[] = [];
    const children = this.getChildren(executionId);

    for (const child of children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child));
    }

    return descendants;
  }

  /**
   * Get ancestors
   */
  getAncestors(executionId: ExecutionId): readonly ExecutionId[] {
    const chain = this.getLineageChain(executionId);
    return chain.slice(0, -1);
  }

  /**
   * Validate lineage integrity
   */
  validateLineageIntegrity(executionId: ExecutionId): boolean {
    const chain = this.getLineageChain(executionId);

    for (let i = 0; i < chain.length - 1; i++) {
      const current = chain[i];
      const parent = chain[i + 1];
      const lineage = this.getLineageForExecution(current);

      if (!lineage || lineage.parentExecutionId !== parent) {
        return false;
      }
    }

    return true;
  }

  /**
   * Clear lineage
   */
  clearLineage(lineageId: LineageId): void {
    const lineage = this.lineages.get(lineageId);
    if (!lineage) return;

    this.executionIndex.delete(lineage.executionId);
    this.lineages.delete(lineageId);
  }

  /**
   * Clear all lineages
   */
  clear(): void {
    this.lineages.clear();
    this.executionIndex.clear();
  }
}
