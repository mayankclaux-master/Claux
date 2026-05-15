/**
 * CLAUX Runtime Distributed Layer - Execution Partitioner
 * 
 * Partitions executions across distributed workers.
 * No external dependencies - pure partitioning semantics.
 */

import type { ExecutionId, PartitionId, WorkerId } from '../types';

/**
 * Execution Partitioner Configuration
 */
export interface ExecutionPartitionerConfig {
  readonly partitionCount: number;
  readonly enableHashPartitioning: boolean;
  readonly enableRangePartitioning: boolean;
}

/**
 * Execution Partitioner
 * 
 * Partitions executions across distributed workers.
 */
export class ExecutionPartitioner {
  private config: ExecutionPartitionerConfig;
  private executionPartitionMap: Map<ExecutionId, PartitionId> = new Map();
  private partitionWorkerMap: Map<PartitionId, WorkerId> = new Map();

  constructor(config: Partial<ExecutionPartitionerConfig> = {}) {
    this.config = {
      partitionCount: config.partitionCount || 32,
      enableHashPartitioning: config.enableHashPartitioning ?? true,
      enableRangePartitioning: config.enableRangePartitioning ?? false,
    };
  }

  /**
   * Partition execution
   */
  partitionExecution(executionId: ExecutionId): PartitionId {
    let partitionId: PartitionId;

    if (this.config.enableHashPartitioning) {
      partitionId = this.hashPartition(executionId);
    } else if (this.config.enableRangePartitioning) {
      partitionId = this.rangePartition(executionId);
    } else {
      partitionId = this.roundRobinPartition();
    }

    this.executionPartitionMap.set(executionId, partitionId);
    return partitionId;
  }

  /**
   * Get partition for execution
   */
  getPartitionForExecution(executionId: ExecutionId): PartitionId | undefined {
    return this.executionPartitionMap.get(executionId);
  }

  /**
   * Set worker for partition
   */
  setPartitionWorker(partitionId: PartitionId, workerId: WorkerId): void {
    this.partitionWorkerMap.set(partitionId, workerId);
  }

  /**
   * Get worker for partition
   */
  getWorkerForPartition(partitionId: PartitionId): WorkerId | undefined {
    return this.partitionWorkerMap.get(partitionId);
  }

  /**
   * Get worker for execution
   */
  getWorkerForExecution(executionId: ExecutionId): WorkerId | undefined {
    const partitionId = this.executionPartitionMap.get(executionId);
    if (!partitionId) return undefined;

    return this.partitionWorkerMap.get(partitionId);
  }

  /**
   * Hash-based partitioning
   */
  private hashPartition(executionId: ExecutionId): PartitionId {
    let hash = 0;
    for (let i = 0; i < executionId.length; i++) {
      const char = executionId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    const partitionIndex = Math.abs(hash) % this.config.partitionCount;
    return `partition_${partitionIndex}` as PartitionId;
  }

  /**
   * Range-based partitioning
   */
  private rangePartition(executionId: ExecutionId): PartitionId {
    const hash = this.simpleHash(executionId);
    const normalized = hash / 0xFFFFFFFF;
    const partitionIndex = Math.floor(normalized * this.config.partitionCount);
    return `partition_${partitionIndex}` as PartitionId;
  }

  /**
   * Round-robin partitioning
   */
  private roundRobinPartition(): PartitionId {
    const partitionIndex = this.executionPartitionMap.size % this.config.partitionCount;
    return `partition_${partitionIndex}` as PartitionId;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Get partition distribution
   */
  getPartitionDistribution(): Map<PartitionId, number> {
    const distribution = new Map<PartitionId, number>();

    for (const partitionId of this.executionPartitionMap.values()) {
      const count = distribution.get(partitionId) || 0;
      distribution.set(partitionId, count + 1);
    }

    return distribution;
  }

  /**
   * Get partition statistics
   */
  getStatistics(): {
    totalExecutions: number;
    partitionCount: number;
    averageExecutionsPerPartition: number;
    partitionSkew: number;
    assignedPartitions: number;
  } {
    const distribution = this.getPartitionDistribution();
    const counts = Array.from(distribution.values());

    const avg = counts.length > 0 ? counts.reduce((sum, count) => sum + count, 0) / counts.length : 0;
    const max = counts.length > 0 ? Math.max(...counts) : 0;
    const skew = max - avg;

    return {
      totalExecutions: this.executionPartitionMap.size,
      partitionCount: this.config.partitionCount,
      averageExecutionsPerPartition: avg,
      partitionSkew: skew,
      assignedPartitions: distribution.size,
    };
  }

  /**
   * Remove execution from partition
   */
  removeExecution(executionId: ExecutionId): void {
    this.executionPartitionMap.delete(executionId);
  }

  /**
   * Clear all partitions
   */
  clear(): void {
    this.executionPartitionMap.clear();
    this.partitionWorkerMap.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): ExecutionPartitionerConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<ExecutionPartitionerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
