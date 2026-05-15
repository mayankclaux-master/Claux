/**
 * CLAUX Runtime Execution Engine - Task State Machine
 * 
 * Manages task lifecycle state transitions.
 * No external dependencies - pure state machine logic.
 */

import { TaskStatus } from '../../contracts';
import { InvalidStateTransitionError } from '../errors';

/**
 * Task State Transition
 */
export interface TaskStateTransition {
  readonly from: TaskStatus;
  readonly to: TaskStatus;
  readonly timestamp: Date;
  readonly reason?: string;
}

/**
 * Task State Machine
 * 
 * Manages task lifecycle state transitions deterministically.
 */
export class TaskStateMachine {
  private currentState: TaskStatus;
  private transitions: TaskStateTransition[] = [];

  constructor(initialState: TaskStatus = TaskStatus.PENDING) {
    this.currentState = initialState;
  }

  /**
   * Get current state
   */
  getCurrentState(): TaskStatus {
    return this.currentState;
  }

  /**
   * Transition to new state
   */
  transition(to: TaskStatus, reason?: string): void {
    if (!this.isValidTransition(this.currentState, to)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        to,
        this.getValidTransitions(this.currentState)
      );
    }

    const transition: TaskStateTransition = {
      from: this.currentState,
      to,
      timestamp: new Date(),
      reason,
    };

