/**
 * CLAUX Runtime Temporal Layer - Recovery Lineage
 * 
 * Recovery lineage tracking and ancestry.
 * No external dependencies - pure lineage semantics.
 */

import type { RecoveryId, ExecutionId, RecoveryLineage } from '../types';
import { LineageError } from '../errors';
import { DEFAULT_LINEAGE_MAX_DEPTH } from '../constants';

/**
 * Recovery Lineage Manager
 * 
 * Recovery lineage tracking and ancestry.
 */
export class RecoveryLineageManager {
  private lineages: Map<RecoveryId, RecoveryLineage> = new Map();
  private executionIndex: Map<ExecutionId, RecoveryId[]> = new Map();

  /**
   * Create recovery lineage
   */
  createLineage(
    recoveryId: RecoveryId,
    executionId: ExecutionId,
    recoveryType: string,
    parentRecoveryId: RecoveryId | null
  ): RecoveryLineage {
    const depth = parentRecoveryId ? (this.getLineageDepth(parentRecoveryId) + 1) : 1;

    if (depth > DEFAULT_LINEAGE_MAX_DEPTH) {
      throw new LineageError(`Recovery lineage depth exceeds maximum ${DEFAULT_LINEAGE_MAX_DEPTH}`, recoveryId);
    }

    const lineage: RecoveryLineage = {
      recoveryId,
      executionId,
      recoveryType,
      parentRecoveryId,
      children: [],
      depth,
    };

    this.lineages.set(recoveryId, lineage);
    const executionRecoveries = this.executionIndex.get(executionId) || [];
    this.executionIndex.set(executionId, [...executionRecoveries, recoveryId]);

    // Add to parent's children
    if (parentRecoveryId) {
      const parentLineage = this.lineages.get(parentRecoveryId);
      if (parentLineage) {
        parentLineage.children = [...parentLineage.children, recoveryId];
      }
    }

    return lineage;
  }

  /**
   * Get lineage by ID
   */
  getLineage(recoveryId: RecoveryId): RecoveryLineage | undefined {
    return this.lineages.get(recoveryId);
  }

  /**
   * Get lineages for execution
   */
  getLineagesForExecution(executionId: ExecutionId): readonly RecoveryLineage[] {
    const recoveryIds = this.executionIndex.get(executionId) || [];
    const lineages: RecoveryLineage[] = [];

    for (const recoveryId of recoveryIds) {
      const lineage = this.lineages.get(recoveryId);
      if (lineage) lineages.push(lineage);
    }

    return lineages;
  }

  /**
   * Get lineage chain
   */
  getLineageChain(recoveryId: RecoveryId): readonly RecoveryId[] {
    const chain: RecoveryId[] = [];
    let currentId = recoveryId;

    while (currentId) {
      chain.push(currentId);
      const lineage = this.lineages.get(currentId);
      currentId = lineage?.parentRecoveryId || '' as RecoveryId;
      if (!currentId || chain.length > DEFAULT_LINEAGE_MAX_DEPTH) break;
    }

    return chain.reverse();
  }

  /**
   * Get lineage depth
   */
  getLineageDepth(recoveryId: RecoveryId): number {
    return this.getLineageChain(recoveryId).length;
  }

  /**
   * Get children of recovery
   */
  getChildren(recoveryId: RecoveryId): readonly RecoveryId[] {
    const lineage = this.lineages.get(recoveryId);
    return lineage?.children || [];
  }

  /**
   * Clear lineage
   */
  clearLineage(recoveryId: RecoveryId): void {
    const lineage = this.lineages.get(recoveryId);
    if (!lineage) return;

    const executionRecoveries = this.executionIndex.get(lineage.executionId) || [];
    this.executionIndex.set(lineage.executionId, executionRecoveries.filter(r => r !== recoveryId));
    this.lineages.delete(recoveryId);
  }

  /**
   * Clear all lineages
   */
  clear(): void {
    this.lineages.clear();
    this.executionIndex.clear();
  }
}
