/**
 * CLAUX Agent State Machine Definitions
 * 
 * This file defines the canonical state machines for each agent.
 */

import {
  AgentStateMachine,
  AgentRuntimeState,
  StateTransition,
  StateInvariant,
  FailureCondition,
  ReplaySemantics,
} from './states';
import { CanonicalAgentType } from '../system/types';

/**
 * Base state transitions
 */
export const BASE_STATE_TRANSITIONS: readonly StateTransition[] = [
  { from: AgentRuntimeState.INITIALIZING, to: AgentRuntimeState.IDLE, condition: 'initialization_complete', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.IDLE, to: AgentRuntimeState.PLANNING, condition: 'plan_requested', validFor: [CanonicalAgentType.PLANNER, CanonicalAgentType.SIMULATOR] },
  { from: AgentRuntimeState.IDLE, to: AgentRuntimeState.EXECUTING, condition: 'execute_requested', validFor: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.ROUTER] },
  { from: AgentRuntimeState.IDLE, to: AgentRuntimeState.BLOCKED, condition: 'blocked_condition', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.PLANNING, to: AgentRuntimeState.IDLE, condition: 'plan_complete', validFor: [CanonicalAgentType.PLANNER, CanonicalAgentType.SIMULATOR] },
  { from: AgentRuntimeState.PLANNING, to: AgentRuntimeState.BLOCKED, condition: 'planning_blocked', validFor: [CanonicalAgentType.PLANNER, CanonicalAgentType.SIMULATOR] },
  { from: AgentRuntimeState.EXECUTING, to: AgentRuntimeState.IDLE, condition: 'execution_complete', validFor: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.ROUTER] },
  { from: AgentRuntimeState.EXECUTING, to: AgentRuntimeState.RECOVERING, condition: 'execution_failed', validFor: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.ROUTER] },
  { from: AgentRuntimeState.BLOCKED, to: AgentRuntimeState.IDLE, condition: 'block_cleared', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.RECOVERING, to: AgentRuntimeState.IDLE, condition: 'recovery_complete', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.RECOVERING, to: AgentRuntimeState.DEGRADED, condition: 'recovery_partial', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.REPLAYING, to: AgentRuntimeState.IDLE, condition: 'replay_complete', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.DEGRADED, to: AgentRuntimeState.IDLE, condition: 'degradation_cleared', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.SUSPENDED, to: AgentRuntimeState.IDLE, condition: 'suspension_lifted', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
  { from: AgentRuntimeState.TERMINATED, to: AgentRuntimeState.INITIALIZING, condition: 'reinitialization_requested', validFor: Object.values(CanonicalAgentType) as CanonicalAgentType[] },
];

/**
 * PLANNER state machine
 */
export const PLANNER_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.PLANNER,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.PLANNING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.PLANNER)),
  stateInvariants: [
    { state: AgentRuntimeState.PLANNING, invariant: 'planning_authority_granted', validFor: [CanonicalAgentType.PLANNER] },
    { state: AgentRuntimeState.IDLE, invariant: 'no_active_tasks', validFor: [CanonicalAgentType.PLANNER] },
  ],
  failureConditions: [
    { failureId: 'planner_policy_violation', condition: 'policy_violation', resultingState: AgentRuntimeState.BLOCKED, validFor: [CanonicalAgentType.PLANNER] },
    { failureId: 'planner_critical_failure', condition: 'critical_failure', resultingState: AgentRuntimeState.RECOVERING, validFor: [CanonicalAgentType.PLANNER] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.PLANNING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.PLANNER] },
    { state: AgentRuntimeState.IDLE, replayable: true, replayCheckpointRequired: false, validFor: [CanonicalAgentType.PLANNER] },
  ],
};

/**
 * EXECUTOR state machine
 */
export const EXECUTOR_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.EXECUTOR,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.EXECUTOR)),
  stateInvariants: [
    { state: AgentRuntimeState.EXECUTING, invariant: 'execution_claim_granted', validFor: [CanonicalAgentType.EXECUTOR] },
    { state: AgentRuntimeState.IDLE, invariant: 'no_active_tasks', validFor: [CanonicalAgentType.EXECUTOR] },
  ],
  failureConditions: [
    { failureId: 'executor_execution_failure', condition: 'execution_failure', resultingState: AgentRuntimeState.RECOVERING, validFor: [CanonicalAgentType.EXECUTOR] },
    { failureId: 'executor_timeout', condition: 'execution_timeout', resultingState: AgentRuntimeState.RECOVERING, validFor: [CanonicalAgentType.EXECUTOR] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.EXECUTOR] },
    { state: AgentRuntimeState.REPLAYING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.EXECUTOR] },
  ],
};

/**
 * VALIDATOR state machine
 */
