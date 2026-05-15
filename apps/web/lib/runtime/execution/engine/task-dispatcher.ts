/**
 * CLAUX Runtime Execution Engine - Task Dispatcher
 * 
 * Dispatches tasks for execution.
 * No external dependencies - pure dispatch logic.
 */

import type { TaskId } from '../../contracts';
import type { DAG, DAGNode } from '../types';
import { DependencyResolver, RunnableSelector, PriorityQueue, ConcurrencyController } from '../scheduler';
import { TaskRuntime } from '../runtime';
import { TaskStateMachine } from '../state';

/**
 * Task Dispatch Result
 */
export interface TaskDispatchResult {
  readonly dispatched: readonly TaskId[];
  readonly skipped: readonly TaskId[];
  readonly pending: readonly TaskId[];
}

/**
 * Task Dispatcher
 * 
 * Dispatches runnable tasks for execution.
 */
export class TaskDispatcher {
  private dependencyResolver: DependencyResolver;
  private runnableSelector: RunnableSelector;
  private priorityQueue: PriorityQueue<TaskId>;
  private concurrencyController: ConcurrencyController;
  private taskRuntimes: Map<TaskId, TaskRuntime> = new Map();

  constructor(
    dag: DAG,
    maxConcurrency: number
  ) {
    this.dependencyResolver = new DependencyResolver();
    this.runnableSelector = new RunnableSelector();
    this.priorityQueue = new PriorityQueue<TaskId>();
    this.concurrencyController = new ConcurrencyController(maxConcurrency);
  }

  /**
   * Dispatch runnable tasks
   */
  dispatch(
    taskStates: Map<TaskId, TaskStateMachine>
  ): TaskDispatchResult {
    // TODO: Implement using RunnableSelector API
    // Currently RunnableSelector constructor and method signatures mismatch
    return {
      dispatched: [],
      pending: [],
      skipped: [],
    };
  }

  /**
   * Get next task to execute
   */
  getNextTask(): TaskId | undefined {
    const item = this.priorityQueue.dequeue();
    return item?.item;
  }

  /**
   * Complete task execution
   */
  completeTask(taskId: TaskId): void {
    this.concurrencyController.completeExecution();
    const runtime = this.taskRuntimes.get(taskId);
    if (runtime) {
      runtime.complete();
    }
  }

  /**
   * Fail task execution
   */
  failTask(taskId: TaskId, error: Error): void {
    this.concurrencyController.completeExecution();
    const runtime = this.taskRuntimes.get(taskId);
    if (runtime) {
      runtime.fail(error);
    }
  }

  /**
   * Get task runtime
   */
  getTaskRuntime(taskId: TaskId): TaskRuntime | undefined {
    return this.taskRuntimes.get(taskId);
  }

  /**
   * Create task runtime
   */
  createTaskRuntime(taskId: TaskId, node: DAGNode): TaskRuntime {
    const runtime = new TaskRuntime(taskId, node);
    this.taskRuntimes.set(taskId, runtime);
    return runtime;
  }

  /**
   * Get concurrency controller
   */
  getConcurrencyController(): ConcurrencyController {
    return this.concurrencyController;
  }

  /**
   * Get dependency resolver
   */
  getDependencyResolver(): DependencyResolver {
    return this.dependencyResolver;
  }

  /**
   * Get runnable selector
   * Get priority queue
   */
  getPriorityQueue(): PriorityQueue<TaskId> {
    return this.priorityQueue;
  }

  /**
   * Get task priority
   */
  private getTaskPriority(taskId: TaskId): number {
    // TODO: Implement using DependencyResolver API
    // Currently DependencyResolver doesn't have getCriticalPath() method
    return 0;
  }

  /**
   * Get dispatch statistics
   */
  getStatistics(): {
    queueSize: number;
    activeExecutions: number;
    queuedExecutions: number;
    availableSlots: number;
    utilization: number;
  } {
    return {
      queueSize: this.priorityQueue.getSize(),
      activeExecutions: this.concurrencyController.getState().activeExecutions,
      queuedExecutions: this.concurrencyController.getState().queuedExecutions,
      availableSlots: this.concurrencyController.getAvailableSlots(),
      utilization: this.concurrencyController.getUtilization(),
    };
  }

  /**
   * Reset dispatcher
   */
  reset(): void {
    this.priorityQueue.clear();
    this.concurrencyController.reset();
    this.taskRuntimes.clear();
  }
}
