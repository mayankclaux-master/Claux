/**
 * CLAUX Runtime Temporal Layer - Ancestry Tracker
 * 
 * Ancestry tracking across executions, replays, and recoveries.
 * No external dependencies - pure ancestry semantics.
 */

import type { ExecutionId, ReplayId, RecoveryId, AncestryEntry, TemporalTimestamp } from '../types';

/**
 * Ancestry Tracker
 * 
 * Ancestry tracking across executions, replays, and recoveries.
 */
export class AncestryTracker {
  private executionAncestry: Map<ExecutionId, AncestryEntry[]> = new Map();
  private replayAncestry: Map<ReplayId, AncestryEntry[]> = new Map();
  private recoveryAncestry: Map<RecoveryId, AncestryEntry[]> = new Map();

  /**
   * Track execution ancestry
   */
  trackExecutionAncestry(executionId: ExecutionId, ancestorId: string, ancestorType: 'execution' | 'replay' | 'recovery', timestamp: TemporalTimestamp): void {
    const ancestry = this.executionAncestry.get(executionId) || [];
    const depth = ancestry.length > 0 ? ancestry[ancestry.length - 1].depth + 1 : 1;

    ancestry.push({
      ancestorId,
      ancestorType,
      timestamp,
      depth,
    });

    this.executionAncestry.set(executionId, ancestry);
  }

  /**
   * Track replay ancestry
   */
  trackReplayAncestry(replayId: ReplayId, ancestorId: string, ancestorType: 'execution' | 'replay' | 'recovery', timestamp: TemporalTimestamp): void {
    const ancestry = this.replayAncestry.get(replayId) || [];
    const depth = ancestry.length > 0 ? ancestry[ancestry.length - 1].depth + 1 : 1;

    ancestry.push({
      ancestorId,
      ancestorType,
      timestamp,
      depth,
    });

    this.replayAncestry.set(replayId, ancestry);
  }

  /**
   * Track recovery ancestry
   */
  trackRecoveryAncestry(recoveryId: RecoveryId, ancestorId: string, ancestorType: 'execution' | 'replay' | 'recovery', timestamp: TemporalTimestamp): void {
    const ancestry = this.recoveryAncestry.get(recoveryId) || [];
    const depth = ancestry.length > 0 ? ancestry[ancestry.length - 1].depth + 1 : 1;

    ancestry.push({
      ancestorId,
      ancestorType,
      timestamp,
      depth,
    });

    this.recoveryAncestry.set(recoveryId, ancestry);
  }

  /**
   * Get execution ancestry
   */
  getExecutionAncestry(executionId: ExecutionId): readonly AncestryEntry[] {
    return this.executionAncestry.get(executionId) || [];
  }

  /**
   * Get replay ancestry
   */
  getReplayAncestry(replayId: ReplayId): readonly AncestryEntry[] {
    return this.replayAncestry.get(replayId) || [];
  }

  /**
   * Get recovery ancestry
   */
  getRecoveryAncestry(recoveryId: RecoveryId): readonly AncestryEntry[] {
    return this.recoveryAncestry.get(recoveryId) || [];
  }

  /**
   * Get full ancestry chain
   */
  getFullAncestry(id: string, type: 'execution' | 'replay' | 'recovery'): readonly AncestryEntry[] {
    switch (type) {
      case 'execution':
        return this.executionAncestry.get(id as ExecutionId) || [];
      case 'replay':
        return this.replayAncestry.get(id as ReplayId) || [];
      case 'recovery':
        return this.recoveryAncestry.get(id as RecoveryId) || [];
    }
  }

  /**
   * Get ancestry depth
   */
  getAncestryDepth(id: string, type: 'execution' | 'replay' | 'recovery'): number {
    const ancestry = this.getFullAncestry(id, type);
    return ancestry.length > 0 ? ancestry[ancestry.length - 1].depth : 0;
  }

  /**
   * Clear ancestry
   */
  clearAncestry(id: string, type: 'execution' | 'replay' | 'recovery'): void {
    switch (type) {
      case 'execution':
        this.executionAncestry.delete(id as ExecutionId);
        break;
      case 'replay':
        this.replayAncestry.delete(id as ReplayId);
        break;
      case 'recovery':
        this.recoveryAncestry.delete(id as RecoveryId);
        break;
    }
  }

  /**
   * Clear all ancestry
   */
  clear(): void {
    this.executionAncestry.clear();
    this.replayAncestry.clear();
    this.recoveryAncestry.clear();
  }
}
