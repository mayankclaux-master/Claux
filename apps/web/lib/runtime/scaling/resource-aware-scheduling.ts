/**
 * CLAUX Runtime Scaling Layer - Resource-Aware Scheduling
 */

import type { WorkerId } from './types';
import { ResourceSchedulingError } from './errors';

/**
 * Worker Resources
 */
export interface WorkerResources {
  readonly workerId: WorkerId;
  readonly cpu: number;
  readonly memory: number;
  readonly available: boolean;
}

/**
 * Resource-Aware Scheduling Manager
 */
export class ResourceAwareSchedulingManager {
  private workers: Map<WorkerId, WorkerResources> = new Map();

  /**
   * Register worker
   */
  register(worker: WorkerResources): void {
    this.workers.set(worker.workerId, worker);
  }

  /**
   * Select best worker
   */
  selectBest(requiredCpu: number, requiredMemory: number): WorkerId | null {
    let bestWorker: WorkerId | null = null;
    let bestScore = -1;

    for (const [workerId, worker] of this.workers) {
      if (!worker.available) continue;
      if (worker.cpu < requiredCpu || worker.memory < requiredMemory) continue;

      const score = this.calculateScore(worker, requiredCpu, requiredMemory);
      if (score > bestScore) {
        bestScore = score;
        bestWorker = workerId;
      }
    }

    return bestWorker;
  }

  /**
   * Calculate score
   */
  private calculateScore(worker: WorkerResources, requiredCpu: number, requiredMemory: number): number {
    const cpuUtilization = requiredCpu / worker.cpu;
    const memoryUtilization = requiredMemory / worker.memory;
    return 1 - (cpuUtilization + memoryUtilization) / 2;
  }

  /**
   * Update worker
   */
  update(workerId: WorkerId, resources: Partial<WorkerResources>): void {
    const worker = this.workers.get(workerId);
    if (!worker) return;

    const updated: WorkerResources = {
      ...worker,
      ...resources,
    };

    this.workers.set(workerId, updated);
  }

  /**
   * Clear
   */
  clear(): void {
    this.workers.clear();
  }
}
