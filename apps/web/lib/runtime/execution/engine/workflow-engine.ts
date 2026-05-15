/**
 * CLAUX Runtime Execution Engine - Workflow Engine
 * 
 * Main orchestration engine for workflow execution.
 * No external dependencies - pure orchestration logic.
 */

import type { ExecutionId, ExecutionStatus } from '../../contracts';
import type { DAG, ExecutionGraphState } from '../types';
import { ExecutionStateMachine } from '../state';
import { TaskStateMachine } from '../state';
import { GraphStateManager } from '../graph';
import { TaskDispatcher } from './task-dispatcher';
import { ExecutionLoop } from './execution-loop';
import { CancellationEngine } from './cancellation-engine';
import { RetryEngine } from './retry-engine';
import { CheckpointEngine } from './checkpoint-engine';
import { DAGEngine } from './dag-engine';
import { ExecutionFailedError, DAGValidationError } from '../errors';

/**
 * Workflow Engine Configuration
 */
export interface WorkflowEngineConfig {
  readonly maxConcurrency: number;
  readonly checkpointIntervalMs: number;
  readonly retryMaxAttempts: number;
  readonly cancellationTimeoutMs: number;
}

/**
 * Workflow Execution Result
 */
export interface WorkflowExecutionResult {
  readonly executionId: ExecutionId;
  readonly status: ExecutionStatus;
  readonly duration: number;
  readonly tasksCompleted: number;
  readonly tasksFailed: number;
  readonly tasksCancelled: number;
  readonly checkpointsCreated: number;
  readonly retriesAttempted: number;
}

/**
 * Workflow Engine
 * 
 * Main orchestration engine for workflow execution.
 */
export class WorkflowEngine {
  private executionId: ExecutionId;
  private executionStateMachine: ExecutionStateMachine;
  private taskStateMachines: Map<string, TaskStateMachine>;
  private graphStateManager: GraphStateManager;
  private taskDispatcher: TaskDispatcher;
  private executionLoop: ExecutionLoop;
  private cancellationEngine: CancellationEngine;
  private retryEngine: RetryEngine;
  private checkpointEngine: CheckpointEngine;
  private dagEngine: DAGEngine;
  private config: WorkflowEngineConfig;
  private startTime: Date | null = null;

  constructor(
    executionId: ExecutionId,
    dag: DAG,
    config?: WorkflowEngineConfig
  ) {
    this.executionId = executionId;
    this.config = config || {
      maxConcurrency: 10,
      checkpointIntervalMs: 60000,
      retryMaxAttempts: 3,
      cancellationTimeoutMs: 30000,
    };

    // Initialize state machines
    this.executionStateMachine = new ExecutionStateMachine();
    this.taskStateMachines = this.initializeTaskStateMachines(dag);

    // Initialize graph state manager
    this.graphStateManager = new GraphStateManager();

    // Initialize engines
    this.taskDispatcher = new TaskDispatcher(dag, this.config.maxConcurrency);
    this.executionLoop = new ExecutionLoop(
      this.executionStateMachine,
      this.taskStateMachines,
      this.graphStateManager,
      this.taskDispatcher,
      {
        maxParallelism: this.config.maxConcurrency,
        pollIntervalMs: 100,
        checkpointIntervalMs: this.config.checkpointIntervalMs,
      }
    );
    this.cancellationEngine = new CancellationEngine(
      this.executionStateMachine,
      this.taskStateMachines,
      this.config.cancellationTimeoutMs
    );
    this.retryEngine = new RetryEngine(this.taskStateMachines, {
      maxAttempts: this.config.retryMaxAttempts,
      backoffMs: 1000,
      exponentialBackoff: true,
      jitter: true,
    });
    this.checkpointEngine = new CheckpointEngine({
      autoCheckpoint: true,
      checkpointIntervalMs: this.config.checkpointIntervalMs,
      maxCheckpoints: 10,
    });
    this.dagEngine = new DAGEngine(this.graphStateManager);
  }

