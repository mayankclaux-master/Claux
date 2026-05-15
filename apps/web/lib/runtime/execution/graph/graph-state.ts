/**
 * CLAUX Runtime Execution Engine - Graph State
 * 
 * Manages execution graph state during workflow execution.
 * No external dependencies - pure state management.
 */

import type {
  ExecutionId,
  TaskId,
  TaskStatus,
  CheckpointId,
} from '../../contracts';
import type {
  DAG,
  ExecutionGraphState,
  TaskExecutionState,
  ReplayContext,
} from '../types';
import { ExecutionStatus, TaskStatus as TaskStatusEnum } from '../../contracts';

/**
 * Graph State Manager
 * 
 * Manages the state of an execution graph during workflow execution.
 */
export class GraphStateManager {
  /**
   * Create initial graph state from DAG
   */
  createInitialState(
    executionId: ExecutionId,
    dag: DAG
  ): ExecutionGraphState {
    const taskStates = new Map<TaskId, TaskExecutionState>();

    for (const node of dag.nodes) {
      taskStates.set(node.taskId, {
        taskId: node.taskId,
        status: TaskStatusEnum.PENDING,
        attempts: 0,
        checkpointed: false,
      });
    }

    return {
      executionId,
      dag,
      taskStates,
      completedTasks: new Set(),
      failedTasks: new Set(),
      runnableTasks: new Set(dag.rootNodes),
      inProgressTasks: new Set(),
      cancelledTasks: new Set(),
    };
  }

  /**
   * Update task state
   */
  updateTaskState(
    state: ExecutionGraphState,
    taskId: TaskId,
    newStatus: TaskStatus,
    result?: unknown,
    error?: { readonly code: string; readonly message: string }
  ): ExecutionGraphState {
    const currentState = state.taskStates.get(taskId);

    if (!currentState) {
      throw new Error(`Task ${taskId} not found in graph state`);
    }

    const updatedTaskState: TaskExecutionState = {
      ...currentState,
      status: newStatus,
      attempts: currentState.attempts + (newStatus === TaskStatusEnum.RUNNING ? 1 : 0),
      startedAt: newStatus === TaskStatusEnum.RUNNING ? new Date() : currentState.startedAt,
      completedAt: (newStatus === TaskStatusEnum.COMPLETED || newStatus === TaskStatusEnum.FAILED)
        ? new Date()
        : currentState.completedAt,
      result,
      error: error ? { code: error.code, message: error.message, timestamp: new Date(), retryable: false, recoverable: false } : currentState.error,
      checkpointed: currentState.checkpointed,
    };

    const newTaskStates = new Map(state.taskStates);
    newTaskStates.set(taskId, updatedTaskState);

    // Update task sets based on status
    const newCompletedTasks = new Set(state.completedTasks);
    const newFailedTasks = new Set(state.failedTasks);
    const newInProgressTasks = new Set(state.inProgressTasks);
    const newCancelledTasks = new Set(state.cancelledTasks);

    if (newStatus === TaskStatusEnum.COMPLETED) {
      newCompletedTasks.add(taskId);
      newInProgressTasks.delete(taskId);
    } else if (newStatus === TaskStatusEnum.FAILED) {
      newFailedTasks.add(taskId);
      newInProgressTasks.delete(taskId);
    } else if (newStatus === TaskStatusEnum.RUNNING) {
      newInProgressTasks.add(taskId);
    } else if (newStatus === TaskStatusEnum.CANCELLED) {
      newCancelledTasks.add(taskId);
      newInProgressTasks.delete(taskId);
    }

    // Recalculate runnable tasks
    const newRunnableTasks = this.calculateRunnableTasks(state.dag, newTaskStates, newCompletedTasks);

    return {
      ...state,
      taskStates: newTaskStates,
      completedTasks: newCompletedTasks,
      failedTasks: newFailedTasks,
      runnableTasks: newRunnableTasks,
      inProgressTasks: newInProgressTasks,
      cancelledTasks: newCancelledTasks,
    };
  }

