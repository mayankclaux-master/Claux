/**
 * CLAUX Runtime Temporal Layer - Temporal Runtime State
 * 
 * Temporal runtime state management.
 * No external dependencies - pure state semantics.
 */

import type { TemporalRuntimeState, ExecutionId, ReplayId, RecoveryId, TemporalTimestamp } from '../types';

/**
 * Temporal Runtime State Manager
 * 
 * Temporal runtime state management.
 */
export class TemporalRuntimeStateManager {
  private state: TemporalRuntimeState;

  constructor() {
    this.state = {
      activeExecutions: [],
      activeReplays: [],
      activeRecoveries: [],
      snapshotCount: 0,
      eventCount: 0,
      auditCount: 0,
      lastEventTimestamp: Date.now() as TemporalTimestamp,
    };
  }

  /**
   * Add active execution
   */
  addActiveExecution(executionId: ExecutionId): void {
    if (!this.state.activeExecutions.includes(executionId)) {
      this.state.activeExecutions = [...this.state.activeExecutions, executionId];
    }
  }

  /**
   * Remove active execution
   */
  removeActiveExecution(executionId: ExecutionId): void {
    this.state.activeExecutions = this.state.activeExecutions.filter(e => e !== executionId);
  }

  /**
   * Add active replay
   */
  addActiveReplay(replayId: ReplayId): void {
    if (!this.state.activeReplays.includes(replayId)) {
      this.state.activeReplays = [...this.state.activeReplays, replayId];
    }
  }

  /**
   * Remove active replay
   */
  removeActiveReplay(replayId: ReplayId): void {
    this.state.activeReplays = this.state.activeReplays.filter(r => r !== replayId);
  }

  /**
   * Add active recovery
   */
  addActiveRecovery(recoveryId: RecoveryId): void {
    if (!this.state.activeRecoveries.includes(recoveryId)) {
      this.state.activeRecoveries = [...this.state.activeRecoveries, recoveryId];
    }
  }

  /**
   * Remove active recovery
   */
  removeActiveRecovery(recoveryId: RecoveryId): void {
    this.state.activeRecoveries = this.state.activeRecoveries.filter(r => r !== recoveryId);
  }

  /**
   * Increment snapshot count
   */
  incrementSnapshotCount(): void {
    this.state.snapshotCount++;
  }

  /**
   * Increment event count
   */
  incrementEventCount(): void {
    this.state.eventCount++;
    this.state.lastEventTimestamp = Date.now() as TemporalTimestamp;
  }

  /**
   * Increment audit count
   */
  incrementAuditCount(): void {
    this.state.auditCount++;
  }

  /**
   * Get state
   */
  getState(): TemporalRuntimeState {
    return { ...this.state };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      activeExecutions: [],
      activeReplays: [],
      activeRecoveries: [],
      snapshotCount: 0,
      eventCount: 0,
      auditCount: 0,
      lastEventTimestamp: Date.now() as TemporalTimestamp,
    };
  }
}