  /**
   * Execute workflow
   */
  async execute(): Promise<WorkflowExecutionResult> {
    this.startTime = new Date();

    try {
      // Initialize DAG
      await this.dagEngine.initialize();

      // Start execution
      this.executionStateMachine.toRunning('Workflow execution started');

      // Start execution loop
      await this.executionLoop.start();

      // Get final status
      const status = this.executionStateMachine.getCurrentState();
      const duration = Date.now() - this.startTime.getTime();

      return this.buildResult(status, duration);
    } catch (error) {
      this.executionStateMachine.toFailed(`Workflow execution failed: ${error}`);
      throw new ExecutionFailedError(this.executionId, error as Error);
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancel(reason: string): Promise<void> {
    await this.cancellationEngine.cancel(reason);
  }

  /**
   * Retry workflow execution
   */
  async retry(): Promise<void> {
    await this.retryEngine.retryExecution();
  }

  /**
   * Create checkpoint
   */
  async createCheckpoint(): Promise<void> {
    // TODO: Implement using GraphStateManager API
    // Currently GraphStateManager doesn't have getGraphState() method
  }

  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(checkpointId: string): Promise<void> {
    // TODO: Implement using GraphStateManager API
    // Currently GraphStateManager doesn't have updateGraphState() method
  }

  /**
   * Pause execution
   */
  pause(): void {
    this.executionLoop.pause();
    this.executionStateMachine.toPaused('Workflow execution paused');
  }

  /**
   * Resume execution
   */
  resume(): void {
    this.executionLoop.resume();
    this.executionStateMachine.toRunning('Workflow execution resumed');
  }

  /**
   * Get status
   */
  getStatus(): ExecutionStatus {
    return this.executionStateMachine.getCurrentState();
  }

  /**
   * Get progress
   */
  getProgress(): number {
    // TODO: Implement using GraphStateManager API
    // Currently GraphStateManager doesn't have getGraphState() method
    return 0;
  }

  /**
   * Get workflow statistics
   */
  getStatistics(): {
    executionId: ExecutionId;
    status: ExecutionStatus;
    progress: number;
    duration: number;
    tasksCompleted: number;
    tasksFailed: number;
    tasksInProgress: number;
    checkpointsCreated: number;
    retriesAttempted: number;
  } {
    // TODO: Implement using GraphStateManager API
    // Currently GraphStateManager doesn't have getGraphState() method
    const duration = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const checkpointStats = this.checkpointEngine.getStatistics();
    const retryStats = this.retryEngine.getStatistics();

    return {
      executionId: this.executionId,
      status: this.getStatus(),
      progress: this.getProgress(),
      duration,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksInProgress: 0,
      checkpointsCreated: checkpointStats.totalCheckpoints,
      retriesAttempted: retryStats.totalRetries,
    };
  }

  /**
   * Initialize task state machines
   */
  private initializeTaskStateMachines(dag: DAG): Map<string, TaskStateMachine> {
    const taskStateMachines = new Map<string, TaskStateMachine>();

    for (const node of dag.nodes) {
      taskStateMachines.set(node.taskId, new TaskStateMachine());
    }

    return taskStateMachines;
  }

  /**
   * Build execution result
   */
  private buildResult(status: ExecutionStatus, duration: number): WorkflowExecutionResult {
    // TODO: Implement using GraphStateManager API
    // Currently GraphStateManager doesn't have getGraphState() method
    const checkpointStats = this.checkpointEngine.getStatistics();
    const retryStats = this.retryEngine.getStatistics();

    return {
      executionId: this.executionId,
      status,
      duration,
      tasksCompleted: 0,
      tasksFailed: 0,
      tasksCancelled: 0,
      checkpointsCreated: checkpointStats.totalCheckpoints,
      retriesAttempted: retryStats.totalRetries,
    };
  }

  /**
   * Get DAG engine
   */
  getDAGEngine(): DAGEngine {
    return this.dagEngine;
  }

  /**
   * Get task dispatcher
   */
  getTaskDispatcher(): TaskDispatcher {
    return this.taskDispatcher;
  }

  /**
   * Get cancellation engine
   */
  getCancellationEngine(): CancellationEngine {
    return this.cancellationEngine;
  }

  /**
   * Get retry engine
   */
  getRetryEngine(): RetryEngine {
    return this.retryEngine;
  }

  /**
   * Get checkpoint engine
   */
  getCheckpointEngine(): CheckpointEngine {
    return this.checkpointEngine;
  }
}
