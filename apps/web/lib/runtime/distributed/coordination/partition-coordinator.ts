/**
 * CLAUX Runtime Distributed Layer - Partition Coordinator
 * 
 * Coordinates partition assignment and rebalancing.
 * No external dependencies - pure coordination semantics.
 */

import type { WorkerId, PartitionId, PartitionInfo, PartitionMetadata, OwnershipInfo, PartitionState, ClusterId, PartitionKeyRange } from '../types';
import { PartitionState as PartitionStateEnum, LeaseResourceType as LeaseResourceTypeEnum, LeaseState } from '../types';
import { DEFAULT_PARTITION_COUNT, PARTITION_ASSIGNMENT_TIMEOUT_MS, PARTITION_REBALANCE_THRESHOLD, MAX_PARTITIONS_PER_WORKER } from '../constants';
import { PartitionAssignmentError, PartitionReassignmentError, PartitionNotFoundError } from '../errors';

/**
 * Partition Coordinator Configuration
 */
export interface PartitionCoordinatorConfig {
  readonly clusterId: ClusterId;
  readonly partitionCount: number;
  readonly rebalanceThreshold: number;
  readonly assignmentTimeoutMs: number;
  readonly maxPartitionsPerWorker: number;
}

/**
 * Partition Coordinator
 * 
 * Coordinates partition assignment and rebalancing across workers.
 */
export class PartitionCoordinator {
  private config: PartitionCoordinatorConfig;
  private partitions: Map<PartitionId, PartitionInfo> = new Map();
  private workerPartitionMap: Map<WorkerId, Set<PartitionId>> = new Map();
  private currentEpoch: number = 0;

  constructor(config: Partial<PartitionCoordinatorConfig> = {}) {
    this.config = {
      clusterId: config.clusterId || 'default',
      partitionCount: config.partitionCount || DEFAULT_PARTITION_COUNT,
      rebalanceThreshold: config.rebalanceThreshold || PARTITION_REBALANCE_THRESHOLD,
      assignmentTimeoutMs: config.assignmentTimeoutMs || PARTITION_ASSIGNMENT_TIMEOUT_MS,
      maxPartitionsPerWorker: config.maxPartitionsPerWorker || MAX_PARTITIONS_PER_WORKER,
    };

    this.initializePartitions();
  }

  /**
   * Initialize partitions
   */
  private initializePartitions(): void {
    const partitionSize = 1 / this.config.partitionCount;

    for (let i = 0; i < this.config.partitionCount; i++) {
      const partitionId = this.generatePartitionId(i);
      const keyRange = this.generateKeyRange(i, partitionSize);

      const metadata: PartitionMetadata = {
        partitionId,
        clusterId: this.config.clusterId,
        keyRange,
        owner: '',
        epoch: 0,
      };

      const partitionInfo: PartitionInfo = {
        metadata,
        state: PartitionStateEnum.UNASSIGNED,
        ownership: this.createOwnershipInfo(metadata),
        executionCount: 0,
        lastAssignment: new Date(),
      };

      this.partitions.set(partitionId, partitionInfo);
    }
  }

  /**
   * Assign partition to worker
   */
  async assignPartition(partitionId: PartitionId, workerId: WorkerId): Promise<void> {
    let partition = this.partitions.get(partitionId);
    if (!partition) {
      throw new PartitionNotFoundError(`Partition ${partitionId} not found`, partitionId);
    }

    // Check if worker can accept more partitions
    const workerPartitions = this.workerPartitionMap.get(workerId) || new Set();
    if (workerPartitions.size >= this.config.maxPartitionsPerWorker) {
      throw new PartitionAssignmentError(
        `Worker ${workerId} has reached maximum partition limit`,
        partitionId,
        workerId
      );
    }

    // Update partition ownership
    this.currentEpoch++;
    partition = {
      ...partition,
      metadata: {
        ...partition.metadata,
        owner: workerId,
        epoch: this.currentEpoch,
      },
      state: PartitionStateEnum.ASSIGNED,
      lastAssignment: new Date(),
      ownership: this.createOwnershipInfo({
        ...partition.metadata,
        owner: workerId,
        epoch: this.currentEpoch,
      }),
    };
    this.partitions.set(partitionId, partition);

    // Update worker partition map
    workerPartitions.add(partitionId);
    this.workerPartitionMap.set(workerId, workerPartitions);
  }

