/**
 * CLAUX Agent Observability Model Definition
 * 
 * This file defines the canonical observability model for each agent.
 */

import {
  AgentObservabilityModel,
  ObservabilityOwnership,
  ObservabilityScope,
  ObservabilityAccessLevel,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * PLANNER observability model
 */
export const PLANNER_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.PLANNER,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.PLANNER, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.PLANNER, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
    { agentType: CanonicalAgentType.PLANNER, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.PLANNER, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
  ],
};

/**
 * EXECUTOR observability model
 */
export const EXECUTOR_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.EXECUTOR,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.EXECUTOR, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.EXECUTOR, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
    { agentType: CanonicalAgentType.EXECUTOR, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.EXECUTOR, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
  ],
};

/**
 * VALIDATOR observability model
 */
export const VALIDATOR_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.VALIDATOR,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.VALIDATOR, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.VALIDATOR, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
    { agentType: CanonicalAgentType.VALIDATOR, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.VALIDATOR, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
  ],
};

/**
 * GOVERNOR observability model
 */
export const GOVERNOR_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.GOVERNOR,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.GOVERNOR, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.GOVERNOR, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.GOVERNOR, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.GOVERNOR, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'system' },
  ],
};

/**
 * ANALYZER observability model
 */
export const ANALYZER_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.ANALYZER,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.ANALYZER, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.ANALYZER, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
    { agentType: CanonicalAgentType.ANALYZER, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
  ],
};

/**
 * ROUTER observability model
 */
export const ROUTER_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.ROUTER,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.ROUTER, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.ROUTER, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'session' },
    { agentType: CanonicalAgentType.ROUTER, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.ROUTER, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'session' },
  ],
};

/**
 * SIMULATOR observability model
 */
export const SIMULATOR_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.SIMULATOR,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.SIMULATOR, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.SIMULATOR, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
    { agentType: CanonicalAgentType.SIMULATOR, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.SIMULATOR, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'workflow' },
  ],
};

/**
 * RECOVERER observability model
 */
export const RECOVERER_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.RECOVERER,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.RECOVERER, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.RECOVERER, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.RECOVERER, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.OWN, scopeLevel: 'agent' },
    { agentType: CanonicalAgentType.RECOVERER, scope: ObservabilityScope.DIAGNOSTICS, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.RECOVERER, scope: ObservabilityScope.HEALTH, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
  ],
};

/**
 * OBSERVER observability model
 */
export const OBSERVER_OBSERVABILITY_MODEL: AgentObservabilityModel = {
  agentType: CanonicalAgentType.OBSERVER,
  observabilityOwnerships: [
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.TELEMETRY, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.TRACING, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.LOGGING, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.REPLAY_INSPECTION, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.RUNTIME_INSPECTION, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.DIAGNOSTICS, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
    { agentType: CanonicalAgentType.OBSERVER, scope: ObservabilityScope.HEALTH, accessLevel: ObservabilityAccessLevel.ADMIN, scopeLevel: 'system' },
  ],
};

/**
 * Map of agent types to observability models
 */
export const AGENT_OBSERVABILITY_MODELS: Readonly<Record<CanonicalAgentType, AgentObservabilityModel>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_OBSERVABILITY_MODEL,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_OBSERVABILITY_MODEL,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_OBSERVABILITY_MODEL,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_OBSERVABILITY_MODEL,
  [CanonicalAgentType.ANALYZER]: ANALYZER_OBSERVABILITY_MODEL,
  [CanonicalAgentType.ROUTER]: ROUTER_OBSERVABILITY_MODEL,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_OBSERVABILITY_MODEL,
  [CanonicalAgentType.RECOVERER]: RECOVERER_OBSERVABILITY_MODEL,
  [CanonicalAgentType.OBSERVER]: OBSERVER_OBSERVABILITY_MODEL,
};

/**
 * Get observability model by agent type
 */
export function getObservabilityModel(agentType: CanonicalAgentType): AgentObservabilityModel {
  return AGENT_OBSERVABILITY_MODELS[agentType];
}
