/**
 * CLAUX Runtime Distributed Layer - Worker Draining
 * 
 * Graceful worker shutdown and task draining
 */

import type { UUID } from '../../types';
import { ExecutionStatus } from '../../types';
import type { WorkerId, ExecutionId, PartitionId } from '../types';
import { DEFAULT_DRAIN_TIMEOUT_MS } from '../constants';
import { WorkerDrainingError, WorkerDrainTimeoutError } from '../errors';

/**
 * Worker Draining Configuration
 */
export interface WorkerDrainingConfig {
  readonly timeoutMs: number;
  readonly drainExecutions: boolean;
  readonly drainPartitions: boolean;
}

/**
 * Worker Draining Manager
 * 
 * Manages worker draining and graceful shutdown.
 */
export class WorkerDrainingManager {
  private config: WorkerDrainingConfig;
  private drainingWorkers: Map<WorkerId, WorkerDrainState> = new Map();
  private workerExecutions: Map<WorkerId, Set<ExecutionId>> = new Map();
  private workerPartitions: Map<WorkerId, Set<PartitionId>> = new Map();

  constructor(config: Partial<WorkerDrainingConfig> = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || DEFAULT_DRAIN_TIMEOUT_MS,
      drainExecutions: config.drainExecutions ?? true,
      drainPartitions: config.drainPartitions ?? true,
    };
  }

  /**
   * Start draining worker
   */
  async startDraining(workerId: WorkerId): Promise<void> {
    if (this.drainingWorkers.has(workerId)) {
      throw new WorkerDrainingError(`Worker ${workerId} is already draining`, workerId);
    }

    const drainState: WorkerDrainState = {
      workerId,
      startTime: new Date(),
      status: 'draining',
      remainingExecutions: this.workerExecutions.get(workerId)?.size || 0,
      remainingPartitions: this.workerPartitions.get(workerId)?.size || 0,
    };

    this.drainingWorkers.set(workerId, drainState);
  }

  /**
   * Complete draining worker
   */
  completeDraining(workerId: WorkerId): void {
    const drainState = this.drainingWorkers.get(workerId);
    if (!drainState) {
      throw new WorkerDrainingError(`Worker ${workerId} is not draining`, workerId);
    }

    drainState.status = 'completed';
    drainState.endTime = new Date();

    this.drainingWorkers.delete(workerId);
  }

  /**
   * Cancel draining worker
   */
  cancelDraining(workerId: WorkerId): void {
    const drainState = this.drainingWorkers.get(workerId);
    if (!drainState) {
      throw new WorkerDrainingError(`Worker ${workerId} is not draining`, workerId);
    }

    drainState.status = 'cancelled';
    drainState.endTime = new Date();

    this.drainingWorkers.delete(workerId);
  }

  /**
   * Get drain state for worker
   */
  getDrainState(workerId: WorkerId): WorkerDrainState | undefined {
    const state = this.drainingWorkers.get(workerId);
    return state ? { ...state } : undefined;
  }

  /**
   * Check if worker is draining
   */
  isDraining(workerId: WorkerId): boolean {
    return this.drainingWorkers.has(workerId);
  }

  /**
   * Update remaining executions for worker
   */
  updateRemainingExecutions(workerId: WorkerId, count: number): void {
    const drainState = this.drainingWorkers.get(workerId);
    if (drainState) {
      drainState.remainingExecutions = count;
    }
  }

  /**
   * Update remaining partitions for worker
   */
  updateRemainingPartitions(workerId: WorkerId, count: number): void {
    const drainState = this.drainingWorkers.get(workerId);
    if (drainState) {
      drainState.remainingPartitions = count;
    }
  }

  /**
   * Check if drain is complete
   */
  isDrainComplete(workerId: WorkerId): boolean {
    const drainState = this.drainingWorkers.get(workerId);
    if (!drainState) return true;

    return drainState.remainingExecutions === 0 && drainState.remainingPartitions === 0;
  }

  /**
   * Check if drain has timed out
   */
  isDrainTimeout(workerId: WorkerId): boolean {
    const drainState = this.drainingWorkers.get(workerId);
    if (!drainState) return false;

    const elapsed = Date.now() - drainState.startTime.getTime();
    return elapsed > this.config.timeoutMs;
  }

  /**
   * Get all draining workers
   */
  getDrainingWorkers(): readonly WorkerId[] {
    return Array.from(this.drainingWorkers.keys());
  }

  /**
   * Get workers that have timed out
   */
  getTimedOutWorkers(): readonly WorkerId[] {
    const timedOut: WorkerId[] = [];
    for (const [workerId] of this.drainingWorkers) {
      if (this.isDrainTimeout(workerId)) {
        timedOut.push(workerId);
      }
    }
    return timedOut;
  }

  /**
   * Set worker executions
   */
  setWorkerExecutions(workerId: WorkerId, executions: ExecutionId[]): void {
    this.workerExecutions.set(workerId, new Set(executions));
  }

  /**
   * Set worker partitions
   */
  setWorkerPartitions(workerId: WorkerId, partitions: PartitionId[]): void {
    this.workerPartitions.set(workerId, new Set(partitions));
  }

  /**
   * Get worker executions
   */
  getWorkerExecutions(workerId: WorkerId): readonly ExecutionId[] {
    const executions = this.workerExecutions.get(workerId);
    return executions ? Array.from(executions) : [];
  }

  /**
   * Get worker partitions
   */
  getWorkerPartitions(workerId: WorkerId): readonly PartitionId[] {
    const partitions = this.workerPartitions.get(workerId);
    return partitions ? Array.from(partitions) : [];
  }

  /**
   * Remove execution from worker
   */
  removeExecution(workerId: WorkerId, executionId: ExecutionId): void {
    const executions = this.workerExecutions.get(workerId);
    if (executions) {
      executions.delete(executionId);
      this.updateRemainingExecutions(workerId, executions.size);
    }
  }

  /**
   * Remove partition from worker
   */
  removePartition(workerId: WorkerId, partitionId: PartitionId): void {
    const partitions = this.workerPartitions.get(workerId);
    if (partitions) {
      partitions.delete(partitionId);
      this.updateRemainingPartitions(workerId, partitions.size);
    }
  }

  /**
   * Get draining statistics
   */
  getStatistics(): {
    drainingWorkers: number;
    completedDrains: number;
    cancelledDrains: number;
    timedOutDrains: number;
    averageDrainTime: number;
  } {
    let completed = 0;
    let cancelled = 0;
    let timedOut = 0;
    let totalDrainTime = 0;

    for (const state of this.drainingWorkers.values()) {
      if (state.status === ExecutionStatus.COMPLETED) {
        completed++;
        if (state.endTime) {
          totalDrainTime += state.endTime.getTime() - state.startTime.getTime();
        }
      } else if (state.status === ExecutionStatus.CANCELLED) {
        cancelled++;
      } else if (this.isDrainTimeout(state.workerId)) {
        timedOut++;
      }
    }

    const avgDrainTime = completed > 0 ? totalDrainTime / completed : 0;

    return {
      drainingWorkers: this.drainingWorkers.size,
      completedDrains: completed,
      cancelledDrains: cancelled,
      timedOutDrains: timedOut,
      averageDrainTime: avgDrainTime,
    };
  }

  /**
   * Clear all draining state
   */
  clear(): void {
    this.drainingWorkers.clear();
    this.workerExecutions.clear();
    this.workerPartitions.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): WorkerDrainingConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<WorkerDrainingConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Worker Drain State
 */
interface WorkerDrainState {
  readonly workerId: WorkerId;
  readonly startTime: Date;
  endTime?: Date;
  status: 'draining' | 'completed' | 'cancelled' | 'timeout';
  remainingExecutions: number;
  remainingPartitions: number;
}
