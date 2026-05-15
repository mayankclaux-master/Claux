/**
 * CLAUX Runtime Distributed Layer - Workload Distributor
 * 
 * Distributes workload across workers.
 * No external dependencies - pure distribution semantics.
 */

import type { WorkerId, ExecutionId, WorkerInfo } from '../types';

/**
 * Workload Distributor
 * 
 * Distributes workload across workers.
 */
export class WorkloadDistributor {
  private workerWorkloads: Map<WorkerId, Workload> = new Map();
  private executionAssignments: Map<ExecutionId, WorkerId> = new Map();

  /**
   * Assign execution to worker
   */
  assignExecution(executionId: ExecutionId, workerId: WorkerId): void {
    this.executionAssignments.set(executionId, workerId);

    const workload = this.workerWorkloads.get(workerId) || this.createWorkload();
    workload.executionCount++;
    workload.lastAssignment = new Date();
    this.workerWorkloads.set(workerId, workload);
  }

  /**
   * Remove execution from worker
   */
  removeExecution(executionId: ExecutionId): void {
    const workerId = this.executionAssignments.get(executionId);
    if (!workerId) return;

    const workload = this.workerWorkloads.get(workerId);
    if (workload) {
      workload.executionCount--;
      this.workerWorkloads.set(workerId, workload);
    }

    this.executionAssignments.delete(executionId);
  }

  /**
   * Get worker for execution
   */
  getWorkerForExecution(executionId: ExecutionId): WorkerId | undefined {
    return this.executionAssignments.get(executionId);
  }

  /**
   * Get workload for worker
   */
  getWorkload(workerId: WorkerId): Workload | undefined {
    const workload = this.workerWorkloads.get(workerId);
    return workload ? { ...workload } : undefined;
  }

  /**
   * Get all workloads
   */
  getAllWorkloads(): Map<WorkerId, Workload> {
    const workloads = new Map<WorkerId, Workload>();
    for (const [workerId, workload] of this.workerWorkloads) {
      workloads.set(workerId, { ...workload });
    }
    return workloads;
  }

  /**
   * Select least loaded worker
   */
  selectLeastLoaded(workerIds: readonly WorkerId[]): WorkerId | undefined {
    if (workerIds.length === 0) return undefined;

    let minLoad = Infinity;
    let selectedWorker: WorkerId | undefined;

    for (const workerId of workerIds) {
      const workload = this.workerWorkloads.get(workerId) || this.createWorkload();
      if (workload.executionCount < minLoad) {
        minLoad = workload.executionCount;
        selectedWorker = workerId;
      }
    }

    return selectedWorker || workerIds[0];
  }

  /**
   * Get distribution statistics
   */
  getStatistics(): {
    totalExecutions: number;
    totalWorkers: number;
    averageExecutionsPerWorker: number;
    workloadVariance: number;
    maxExecutions: number;
    minExecutions: number;
  } {
    const counts = Array.from(this.workerWorkloads.values()).map(w => w.executionCount);

    const totalExecutions = this.executionAssignments.size;
    const totalWorkers = this.workerWorkloads.size;
    const avgExecutions = totalWorkers > 0 ? totalExecutions / totalWorkers : 0;
    const maxExecutions = counts.length > 0 ? Math.max(...counts) : 0;
    const minExecutions = counts.length > 0 ? Math.min(...counts) : 0;
    const variance = counts.length > 0
      ? counts.reduce((sum, count) => sum + Math.pow(count - avgExecutions, 2), 0) / counts.length
      : 0;

    return {
      totalExecutions,
      totalWorkers,
      averageExecutionsPerWorker: avgExecutions,
      workloadVariance: variance,
      maxExecutions,
      minExecutions,
    };
  }

  /**
   * Redistribute workload
   */
  redistribute(workers: readonly WorkerInfo[]): void {
    const stats = this.getStatistics();
    const avgExecutions = stats.averageExecutionsPerWorker;
    const threshold = avgExecutions * 0.2;

    // Find overloaded and underloaded workers
    const overloaded: WorkerId[] = [];
    const underloaded: WorkerId[] = [];

    for (const [workerId, workload] of this.workerWorkloads) {
      if (workload.executionCount > avgExecutions + threshold) {
        overloaded.push(workerId);
      } else if (workload.executionCount < avgExecutions - threshold) {
        underloaded.push(workerId);
      }
    }

    // Move executions from overloaded to underloaded
    for (const overloadedWorker of overloaded) {
      if (underloaded.length === 0) break;

      const executionsToMove: ExecutionId[] = [];
      for (const [executionId, assignedWorker] of this.executionAssignments) {
        if (assignedWorker === overloadedWorker) {
          executionsToMove.push(executionId);
        }
      }

      for (const executionId of executionsToMove) {
        if (underloaded.length === 0) break;

        const targetWorker = underloaded.shift()!;
        this.removeExecution(executionId);
        this.assignExecution(executionId, targetWorker);
      }
    }
  }

  /**
   * Create workload
   */
  private createWorkload(): Workload {
    return {
      executionCount: 0,
      lastAssignment: new Date(),
    };
  }

  /**
   * Clear all workloads
   */
  clear(): void {
    this.workerWorkloads.clear();
    this.executionAssignments.clear();
  }
}

/**
 * Workload
 */
interface Workload {
  executionCount: number;
  lastAssignment: Date;
}
