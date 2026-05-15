/**
 * CLAUX Agent Runtime States Types
 * 
 * This file defines the agent runtime states including:
 * - canonical lifecycle states
 * - transitions
 * - invariants
 * - failure conditions
 * - replay semantics
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Agent runtime state
 */
export enum AgentRuntimeState {
  /**
   * INITIALIZING - Agent is initializing
   */
  INITIALIZING = 'initializing',

  /**
   * IDLE - Agent is idle
   */
  IDLE = 'idle',

  /**
   * PLANNING - Agent is planning
   */
  PLANNING = 'planning',

  /**
   * EXECUTING - Agent is executing
   */
  EXECUTING = 'executing',

  /**
   * BLOCKED - Agent is blocked
   */
  BLOCKED = 'blocked',

  /**
   * RECOVERING - Agent is recovering
   */
  RECOVERING = 'recovering',

  /**
   * REPLAYING - Agent is replaying
   */
  REPLAYING = 'replaying',

  /**
   * DEGRADED - Agent is degraded
   */
  DEGRADED = 'degraded',

  /**
   * SUSPENDED - Agent is suspended
   */
  SUSPENDED = 'suspended',

  /**
   * TERMINATED - Agent is terminated
   */
  TERMINATED = 'terminated',
}

/**
 * State transition
 */
export interface StateTransition {
  /**
   * From state
   */
  readonly from: AgentRuntimeState;

  /**
   * To state
   */
  readonly to: AgentRuntimeState;

  /**
   * Transition condition
   */
  readonly condition: string;

  /**
   * Valid for agent types
   */
  readonly validFor: readonly CanonicalAgentType[];
}

/**
 * State invariant
 */
export interface StateInvariant {
  /**
   * State
   */
  readonly state: AgentRuntimeState;

  /**
   * Invariant condition
   */
  readonly invariant: string;

  /**
   * Valid for agent types
   */
  readonly validFor: readonly CanonicalAgentType[];
}

/**
 * Failure condition
 */
export interface FailureCondition {
  /**
   * Failure identifier
   */
  readonly failureId: string;

  /**
   * Failure condition
   */
  readonly condition: string;

  /**
   * Resulting state
   */
  readonly resultingState: AgentRuntimeState;

  /**
   * Valid for agent types
   */
  readonly validFor: readonly CanonicalAgentType[];
}

/**
 * Replay semantics
 */
export interface ReplaySemantics {
  /**
   * State
   */
  readonly state: AgentRuntimeState;

  /**
   * Replayable
   */
  readonly replayable: boolean;

  /**
   * Replay checkpoint required
   */
  readonly replayCheckpointRequired: boolean;

  /**
   * Valid for agent types
   */
  readonly validFor: readonly CanonicalAgentType[];
}

/**
 * Agent state machine
 */
export interface AgentStateMachine {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Initial state
   */
  readonly initialState: AgentRuntimeState;

  /**
   * Valid states
   */
  readonly validStates: readonly AgentRuntimeState[];

  /**
   * State transitions
   */
  readonly stateTransitions: readonly StateTransition[];

  /**
   * State invariants
   */
  readonly stateInvariants: readonly StateInvariant[];

  /**
   * Failure conditions
   */
  readonly failureConditions: readonly FailureCondition[];

  /**
   * Replay semantics
   */
  readonly replaySemantics: readonly ReplaySemantics[];
}