  /**
   * Reassign partition to different worker
   */
  async reassignPartition(partitionId: PartitionId, fromWorker: WorkerId, toWorker: WorkerId): Promise<void> {
    const partition = this.partitions.get(partitionId);
    if (!partition) {
      throw new PartitionNotFoundError(`Partition ${partitionId} not found`, partitionId);
    }

    if (partition.metadata.owner !== fromWorker) {
      throw new PartitionReassignmentError(
        `Partition ${partitionId} is not owned by ${fromWorker}`,
        partitionId,
        fromWorker,
        toWorker
      );
    }

    // Remove from old worker
    const fromWorkerPartitions = this.workerPartitionMap.get(fromWorker);
    if (fromWorkerPartitions) {
      fromWorkerPartitions.delete(partitionId);
      this.workerPartitionMap.set(fromWorker, fromWorkerPartitions);
    }

    // Assign to new worker
    await this.assignPartition(partitionId, toWorker);
  }

  /**
   * Release partition from worker
   */
  async releasePartition(partitionId: PartitionId, workerId: WorkerId): Promise<void> {
    let partition = this.partitions.get(partitionId);
    if (!partition) {
      throw new PartitionNotFoundError(`Partition ${partitionId} not found`, partitionId);
    }

    if (partition.metadata.owner !== workerId) {
      throw new PartitionAssignmentError(
        `Partition ${partitionId} is not owned by ${workerId}`,
        partitionId,
        workerId
      );
    }

    // Reset partition
    partition = {
      ...partition,
      state: PartitionStateEnum.UNASSIGNED,
      metadata: {
        ...partition.metadata,
        owner: '',
      },
      ownership: this.createOwnershipInfo({
        ...partition.metadata,
        owner: '',
      }),
    };
    this.partitions.set(partitionId, partition);

    // Remove from worker partition map
    const workerPartitions = this.workerPartitionMap.get(workerId);
    if (workerPartitions) {
      workerPartitions.delete(partitionId);
      this.workerPartitionMap.set(workerId, workerPartitions);
    }
  }

  /**
   * Get partition info
   */
  getPartitionInfo(partitionId: PartitionId): PartitionInfo | undefined {
    const partition = this.partitions.get(partitionId);
    return partition ? { ...partition } : undefined;
  }

  /**
   * Get all partitions
   */
  getAllPartitions(): readonly PartitionInfo[] {
    return Array.from(this.partitions.values()).map(p => ({ ...p }));
  }

  /**
   * Get partitions for worker
   */
  getPartitionsForWorker(workerId: WorkerId): readonly PartitionId[] {
    const workerPartitions = this.workerPartitionMap.get(workerId);
    return workerPartitions ? Array.from(workerPartitions) : [];
  }

  /**
   * Get partition for key
   */
  getPartitionForKey(key: string): PartitionId | undefined {
    const hash = this.hashKey(key);
    const partitionIndex = Math.floor(hash * this.config.partitionCount);
    return this.generatePartitionId(partitionIndex);
  }

  /**
   * Check if rebalancing is needed
   */
  needsRebalancing(): boolean {
    const partitionCounts = Array.from(this.workerPartitionMap.values()).map(set => set.size);
    if (partitionCounts.length === 0) return false;

    const maxCount = Math.max(...partitionCounts);
    const minCount = Math.min(...partitionCounts);
    const avgCount = partitionCounts.reduce((sum, count) => sum + count, 0) / partitionCounts.length;

    const skew = maxCount - minCount;
    const threshold = avgCount * this.config.rebalanceThreshold;

    return skew > threshold;
  }

