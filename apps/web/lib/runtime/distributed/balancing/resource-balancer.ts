/**
 * CLAUX Runtime Distributed Layer - Resource Balancer
 * 
 * Balances resources across workers.
 * No external dependencies - pure resource balancing semantics.
 */

import type { WorkerId, WorkerInfo, WorkerCapacity, WorkerUtilization } from '../types';

/**
 * Resource Balancer
 * 
 * Balances resources across workers.
 */
export class ResourceBalancer {
  /**
   * Calculate resource score for worker
   */
  calculateResourceScore(worker: WorkerInfo): number {
    const capacity = worker.metadata.capacity;
    const utilization = worker.utilization;

    // Calculate available capacity
    const availableCpu = capacity.cpu - utilization.cpu;
    const availableMemory = capacity.memory - utilization.memory;
    const availableConcurrency = capacity.concurrency - utilization.concurrency;
    const availableBandwidth = capacity.bandwidth - utilization.bandwidth;

    // Normalize and weight
    const cpuScore = availableCpu / capacity.cpu;
    const memoryScore = availableMemory / capacity.memory;
    const concurrencyScore = availableConcurrency / capacity.concurrency;
    const bandwidthScore = availableBandwidth / capacity.bandwidth;

    // Weighted average (CPU and memory are more important)
    return (cpuScore * 0.4) + (memoryScore * 0.3) + (concurrencyScore * 0.2) + (bandwidthScore * 0.1);
  }

  /**
   * Select worker with highest resource score
   */
  selectBestWorker(workers: readonly WorkerInfo[]): WorkerId | undefined {
    if (workers.length === 0) return undefined;

    let bestScore = -Infinity;
    let bestWorker: WorkerInfo | undefined;

    for (const worker of workers) {
      const score = this.calculateResourceScore(worker);
      if (score > bestScore) {
        bestScore = score;
        bestWorker = worker;
      }
    }

    return bestWorker?.metadata.workerId;
  }

  /**
   * Get resource utilization statistics
   */
  getResourceStatistics(workers: readonly WorkerInfo[]): {
    totalCpuCapacity: number;
    totalMemoryCapacity: number;
    totalConcurrencyCapacity: number;
    totalBandwidthCapacity: number;
    averageCpuUtilization: number;
    averageMemoryUtilization: number;
    averageConcurrencyUtilization: number;
    averageBandwidthUtilization: number;
    resourcePressure: number;
  } {
    if (workers.length === 0) {
      return {
        totalCpuCapacity: 0,
        totalMemoryCapacity: 0,
        totalConcurrencyCapacity: 0,
        totalBandwidthCapacity: 0,
        averageCpuUtilization: 0,
        averageMemoryUtilization: 0,
        averageConcurrencyUtilization: 0,
        averageBandwidthUtilization: 0,
        resourcePressure: 0,
      };
    }

    let totalCpuCapacity = 0;
    let totalMemoryCapacity = 0;
    let totalConcurrencyCapacity = 0;
    let totalBandwidthCapacity = 0;

    let totalCpuUtilization = 0;
    let totalMemoryUtilization = 0;
    let totalConcurrencyUtilization = 0;
    let totalBandwidthUtilization = 0;

    for (const worker of workers) {
      const capacity = worker.metadata.capacity;
      const utilization = worker.utilization;

      totalCpuCapacity += capacity.cpu;
      totalMemoryCapacity += capacity.memory;
      totalConcurrencyCapacity += capacity.concurrency;
      totalBandwidthCapacity += capacity.bandwidth;

      totalCpuUtilization += utilization.cpu;
      totalMemoryUtilization += utilization.memory;
      totalConcurrencyUtilization += utilization.concurrency;
      totalBandwidthUtilization += utilization.bandwidth;
    }

    const avgCpuUtil = totalCpuUtilization / workers.length;
    const avgMemoryUtil = totalMemoryUtilization / workers.length;
    const avgConcurrencyUtil = totalConcurrencyUtilization / workers.length;
    const avgBandwidthUtil = totalBandwidthUtilization / workers.length;

    // Calculate resource pressure (0-1, higher is more pressure)
    const cpuPressure = totalCpuCapacity > 0 ? totalCpuUtilization / totalCpuCapacity : 0;
    const memoryPressure = totalMemoryCapacity > 0 ? totalMemoryUtilization / totalMemoryCapacity : 0;
    const concurrencyPressure = totalConcurrencyCapacity > 0 ? totalConcurrencyUtilization / totalConcurrencyCapacity : 0;

    const resourcePressure = Math.max(cpuPressure, memoryPressure, concurrencyPressure);

    return {
      totalCpuCapacity,
      totalMemoryCapacity,
      totalConcurrencyCapacity,
      totalBandwidthCapacity,
      averageCpuUtilization: avgCpuUtil,
      averageMemoryUtilization: avgMemoryUtil,
      averageConcurrencyUtilization: avgConcurrencyUtil,
      averageBandwidthUtilization: avgBandwidthUtil,
      resourcePressure,
    };
  }

  /**
   * Check if cluster is under resource pressure
   */
  isUnderPressure(workers: readonly WorkerInfo[], threshold: number = 0.8): boolean {
    const stats = this.getResourceStatistics(workers);
    return stats.resourcePressure > threshold;
  }

  /**
   * Get resource-constrained workers
   */
  getConstrainedWorkers(workers: readonly WorkerInfo[], threshold: number = 0.9): readonly WorkerId[] {
    const constrained: WorkerId[] = [];

    for (const worker of workers) {
      const capacity = worker.metadata.capacity;
      const utilization = worker.utilization;

      const cpuUtil = capacity.cpu > 0 ? utilization.cpu / capacity.cpu : 0;
      const memoryUtil = capacity.memory > 0 ? utilization.memory / capacity.memory : 0;
      const concurrencyUtil = capacity.concurrency > 0 ? utilization.concurrency / capacity.concurrency : 0;

      if (cpuUtil > threshold || memoryUtil > threshold || concurrencyUtil > threshold) {
        constrained.push(worker.metadata.workerId);
      }
    }

    return constrained;
  }

  /**
   * Get available workers
   */
  getAvailableWorkers(workers: readonly WorkerInfo[], threshold: number = 0.7): readonly WorkerId[] {
    const available: WorkerId[] = [];

    for (const worker of workers) {
      const capacity = worker.metadata.capacity;
      const utilization = worker.utilization;

      const cpuUtil = capacity.cpu > 0 ? utilization.cpu / capacity.cpu : 0;
      const memoryUtil = capacity.memory > 0 ? utilization.memory / capacity.memory : 0;
      const concurrencyUtil = capacity.concurrency > 0 ? utilization.concurrency / capacity.concurrency : 0;

      if (cpuUtil < threshold && memoryUtil < threshold && concurrencyUtil < threshold) {
        available.push(worker.metadata.workerId);
      }
    }

    return available;
  }
}
