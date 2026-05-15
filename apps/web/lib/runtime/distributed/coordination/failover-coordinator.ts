/**
 * CLAUX Runtime Distributed Layer - Failover Coordinator
 * 
 * Coordinates failover operations and recovery.
 * No external dependencies - pure coordination semantics.
 */

import type { WorkerId, ExecutionId, PartitionId, FailoverInfo, FailoverMetadata, FailoverTrigger } from '../types';
import { FailoverTrigger as FailoverTriggerEnum } from '../types';
import { DEFAULT_FAILOVER_TIMEOUT_MS, MAX_CONCURRENT_FAILOVERS, CHECKPOINT_PRESERVATION_TIMEOUT_MS, REPLAY_MIGRATION_TIMEOUT_MS } from '../constants';
import { FailoverError, FailoverTimeoutError } from '../errors';

/**
 * Failover Coordinator Configuration
 */
export interface FailoverCoordinatorConfig {
  readonly timeoutMs: number;
  readonly maxConcurrentFailovers: number;
  readonly checkpointPreservationTimeoutMs: number;
  readonly replayMigrationTimeoutMs: number;
}

/**
 * Failover Coordinator
 * 
 * Coordinates failover operations and recovery across workers.
 */
export class FailoverCoordinator {
  private config: FailoverCoordinatorConfig;
  private activeFailovers: Map<string, FailoverInfo> = new Map();
  private failoverHistory: FailoverInfo[] = [];
  private pendingFailovers: Set<string> = new Set();

  constructor(config: Partial<FailoverCoordinatorConfig> = {}) {
    this.config = {
      timeoutMs: config.timeoutMs || DEFAULT_FAILOVER_TIMEOUT_MS,
      maxConcurrentFailovers: config.maxConcurrentFailovers || MAX_CONCURRENT_FAILOVERS,
      checkpointPreservationTimeoutMs: config.checkpointPreservationTimeoutMs || CHECKPOINT_PRESERVATION_TIMEOUT_MS,
      replayMigrationTimeoutMs: config.replayMigrationTimeoutMs || REPLAY_MIGRATION_TIMEOUT_MS,
    };
  }

  /**
   * Initiate failover for worker
   */
  async initiateFailover(
    sourceWorker: WorkerId,
    targetWorker: WorkerId,
    trigger: FailoverTrigger,
    reason: string
  ): Promise<FailoverInfo> {
    // Check if we can start a new failover
    if (this.activeFailovers.size >= this.config.maxConcurrentFailovers) {
      throw new FailoverError('Maximum concurrent failovers reached', sourceWorker, targetWorker);
    }

    const failoverId = this.generateFailoverId();
    const metadata: FailoverMetadata = {
      failoverId,
      trigger,
      sourceWorker,
      targetWorker,
      timestamp: new Date(),
      reason,
    };

    let failoverInfo: FailoverInfo = {
      metadata,
      affectedExecutions: [],
      affectedPartitions: [],
      checkpointPreserved: false,
      replayPreserved: false,
      completed: false,
    };

    this.activeFailovers.set(failoverId, failoverInfo);
    this.pendingFailovers.add(failoverId);

    try {
      // Preserve checkpoints
      await this.preserveCheckpoints(sourceWorker, targetWorker);
      failoverInfo = {
        ...failoverInfo,
        checkpointPreserved: true,
      };
      this.activeFailovers.set(failoverId, failoverInfo);

      // Migrate replays
      await this.migrateReplays(sourceWorker, targetWorker);
      failoverInfo = {
        ...failoverInfo,
        replayPreserved: true,
      };
      this.activeFailovers.set(failoverId, failoverInfo);

      // Transfer ownership
      await this.transferOwnership(sourceWorker, targetWorker, failoverInfo);

      failoverInfo = {
        ...failoverInfo,
        completed: true,
      };
      this.activeFailovers.set(failoverId, failoverInfo);
      this.failoverHistory.push(failoverInfo);
    } catch (error) {
      failoverInfo = {
        ...failoverInfo,
        completed: false,
      };
      this.activeFailovers.set(failoverId, failoverInfo);
      throw error;
    } finally {
      this.pendingFailovers.delete(failoverId);
    }

    return failoverInfo;
  }

