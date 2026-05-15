/**
 * CLAUX Runtime Temporal Layer - Temporal State
 * 
 * Temporal state management and versioning.
 * No external dependencies - pure state semantics.
 */

import type { ExecutionId, TemporalTimestamp, TemporalState, LineageId, CausationId } from '../types';

/**
 * Temporal State Manager
 * 
 * Temporal state management and versioning.
 */
export class TemporalStateManager {
  private states: Map<ExecutionId, TemporalState[]> = new Map();

  /**
   * Record state
   */
  recordState(executionId: ExecutionId, state: unknown, timestamp: TemporalTimestamp, sequence: number, lineage: readonly LineageId[], causality: readonly CausationId[]): void {
    const temporalState: TemporalState = {
      executionId,
      timestamp,
      eventSequence: sequence,
      state,
      lineage: [...lineage],
      causality: [...causality],
    };

    const executionStates = this.states.get(executionId) || [];
    this.states.set(executionId, [...executionStates, temporalState]);
  }

  /**
   * Get state at sequence
   */
  getStateAtSequence(executionId: ExecutionId, sequence: number): TemporalState | undefined {
    const states = this.states.get(executionId) || [];
    return states.find(s => s.eventSequence === sequence);
  }

  /**
   * Get state at time
   */
  getStateAtTime(executionId: ExecutionId, timestamp: TemporalTimestamp): TemporalState | undefined {
    const states = this.states.get(executionId) || [];
    return states.filter(s => s.timestamp <= timestamp).pop();
  }

  /**
   * Get latest state
   */
  getLatestState(executionId: ExecutionId): TemporalState | undefined {
    const states = this.states.get(executionId) || [];
    return states.length > 0 ? states[states.length - 1] : undefined;
  }

  /**
   * Get all states for execution
   */
  getAllStates(executionId: ExecutionId): readonly TemporalState[] {
    return this.states.get(executionId) || [];
  }

  /**
   * Clear states for execution
   */
  clearExecution(executionId: ExecutionId): void {
    this.states.delete(executionId);
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.clear();
  }
}
