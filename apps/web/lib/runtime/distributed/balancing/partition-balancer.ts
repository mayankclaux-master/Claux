/**
 * CLAUX Runtime Distributed Layer - Partition Balancer
 * 
 * Balances partitions across workers.
 * No external dependencies - pure balancing semantics.
 */

import type { WorkerId, PartitionId, WorkerInfo } from '../types';

/**
 * Partition Balancer
 * 
 * Balances partitions across workers.
 */
export class PartitionBalancer {
  private partitionAssignments: Map<PartitionId, WorkerId> = new Map();
  private workerPartitions: Map<WorkerId, Set<PartitionId>> = new Map();

  /**
   * Assign partition to worker
   */
  assignPartition(partitionId: PartitionId, workerId: WorkerId): void {
    // Remove from previous worker if assigned
    const previousWorker = this.partitionAssignments.get(partitionId);
    if (previousWorker) {
      const workerPartitions = this.workerPartitions.get(previousWorker);
      if (workerPartitions) {
        workerPartitions.delete(partitionId);
        this.workerPartitions.set(previousWorker, workerPartitions);
      }
    }

    // Assign to new worker
    this.partitionAssignments.set(partitionId, workerId);
    const workerPartitions = this.workerPartitions.get(workerId) || new Set();
    workerPartitions.add(partitionId);
    this.workerPartitions.set(workerId, workerPartitions);
  }

  /**
   * Reassign partition
   */
  reassignPartition(partitionId: PartitionId, newWorkerId: WorkerId): void {
    this.assignPartition(partitionId, newWorkerId);
  }

  /**
   * Get worker for partition
   */
  getWorkerForPartition(partitionId: PartitionId): WorkerId | undefined {
    return this.partitionAssignments.get(partitionId);
  }

  /**
   * Get partitions for worker
   */
  getPartitionsForWorker(workerId: WorkerId): readonly PartitionId[] {
    const partitions = this.workerPartitions.get(workerId);
    return partitions ? Array.from(partitions) : [];
  }

  /**
   * Get partition distribution
   */
  getPartitionDistribution(): Map<WorkerId, number> {
    const distribution = new Map<WorkerId, number>();

    for (const [workerId, partitions] of this.workerPartitions) {
      distribution.set(workerId, partitions.size);
    }

    return distribution;
  }

  /**
   * Balance partitions across workers
   */
  balance(workers: readonly WorkerInfo[]): void {
    const distribution = this.getPartitionDistribution();
    const counts = Array.from(distribution.values());

    if (counts.length === 0) return;

    const avgCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const threshold = avgCount * 0.2; // 20% variance threshold

    // Find overloaded and underloaded workers
    const overloaded: WorkerId[] = [];
    const underloaded: WorkerId[] = [];

    for (const [workerId, count] of distribution) {
      if (count > avgCount + threshold) {
        overloaded.push(workerId);
      } else if (count < avgCount - threshold) {
        underloaded.push(workerId);
      }
    }

    // Move partitions from overloaded to underloaded
    for (const overloadedWorker of overloaded) {
      if (underloaded.length === 0) break;

      const partitions = this.workerPartitions.get(overloadedWorker);
      if (!partitions) continue;

      for (const partitionId of partitions) {
        if (underloaded.length === 0) break;

        const targetWorker = underloaded.shift()!;
        this.reassignPartition(partitionId, targetWorker);
      }
    }
  }

  /**
   * Remove partition
   */
  removePartition(partitionId: PartitionId): void {
    const workerId = this.partitionAssignments.get(partitionId);
    if (!workerId) return;

    const workerPartitions = this.workerPartitions.get(workerId);
    if (workerPartitions) {
      workerPartitions.delete(partitionId);
      this.workerPartitions.set(workerId, workerPartitions);
    }

    this.partitionAssignments.delete(partitionId);
  }

  /**
   * Remove worker
   */
  removeWorker(workerId: WorkerId): void {
    const partitions = this.workerPartitions.get(workerId);
    if (partitions) {
      for (const partitionId of partitions) {
        this.partitionAssignments.delete(partitionId);
      }
    }

    this.workerPartitions.delete(workerId);
  }

  /**
   * Get balancing statistics
   */
  getStatistics(): {
    totalPartitions: number;
    totalWorkers: number;
    averagePartitionsPerWorker: number;
    partitionSkew: number;
    maxPartitions: number;
    minPartitions: number;
  } {
    const distribution = this.getPartitionDistribution();
    const counts = Array.from(distribution.values());

    const totalPartitions = this.partitionAssignments.size;
    const totalWorkers = distribution.size;
    const avgPartitions = totalWorkers > 0 ? totalPartitions / totalWorkers : 0;
    const maxPartitions = counts.length > 0 ? Math.max(...counts) : 0;
    const minPartitions = counts.length > 0 ? Math.min(...counts) : 0;
    const skew = maxPartitions - minPartitions;

    return {
      totalPartitions,
      totalWorkers,
      averagePartitionsPerWorker: avgPartitions,
      partitionSkew: skew,
      maxPartitions,
      minPartitions,
    };
  }

  /**
   * Clear all assignments
   */
  clear(): void {
    this.partitionAssignments.clear();
    this.workerPartitions.clear();
  }
}
