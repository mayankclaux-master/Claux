/**
 * CLAUX Runtime Execution Engine - Replay Runtime
 * 
 * Manages replay execution context.
 * No external dependencies - pure replay runtime logic.
 */

import type { ExecutionId, RuntimeEvent } from '../../contracts';
import type { ReplayContext } from '../types';
import { ReplayStateMachine, ReplayState } from '../state';

/**
 * Replay Runtime Context
 */
export interface ReplayRuntimeContext {
  readonly executionId: ExecutionId;
  readonly originalExecutionId: ExecutionId;
  readonly stateMachine: ReplayStateMachine;
  readonly startTime: Date;
  endTime?: Date;
  readonly replayContext: ReplayContext;
  metadata: Record<string, unknown>;
}

/**
 * Replay Runtime
 * 
 * Manages the runtime context for deterministic replay execution.
 */
export class ReplayRuntime {
  private context: ReplayRuntimeContext;
  private eventHandlers: Map<string, (event: RuntimeEvent) => void> = new Map();

  constructor(
    executionId: ExecutionId,
    originalExecutionId: ExecutionId,
    replayContext: ReplayContext
  ) {
    this.context = {
      executionId,
      originalExecutionId,
      stateMachine: new ReplayStateMachine(ReplayState.IDLE),
      startTime: new Date(),
      replayContext,
      metadata: {},
    };
  }

  /**
   * Get replay context
   */
  getContext(): ReplayRuntimeContext {
    return this.context;
  }

  /**
   * Get execution ID
   */
  getExecutionId(): ExecutionId {
    return this.context.executionId;
  }

  /**
   * Get original execution ID
   */
  getOriginalExecutionId(): ExecutionId {
    return this.context.originalExecutionId;
  }

  /**
   * Get state machine
   */
  getStateMachine(): ReplayStateMachine {
    return this.context.stateMachine;
  }

  /**
   * Get replay state
   */
  getState(): ReplayState {
    return this.context.stateMachine.getCurrentState();
  }

  /**
   * Start replay
   */
  start(): void {
    this.context.stateMachine.toInitiating('Replay initiated');
  }

  /**
   * Load checkpoint
   */
  load(): void {
    this.context.stateMachine.toLoading('Loading checkpoint');
  }

  /**
   * Validate checkpoint
   */
  validate(): void {
    this.context.stateMachine.toValidating('Validating checkpoint');
  }

  /**
   * Begin replaying
   */
  replay(): void {
    this.context.stateMachine.toReplaying('Replaying execution');
  }

  /**
   * Compare results
   */
  compare(): void {
    this.context.stateMachine.toComparing('Comparing replay results');
  }

  /**
   * Complete replay
   */
  complete(): void {
    this.context.stateMachine.toCompleted('Replay completed');
    this.context.endTime = new Date();
  }

  /**
   * Fail replay
   */
  fail(reason: string): void {
    this.context.stateMachine.toFailed(reason);
    this.context.endTime = new Date();
  }

  /**
   * Record determinism violation
   */
  violation(reason: string): void {
    this.context.stateMachine.toViolation(reason);
    this.context.endTime = new Date();
  }

  /**
   * Get replay context data
   */
  getReplayContext(): ReplayContext {
    return this.context.replayContext;
  }

  /**
   * Get replay duration
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
   * Check if replay is complete
   */
  isComplete(): boolean {
    return this.context.stateMachine.isCurrentTerminal();
  }

  /**
   * Check if replay is active
   */
  isActive(): boolean {
    return this.context.stateMachine.isCurrentActive();
  }

  /**
   * Check if replay failed due to determinism violation
   */
  isDeterminismViolation(): boolean {
    return this.context.stateMachine.isDeterminismViolation();
  }

  /**
   * Check if replay is deterministic
   */
  isDeterministic(): boolean {
    return this.context.stateMachine.isDeterministic();
  }

  /**
   * Get violation count
   */
  getViolationCount(): number {
    return this.context.stateMachine.getViolationCount();
  }

  /**
   * Get replay summary
   */
  getSummary(): {
    executionId: ExecutionId;
    originalExecutionId: ExecutionId;
    state: ReplayState;
    duration: number;
    isDeterministic: boolean;
    violationCount: number;
  } {
    return {
      executionId: this.context.executionId,
      originalExecutionId: this.context.originalExecutionId,
      state: this.getState(),
      duration: this.getDuration(),
      isDeterministic: this.isDeterministic(),
      violationCount: this.getViolationCount(),
    };
  }
}
