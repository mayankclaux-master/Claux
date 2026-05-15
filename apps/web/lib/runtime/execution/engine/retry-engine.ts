/**
 * CLAUX Runtime Execution Engine - Retry Engine
 * 
 * Manages retry logic for failed tasks and executions.
 * No external dependencies - pure retry logic.
 */

import type { TaskId } from '../../contracts';
import { TaskStateMachine } from '../state';
import { RetryExhaustedError, RetryFailedError } from '../errors';

/**
 * Retry Strategy
 */
export interface RetryStrategy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly exponentialBackoff: boolean;
  readonly jitter: boolean;
}

/**
 * Retry Result
 */
export interface RetryResult {
  readonly retried: boolean;
  readonly attempts: number;
  readonly nextAttemptAt?: Date;
  readonly reason: string;
}

/**
 * Retry Engine
 * 
 * Manages retry logic for failed tasks.
 */
export class RetryEngine {
  private taskStateMachines: Map<TaskId, TaskStateMachine>;
  private retryStrategy: RetryStrategy;
  private retryCount: Map<TaskId, number> = new Map();

  constructor(
    taskStateMachines: Map<TaskId, TaskStateMachine>,
    retryStrategy?: RetryStrategy
  ) {
    this.taskStateMachines = taskStateMachines;
    this.retryStrategy = retryStrategy || {
      maxAttempts: 3,
      backoffMs: 1000,
      exponentialBackoff: true,
      jitter: true,
    };
  }

  /**
   * Retry failed task
   */
  async retryTask(taskId: TaskId): Promise<RetryResult> {
    const taskStateMachine = this.taskStateMachines.get(taskId);

    if (!taskStateMachine) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check if task is retryable
    if (!taskStateMachine.isRetryable()) {
      throw new RetryFailedError(taskId, new Error('Task is not retryable'));
    }

    // Get current retry count
    const currentAttempts = this.retryCount.get(taskId) ?? 0;

    // Check if max attempts reached
    if (currentAttempts >= this.retryStrategy.maxAttempts) {
      throw new RetryExhaustedError(taskId, currentAttempts, this.retryStrategy.maxAttempts);
    }

    // Calculate backoff
    const backoffMs = this.calculateBackoff(currentAttempts);
    const nextAttemptAt = new Date(Date.now() + backoffMs);

    // Increment retry count
    this.retryCount.set(taskId, currentAttempts + 1);

    // Transition to retrying
    taskStateMachine.toRetrying(`Retry attempt ${currentAttempts + 1}`);

    return {
      retried: true,
      attempts: currentAttempts + 1,
      nextAttemptAt,
      reason: `Task retried after ${backoffMs}ms backoff`,
    };
  }

  /**
   * Retry execution
   */
  async retryExecution(): Promise<RetryResult> {
    // Find all failed tasks that are retryable
    const retryableTasks: TaskId[] = [];

    for (const [taskId, taskStateMachine] of this.taskStateMachines) {
      if (taskStateMachine.isRetryable()) {
        retryableTasks.push(taskId);
      }
    }

    if (retryableTasks.length === 0) {
      return {
        retried: false,
        attempts: 0,
        reason: 'No retryable tasks found',
      };
    }

    // Retry all retryable tasks
    for (const taskId of retryableTasks) {
      try {
        await this.retryTask(taskId);
      } catch {
        // Continue with other tasks even if one fails to retry
      }
    }

    return {
      retried: true,
      attempts: retryableTasks.length,
      reason: `Retried ${retryableTasks.length} tasks`,
    };
  }

  /**
   * Check if task can be retried
   */
  canRetry(taskId: TaskId): boolean {
    const taskStateMachine = this.taskStateMachines.get(taskId);
    if (!taskStateMachine) {
      return false;
    }

    const currentAttempts = this.retryCount.get(taskId) ?? 0;
    return taskStateMachine.isRetryable() && currentAttempts < this.retryStrategy.maxAttempts;
  }

  /**
   * Get retry count for task
   */
  getRetryCount(taskId: TaskId): number {
    return this.retryCount.get(taskId) ?? 0;
  }

  /**
   * Reset retry count for task
   */
  resetRetryCount(taskId: TaskId): void {
    this.retryCount.delete(taskId);
  }

  /**
   * Reset all retry counts
   */
  resetAllRetryCounts(): void {
    this.retryCount.clear();
  }

  /**
   * Set retry strategy
   */
  setRetryStrategy(strategy: RetryStrategy): void {
    this.retryStrategy = strategy;
  }

  /**
   * Get retry strategy
   */
  getRetryStrategy(): RetryStrategy {
    return { ...this.retryStrategy };
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(attempt: number): number {
    let backoff = this.retryStrategy.backoffMs;

    if (this.retryStrategy.exponentialBackoff) {
      backoff = backoff * Math.pow(2, attempt);
    }

    if (this.retryStrategy.jitter) {
      backoff = backoff * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(backoff);
  }

  /**
   * Get retry statistics
   */
  getStatistics(): {
    totalRetries: number;
    tasksWithRetries: number;
    maxRetryCount: number;
    averageRetryCount: number;
  } {
    let totalRetries = 0;
    let maxRetryCount = 0;

    for (const count of this.retryCount.values()) {
      totalRetries += count;
      if (count > maxRetryCount) {
        maxRetryCount = count;
      }
    }

    const tasksWithRetries = this.retryCount.size;
    const averageRetryCount = tasksWithRetries > 0 ? totalRetries / tasksWithRetries : 0;

    return {
      totalRetries,
      tasksWithRetries,
      maxRetryCount,
      averageRetryCount,
    };
  }
}
