/**
 * CLAUX Agent Topology Definition
 * 
 * This file defines the canonical agent topology for CLAUX.
 */

import {
  AgentTopology,
  AgentRelationship,
  HierarchyNode,
  DelegationSemantics,
  EscalationChain,
  SupervisionSemantics,
  DistributedCoordinationRule,
  RelationshipType,
  AuthorityType,
  HierarchyLevel,
  DecisionMode,
  ArbitrationMode,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * Canonical agent topology
 */
export const CANONICAL_TOPOLOGY: AgentTopology = {
  relationships: [
    // Planner hierarchy
    {
      source: CanonicalAgentType.PLANNER,
      target: CanonicalAgentType.EXECUTOR,
      type: RelationshipType.HIERARCHY,
      authorities: [AuthorityType.PLANNING, AuthorityType.ORCHESTRATION],
    },
    {
      source: CanonicalAgentType.PLANNER,
      target: CanonicalAgentType.SIMULATOR,
      type: RelationshipType.HIERARCHY,
      authorities: [AuthorityType.PLANNING],
    },
    // Governor hierarchy
    {
      source: CanonicalAgentType.GOVERNOR,
      target: CanonicalAgentType.VALIDATOR,
      type: RelationshipType.SUPERVISOR,
      authorities: [AuthorityType.GOVERNANCE],
    },
    // Peer relationships
    {
      source: CanonicalAgentType.PLANNER,
      target: CanonicalAgentType.ROUTER,
      type: RelationshipType.PEER,
      authorities: [AuthorityType.ORCHESTRATION],
    },
    {
      source: CanonicalAgentType.EXECUTOR,
      target: CanonicalAgentType.VALIDATOR,
      type: RelationshipType.PEER,
      authorities: [],
    },
    // Recoverer system-wide
    {
      source: CanonicalAgentType.RECOVERER,
      target: CanonicalAgentType.EXECUTOR,
      type: RelationshipType.SUPERVISOR,
      authorities: [],
    },
    {
      source: CanonicalAgentType.RECOVERER,
      target: CanonicalAgentType.PLANNER,
      type: RelationshipType.SUPERVISOR,
      authorities: [],
    },
    // Observer system-wide
    {
      source: CanonicalAgentType.OBSERVER,
      target: CanonicalAgentType.PLANNER,
      type: RelationshipType.PEER,
      authorities: [],
    },
    {
      source: CanonicalAgentType.OBSERVER,
      target: CanonicalAgentType.EXECUTOR,
      type: RelationshipType.PEER,
      authorities: [],
    },
  ],

  hierarchy: [
    {
      agentType: CanonicalAgentType.PLANNER,
      level: HierarchyLevel.STRATEGIC,
      parents: [],
      children: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.SIMULATOR],
    },
    {
      agentType: CanonicalAgentType.GOVERNOR,
      level: HierarchyLevel.STRATEGIC,
      parents: [],
      children: [CanonicalAgentType.VALIDATOR],
    },
    {
      agentType: CanonicalAgentType.ROUTER,
      level: HierarchyLevel.TACTICAL,
      parents: [CanonicalAgentType.PLANNER],
      children: [],
    },
    {
      agentType: CanonicalAgentType.EXECUTOR,
      level: HierarchyLevel.OPERATIONAL,
      parents: [CanonicalAgentType.PLANNER],
      children: [],
    },
    {
      agentType: CanonicalAgentType.VALIDATOR,
      level: HierarchyLevel.OPERATIONAL,
      parents: [CanonicalAgentType.GOVERNOR],
      children: [],
    },
    {
      agentType: CanonicalAgentType.SIMULATOR,
      level: HierarchyLevel.TACTICAL,
      parents: [CanonicalAgentType.PLANNER],
      children: [],
    },
    {
      agentType: CanonicalAgentType.ANALYZER,
      level: HierarchyLevel.TACTICAL,
      parents: [],
      children: [],
    },
    {
      agentType: CanonicalAgentType.RECOVERER,
      level: HierarchyLevel.STRATEGIC,
      parents: [],
      children: [],
    },
    {
      agentType: CanonicalAgentType.OBSERVER,
      level: HierarchyLevel.STRATEGIC,
      parents: [],
      children: [],
    },
  ],

  delegationSemantics: [
    {
      delegator: CanonicalAgentType.PLANNER,
      delegatee: CanonicalAgentType.EXECUTOR,
      scope: 'task_execution',
      authority: AuthorityType.EXECUTION,
      revocable: true,
    },
    {
      delegator: CanonicalAgentType.PLANNER,
      delegatee: CanonicalAgentType.ROUTER,
      scope: 'resource_allocation',
      authority: AuthorityType.ORCHESTRATION,
      revocable: true,
    },
    {
      delegator: CanonicalAgentType.PLANNER,
      delegatee: CanonicalAgentType.SIMULATOR,
      scope: 'scenario_simulation',
      authority: AuthorityType.PLANNING,
      revocable: true,
    },
  ],

  escalationChains: [
    {
      source: CanonicalAgentType.EXECUTOR,
      path: [CanonicalAgentType.PLANNER, CanonicalAgentType.GOVERNOR],
      trigger: 'task_ambiguity',
    },
    {
      source: CanonicalAgentType.EXECUTOR,
      path: [CanonicalAgentType.RECOVERER],
      trigger: 'execution_failure',
    },
    {
      source: CanonicalAgentType.VALIDATOR,
      path: [CanonicalAgentType.GOVERNOR],
      trigger: 'validation_failure',
    },
    {
      source: CanonicalAgentType.PLANNER,
      path: [CanonicalAgentType.GOVERNOR],
      trigger: 'policy_violation',
    },
    {
      source: CanonicalAgentType.ROUTER,
      path: [CanonicalAgentType.PLANNER],
      trigger: 'routing_conflict',
    },
    {
      source: CanonicalAgentType.ROUTER,
      path: [CanonicalAgentType.RECOVERER],
      trigger: 'resource_exhaustion',
    },
    {
      source: CanonicalAgentType.OBSERVER,
      path: [CanonicalAgentType.GOVERNOR],
      trigger: 'critical_anomaly',
    },
    {
      source: CanonicalAgentType.OBSERVER,
      path: [CanonicalAgentType.RECOVERER],
      trigger: 'system_degradation',
    },
  ],

  supervisionSemantics: [
    {
      supervisor: CanonicalAgentType.GOVERNOR,
      supervisees: [CanonicalAgentType.VALIDATOR],
      scope: 'validation_quality',
      interventionThreshold: 3,
    },
    {
      supervisor: CanonicalAgentType.RECOVERER,
      supervisees: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.PLANNER],
      scope: 'failure_recovery',
      interventionThreshold: 1,
    },
    {
      supervisor: CanonicalAgentType.PLANNER,
      supervisees: [CanonicalAgentType.EXECUTOR, CanonicalAgentType.ROUTER],
      scope: 'task_coordination',
      interventionThreshold: 5,
    },
  ],

  distributedCoordinationRules: [
    {
      ruleId: 'planner_executor_coordination',
      participants: [CanonicalAgentType.PLANNER, CanonicalAgentType.EXECUTOR],
      decisionMode: DecisionMode.CENTRALIZED,
      arbitrationMode: ArbitrationMode.AUTHORITY_DECIDES,
      scope: 'task_delegation',
      consistencyRequirements: ['causal_consistency', 'order_preservation'],
    },
    {
      ruleId: 'governor_validator_coordination',
      participants: [CanonicalAgentType.GOVERNOR, CanonicalAgentType.VALIDATOR],
      decisionMode: DecisionMode.CENTRALIZED,
      arbitrationMode: ArbitrationMode.AUTHORITY_DECIDES,
      scope: 'policy_enforcement',
      consistencyRequirements: ['strict_consistency'],
    },
    {
      ruleId: 'observer_system_coordination',
      participants: [CanonicalAgentType.OBSERVER, CanonicalAgentType.PLANNER, CanonicalAgentType.EXECUTOR, CanonicalAgentType.GOVERNOR],
      decisionMode: DecisionMode.DECENTRALIZED,
      arbitrationMode: ArbitrationMode.CONSENSUS,
      scope: 'system_monitoring',
      consistencyRequirements: ['eventual_consistency'],
    },
    {
      ruleId: 'recoverer_system_coordination',
      participants: [CanonicalAgentType.RECOVERER, CanonicalAgentType.EXECUTOR, CanonicalAgentType.PLANNER],
      decisionMode: DecisionMode.HYBRID,
      arbitrationMode: ArbitrationMode.AUTHORITY_DECIDES,
      scope: 'failure_recovery',
      consistencyRequirements: ['causal_consistency', 'checkpoint_consistency'],
    },
  ],
};
