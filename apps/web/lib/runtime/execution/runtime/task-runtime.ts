/**
 * CLAUX Runtime Execution Engine - Task Runtime
 * 
 * Manages task execution lifecycle.
 * No external dependencies - pure task runtime logic.
 */

import type { TaskId, TaskStatus, RuntimeEvent } from '../../contracts';
import type { TaskExecutionState, DAGNode } from '../types';
import { TaskStateMachine } from '../state';

/**
 * Task Runtime Context
 */
export interface TaskRuntimeContext {
  readonly taskId: TaskId;
  readonly node: DAGNode;
  readonly stateMachine: TaskStateMachine;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly result?: unknown;
  readonly error?: Error;
  readonly metadata: Record<string, unknown>;
}

/**
 * Task Runtime
 * 
 * Manages the runtime context for individual task execution.
 */
export class TaskRuntime {
  private context: TaskRuntimeContext;
  private eventHandlers: Map<string, (event: RuntimeEvent) => void> = new Map();

  constructor(taskId: TaskId, node: DAGNode) {
    this.context = {
      taskId,
      node,
      stateMachine: new TaskStateMachine(),
      startTime: new Date(),
      metadata: {},
    };
  }

  /**
   * Get task context
   */
  getContext(): TaskRuntimeContext {
    return this.context;
  }

  /**
   * Get task ID
   */
  getTaskId(): TaskId {
    return this.context.taskId;
  }

  /**
   * Get DAG node
   */
  getNode(): DAGNode {
    return this.context.node;
  }

  /**
   * Get state machine
   */
  getStateMachine(): TaskStateMachine {
    return this.context.stateMachine;
  }

  /**
   * Get task status
   */
  getStatus(): TaskStatus {
    return this.context.stateMachine.getCurrentState();
  }

  /**
   * Start task
   */
  start(): void {
    this.context.stateMachine.toRunning('Task started');
  }

  /**
   * Complete task
   */
  complete(result?: unknown): void {
    this.context.stateMachine.toCompleted('Task completed');
    if (result !== undefined) {
      (this.context as { result?: unknown }).result = result;
    }
    (this.context as { endTime?: Date }).endTime = new Date();
  }

  /**
   * Fail task
   */
  fail(error: Error): void {
    this.context.stateMachine.toFailed(`Task failed: ${error.message}`);
    (this.context as { error?: Error }).error = error;
    (this.context as { endTime?: Date }).endTime = new Date();
  }

  /**
   * Cancel task
   */
  cancel(reason: string): void {
    this.context.stateMachine.toCancelled(reason);
    (this.context as { endTime?: Date }).endTime = new Date();
  }

  /**
   * Retry task
   */
  retry(reason: string): void {
    this.context.stateMachine.toRetrying(reason);
  }

  /**
   * Skip task
   */
  skip(reason: string): void {
    this.context.stateMachine.toSkipped(reason);
    (this.context as { endTime?: Date }).endTime = new Date();
  }

  /**
   * Get task result
   */
  getResult(): unknown {
    return this.context.result;
  }

  /**
   * Get task error
   */
  getError(): Error | undefined {
    return this.context.error;
  }

  /**
   * Get task duration
   */
  getDuration(): number {
    const endTime = this.context.endTime || new Date();
    return endTime.getTime() - this.context.startTime.getTime();
  }

  /**
   * Set metadata
   */
  setMetadata(key: string, value: unknown): void {
    this.context.metadata[key] = value;
  }

  /**
   * Get metadata
   */
  getMetadata(key: string): unknown {
    return this.context.metadata[key];
  }

  /**
   * Get all metadata
   */
  getAllMetadata(): Record<string, unknown> {
    return { ...this.context.metadata };
  }

  /**
   * Register event handler
   */
  on(eventType: string, handler: (event: RuntimeEvent) => void): void {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Unregister event handler
   */
  off(eventType: string): void {
    this.eventHandlers.delete(eventType);
  }

  /**
   * Emit event
   */
  emit(event: RuntimeEvent): void {
    const handler = this.eventHandlers.get(event.eventType);
    if (handler) {
      handler(event);
    }
  }

  /**
   * Check if task is complete
   */
  isComplete(): boolean {
    return this.context.stateMachine.isCurrentTerminal();
  }

  /**
   * Check if task is active
   */
  isActive(): boolean {
    return this.context.stateMachine.isCurrentActive();
  }

  /**
   * Check if task can be cancelled
   */
  canCancel(): boolean {
    return this.context.stateMachine.canBeCancelled();
  }

  /**
   * Check if task can be skipped
   */
  canSkip(): boolean {
    return this.context.stateMachine.canBeSkipped();
  }

  /**
   * Check if task can be retried
   */
  canRetry(): boolean {
    return this.context.stateMachine.isRetryable();
  }

  /**
   * Get retry count
   */
  getRetryCount(): number {
    return this.context.stateMachine.getRetryCount();
  }

  /**
   * Check if task has been retried
   */
  hasRetried(): boolean {
    return this.context.stateMachine.hasRetried();
  }

  /**
   * Get task execution state
   */
  toTaskExecutionState(): TaskExecutionState {
    return {
      taskId: this.context.taskId,
      status: this.getStatus(),
      attempts: this.getRetryCount() + (this.isActive() ? 1 : 0),
      startedAt: this.context.startTime,
      completedAt: this.context.endTime,
      result: this.context.result,
      error: this.context.error ? {
        code: 'TASK_ERROR',
        message: this.context.error.message,
        timestamp: this.context.endTime || new Date(),
        retryable: this.canRetry(),
        recoverable: false,
      } : undefined,
      checkpointed: false,
    };
  }

  /**
   * Get task summary
   */
  getSummary(): {
    taskId: TaskId;
    status: TaskStatus;
    duration: number;
    retryCount: number;
    hasResult: boolean;
    hasError: boolean;
  } {
    return {
      taskId: this.context.taskId,
      status: this.getStatus(),
      duration: this.getDuration(),
      retryCount: this.getRetryCount(),
      hasResult: this.context.result !== undefined,
      hasError: this.context.error !== undefined,
    };
  }
}
