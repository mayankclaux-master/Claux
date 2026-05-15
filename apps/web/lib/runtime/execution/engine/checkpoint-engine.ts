/**
 * CLAUX Runtime Execution Engine - Checkpoint Engine
 * 
 * Manages checkpointing and restoration of execution state.
 * No external dependencies - pure checkpoint logic.
 */

import type { TaskId, ExecutionId, RuntimeCheckpoint, CheckpointId, CheckpointType, CheckpointStatus, CheckpointState } from '../../contracts';
import type { ExecutionGraphState } from '../types';
import { CheckpointFailedError, CheckpointRestoreFailedError } from '../errors';
import { CheckpointType as CheckpointTypeEnum, CheckpointStatus as CheckpointStatusEnum } from '../../contracts/checkpoint.contract';

/**
 * Checkpoint Engine Configuration
 */
export interface CheckpointEngineConfig {
  readonly autoCheckpoint: boolean;
  readonly checkpointIntervalMs: number;
  readonly maxCheckpoints: number;
}

/**
 * Checkpoint Metadata
 */
export interface CheckpointMetadata {
  readonly executionId: ExecutionId;
  readonly checkpointId: CheckpointId;
  readonly timestamp: Date;
  readonly taskCount: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
}

/**
 * Checkpoint Engine
 * 
 * Manages checkpointing and restoration of execution state.
 */
export class CheckpointEngine {
  private config: CheckpointEngineConfig;
  private checkpoints: Map<CheckpointId, RuntimeCheckpoint> = new Map();
  private checkpointMetadata: Map<CheckpointId, CheckpointMetadata> = new Map();
  private lastCheckpointTime: Date | null = null;

  constructor(config?: CheckpointEngineConfig) {
    this.config = config || {
      autoCheckpoint: true,
      checkpointIntervalMs: 60000,
      maxCheckpoints: 10,
    };
  }

  /**
   * Create checkpoint
   */
  async createCheckpoint(
    executionId: ExecutionId,
    graphState: ExecutionGraphState
  ): Promise<RuntimeCheckpoint> {
    const checkpointId = this.generateCheckpointId();
    const timestamp = new Date();

    const checkpoint: RuntimeCheckpoint = {
      checkpointId,
      checkpointType: CheckpointTypeEnum.EXECUTION,
      targetId: executionId,
      timestamp,
      status: CheckpointStatusEnum.ACTIVE,
      state: {
        version: '1.0',
        data: JSON.parse(this.serializeGraphState(graphState)) as Record<string, unknown>,
        completedSteps: Array.from(graphState.completedTasks),
        progress: graphState.completedTasks.size / graphState.dag.nodes.length,
      },
      metadata: {
        createdBy: 'execution-engine',
        createdAt: timestamp,
        customMetadata: {
          taskCount: graphState.dag.nodes.length,
          completedTasks: graphState.completedTasks.size,
          failedTasks: graphState.failedTasks.size,
          inProgressTasks: graphState.inProgressTasks.size,
        },
      },
    };

    // Store checkpoint
    this.checkpoints.set(checkpointId, checkpoint);
    this.checkpointMetadata.set(checkpointId, {
      executionId,
      checkpointId,
      timestamp,
      taskCount: graphState.dag.nodes.length,
      completedTasks: graphState.completedTasks.size,
      failedTasks: graphState.failedTasks.size,
    });

    // Enforce max checkpoints limit
    this.enforceMaxCheckpoints();

    this.lastCheckpointTime = timestamp;

    return checkpoint;
  }

  /**
   * Restore checkpoint
   */
  async restoreCheckpoint(checkpointId: CheckpointId): Promise<ExecutionGraphState> {
    const checkpoint = this.checkpoints.get(checkpointId);

    if (!checkpoint) {
      throw new CheckpointRestoreFailedError(checkpointId, new Error('Checkpoint not found'));
    }

    try {
      const graphState = this.deserializeGraphState(JSON.stringify(checkpoint.state.data));
      return graphState;
    } catch (error) {
      throw new CheckpointRestoreFailedError(checkpointId, new Error(`Failed to deserialize checkpoint: ${error}`));
    }
  }

