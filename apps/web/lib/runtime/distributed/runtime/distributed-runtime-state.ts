/**
 * CLAUX Runtime Distributed Layer - Distributed Runtime State
 * 
 * Manages distributed runtime state.
 * No external dependencies - pure state semantics.
 */

import type { ClusterId, ExecutionId, PartitionId, WorkerId } from '../types';

/**
 * Distributed Runtime State
 * 
 * Manages distributed runtime state.
 */
export class DistributedRuntimeState {
  private clusterId: ClusterId;
  private activeExecutions: Set<ExecutionId> = new Set();
  private activePartitions: Set<PartitionId> = new Set();
  private activeWorkers: Set<WorkerId> = new Set();
  private stateVersion: number = 0;
  private lastModified: Date;

  constructor(clusterId: ClusterId) {
    this.clusterId = clusterId;
    this.lastModified = new Date();
  }

  /**
   * Add execution
   */
  addExecution(executionId: ExecutionId): void {
    this.activeExecutions.add(executionId);
    this.incrementVersion();
  }

  /**
   * Remove execution
   */
  removeExecution(executionId: ExecutionId): void {
    this.activeExecutions.delete(executionId);
    this.incrementVersion();
  }

  /**
   * Add partition
   */
  addPartition(partitionId: PartitionId): void {
    this.activePartitions.add(partitionId);
    this.incrementVersion();
  }

  /**
   * Remove partition
   */
  removePartition(partitionId: PartitionId): void {
    this.activePartitions.delete(partitionId);
    this.incrementVersion();
  }

  /**
   * Add worker
   */
  addWorker(workerId: WorkerId): void {
    this.activeWorkers.add(workerId);
    this.incrementVersion();
  }

  /**
   * Remove worker
   */
  removeWorker(workerId: WorkerId): void {
    this.activeWorkers.delete(workerId);
    this.incrementVersion();
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): readonly ExecutionId[] {
    return Array.from(this.activeExecutions);
  }

  /**
   * Get active partitions
   */
  getActivePartitions(): readonly PartitionId[] {
    return Array.from(this.activePartitions);
  }

  /**
   * Get active workers
   */
  getActiveWorkers(): readonly WorkerId[] {
    return Array.from(this.activeWorkers);
  }

  /**
   * Check if execution is active
   */
  isExecutionActive(executionId: ExecutionId): boolean {
    return this.activeExecutions.has(executionId);
  }

  /**
   * Check if partition is active
   */
  isPartitionActive(partitionId: PartitionId): boolean {
    return this.activePartitions.has(partitionId);
  }

  /**
   * Check if worker is active
   */
  isWorkerActive(workerId: WorkerId): boolean {
    return this.activeWorkers.has(workerId);
  }

  /**
   * Get state version
   */
  getVersion(): number {
    return this.stateVersion;
  }

  /**
   * Get last modified time
   */
  getLastModified(): Date {
    return this.lastModified;
  }

  /**
   * Increment state version
   */
  private incrementVersion(): void {
    this.stateVersion++;
    this.lastModified = new Date();
  }

  /**
   * Get state snapshot
   */
  getSnapshot(): RuntimeStateSnapshot {
    return {
      clusterId: this.clusterId,
      version: this.stateVersion,
      lastModified: this.lastModified,
      activeExecutions: Array.from(this.activeExecutions),
      activePartitions: Array.from(this.activePartitions),
      activeWorkers: Array.from(this.activeWorkers),
    };
  }

  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(snapshot: RuntimeStateSnapshot): void {
    this.clusterId = snapshot.clusterId;
    this.stateVersion = snapshot.version;
    this.lastModified = snapshot.lastModified;
    this.activeExecutions = new Set(snapshot.activeExecutions);
    this.activePartitions = new Set(snapshot.activePartitions);
    this.activeWorkers = new Set(snapshot.activeWorkers);
  }

  /**
   * Clear state
   */
  clear(): void {
    this.activeExecutions.clear();
    this.activePartitions.clear();
    this.activeWorkers.clear();
    this.stateVersion = 0;
    this.lastModified = new Date();
  }
}

/**
 * Runtime State Snapshot
 */
interface RuntimeStateSnapshot {
  readonly clusterId: ClusterId;
  readonly version: number;
  readonly lastModified: Date;
  readonly activeExecutions: ExecutionId[];
  readonly activePartitions: PartitionId[];
  readonly activeWorkers: WorkerId[];
}
