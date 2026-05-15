/**
 * CLAUX Runtime Execution Engine - Cancellation Engine
 * 
 * Manages cancellation of executions and tasks.
 * No external dependencies - pure cancellation logic.
 */

import type { TaskId } from '../../contracts';
import { ExecutionStatus } from '../../contracts';
import { ExecutionStateMachine } from '../state';
import { TaskStateMachine } from '../state';
import { CancellationTimeoutError, CancellationFailedError } from '../errors';

/**
 * Cancellation Result
 */
export interface CancellationResult {
  readonly executionCancelled: boolean;
  readonly tasksCancelled: readonly TaskId[];
  readonly tasksSkipped: readonly TaskId[];
  readonly duration: number;
}

/**
 * Cancellation Engine
 * 
 * Manages cancellation of executions and tasks.
 */
export class CancellationEngine {
  private executionStateMachine: ExecutionStateMachine;
  private taskStateMachines: Map<TaskId, TaskStateMachine>;
  private timeoutMs: number;

  constructor(
    executionStateMachine: ExecutionStateMachine,
    taskStateMachines: Map<TaskId, TaskStateMachine>,
    timeoutMs: number = 30000
  ) {
    this.executionStateMachine = executionStateMachine;
    this.taskStateMachines = taskStateMachines;
    this.timeoutMs = timeoutMs;
  }

  /**
   * Cancel execution
   */
  async cancel(reason: string): Promise<CancellationResult> {
    const startTime = Date.now();

    // Check if execution can be cancelled
    if (!this.executionStateMachine.canTransitionToCancelled()) {
      throw new CancellationFailedError(
        undefined,
        new Error(`Execution cannot be cancelled in current state: ${this.executionStateMachine.getCurrentState()}`)
      );
    }

    // Cancel execution
    this.executionStateMachine.toCancelled(reason);

    // Cancel all active tasks
    const tasksCancelled: TaskId[] = [];
    const tasksSkipped: TaskId[] = [];

    for (const [taskId, taskStateMachine] of this.taskStateMachines) {
      if (taskStateMachine.canTransitionToCancelled()) {
        taskStateMachine.toCancelled(reason);
        tasksCancelled.push(taskId);
      } else if (!taskStateMachine.isCurrentTerminal()) {
        // Task cannot be cancelled but is not terminal - skip it
        tasksSkipped.push(taskId);
      }
    }

    // Wait for cancellation to complete
    await this.waitForCancellation(startTime);

    const duration = Date.now() - startTime;

    return {
      executionCancelled: true,
      tasksCancelled,
      tasksSkipped,
      duration,
    };
  }

  /**
   * Cancel specific task
   */
  async cancelTask(taskId: TaskId, reason: string): Promise<boolean> {
    const taskStateMachine = this.taskStateMachines.get(taskId);

    if (!taskStateMachine) {
      return false;
    }

    if (!taskStateMachine.canTransitionToCancelled()) {
      return false;
    }

    taskStateMachine.toCancelled(reason);
    return true;
  }

  /**
   * Cancel multiple tasks
   */
  async cancelTasks(taskIds: readonly TaskId[], reason: string): Promise<readonly TaskId[]> {
    const cancelled: TaskId[] = [];

    for (const taskId of taskIds) {
      const success = await this.cancelTask(taskId, reason);
      if (success) {
        cancelled.push(taskId);
      }
    }

    return cancelled;
  }

  /**
   * Check if execution is cancelled
   */
  isCancelled(): boolean {
    return this.executionStateMachine.getCurrentState() === ExecutionStatus.CANCELLED;
  }

  /**
   * Check if task is cancelled
   */
  isTaskCancelled(taskId: TaskId): boolean {
    const taskStateMachine = this.taskStateMachines.get(taskId);
    return taskStateMachine?.getCurrentState() === 'cancelled';
  }

  /**
   * Get cancellation statistics
   */
  getStatistics(): {
    executionCancelled: boolean;
    activeTasks: number;
    cancelledTasks: number;
    terminalTasks: number;
  } {
    let activeTasks = 0;
    let cancelledTasks = 0;
    let terminalTasks = 0;

    for (const taskStateMachine of this.taskStateMachines.values()) {
      if (taskStateMachine.getCurrentState() === 'cancelled') {
        cancelledTasks++;
      } else if (taskStateMachine.isCurrentTerminal()) {
        terminalTasks++;
      } else {
        activeTasks++;
      }
    }

    return {
      executionCancelled: this.isCancelled(),
      activeTasks,
      cancelledTasks,
      terminalTasks,
    };
  }

  /**
   * Wait for cancellation to complete
   */
  private async waitForCancellation(startTime: number): Promise<void> {
    const elapsed = Date.now() - startTime;
    const remaining = this.timeoutMs - elapsed;

    if (remaining <= 0) {
      throw new CancellationTimeoutError('', this.timeoutMs);
    }

    // Wait for tasks to complete cancellation
    await new Promise(resolve => setTimeout(resolve, Math.min(remaining, 100)));
  }

  /**
   * Set cancellation timeout
   */
  setTimeout(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Get cancellation timeout
   */
  getTimeout(): number {
    return this.timeoutMs;
  }
}