  /**
   * Get checkpoint
   */
  getCheckpoint(checkpointId: CheckpointId): RuntimeCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Get all checkpoints for execution
   */
  getCheckpointsForExecution(executionId: ExecutionId): readonly RuntimeCheckpoint[] {
    const checkpoints: RuntimeCheckpoint[] = [];

    for (const checkpoint of this.checkpoints.values()) {
      if (checkpoint.targetId === executionId) {
        checkpoints.push(checkpoint);
      }
    }

    return checkpoints.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get checkpoint by execution
   */
  getCheckpointByExecution(executionId: ExecutionId): RuntimeCheckpoint | undefined {
    return Array.from(this.checkpoints.values()).find(cp => cp.targetId === executionId);
  }

  /**
   * Get latest checkpoint for execution
   */
  getLatestCheckpoint(executionId: ExecutionId): RuntimeCheckpoint | undefined {
    const checkpoints = this.getCheckpointsForExecution(executionId);
    return checkpoints[checkpoints.length - 1];
  }

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(checkpointId: CheckpointId): boolean {
    this.checkpointMetadata.delete(checkpointId);
    return this.checkpoints.delete(checkpointId);
  }

  /**
   * Delete all checkpoints for execution
   */
  deleteCheckpointsForExecution(executionId: ExecutionId): number {
    let deleted = 0;

    for (const [checkpointId, checkpoint] of this.checkpoints) {
      if (checkpoint.targetId === executionId) {
        this.checkpoints.delete(checkpointId);
        this.checkpointMetadata.delete(checkpointId);
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Clear all checkpoints
   */
  clearAllCheckpoints(): void {
    this.checkpoints.clear();
    this.checkpointMetadata.clear();
    this.lastCheckpointTime = null;
  }

  /**
   * Check if auto-checkpoint is enabled
   */
  shouldCheckpoint(): boolean {
    if (!this.config.autoCheckpoint) {
      return false;
    }

    if (!this.lastCheckpointTime) {
      return true;
    }

    const elapsed = Date.now() - this.lastCheckpointTime.getTime();
    return elapsed >= this.config.checkpointIntervalMs;
  }

  /**
   * Get checkpoint metadata
   */
  getCheckpointMetadata(checkpointId: CheckpointId): CheckpointMetadata | undefined {
    return this.checkpointMetadata.get(checkpointId);
  }

  /**
   * Get checkpoint statistics
   */
  getStatistics(): {
    totalCheckpoints: number;
    checkpointsByExecution: Map<ExecutionId, number>;
    oldestCheckpoint: Date | null;
    newestCheckpoint: Date | null;
  } {
    const checkpointsByExecution = new Map<ExecutionId, number>();
    let oldest: Date | null = null;
    let newest: Date | null = null;

    for (const checkpoint of this.checkpoints.values()) {
      const count = checkpointsByExecution.get(checkpoint.targetId) ?? 0;
      checkpointsByExecution.set(checkpoint.targetId, count + 1);

      const timestamp = new Date(checkpoint.timestamp);
      if (!oldest || timestamp < oldest) {
        oldest = timestamp;
      }
      if (!newest || timestamp > newest) {
        newest = timestamp;
      }
    }

    return {
      totalCheckpoints: this.checkpoints.size,
      checkpointsByExecution,
      oldestCheckpoint: oldest,
      newestCheckpoint: newest,
    };
  }

  /**
   * Set configuration
   */
  setConfig(config: Partial<CheckpointEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get configuration
   */
  getConfig(): CheckpointEngineConfig {
    return { ...this.config };
  }

  /**
   * Generate checkpoint ID
   */
  private generateCheckpointId(): CheckpointId {
    return `ckpt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}` as CheckpointId;
  }

  /**
   * Serialize graph state
   */
  private serializeGraphState(graphState: ExecutionGraphState): string {
    return JSON.stringify({
      taskStates: Array.from(graphState.taskStates.entries()),
      completedTasks: Array.from(graphState.completedTasks),
      failedTasks: Array.from(graphState.failedTasks),
      inProgressTasks: Array.from(graphState.inProgressTasks),
      cancelledTasks: Array.from(graphState.cancelledTasks),
    });
  }

  /**
   * Deserialize graph state
   */
  private deserializeGraphState(data: string): ExecutionGraphState {
    const parsed = JSON.parse(data);
    // In a real implementation, this would reconstruct the full ExecutionGraphState
    return parsed as ExecutionGraphState;
  }

  /**
   * Enforce max checkpoints limit
   */
  private enforceMaxCheckpoints(): void {
    if (this.checkpoints.size <= this.config.maxCheckpoints) {
      return;
    }

    // Remove oldest checkpoints
    const sortedCheckpoints = Array.from(this.checkpoints.entries())
      .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());

    const toRemove = sortedCheckpoints.length - this.config.maxCheckpoints;

    for (let i = 0; i < toRemove; i++) {
      const [checkpointId] = sortedCheckpoints[i];
      this.checkpoints.delete(checkpointId);
      this.checkpointMetadata.delete(checkpointId);
    }
  }
}