  /**
   * Rebalance partitions
   */
  async rebalance(): Promise<void> {
    if (!this.needsRebalancing()) {
      return;
    }

    const partitionCounts = new Map<WorkerId, number>();
    for (const [workerId, partitions] of this.workerPartitionMap) {
      partitionCounts.set(workerId, partitions.size);
    }

    // Find overloaded and underloaded workers
    const overloadedWorkers: WorkerId[] = [];
    const underloadedWorkers: WorkerId[] = [];
    const avgCount = Array.from(partitionCounts.values()).reduce((sum, count) => sum + count, 0) / partitionCounts.size;

    for (const [workerId, count] of partitionCounts) {
      if (count > avgCount * (1 + this.config.rebalanceThreshold)) {
        overloadedWorkers.push(workerId);
      } else if (count < avgCount * (1 - this.config.rebalanceThreshold)) {
        underloadedWorkers.push(workerId);
      }
    }

    // Move partitions from overloaded to underloaded workers
    for (const overloadedWorker of overloadedWorkers) {
      const partitions = this.workerPartitionMap.get(overloadedWorker);
      if (!partitions) continue;

      for (const partitionId of partitions) {
        if (underloadedWorkers.length === 0) break;

        const targetWorker = underloadedWorkers.shift()!;
        await this.reassignPartition(partitionId, overloadedWorker, targetWorker);
      }
    }
  }

  /**
   * Get partition statistics
   */
  getStatistics(): {
    totalPartitions: number;
    assignedPartitions: number;
    unassignedPartitions: number;
    workerPartitionCounts: Map<WorkerId, number>;
    averagePartitionsPerWorker: number;
    needsRebalancing: boolean;
  } {
    let assignedCount = 0;
    const workerPartitionCounts = new Map<WorkerId, number>();

    for (const partition of this.partitions.values()) {
      if (partition.state === PartitionStateEnum.ASSIGNED) {
        assignedCount++;
        const count = workerPartitionCounts.get(partition.metadata.owner) || 0;
        workerPartitionCounts.set(partition.metadata.owner, count + 1);
      }
    }

    const workerCount = workerPartitionCounts.size || 1;
    const avgPartitions = assignedCount / workerCount;

    return {
      totalPartitions: this.partitions.size,
      assignedPartitions: assignedCount,
      unassignedPartitions: this.partitions.size - assignedCount,
      workerPartitionCounts,
      averagePartitionsPerWorker: avgPartitions,
      needsRebalancing: this.needsRebalancing(),
    };
  }

  /**
   * Generate partition ID
   */
  private generatePartitionId(index: number): PartitionId {
    return `partition_${this.config.clusterId}_${index}` as PartitionId;
  }

  /**
   * Generate key range for partition
   */
  private generateKeyRange(index: number, partitionSize: number): PartitionKeyRange {
    const start = (index * partitionSize).toString(16).padStart(32, '0');
    const end = ((index + 1) * partitionSize).toString(16).padStart(32, '0');

    return {
      start,
      end,
      inclusive: false,
    };
  }

  /**
   * Hash key to partition index
   */
  private hashKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash) / 0xFFFFFFFF;
  }

  /**
   * Create ownership info
   */
  private createOwnershipInfo(metadata: PartitionMetadata) {
    const leaseId = `lease_${metadata.partitionId}_${Date.now()}`;
    return {
      metadata: {
        resourceId: metadata.partitionId,
        resourceType: LeaseResourceTypeEnum.PARTITION,
        owner: metadata.owner,
        epoch: metadata.epoch,
        leaseId,
        acquiredAt: new Date(),
        history: [
          {
            epoch: metadata.epoch,
            owner: metadata.owner,
            timestamp: new Date(),
            reason: 'initial_assignment',
          },
        ],
      },
      leaseInfo: {
        metadata: {
          leaseId,
          workerId: metadata.owner,
          clusterId: metadata.clusterId,
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30000),
          epoch: metadata.epoch,
        },
        state: LeaseState.ACTIVE,
        resource: {
          type: LeaseResourceTypeEnum.PARTITION,
          resourceId: metadata.partitionId,
          metadata: {},
        },
        renewals: 0,
        lastRenewed: new Date(),
      },
      transferable: true,
      replaySafe: true,
    };
  }

  /**
   * Reset coordinator
   */
  reset(): void {
    this.partitions.clear();
    this.workerPartitionMap.clear();
    this.currentEpoch = 0;
    this.initializePartitions();
  }

  /**
   * Get configuration
   */
  getConfig(): PartitionCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<PartitionCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
