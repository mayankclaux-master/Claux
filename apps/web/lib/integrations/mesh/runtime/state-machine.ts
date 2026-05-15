/**
 * Provider Execution State Machine
 * 
 * Provider execution states:
 * - DISPATCHED
 * - ACKNOWLEDGED
 * - PROCESSING
 * - CALLBACK_RECEIVED
 * - RESUMED
 * - COMPLETED
 * - FAILED
 * - RETRYING
 * - COOLDOWN
 * - QUARANTINED
 * - DEAD_LETTER
 * 
 * Persist ONLY through agent_events and agent_logs.
 * NO NEW EXECUTION TABLES.
 */

import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { LogLevel } from '@/lib/runtime/types/log.types';

export type ProviderExecutionState =
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'PROCESSING'
  | 'CALLBACK_RECEIVED'
  | 'RESUMED'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING'
  | 'COOLDOWN'
  | 'QUARANTINED'
  | 'DEAD_LETTER';

export interface ProviderExecutionStateTransition {
  executionId: string;
  tenantId: string;
  provider: string;
  fromState: ProviderExecutionState;
  toState: ProviderExecutionState;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export class ProviderExecutionStateMachine {
  private runtime: RuntimeService;
  private stateTransitions: Map<string, ProviderExecutionStateTransition[]> = new Map();

  constructor(runtime: RuntimeService) {
    this.runtime = runtime;
  }

  /**
   * Get current state for execution
   */
  getCurrentState(executionId: string): ProviderExecutionState | undefined {
    const transitions = this.stateTransitions.get(executionId);
    return transitions?.[transitions.length - 1]?.toState;
  }

  /**
   * Transition state
   */
  async transitionState(
    executionId: string,
    tenantId: string,
    provider: string,
    toState: ProviderExecutionState,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const fromState = this.getCurrentState(executionId) || 'DISPATCHED';

    // Validate state transition
    if (!this.isValidTransition(fromState, toState)) {
      throw new Error(`Invalid state transition: ${fromState} → ${toState}`);
    }

    const transition: ProviderExecutionStateTransition = {
      executionId,
      tenantId,
      provider,
      fromState,
      toState,
      timestamp: new Date().toISOString(),
      reason,
      metadata,
    };

    // Store transition
    const transitions = this.stateTransitions.get(executionId) || [];
    transitions.push(transition);
    this.stateTransitions.set(executionId, transitions);

    // Emit state transition event
    await this.runtime.event.publishEvent({
      tenant_id: tenantId,
      execution_id: executionId,
      event_name: 'provider_state_transition',
      event_source: 'integration_mesh',
      payload: {
        executionId: transition.executionId,
        tenantId: transition.tenantId,
        provider: transition.provider,
        fromState: transition.fromState,
        toState: transition.toState,
        timestamp: transition.timestamp,
        reason: transition.reason,
        metadata: transition.metadata,
      },
    });

    // Log state transition
    await this.runtime.log.writeLog({
      execution_id: executionId,
      log_level: LogLevel.INFO,
      message: `Provider state transition: ${fromState} → ${toState}`,
      context: {
        provider,
        reason,
        metadata,
      },
    });
  }

  /**
   * Validate state transition
   */
  private isValidTransition(fromState: ProviderExecutionState, toState: ProviderExecutionState): boolean {
    const validTransitions: Record<ProviderExecutionState, ProviderExecutionState[]> = {
      DISPATCHED: ['ACKNOWLEDGED', 'FAILED'],
      ACKNOWLEDGED: ['PROCESSING', 'FAILED'],
      PROCESSING: ['CALLBACK_RECEIVED', 'FAILED', 'RETRYING'],
      CALLBACK_RECEIVED: ['RESUMED', 'FAILED'],
      RESUMED: ['COMPLETED', 'FAILED'],
      COMPLETED: [],
      FAILED: ['RETRYING', 'COOLDOWN', 'QUARANTINED', 'DEAD_LETTER'],
      RETRYING: ['PROCESSING', 'FAILED', 'COOLDOWN', 'QUARANTINED', 'DEAD_LETTER'],
      COOLDOWN: ['PROCESSING', 'FAILED', 'QUARANTINED', 'DEAD_LETTER'],
      QUARANTINED: ['PROCESSING', 'DEAD_LETTER'],
      DEAD_LETTER: [],
    };

    return validTransitions[fromState]?.includes(toState) || false;
  }

  /**
   * Get state history for execution
   */
  getStateHistory(executionId: string): ProviderExecutionStateTransition[] {
    return this.stateTransitions.get(executionId) || [];
  }

  /**
   * Clear state history for execution
   */
  clearStateHistory(executionId: string): void {
    this.stateTransitions.delete(executionId);
  }
}

export function createProviderExecutionStateMachine(runtime: RuntimeService): ProviderExecutionStateMachine {
  return new ProviderExecutionStateMachine(runtime);
}
