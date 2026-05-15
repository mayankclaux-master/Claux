/**
 * CLAUX Runtime Execution Engine - Execution Runtime
 * 
 * Manages execution lifecycle and coordination.
 * No external dependencies - pure runtime logic.
 */

import type { ExecutionId, RuntimeEvent } from '../../contracts';
import { ExecutionStatus } from '../../contracts';
import type { ExecutionGraphState, TaskExecutionState } from '../types';
import { ExecutionStateMachine } from '../state';

/**
 * Execution Runtime Context
 */
export interface ExecutionContext {
  readonly executionId: ExecutionId;
  graphState: ExecutionGraphState;
  readonly stateMachine: ExecutionStateMachine;
  readonly startTime: Date;
  endTime?: Date;
  metadata: Record<string, unknown>;
}

/**
 * Execution Runtime
 * 
 * Manages the runtime context for workflow execution.
 */
export class ExecutionRuntime {
  private context: ExecutionContext;
  private eventHandlers: Map<string, (event: RuntimeEvent) => void> = new Map();

  constructor(executionId: ExecutionId, graphState: ExecutionGraphState) {
    this.context = {
      executionId,
      graphState,
      stateMachine: new ExecutionStateMachine(ExecutionStatus.PENDING),
      startTime: new Date(),
      metadata: {},
    };
  }

  /**
   * Get execution context
   */
  getContext(): ExecutionContext {
    return this.context;
  }

  /**
   * Get execution ID
   */
  getExecutionId(): ExecutionId {
    return this.context.executionId;
  }

  /**
   * Get graph state
   */
  getGraphState(): ExecutionGraphState {
    return this.context.graphState;
  }

  /**
   * Get state machine
   */
  getStateMachine(): ExecutionStateMachine {
    return this.context.stateMachine;
  }

  /**
   * Get execution status
   */
  getStatus(): ExecutionStatus {
    return this.context.stateMachine.getCurrentState();
  }

  /**
   * Start execution
   */
  start(): void {
    this.context.stateMachine.toRunning('Execution started');
  }

  /**
   * Pause execution
   */
  pause(): void {
    this.context.stateMachine.toPaused('Execution paused');
  }

  /**
   * Resume execution
   */
  resume(): void {
    this.context.stateMachine.toRunning('Execution resumed');
  }

  /**
   * Complete execution
   */
  complete(): void {
    this.context.stateMachine.toCompleted('Execution completed');
    this.context.endTime = new Date();
  }

  /**
   * Fail execution
   */
  fail(reason: string): void {
    this.context.stateMachine.toFailed(reason);
    this.context.endTime = new Date();
  }

  /**
   * Cancel execution
   */
  cancel(reason: string): void {
    this.context.stateMachine.toCancelled(reason);
    this.context.endTime = new Date();
  }

  /**
   * Retry execution
   */
  retry(reason: string): void {
    this.context.stateMachine.toRetrying(reason);
  }

  /**
   * Update graph state
   */
  updateGraphState(graphState: ExecutionGraphState): void {
    this.context.graphState = graphState;
  }

  /**
   * Get task state
   */
  getTaskState(taskId: string): TaskExecutionState | undefined {
    return this.context.graphState.taskStates.get(taskId);
  }

  /**
   * Get all task states
   */
  getAllTaskStates(): ReadonlyMap<string, TaskExecutionState> {
    return this.context.graphState.taskStates;
  }

  /**
   * Get completed tasks
   */
  getCompletedTasks(): ReadonlySet<string> {
    return this.context.graphState.completedTasks;
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): ReadonlySet<string> {
    return this.context.graphState.failedTasks;
  }

  /**
   * Get in-progress tasks
   */
  getInProgressTasks(): ReadonlySet<string> {
    return this.context.graphState.inProgressTasks;
  }

  /**
   * Get runnable tasks
   */
  getRunnableTasks(): ReadonlySet<string> {
    return this.context.graphState.runnableTasks;
  }

  /**
   * Get execution progress
   */
  getProgress(): number {
    const total = this.context.graphState.dag.nodes.length;
    const completed = this.context.graphState.completedTasks.size;
    const failed = this.context.graphState.failedTasks.size;
    const cancelled = this.context.graphState.cancelledTasks.size;

    return ((completed + failed + cancelled) / total) * 100;
  }

  /**
   * Get execution duration
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
   * Check if execution is complete
   */
  isComplete(): boolean {
    return this.context.stateMachine.isCurrentTerminal();
  }

  /**
   * Check if execution is active
   */
  isActive(): boolean {
    return this.context.stateMachine.isCurrentActive();
  }

  /**
   * Check if execution can be paused
   */
  canPause(): boolean {
    return this.context.stateMachine.canTransitionToPaused();
  }

  /**
   * Check if execution can be cancelled
   */
  canCancel(): boolean {
    return this.context.stateMachine.canTransitionToCancelled();
  }

  /**
   * Check if execution can be retried
   */
  canRetry(): boolean {
    return this.context.stateMachine.canTransitionToRetrying();
  }

  /**
   * Get execution summary
   */
  getSummary(): {
    executionId: ExecutionId;
    status: ExecutionStatus;
    progress: number;
    duration: number;
    completedTasks: number;
    failedTasks: number;
    inProgressTasks: number;
    runnableTasks: number;
  } {
    return {
      executionId: this.context.executionId,
      status: this.getStatus(),
      progress: this.getProgress(),
      duration: this.getDuration(),
      completedTasks: this.context.graphState.completedTasks.size,
      failedTasks: this.context.graphState.failedTasks.size,
      inProgressTasks: this.context.graphState.inProgressTasks.size,
      runnableTasks: this.context.graphState.runnableTasks.size,
    };
  }
}
