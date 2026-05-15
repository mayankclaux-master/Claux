/**
 * CLAUX Runtime Execution Engine - Recovery State Machine
 * 
 * Manages recovery lifecycle state transitions.
 * No external dependencies - pure state machine logic.
 */

import { ExecutionStatus } from '../../contracts';
import { InvalidStateTransitionError } from '../errors';

/**
 * Recovery State
 */
export enum RecoveryState {
  IDLE = 'idle',
  INITIATING = 'initiating',
  RESTORING = 'restoring',
  VALIDATING = 'validating',
  RESUMING = 'resuming',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Recovery State Transition
 */
export interface RecoveryStateTransition {
  readonly from: RecoveryState;
  readonly to: RecoveryState;
  readonly timestamp: Date;
  readonly reason?: string;
}

/**
 * Recovery State Machine
 * 
 * Manages recovery lifecycle state transitions deterministically.
 */
export class RecoveryStateMachine {
  private currentState: RecoveryState;
  private transitions: RecoveryStateTransition[] = [];

  constructor(initialState: RecoveryState = RecoveryState.IDLE) {
    this.currentState = initialState;
  }

  /**
   * Get current state
   */
  getCurrentState(): RecoveryState {
    return this.currentState;
  }

  /**
   * Transition to new state
   */
  transition(to: RecoveryState, reason?: string): void {
    if (!this.isValidTransition(this.currentState, to)) {
      throw new InvalidStateTransitionError(
        this.currentState,
        to,
        this.getValidTransitions(this.currentState)
      );
    }

    const transition: RecoveryStateTransition = {
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
  isValidTransition(from: RecoveryState, to: RecoveryState): boolean {
    return this.getValidTransitions(from).includes(to);
  }

  /**
   * Get valid transitions from current state
   */
  getValidTransitions(from: RecoveryState): readonly RecoveryState[] {
    const transitions: Record<RecoveryState, readonly RecoveryState[]> = {
      [RecoveryState.IDLE]: [
        RecoveryState.INITIATING,
      ],
      [RecoveryState.INITIATING]: [
        RecoveryState.RESTORING,
        RecoveryState.FAILED,
      ],
      [RecoveryState.RESTORING]: [
        RecoveryState.VALIDATING,
        RecoveryState.FAILED,
      ],
      [RecoveryState.VALIDATING]: [
        RecoveryState.RESUMING,
        RecoveryState.FAILED,
      ],
      [RecoveryState.RESUMING]: [
        RecoveryState.COMPLETED,
        RecoveryState.FAILED,
      ],
      [RecoveryState.COMPLETED]: [], // Terminal state
      [RecoveryState.FAILED]: [
        RecoveryState.INITIATING, // Retry recovery
      ],
    };

    return transitions[from] ?? [];
  }

  /**
   * Check if state is terminal
   */
  isTerminal(state: RecoveryState): boolean {
    return state === RecoveryState.COMPLETED;
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
  isActive(state: RecoveryState): boolean {
    return state === RecoveryState.INITIATING ||
           state === RecoveryState.RESTORING ||
           state === RecoveryState.VALIDATING ||
           state === RecoveryState.RESUMING;
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
  getTransitionHistory(): readonly RecoveryStateTransition[] {
    return [...this.transitions];
  }

  /**
   * Reset state machine
   */
  reset(initialState: RecoveryState = RecoveryState.IDLE): void {
    this.currentState = initialState;
    this.transitions = [];
  }

  /**
   * Clone state machine
   */
  clone(): RecoveryStateMachine {
    const cloned = new RecoveryStateMachine(this.currentState);
    cloned.transitions = [...this.transitions];
    return cloned;
  }

  /**
   * Can transition to initiating
   */
  canTransitionToInitiating(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.INITIATING);
  }

  /**
   * Can transition to restoring
   */
  canTransitionToRestoring(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.RESTORING);
  }

  /**
   * Can transition to validating
   */
  canTransitionToValidating(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.VALIDATING);
  }

  /**
   * Can transition to resuming
   */
  canTransitionToResuming(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.RESUMING);
  }

  /**
   * Can transition to completed
   */
  canTransitionToCompleted(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.COMPLETED);
  }

  /**
   * Can transition to failed
   */
  canTransitionToFailed(): boolean {
    return this.isValidTransition(this.currentState, RecoveryState.FAILED);
  }

  /**
   * Transition to initiating
   */
  toInitiating(reason?: string): void {
    this.transition(RecoveryState.INITIATING, reason);
  }

  /**
   * Transition to restoring
   */
  toRestoring(reason?: string): void {
    this.transition(RecoveryState.RESTORING, reason);
  }

  /**
   * Transition to validating
   */
  toValidating(reason?: string): void {
    this.transition(RecoveryState.VALIDATING, reason);
  }

  /**
   * Transition to resuming
   */
  toResuming(reason?: string): void {
    this.transition(RecoveryState.RESUMING, reason);
  }

  /**
   * Transition to completed
   */
  toCompleted(reason?: string): void {
    this.transition(RecoveryState.COMPLETED, reason);
  }

  /**
   * Transition to failed
   */
  toFailed(reason?: string): void {
    this.transition(RecoveryState.FAILED, reason);
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
   * Get total recovery duration
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
  getTimeSpentInStates(): Map<RecoveryState, number> {
    const timeSpent = new Map<RecoveryState, number>();

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
    return this.transitions.filter(t => t.to === RecoveryState.INITIATING).length - 1;
  }

  /**
   * Check if recovery has been retried
   */
  hasRetried(): boolean {
    return this.getRetryCount() > 0;
  }

  /**
   * Check if recovery is in retryable state
   */
  isRetryable(): boolean {
    return this.currentState === RecoveryState.FAILED;
  }

  /**
   * Map recovery state to execution status
   */
  toExecutionStatus(): ExecutionStatus {
    switch (this.currentState) {
      case RecoveryState.IDLE:
      case RecoveryState.INITIATING:
      case RecoveryState.RESTORING:
      case RecoveryState.VALIDATING:
      case RecoveryState.RESUMING:
        return ExecutionStatus.RETRYING;
      case RecoveryState.COMPLETED:
        return ExecutionStatus.RUNNING;
      case RecoveryState.FAILED:
        return ExecutionStatus.FAILED;
    }
  }
}