  /**
   * Complete failover
   */
  completeFailover(failoverId: string): void {
    const failover = this.activeFailovers.get(failoverId);
    if (!failover) {
      throw new Error(`Failover ${failoverId} not found`);
    }

    const completedFailover = {
      ...failover,
      completed: true,
    };
    this.failoverHistory.push(completedFailover);
    this.activeFailovers.delete(failoverId);
  }

  /**
   * Get failover info
   */
  getFailover(failoverId: string): FailoverInfo | undefined {
    const failover = this.activeFailovers.get(failoverId);
    return failover ? { ...failover } : undefined;
  }

  /**
   * Get all active failovers
   */
  getActiveFailovers(): readonly FailoverInfo[] {
    return Array.from(this.activeFailovers.values()).map(f => ({ ...f }));
  }

  /**
   * Get failover history
   */
  getFailoverHistory(): readonly FailoverInfo[] {
    return [...this.failoverHistory];
  }

  /**
   * Check if worker is failing over
   */
  isFailingOver(workerId: WorkerId): boolean {
    for (const failover of this.activeFailovers.values()) {
      if (failover.metadata.sourceWorker === workerId || failover.metadata.targetWorker === workerId) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get affected executions for worker
   */
  getAffectedExecutions(workerId: WorkerId): readonly ExecutionId[] {
    const executions: ExecutionId[] = [];
    for (const failover of this.activeFailovers.values()) {
      if (failover.metadata.sourceWorker === workerId) {
        executions.push(...failover.affectedExecutions);
      }
    }
    return executions;
  }

  /**
   * Get affected partitions for worker
   */
  getAffectedPartitions(workerId: WorkerId): readonly PartitionId[] {
    const partitions: PartitionId[] = [];
    for (const failover of this.activeFailovers.values()) {
      if (failover.metadata.sourceWorker === workerId) {
        partitions.push(...failover.affectedPartitions);
      }
    }
    return partitions;
  }

  /**
   * Preserve checkpoints during failover
   */
  private async preserveCheckpoints(sourceWorker: WorkerId, targetWorker: WorkerId): Promise<void> {
    // In production, this would coordinate checkpoint preservation
    // For now, we simulate the operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Migrate replays during failover
   */
  private async migrateReplays(sourceWorker: WorkerId, targetWorker: WorkerId): Promise<void> {
    // In production, this would coordinate replay migration
    // For now, we simulate the operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Transfer ownership during failover
   */
  private async transferOwnership(sourceWorker: WorkerId, targetWorker: WorkerId, failoverInfo: FailoverInfo): Promise<void> {
    // In production, this would coordinate ownership transfer
    // For now, we simulate the operation
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Check failover timeout
   */
  checkTimeout(failoverId: string): boolean {
    const failover = this.activeFailovers.get(failoverId);
    if (!failover) return false;

    const elapsed = Date.now() - failover.metadata.timestamp.getTime();
    return elapsed > this.config.timeoutMs;
  }

  /**
   * Get failover statistics
   */
  getStatistics(): {
    activeFailovers: number;
    completedFailovers: number;
    failedFailovers: number;
    failoverByTrigger: Map<FailoverTrigger, number>;
    averageFailoverDuration: number;
  } {
    const failoverByTrigger = new Map<FailoverTrigger, number>();
    let totalDuration = 0;

    for (const failover of this.failoverHistory) {
      const count = failoverByTrigger.get(failover.metadata.trigger) || 0;
      failoverByTrigger.set(failover.metadata.trigger, count + 1);
      // Duration would be calculated from start/end times in production
    }

    const completedCount = this.failoverHistory.filter(f => f.completed).length;
    const failedCount = this.failoverHistory.filter(f => !f.completed).length;
    const avgDuration = completedCount > 0 ? totalDuration / completedCount : 0;

    return {
      activeFailovers: this.activeFailovers.size,
      completedFailovers: completedCount,
      failedFailovers: failedCount,
      failoverByTrigger,
      averageFailoverDuration: avgDuration,
    };
  }

  /**
   * Generate failover ID
   */
  private generateFailoverId(): string {
    return `failover_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Reset coordinator
   */
  reset(): void {
    this.activeFailovers.clear();
    this.failoverHistory = [];
    this.pendingFailovers.clear();
  }

  /**
   * Get configuration
   */
  getConfig(): FailoverCoordinatorConfig {
    return { ...this.config };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<FailoverCoordinatorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