    this.transitions.push(transition);
    this.currentState = to;
  }

  /**
   * Check if transition is valid
   */
  isValidTransition(from: TaskStatus, to: TaskStatus): boolean {
    return this.getValidTransitions(from).includes(to);
  }

  /**
   * Get valid transitions from current state
   */
  getValidTransitions(from: TaskStatus): readonly TaskStatus[] {
    const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
      [TaskStatus.PENDING]: [
        TaskStatus.RUNNING,
        TaskStatus.SKIPPED,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.RUNNING]: [
        TaskStatus.COMPLETED,
        TaskStatus.FAILED,
        TaskStatus.CANCELLED,
        TaskStatus.RETRYING,
      ],
      [TaskStatus.RETRYING]: [
        TaskStatus.RUNNING,
        TaskStatus.FAILED,
        TaskStatus.CANCELLED,
      ],
      [TaskStatus.COMPLETED]: [], // Terminal state
      [TaskStatus.FAILED]: [
        TaskStatus.RETRYING,
      ],
      [TaskStatus.CANCELLED]: [], // Terminal state
      [TaskStatus.SKIPPED]: [], // Terminal state
    };

    return transitions[from] ?? [];
  }

  /**
   * Check if state is terminal
   */
  isTerminal(state: TaskStatus): boolean {
    return state === TaskStatus.COMPLETED ||
           state === TaskStatus.FAILED ||
           state === TaskStatus.CANCELLED ||
           state === TaskStatus.SKIPPED;
  }

  /**
   * Check if current state is terminal
   */
  isCurrentTerminal(): boolean {
    return this.isTerminal(this.currentState);
  }

  /**
   * Check if state is active
   */
  isActive(state: TaskStatus): boolean {
    return state === TaskStatus.RUNNING ||
           state === TaskStatus.RETRYING;
  }

  /**
   * Check if current state is active
   */
  isCurrentActive(): boolean {
    return this.isActive(this.currentState);
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): readonly TaskStateTransition[] {
    return [...this.transitions];
  }

  /**
   * Reset state machine
   */
  reset(initialState: TaskStatus = TaskStatus.PENDING): void {
    this.currentState = initialState;
    this.transitions = [];
  }

  /**
   * Clone state machine
   */
  clone(): TaskStateMachine {
    const cloned = new TaskStateMachine(this.currentState);
    cloned.transitions = [...this.transitions];
    return cloned;
  }

  /**
   * Can transition to running
   */
  canTransitionToRunning(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.RUNNING);
  }

  /**
   * Can transition to completed
   */
  canTransitionToCompleted(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.COMPLETED);
  }

  /**
   * Can transition to failed
   */
  canTransitionToFailed(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.FAILED);
  }

  /**
   * Can transition to cancelled
   */
  canTransitionToCancelled(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.CANCELLED);
  }

  /**
   * Can transition to retrying
   */
  canTransitionToRetrying(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.RETRYING);
  }

  /**
   * Can transition to skipped
   */
  canTransitionToSkipped(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.SKIPPED);
  }

  /**
   * Transition to running
   */
  toRunning(reason?: string): void {
    this.transition(TaskStatus.RUNNING, reason);
  }

  /**
   * Transition to completed
   */
  toCompleted(reason?: string): void {
    this.transition(TaskStatus.COMPLETED, reason);
  }

  /**
   * Transition to failed
   */
  toFailed(reason?: string): void {
    this.transition(TaskStatus.FAILED, reason);
  }

  /**
   * Transition to cancelled
   */
  toCancelled(reason?: string): void {
    this.transition(TaskStatus.CANCELLED, reason);
  }

  /**
   * Transition to retrying
   */
  toRetrying(reason?: string): void {
    this.transition(TaskStatus.RETRYING, reason);
  }

  /**
   * Transition to skipped
   */
  toSkipped(reason?: string): void {
    this.transition(TaskStatus.SKIPPED, reason);
  }

  /**
   * Validate state machine integrity
   */
  validateIntegrity(): boolean {
    // Check that all transitions in history are valid
    for (const transition of this.transitions) {
      if (!this.isValidTransition(transition.from, transition.to)) {
        return false;
      }
    }

    // Check that current state matches the last transition
    if (this.transitions.length > 0) {
      const lastTransition = this.transitions[this.transitions.length - 1];
      if (lastTransition.to !== this.currentState) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get state duration
   */
  getStateDuration(): number {
    if (this.transitions.length === 0) {
      return Date.now(); // Since creation
    }

    const lastTransition = this.transitions[this.transitions.length - 1];
    return Date.now() - lastTransition.timestamp.getTime();
  }

  /**
   * Get total execution duration
   */
  getTotalDuration(): number {
    if (this.transitions.length === 0) {
      return 0;
    }

    const firstTransition = this.transitions[0];
    const lastTransition = this.transitions[this.transitions.length - 1];

    return lastTransition.timestamp.getTime() - firstTransition.timestamp.getTime();
  }

  /**
   * Get time spent in each state
   */
  getTimeSpentInStates(): Map<TaskStatus, number> {
    const timeSpent = new Map<TaskStatus, number>();

    if (this.transitions.length === 0) {
      timeSpent.set(this.currentState, Date.now());
      return timeSpent;
    }

    // Calculate time for each transition
    for (let i = 0; i < this.transitions.length; i++) {
      const transition = this.transitions[i];
      const nextTransition = this.transitions[i + 1];

      const duration = nextTransition
        ? nextTransition.timestamp.getTime() - transition.timestamp.getTime()
        : Date.now() - transition.timestamp.getTime();

      timeSpent.set(transition.from, (timeSpent.get(transition.from) ?? 0) + duration);
    }

    // Add current state duration
    const lastTransition = this.transitions[this.transitions.length - 1];
    const currentDuration = Date.now() - lastTransition.timestamp.getTime();
    timeSpent.set(this.currentState, (timeSpent.get(this.currentState) ?? 0) + currentDuration);

    return timeSpent;
  }

  /**
   * Get retry count
   */
  getRetryCount(): number {
    return this.transitions.filter(t => t.to === TaskStatus.RETRYING).length;
  }

  /**
   * Check if task has been retried
   */
  hasRetried(): boolean {
    return this.getRetryCount() > 0;
  }

  /**
   * Check if task is in retryable state
   */
  isRetryable(): boolean {
    return this.currentState === TaskStatus.FAILED;
  }

  /**
   * Check if task can be cancelled
   */
  canBeCancelled(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.CANCELLED);
  }

  /**
   * Check if task can be skipped
   */
  canBeSkipped(): boolean {
    return this.isValidTransition(this.currentState, TaskStatus.SKIPPED);
  }
}
