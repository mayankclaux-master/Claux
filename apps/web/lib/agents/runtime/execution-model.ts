/**
 * CLAUX Agent Execution Model Definition
 * 
 * This file defines the canonical execution model for each agent.
 */

import {
  AgentExecutionModel,
  DeterministicGuaranteeLevel,
  ExecutionIsolationLevel,
  ExecutionRetryPolicy,
  ExecutionLeaseType,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * PLANNER execution model
 */
export const PLANNER_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.PLANNER,
  deterministicGuarantee: DeterministicGuaranteeLevel.STRICT,
  executionIsolation: ExecutionIsolationLevel.WORKFLOW_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.EXPONENTIAL_BACKOFF,
  leaseType: ExecutionLeaseType.WORKFLOW_LEASE,
  cancellable: true,
  recoverable: true,
  replayable: true,
};

/**
 * EXECUTOR execution model
 */
export const EXECUTOR_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.EXECUTOR,
  deterministicGuarantee: DeterministicGuaranteeLevel.CAUSAL,
  executionIsolation: ExecutionIsolationLevel.TASK_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.EXPONENTIAL_BACKOFF,
  leaseType: ExecutionLeaseType.TASK_LEASE,
  cancellable: true,
  recoverable: true,
  replayable: true,
};

/**
 * VALIDATOR execution model
 */
export const VALIDATOR_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.VALIDATOR,
  deterministicGuarantee: DeterministicGuaranteeLevel.STRICT,
  executionIsolation: ExecutionIsolationLevel.TASK_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.FIXED_RETRY,
  leaseType: ExecutionLeaseType.TASK_LEASE,
  cancellable: true,
  recoverable: false,
  replayable: true,
};

/**
 * GOVERNOR execution model
 */
export const GOVERNOR_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.GOVERNOR,
  deterministicGuarantee: DeterministicGuaranteeLevel.STRICT,
  executionIsolation: ExecutionIsolationLevel.AGENT_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.NO_RETRY,
  leaseType: ExecutionLeaseType.SESSION_LEASE,
  cancellable: false,
  recoverable: false,
  replayable: true,
};

/**
 * ANALYZER execution model
 */
export const ANALYZER_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.ANALYZER,
  deterministicGuarantee: DeterministicGuaranteeLevel.CAUSAL,
  executionIsolation: ExecutionIsolationLevel.WORKFLOW_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.FIXED_RETRY,
  leaseType: ExecutionLeaseType.WORKFLOW_LEASE,
  cancellable: true,
  recoverable: true,
  replayable: true,
};

/**
 * ROUTER execution model
 */
export const ROUTER_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.ROUTER,
  deterministicGuarantee: DeterministicGuaranteeLevel.CAUSAL,
  executionIsolation: ExecutionIsolationLevel.SESSION_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.EXPONENTIAL_BACKOFF,
  leaseType: ExecutionLeaseType.SESSION_LEASE,
  cancellable: true,
  recoverable: true,
  replayable: true,
};

/**
 * SIMULATOR execution model
 */
export const SIMULATOR_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.SIMULATOR,
  deterministicGuarantee: DeterministicGuaranteeLevel.STRICT,
  executionIsolation: ExecutionIsolationLevel.WORKFLOW_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.NO_RETRY,
  leaseType: ExecutionLeaseType.WORKFLOW_LEASE,
  cancellable: true,
  recoverable: false,
  replayable: true,
};

/**
 * RECOVERER execution model
 */
export const RECOVERER_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.RECOVERER,
  deterministicGuarantee: DeterministicGuaranteeLevel.CAUSAL,
  executionIsolation: ExecutionIsolationLevel.AGENT_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.EXPONENTIAL_BACKOFF,
  leaseType: ExecutionLeaseType.SESSION_LEASE,
  cancellable: false,
  recoverable: true,
  replayable: true,
};

/**
 * OBSERVER execution model
 */
export const OBSERVER_EXECUTION_MODEL: AgentExecutionModel = {
  agentType: CanonicalAgentType.OBSERVER,
  deterministicGuarantee: DeterministicGuaranteeLevel.CAUSAL,
  executionIsolation: ExecutionIsolationLevel.AGENT_ISOLATED,
  retryPolicy: ExecutionRetryPolicy.EXPONENTIAL_BACKOFF,
  leaseType: ExecutionLeaseType.SESSION_LEASE,
  cancellable: true,
  recoverable: true,
  replayable: true,
};

/**
 * Map of agent types to execution models
 */
export const AGENT_EXECUTION_MODELS: Readonly<Record<CanonicalAgentType, AgentExecutionModel>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_EXECUTION_MODEL,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_EXECUTION_MODEL,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_EXECUTION_MODEL,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_EXECUTION_MODEL,
  [CanonicalAgentType.ANALYZER]: ANALYZER_EXECUTION_MODEL,
  [CanonicalAgentType.ROUTER]: ROUTER_EXECUTION_MODEL,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_EXECUTION_MODEL,
  [CanonicalAgentType.RECOVERER]: RECOVERER_EXECUTION_MODEL,
  [CanonicalAgentType.OBSERVER]: OBSERVER_EXECUTION_MODEL,
};

/**
 * Get execution model by agent type
 */
export function getExecutionModel(agentType: CanonicalAgentType): AgentExecutionModel {
  return AGENT_EXECUTION_MODELS[agentType];
}