  /**
   * Calculate runnable tasks based on completed dependencies
   */
  private calculateRunnableTasks(
    dag: DAG,
    taskStates: Map<TaskId, TaskExecutionState>,
    completedTasks: Set<TaskId>
  ): Set<TaskId> {
    const runnableTasks = new Set<TaskId>();

    for (const node of dag.nodes) {
      const taskState = taskStates.get(node.taskId);

      // Skip if already completed, failed, cancelled, or in progress
      if (!taskState ||
          taskState.status === TaskStatusEnum.COMPLETED ||
          taskState.status === TaskStatusEnum.FAILED ||
          taskState.status === TaskStatusEnum.CANCELLED ||
          taskState.status === TaskStatusEnum.RUNNING) {
        continue;
      }

      // Check if all dependencies are completed
      const dependenciesCompleted = node.dependencies.every(dep =>
        completedTasks.has(dep)
      );

      if (dependenciesCompleted) {
        runnableTasks.add(node.taskId);
      }
    }

    return runnableTasks;
  }

  /**
   * Check if execution is complete
   */
  isExecutionComplete(state: ExecutionGraphState): boolean {
    return state.completedTasks.size + state.failedTasks.size + state.cancelledTasks.size === state.dag.nodes.length;
  }

  /**
   * Check if execution succeeded
   */
  isExecutionSuccessful(state: ExecutionGraphState): boolean {
    return state.completedTasks.size === state.dag.nodes.length && state.failedTasks.size === 0;
  }

  /**
   * Check if execution failed
   */
  isExecutionFailed(state: ExecutionGraphState): boolean {
    return state.failedTasks.size > 0 && !this.canContinueExecution(state);
  }

  /**
   * Check if execution can continue (has runnable tasks or in-progress tasks)
   */
  canContinueExecution(state: ExecutionGraphState): boolean {
    return state.runnableTasks.size > 0 || state.inProgressTasks.size > 0;
  }

  /**
   * Get task state
   */
  getTaskState(state: ExecutionGraphState, taskId: TaskId): TaskExecutionState | undefined {
    return state.taskStates.get(taskId);
  }

  /**
   * Set checkpoint ID
   */
  setCheckpointId(state: ExecutionGraphState, checkpointId: CheckpointId): ExecutionGraphState {
    return {
      ...state,
      checkpointId,
    };
  }

  /**
   * Set replay context
   */
  setReplayContext(state: ExecutionGraphState, replayContext: ReplayContext): ExecutionGraphState {
    return {
      ...state,
      replayContext,
    };
  }

  /**
   * Clone graph state
   */
  cloneState(state: ExecutionGraphState): ExecutionGraphState {
    return {
      ...state,
      taskStates: new Map(state.taskStates),
      completedTasks: new Set(state.completedTasks),
      failedTasks: new Set(state.failedTasks),
      runnableTasks: new Set(state.runnableTasks),
      inProgressTasks: new Set(state.inProgressTasks),
      cancelledTasks: new Set(state.cancelledTasks),
    };
  }

  /**
   * Restore graph state from checkpoint
   */
  restoreFromCheckpoint(
    executionId: ExecutionId,
    dag: DAG,
    serializedState: Map<TaskId, TaskExecutionState>,
    checkpointId: CheckpointId
  ): ExecutionGraphState {
    const taskStates = new Map(serializedState);
    const completedTasks = new Set<TaskId>();
    const failedTasks = new Set<TaskId>();
    const cancelledTasks = new Set<TaskId>();
    const inProgressTasks = new Set<TaskId>();

    for (const [taskId, taskState] of taskStates.entries()) {
      if (taskState.status === TaskStatusEnum.COMPLETED) {
        completedTasks.add(taskId);
      } else if (taskState.status === TaskStatusEnum.FAILED) {
        failedTasks.add(taskId);
      } else if (taskState.status === TaskStatusEnum.CANCELLED) {
        cancelledTasks.add(taskId);
      } else if (taskState.status === TaskStatusEnum.RUNNING) {
        inProgressTasks.add(taskId);
      }
    }

    const runnableTasks = this.calculateRunnableTasks(dag, taskStates, completedTasks);

    return {
      executionId,
      dag,
      taskStates,
      completedTasks,
      failedTasks,
      runnableTasks,
      inProgressTasks,
      cancelledTasks,
      checkpointId,
    };
  }

  /**
   * Get execution progress percentage
   */
  getExecutionProgress(state: ExecutionGraphState): number {
    const total = state.dag.nodes.length;
    const completed = state.completedTasks.size;
    const failed = state.failedTasks.size;
    const cancelled = state.cancelledTasks.size;

    return ((completed + failed + cancelled) / total) * 100;
  }

  /**
   * Get remaining task count
   */
  getRemainingTaskCount(state: ExecutionGraphState): number {
    return state.dag.nodes.length - state.completedTasks.size - state.failedTasks.size - state.cancelledTasks.size;
  }
}
