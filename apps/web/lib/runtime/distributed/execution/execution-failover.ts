/**
 * CLAUX Runtime Distributed Layer - Execution Failover
 * 
 * Manages execution failover and recovery.
 * No external dependencies - pure failover semantics.
 */

import type { WorkerId, ExecutionId, PartitionId, FailoverInfo, FailoverMetadata, FailoverTrigger } from '../types';
import { FailoverTrigger as FailoverTriggerEnum } from '../types';
import { DEFAULT_FAILOVER_TIMEOUT_MS } from '../constants';
import { FailoverError } from '../errors';

/**
 * Execution Failover Manager
 * 
 * Manages execution failover and recovery.
 */
export class ExecutionFailoverManager {
  private failoverQueue: Map<ExecutionId, FailoverRequest> = new Map();
  private activeFailovers: Map<ExecutionId, FailoverState> = new Map();
  private failoverHistory: FailoverRecord[] = [];
  private config: { timeoutMs: number };

  constructor(config: { timeoutMs?: number } = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || DEFAULT_FAILOVER_TIMEOUT_MS,
    };
  }

  /**
   * Request failover for execution
   */
  async requestFailover(
    executionId: ExecutionId,
    sourceWorker: WorkerId,
    trigger: FailoverTrigger,
    reason: string
  ): Promise<void> {
    const request: FailoverRequest = {
      executionId,
      sourceWorker,
      trigger,
      reason,
      requestedAt: new Date(),
    };

    this.failoverQueue.set(executionId, request);
  }

  /**
   * Start failover
   */
  async startFailover(executionId: ExecutionId, targetWorker: WorkerId): Promise<void> {
    const request = this.failoverQueue.get(executionId);
    if (!request) {
      throw new FailoverError(
        `No failover request for ${executionId}`,
        'unknown',
        targetWorker
      );
    }

    const state: FailoverState = {
      executionId,
      sourceWorker: request.sourceWorker,
      targetWorker,
      trigger: request.trigger,
      startedAt: new Date(),
      status: 'in_progress',
      checkpointPreserved: false,
      replayPreserved: false,
    };

    this.activeFailovers.set(executionId, state);
    this.failoverQueue.delete(executionId);
  }

  /**
   * Update failover progress
   */
  updateFailoverProgress(executionId: ExecutionId, progress: Partial<FailoverState>): void {
    const state = this.activeFailovers.get(executionId);
    if (!state) return;

    Object.assign(state, progress);
  }

  /**
   * Complete failover
   */
  completeFailover(executionId: ExecutionId, partitionId?: PartitionId): void {
    const state = this.activeFailovers.get(executionId);
    if (!state) {
      throw new FailoverError(
        `No active failover for ${executionId}`,
        'unknown',
        'unknown'
      );
    }

    state.status = 'completed';
    state.completedAt = new Date();
    state.partitionId = partitionId;

    // Add to history
    this.failoverHistory.push({
      executionId,
      sourceWorker: state.sourceWorker,
      targetWorker: state.targetWorker,
      trigger: state.trigger,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      status: state.status,
      checkpointPreserved: state.checkpointPreserved,
      replayPreserved: state.replayPreserved,
      partitionId,
    });

    this.activeFailovers.delete(executionId);
  }

  /**
   * Fail failover
   */
  failFailover(executionId: ExecutionId, error: string): void {
    const state = this.activeFailovers.get(executionId);
    if (!state) return;

    state.status = 'failed';
    state.completedAt = new Date();
    state.error = error;

    // Add to history
    this.failoverHistory.push({
      executionId,
      sourceWorker: state.sourceWorker,
      targetWorker: state.targetWorker,
      trigger: state.trigger,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      status: state.status,
      error,
    });

    this.activeFailovers.delete(executionId);
  }

  /**
   * Get failover request
   */
  getFailoverRequest(executionId: ExecutionId): FailoverRequest | undefined {
    const request = this.failoverQueue.get(executionId);
    return request ? { ...request } : undefined;
  }

  /**
   * Get failover state
   */
  getFailoverState(executionId: ExecutionId): FailoverState | undefined {
    const state = this.activeFailovers.get(executionId);
    return state ? { ...state } : undefined;
  }

  /**
   * Check if failover is in progress
   */
  isFailoverInProgress(executionId: ExecutionId): boolean {
    return this.activeFailovers.has(executionId);
  }

  /**
   * Check if failover is queued
   */
  isFailoverQueued(executionId: ExecutionId): boolean {
    return this.failoverQueue.has(executionId);
  }

  /**
   * Get all queued failovers
   */
  getQueuedFailovers(): readonly ExecutionId[] {
    return Array.from(this.failoverQueue.keys());
  }

  /**
   * Get all active failovers
   */
  getActiveFailovers(): readonly ExecutionId[] {
    return Array.from(this.activeFailovers.keys());
  }

  /**
   * Get failover history
   */
  getFailoverHistory(): readonly FailoverRecord[] {
    return [...this.failoverHistory];
  }

  /**
   * Cancel failover
   */
  cancelFailover(executionId: ExecutionId): void {
    this.failoverQueue.delete(executionId);
    
    const state = this.activeFailovers.get(executionId);
    if (state) {
      state.status = 'cancelled';
      state.completedAt = new Date();
      
      this.failoverHistory.push({
        executionId,
        sourceWorker: state.sourceWorker,
        targetWorker: state.targetWorker,
        trigger: state.trigger,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        status: state.status,
      });
      
      this.activeFailovers.delete(executionId);
    }
  }

  /**
   * Check for timeout
   */
  checkTimeout(executionId: ExecutionId): boolean {
    const state = this.activeFailovers.get(executionId);
    if (!state) return false;

    const elapsed = Date.now() - state.startedAt.getTime();
    return elapsed > this.config.timeoutMs;
  }

  /**
   * Get failover statistics
   */
  getStatistics(): {
    queuedFailovers: number;
    activeFailovers: number;
    completedFailovers: number;
    failedFailovers: number;
    cancelledFailovers: number;
    averageFailoverTime: number;
    failoverByTrigger: Map<FailoverTrigger, number>;
  } {
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let totalTime = 0;
    const triggerCounts = new Map<FailoverTrigger, number>();

    for (const record of this.failoverHistory) {
      switch (record.status) {
        case 'completed':
          completed++;
          if (record.completedAt && record.startedAt) {
            totalTime += record.completedAt.getTime() - record.startedAt.getTime();
          }
          break;
        case 'failed':
          failed++;
          break;
        case 'cancelled':
          cancelled++;
          break;
      }

      const triggerCount = triggerCounts.get(record.trigger) || 0;
      triggerCounts.set(record.trigger, triggerCount + 1);
    }

    const avgTime = completed > 0 ? totalTime / completed : 0;

    return {
      queuedFailovers: this.failoverQueue.size,
      activeFailovers: this.activeFailovers.size,
      completedFailovers: completed,
      failedFailovers: failed,
      cancelledFailovers: cancelled,
      averageFailoverTime: avgTime,
      failoverByTrigger: triggerCounts,
    };
  }

  /**
   * Clear all failovers
   */
  clear(): void {
    this.failoverQueue.clear();
    this.activeFailovers.clear();
    this.failoverHistory = [];
  }
}

/**
 * Failover Request
 */
interface FailoverRequest {
  readonly executionId: ExecutionId;
  readonly sourceWorker: WorkerId;
  readonly trigger: FailoverTrigger;
  readonly reason: string;
  readonly requestedAt: Date;
}

/**
 * Failover State
 */
interface FailoverState {
  readonly executionId: ExecutionId;
  readonly sourceWorker: WorkerId;
  readonly targetWorker: WorkerId;
  readonly trigger: FailoverTrigger;
  readonly startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  checkpointPreserved: boolean;
  replayPreserved: boolean;
  partitionId?: PartitionId;
  error?: string;
}

/**
 * Failover Record
 */
interface FailoverRecord {
  readonly executionId: ExecutionId;
  readonly sourceWorker: WorkerId;
  readonly targetWorker: WorkerId;
  readonly trigger: FailoverTrigger;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly status: string;
  checkpointPreserved?: boolean;
  replayPreserved?: boolean;
  partitionId?: PartitionId;
  error?: string;
}
