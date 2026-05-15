/**
 * CLAUX Runtime Distributed Layer - Execution Reassignment
 * 
 * Manages execution reassignment across workers.
 * No external dependencies - pure reassignment semantics.
 */

import type { WorkerId, ExecutionId, PartitionId } from '../types';
import { ExecutionReassignmentError } from '../errors';

/**
 * Execution Reassignment Manager
 * 
 * Manages execution reassignment across workers.
 */
export class ExecutionReassignmentManager {
  private reassignmentQueue: Map<ExecutionId, ReassignmentRequest> = new Map();
  private activeReassignments: Map<ExecutionId, ReassignmentState> = new Map();
  private reassignmentHistory: ReassignmentRecord[] = [];

  /**
   * Request reassignment
   */
  async requestReassignment(
    executionId: ExecutionId,
    fromWorker: WorkerId,
    toWorker: WorkerId,
    reason: string
  ): Promise<void> {
    const request: ReassignmentRequest = {
      executionId,
      fromWorker,
      toWorker,
      reason,
      requestedAt: new Date(),
    };

    this.reassignmentQueue.set(executionId, request);
  }

  /**
   * Start reassignment
   */
  async startReassignment(executionId: ExecutionId): Promise<void> {
    const request = this.reassignmentQueue.get(executionId);
    if (!request) {
      throw new ExecutionReassignmentError(
        `No reassignment request for ${executionId}`,
        executionId,
        'unknown',
        'unknown'
      );
    }

    const state: ReassignmentState = {
      executionId,
      fromWorker: request.fromWorker,
      toWorker: request.toWorker,
      startedAt: new Date(),
      status: 'in_progress',
      partitionId: undefined,
    };

    this.activeReassignments.set(executionId, state);
    this.reassignmentQueue.delete(executionId);
  }

  /**
   * Complete reassignment
   */
  completeReassignment(executionId: ExecutionId, partitionId?: PartitionId): void {
    const state = this.activeReassignments.get(executionId);
    if (!state) {
      throw new ExecutionReassignmentError(
        `No active reassignment for ${executionId}`,
        executionId,
        'unknown',
        'unknown'
      );
    }

    state.status = 'completed';
    state.completedAt = new Date();
    state.partitionId = partitionId;

    // Add to history
    this.reassignmentHistory.push({
      executionId,
      fromWorker: state.fromWorker,
      toWorker: state.toWorker,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      status: state.status,
      partitionId,
    });

    this.activeReassignments.delete(executionId);
  }

  /**
   * Fail reassignment
   */
  failReassignment(executionId: ExecutionId, error: string): void {
    const state = this.activeReassignments.get(executionId);
    if (!state) return;

    state.status = 'failed';
    state.completedAt = new Date();
    state.error = error;

    // Add to history
    this.reassignmentHistory.push({
      executionId,
      fromWorker: state.fromWorker,
      toWorker: state.toWorker,
      startedAt: state.startedAt,
      completedAt: state.completedAt,
      status: state.status,
      error,
    });

    this.activeReassignments.delete(executionId);
  }

  /**
   * Get reassignment request
   */
  getReassignmentRequest(executionId: ExecutionId): ReassignmentRequest | undefined {
    const request = this.reassignmentQueue.get(executionId);
    return request ? { ...request } : undefined;
  }

  /**
   * Get reassignment state
   */
  getReassignmentState(executionId: ExecutionId): ReassignmentState | undefined {
    const state = this.activeReassignments.get(executionId);
    return state ? { ...state } : undefined;
  }

  /**
   * Check if reassignment is in progress
   */
  isReassignmentInProgress(executionId: ExecutionId): boolean {
    return this.activeReassignments.has(executionId);
  }

  /**
   * Check if reassignment is queued
   */
  isReassignmentQueued(executionId: ExecutionId): boolean {
    return this.reassignmentQueue.has(executionId);
  }

  /**
   * Get all queued reassignments
   */
  getQueuedReassignments(): readonly ExecutionId[] {
    return Array.from(this.reassignmentQueue.keys());
  }

  /**
   * Get all active reassignments
   */
  getActiveReassignments(): readonly ExecutionId[] {
    return Array.from(this.activeReassignments.keys());
  }

  /**
   * Get reassignment history
   */
  getReassignmentHistory(): readonly ReassignmentRecord[] {
    return [...this.reassignmentHistory];
  }

  /**
   * Cancel reassignment
   */
  cancelReassignment(executionId: ExecutionId): void {
    this.reassignmentQueue.delete(executionId);
    
    const state = this.activeReassignments.get(executionId);
    if (state) {
      state.status = 'cancelled';
      state.completedAt = new Date();
      
      this.reassignmentHistory.push({
        executionId,
        fromWorker: state.fromWorker,
        toWorker: state.toWorker,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
        status: state.status,
      });
      
      this.activeReassignments.delete(executionId);
    }
  }

  /**
   * Get reassignment statistics
   */
  getStatistics(): {
    queuedReassignments: number;
    activeReassignments: number;
    completedReassignments: number;
    failedReassignments: number;
    cancelledReassignments: number;
    averageReassignmentTime: number;
  } {
    let completed = 0;
    let failed = 0;
    let cancelled = 0;
    let totalTime = 0;

    for (const record of this.reassignmentHistory) {
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
    }

    const avgTime = completed > 0 ? totalTime / completed : 0;

    return {
      queuedReassignments: this.reassignmentQueue.size,
      activeReassignments: this.activeReassignments.size,
      completedReassignments: completed,
      failedReassignments: failed,
      cancelledReassignments: cancelled,
      averageReassignmentTime: avgTime,
    };
  }

  /**
   * Clear all reassignments
   */
  clear(): void {
    this.reassignmentQueue.clear();
    this.activeReassignments.clear();
    this.reassignmentHistory = [];
  }
}

/**
 * Reassignment Request
 */
interface ReassignmentRequest {
  readonly executionId: ExecutionId;
  readonly fromWorker: WorkerId;
  readonly toWorker: WorkerId;
  readonly reason: string;
  readonly requestedAt: Date;
}

/**
 * Reassignment State
 */
interface ReassignmentState {
  readonly executionId: ExecutionId;
  readonly fromWorker: WorkerId;
  readonly toWorker: WorkerId;
  readonly startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  partitionId?: PartitionId;
  error?: string;
}

/**
 * Reassignment Record
 */
interface ReassignmentRecord {
  readonly executionId: ExecutionId;
  readonly fromWorker: WorkerId;
  readonly toWorker: WorkerId;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly status: string;
  readonly partitionId?: PartitionId;
  readonly error?: string;
}
