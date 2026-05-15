/**
 * CLAUX Runtime Temporal Layer - Replay Lineage
 * 
 * Replay lineage tracking and ancestry.
 * No external dependencies - pure lineage semantics.
 */

import type { LineageId, ReplayId, ExecutionId, ReplayLineage } from '../types';
import { LineageError } from '../errors';
import { DEFAULT_LINEAGE_MAX_DEPTH } from '../constants';

/**
 * Replay Lineage Manager
 * 
 * Replay lineage tracking and ancestry.
 */
export class ReplayLineageManager {
  private lineages: Map<ReplayId, ReplayLineage> = new Map();
  private originalExecutionIndex: Map<ExecutionId, ReplayId[]> = new Map();
  private replayedExecutionIndex: Map<ExecutionId, ReplayId> = new Map();

  /**
   * Create replay lineage
   */
  createLineage(
    replayId: ReplayId,
    originalExecutionId: ExecutionId,
    replayedExecutionId: ExecutionId,
    parentReplayId: ReplayId | null
  ): ReplayLineage {
    const depth = parentReplayId ? (this.getLineageDepth(parentReplayId) + 1) : 1;

    if (depth > DEFAULT_LINEAGE_MAX_DEPTH) {
      throw new LineageError(`Replay lineage depth exceeds maximum ${DEFAULT_LINEAGE_MAX_DEPTH}`, replayId);
    }

    const lineage: ReplayLineage = {
      replayId,
      originalExecutionId,
      replayedExecutionId,
      parentReplayId,
      children: [],
      depth,
    };

    this.lineages.set(replayId, lineage);
    this.originalExecutionIndex.set(originalExecutionId, [...(this.originalExecutionIndex.get(originalExecutionId) || []), replayId]);
    this.replayedExecutionIndex.set(replayedExecutionId, replayId);

    // Add to parent's children
    if (parentReplayId) {
      const parentLineage = this.lineages.get(parentReplayId);
      if (parentLineage) {
        parentLineage.children = [...parentLineage.children, replayId];
      }
    }

    return lineage;
  }

  /**
   * Get lineage by ID
   */
  getLineage(replayId: ReplayId): ReplayLineage | undefined {
    return this.lineages.get(replayId);
  }

  /**
   * Get lineage for replayed execution
   */
  getLineageForExecution(executionId: ExecutionId): ReplayLineage | undefined {
    const replayId = this.replayedExecutionIndex.get(executionId);
    return replayId ? this.lineages.get(replayId) : undefined;
  }

  /**
   * Get lineages for original execution
   */
  getLineagesForOriginalExecution(executionId: ExecutionId): readonly ReplayLineage[] {
    const replayIds = this.originalExecutionIndex.get(executionId) || [];
    const lineages: ReplayLineage[] = [];

    for (const replayId of replayIds) {
      const lineage = this.lineages.get(replayId);
      if (lineage) lineages.push(lineage);
    }

    return lineages;
  }

  /**
   * Get lineage chain
   */
  getLineageChain(replayId: ReplayId): readonly ReplayId[] {
    const chain: ReplayId[] = [];
    let currentId = replayId;

    while (currentId) {
      chain.push(currentId);
      const lineage = this.lineages.get(currentId);
      currentId = lineage?.parentReplayId || '' as ReplayId;
      if (!currentId || chain.length > DEFAULT_LINEAGE_MAX_DEPTH) break;
    }

    return chain.reverse();
  }

  /**
   * Get lineage depth
   */
  getLineageDepth(replayId: ReplayId): number {
    return this.getLineageChain(replayId).length;
  }

  /**
   * Get children of replay
   */
  getChildren(replayId: ReplayId): readonly ReplayId[] {
    const lineage = this.lineages.get(replayId);
    return lineage?.children || [];
  }

  /**
   * Clear lineage
   */
  clearLineage(replayId: ReplayId): void {
    const lineage = this.lineages.get(replayId);
    if (!lineage) return;

    this.originalExecutionIndex.set(lineage.originalExecutionId, (this.originalExecutionIndex.get(lineage.originalExecutionId) || []).filter(r => r !== replayId));
    this.replayedExecutionIndex.delete(lineage.replayedExecutionId);
    this.lineages.delete(replayId);
  }

  /**
   * Clear all lineages
   */
  clear(): void {
    this.lineages.clear();
    this.originalExecutionIndex.clear();
    this.replayedExecutionIndex.clear();
  }
}