export const VALIDATOR_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.VALIDATOR,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.VALIDATOR)),
  stateInvariants: [
    { state: AgentRuntimeState.EXECUTING, invariant: 'validation_authority_granted', validFor: [CanonicalAgentType.VALIDATOR] },
  ],
  failureConditions: [
    { failureId: 'validator_validation_failure', condition: 'validation_failure', resultingState: AgentRuntimeState.BLOCKED, validFor: [CanonicalAgentType.VALIDATOR] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.VALIDATOR] },
  ],
};

/**
 * GOVERNOR state machine
 */
export const GOVERNOR_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.GOVERNOR,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.GOVERNOR)),
  stateInvariants: [
    { state: AgentRuntimeState.EXECUTING, invariant: 'governance_authority_granted', validFor: [CanonicalAgentType.GOVERNOR] },
    { state: AgentRuntimeState.IDLE, invariant: 'no_pending_approvals', validFor: [CanonicalAgentType.GOVERNOR] },
  ],
  failureConditions: [
    { failureId: 'governor_critical_failure', condition: 'critical_failure', resultingState: AgentRuntimeState.TERMINATED, validFor: [CanonicalAgentType.GOVERNOR] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.GOVERNOR] },
  ],
};

/**
 * ANALYZER state machine
 */
export const ANALYZER_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.ANALYZER,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.ANALYZER)),
  stateInvariants: [],
  failureConditions: [
    { failureId: 'analyzer_failure', condition: 'analysis_failure', resultingState: AgentRuntimeState.RECOVERING, validFor: [CanonicalAgentType.ANALYZER] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.ANALYZER] },
  ],
};

/**
 * ROUTER state machine
 */
export const ROUTER_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.ROUTER,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.ROUTER)),
  stateInvariants: [
    { state: AgentRuntimeState.EXECUTING, invariant: 'routing_authority_granted', validFor: [CanonicalAgentType.ROUTER] },
  ],
  failureConditions: [
    { failureId: 'router_conflict', condition: 'routing_conflict', resultingState: AgentRuntimeState.BLOCKED, validFor: [CanonicalAgentType.ROUTER] },
    { failureId: 'router_exhaustion', condition: 'resource_exhaustion', resultingState: AgentRuntimeState.RECOVERING, validFor: [CanonicalAgentType.ROUTER] },
  ],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.ROUTER] },
  ],
};

/**
 * SIMULATOR state machine
 */
export const SIMULATOR_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.SIMULATOR,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.PLANNING,
    AgentRuntimeState.BLOCKED,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.SIMULATOR)),
  stateInvariants: [],
  failureConditions: [],
  replaySemantics: [
    { state: AgentRuntimeState.PLANNING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.SIMULATOR] },
    { state: AgentRuntimeState.REPLAYING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.SIMULATOR] },
  ],
};

/**
 * RECOVERER state machine
 */
export const RECOVERER_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.RECOVERER,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.RECOVERING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.RECOVERER)),
  stateInvariants: [
    { state: AgentRuntimeState.RECOVERING, invariant: 'recovery_authority_granted', validFor: [CanonicalAgentType.RECOVERER] },
  ],
  failureConditions: [],
  replaySemantics: [
    { state: AgentRuntimeState.RECOVERING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.RECOVERER] },
  ],
};

/**
 * OBSERVER state machine
 */
export const OBSERVER_STATE_MACHINE: AgentStateMachine = {
  agentType: CanonicalAgentType.OBSERVER,
  initialState: AgentRuntimeState.INITIALIZING,
  validStates: [
    AgentRuntimeState.INITIALIZING,
    AgentRuntimeState.IDLE,
    AgentRuntimeState.EXECUTING,
    AgentRuntimeState.REPLAYING,
    AgentRuntimeState.SUSPENDED,
    AgentRuntimeState.TERMINATED,
  ],
  stateTransitions: BASE_STATE_TRANSITIONS.filter(t => t.validFor.includes(CanonicalAgentType.OBSERVER)),
  stateInvariants: [],
  failureConditions: [],
  replaySemantics: [
    { state: AgentRuntimeState.EXECUTING, replayable: true, replayCheckpointRequired: true, validFor: [CanonicalAgentType.OBSERVER] },
  ],
};

/**
 * Map of agent types to state machines
 */
export const AGENT_STATE_MACHINES: Readonly<Record<CanonicalAgentType, AgentStateMachine>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_STATE_MACHINE,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_STATE_MACHINE,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_STATE_MACHINE,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_STATE_MACHINE,
  [CanonicalAgentType.ANALYZER]: ANALYZER_STATE_MACHINE,
  [CanonicalAgentType.ROUTER]: ROUTER_STATE_MACHINE,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_STATE_MACHINE,
  [CanonicalAgentType.RECOVERER]: RECOVERER_STATE_MACHINE,
  [CanonicalAgentType.OBSERVER]: OBSERVER_STATE_MACHINE,
};

/**
 * Get state machine by agent type
 */
export function getStateMachine(agentType: CanonicalAgentType): AgentStateMachine {
  return AGENT_STATE_MACHINES[agentType];
}
