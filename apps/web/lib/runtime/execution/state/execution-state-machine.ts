/**
 * CLAUX Runtime Execution Engine - Execution State Machine
 * 
 * Manages execution lifecycle state transitions.
 * No external dependencies - pure state machine logic.
 */

import { ExecutionStatus } from '../../contracts';
import { InvalidStateTransitionError } from '../errors';

/**
 * Execution State Transition
 */
export interface ExecutionStateTransition {
  readonly from: ExecutionStatus;
  readonly to: ExecutionStatus;
  readonly timestamp: Date;
  readonly reason?: string;
}

/**
 * Execution State Machine
 * 
 * Manages execution lifecycle state transitions deterministically.
 */
export class ExecutionStateMachine {
  private currentState: ExecutionStatus;
  private transitions: ExecutionStateTransition[] = [];

  constructor(initialState: ExecutionStatus = ExecutionStatus.PENDING) {
    this.currentState = initialState;
  }

  /**
   * Get current state
   */
  getCurrentState(): ExecutionStatus {
    return this.currentState;
  }

  /**
   * Transition to new state
   */
  transition(to: ExecutionStatus, reason?: string): void {
    if (!this.isValidTransition(this.currentState, to)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        to,
        this.getValidTransitions(this.currentState)
      );
    }

    const transition: ExecutionStateTransition = {
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
  isValidTransition(from: ExecutionStatus, to: ExecutionStatus): boolean {
    return this.getValidTransitions(from).includes(to);
  }

  /**
   * Get valid transitions from current state
   */
  getValidTransitions(from: ExecutionStatus): readonly ExecutionStatus[] {
    const transitions: Record<ExecutionStatus, readonly ExecutionStatus[]> = {
      [ExecutionStatus.PENDING]: [
        ExecutionStatus.RUNNING,
        ExecutionStatus.CANCELLED,
      ],
      [ExecutionStatus.RUNNING]: [
        ExecutionStatus.COMPLETED,
        ExecutionStatus.FAILED,
        ExecutionStatus.CANCELLED,
        ExecutionStatus.PAUSED,
      ],
      [ExecutionStatus.PAUSED]: [
        ExecutionStatus.RUNNING,
        ExecutionStatus.CANCELLED,
        ExecutionStatus.FAILED,
      ],
      [ExecutionStatus.COMPLETED]: [], // Terminal state
      [ExecutionStatus.FAILED]: [
        ExecutionStatus.RETRYING,
      ],
      [ExecutionStatus.CANCELLED]: [], // Terminal state
      [ExecutionStatus.RETRYING]: [
        ExecutionStatus.RUNNING,
        ExecutionStatus.FAILED,
        ExecutionStatus.CANCELLED,
      ],
    };

    return transitions[from] ?? [];
  }

  /**
   * Check if state is terminal
   */
  isTerminal(state: ExecutionStatus): boolean {
    return state === ExecutionStatus.COMPLETED ||
           state === ExecutionStatus.CANCELLED;
  }

  /**
   * Check if current state is terminal
   */
  isCurrentTerminal(): boolean {
    return this.isTerminal(this.currentState);
  }

  /**
   * Check if state is active (can be paused/resumed)
   */
  isActive(state: ExecutionStatus): boolean {
    return state === ExecutionStatus.RUNNING ||
           state === ExecutionStatus.PAUSED;
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
  getTransitionHistory(): readonly ExecutionStateTransition[] {
    return [...this.transitions];
  }

  /**
   * Reset state machine
   */
  reset(initialState: ExecutionStatus = ExecutionStatus.PENDING): void {
    this.currentState = initialState;
    this.transitions = [];
  }

  /**
   * Clone state machine
   */
  clone(): ExecutionStateMachine {
    const cloned = new ExecutionStateMachine(this.currentState);
    cloned.transitions = [...this.transitions];
    return cloned;
  }

  /**
   * Can transition to running
   */
  canTransitionToRunning(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.RUNNING);
  }

  /**
   * Can transition to completed
   */
  canTransitionToCompleted(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.COMPLETED);
  }

  /**
   * Can transition to failed
   */
  canTransitionToFailed(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.FAILED);
  }

  /**
   * Can transition to cancelled
   */
  canTransitionToCancelled(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.CANCELLED);
  }

  /**
   * Can transition to paused
   */
  canTransitionToPaused(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.PAUSED);
  }

  /**
   * Can transition to recovering
   */
  canTransitionToRetrying(): boolean {
    return this.isValidTransition(this.currentState, ExecutionStatus.RETRYING);
  }

  /**
   * Transition to running
   */
  toRunning(reason?: string): void {
    this.transition(ExecutionStatus.RUNNING, reason);
  }

  /**
   * Transition to completed
   */
  toCompleted(reason?: string): void {
    this.transition(ExecutionStatus.COMPLETED, reason);
  }

  /**
   * Transition to failed
   */
  toFailed(reason?: string): void {
    this.transition(ExecutionStatus.FAILED, reason);
  }

  /**
   * Transition to cancelled
   */
  toCancelled(reason?: string): void {
    this.transition(ExecutionStatus.CANCELLED, reason);
  }

  /**
   * Transition to paused
   */
  toPaused(reason?: string): void {
    this.transition(ExecutionStatus.PAUSED, reason);
  }

  /**
   * Transition to retrying
   */
  toRetrying(reason?: string): void {
    this.transition(ExecutionStatus.RETRYING, reason);
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
  getTimeSpentInStates(): Map<ExecutionStatus, number> {
    const timeSpent = new Map<ExecutionStatus, number>();

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
}
