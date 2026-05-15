/**
 * CLAUX Runtime Execution Engine - Replay State Machine
 * 
 * Manages replay lifecycle state transitions.
 * No external dependencies - pure state machine logic.
 */

import { ExecutionStatus } from '../../contracts';
import { InvalidStateTransitionError } from '../errors';

/**
 * Replay State
 */
export enum ReplayState {
  IDLE = 'idle',
  INITIATING = 'initiating',
  LOADING = 'loading',
  VALIDATING = 'validating',
  REPLAYING = 'replaying',
  COMPARING = 'comparing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  VIOLATION = 'violation',
}

/**
 * Replay State Transition
 */
export interface ReplayStateTransition {
  readonly from: ReplayState;
  readonly to: ReplayState;
  readonly timestamp: Date;
  readonly reason?: string;
}

/**
 * Replay State Machine
 * 
 * Manages replay lifecycle state transitions deterministically.
 */
export class ReplayStateMachine {
  private currentState: ReplayState;
  private transitions: ReplayStateTransition[] = [];

  constructor(initialState: ReplayState = ReplayState.IDLE) {
    this.currentState = initialState;
  }

  /**
   * Get current state
   */
  getCurrentState(): ReplayState {
    return this.currentState;
  }

  /**
   * Transition to new state
   */
  transition(to: ReplayState, reason?: string): void {
    if (!this.isValidTransition(this.currentState, to)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        to,
        this.getValidTransitions(this.currentState)
      );
    }

    const transition: ReplayStateTransition = {
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
  isValidTransition(from: ReplayState, to: ReplayState): boolean {
    return this.getValidTransitions(from).includes(to);
  }

  /**
   * Get valid transitions from current state
   */
  getValidTransitions(from: ReplayState): readonly ReplayState[] {
    const transitions: Record<ReplayState, readonly ReplayState[]> = {
      [ReplayState.IDLE]: [
        ReplayState.INITIATING,
      ],
      [ReplayState.INITIATING]: [
        ReplayState.LOADING,
        ReplayState.FAILED,
      ],
      [ReplayState.LOADING]: [
        ReplayState.VALIDATING,
        ReplayState.FAILED,
      ],
      [ReplayState.VALIDATING]: [
        ReplayState.REPLAYING,
        ReplayState.FAILED,
      ],
      [ReplayState.REPLAYING]: [
        ReplayState.COMPARING,
        ReplayState.COMPLETED,
        ReplayState.FAILED,
        ReplayState.VIOLATION,
      ],
      [ReplayState.COMPARING]: [
        ReplayState.COMPLETED,
        ReplayState.VIOLATION,
        ReplayState.FAILED,
      ],
      [ReplayState.COMPLETED]: [], // Terminal state
      [ReplayState.FAILED]: [
        ReplayState.INITIATING, // Retry replay
      ],
      [ReplayState.VIOLATION]: [], // Terminal state
    };

    return transitions[from] ?? [];
  }

  /**
   * Check if state is terminal
   */
  isTerminal(state: ReplayState): boolean {
    return state === ReplayState.COMPLETED ||
           state === ReplayState.VIOLATION;
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
  isActive(state: ReplayState): boolean {
    return state === ReplayState.INITIATING ||
           state === ReplayState.LOADING ||
           state === ReplayState.VALIDATING ||
           state === ReplayState.REPLAYING ||
           state === ReplayState.COMPARING;
  }

  /**
   * Check if current state is active
   */
  isCurrentActive(): boolean {
    return this.isActive(this.currentState);
  }

  /**
   * Check if replay failed due to determinism violation
   */
  isDeterminismViolation(): boolean {
    return this.currentState === ReplayState.VIOLATION;
  }

  /**
   * Get transition history
   */
  getTransitionHistory(): readonly ReplayStateTransition[] {
    return [...this.transitions];
  }

  /**
   * Reset state machine
   */
  reset(initialState: ReplayState = ReplayState.IDLE): void {
    this.currentState = initialState;
    this.transitions = [];
  }

  /**
   * Clone state machine
   */
  clone(): ReplayStateMachine {
    const cloned = new ReplayStateMachine(this.currentState);
    cloned.transitions = [...this.transitions];
    return cloned;
  }

  /**
   * Can transition to initiating
   */
  canTransitionToInitiating(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.INITIATING);
  }

  /**
   * Can transition to loading
   */
  canTransitionToLoading(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.LOADING);
  }

  /**
   * Can transition to validating
   */
  canTransitionToValidating(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.VALIDATING);
  }

  /**
   * Can transition to replaying
   */
  canTransitionToReplaying(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.REPLAYING);
  }

  /**
   * Can transition to comparing
   */
  canTransitionToComparing(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.COMPARING);
  }

  /**
   * Can transition to completed
   */
  canTransitionToCompleted(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.COMPLETED);
  }

  /**
   * Can transition to failed
   */
  canTransitionToFailed(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.FAILED);
  }

  /**
   * Can transition to violation
   */
  canTransitionToViolation(): boolean {
    return this.isValidTransition(this.currentState, ReplayState.VIOLATION);
  }

  /**
   * Transition to initiating
   */
  toInitiating(reason?: string): void {
    this.transition(ReplayState.INITIATING, reason);
  }

  /**
   * Transition to loading
   */
  toLoading(reason?: string): void {
    this.transition(ReplayState.LOADING, reason);
  }

  /**
   * Transition to validating
   */
  toValidating(reason?: string): void {
    this.transition(ReplayState.VALIDATING, reason);
  }

  /**
   * Transition to replaying
   */
  toReplaying(reason?: string): void {
    this.transition(ReplayState.REPLAYING, reason);
  }

  /**
   * Transition to comparing
   */
  toComparing(reason?: string): void {
    this.transition(ReplayState.COMPARING, reason);
  }

  /**
   * Transition to completed
   */
  toCompleted(reason?: string): void {
    this.transition(ReplayState.COMPLETED, reason);
  }

  /**
   * Transition to failed
   */
  toFailed(reason?: string): void {
    this.transition(ReplayState.FAILED, reason);
  }

  /**
   * Transition to violation
   */
  toViolation(reason?: string): void {
    this.transition(ReplayState.VIOLATION, reason);
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
   * Get total replay duration
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
  getTimeSpentInStates(): Map<ReplayState, number> {
    const timeSpent = new Map<ReplayState, number>();

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
    return this.transitions.filter(t => t.to === ReplayState.INITIATING).length - 1;
  }

  /**
   * Check if replay has been retried
   */
  hasRetried(): boolean {
    return this.getRetryCount() > 0;
  }

  /**
   * Check if replay is in retryable state
   */
  isRetryable(): boolean {
    return this.currentState === ReplayState.FAILED;
  }

  /**
   * Map replay state to execution status
   */
  toExecutionStatus(): ExecutionStatus {
    switch (this.currentState) {
      case ReplayState.IDLE:
      case ReplayState.INITIATING:
      case ReplayState.LOADING:
      case ReplayState.VALIDATING:
      case ReplayState.REPLAYING:
      case ReplayState.COMPARING:
        return ExecutionStatus.RETRYING;
      case ReplayState.COMPLETED:
        return ExecutionStatus.RUNNING;
      case ReplayState.FAILED:
      case ReplayState.VIOLATION:
        return ExecutionStatus.FAILED;
    }
  }

  /**
   * Get determinism violations count
   */
  getViolationCount(): number {
    return this.transitions.filter(t => t.to === ReplayState.VIOLATION).length;
  }

  /**
   * Check if replay is deterministic (no violations)
   */
  isDeterministic(): boolean {
    return this.getViolationCount() === 0;
  }
}
