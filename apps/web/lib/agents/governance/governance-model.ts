/**
 * CLAUX Agent Governance Model Definition
 * 
 * This file defines the canonical governance model for each agent.
 */

import {
  AgentGovernanceModel,
  GovernancePolicy,
  ApprovalRequirement,
  InterventionTrigger,
  PolicyEnforcementMode,
  PermissionBoundaryType,
  AuditLevel,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * Base governance policies
 */
export const BASE_GOVERNANCE_POLICIES: readonly GovernancePolicy[] = [
  {
    policyId: 'policy_execution_authority',
    policyName: 'Execution Authority',
    description: 'Enforces execution authority boundaries',
    enforcementMode: PolicyEnforcementMode.STRICT,
    applicableAgents: [CanonicalAgentType.EXECUTOR],
    permissionBoundaries: [PermissionBoundaryType.TASK_BOUNDARY],
    auditLevel: AuditLevel.STANDARD,
  },
  {
    policyId: 'policy_governance_authority',
    policyName: 'Governance Authority',
    description: 'Enforces governance authority boundaries',
    enforcementMode: PolicyEnforcementMode.STRICT,
    applicableAgents: [CanonicalAgentType.GOVERNOR],
    permissionBoundaries: [PermissionBoundaryType.SYSTEM_BOUNDARY],
    auditLevel: AuditLevel.COMPREHENSIVE,
  },
  {
    policyId: 'policy_planning_authority',
    policyName: 'Planning Authority',
    description: 'Enforces planning authority boundaries',
    enforcementMode: PolicyEnforcementMode.STRICT,
    applicableAgents: [CanonicalAgentType.PLANNER],
    permissionBoundaries: [PermissionBoundaryType.WORKFLOW_BOUNDARY],
    auditLevel: AuditLevel.STANDARD,
  },
];

/**
 * PLANNER governance model
 */
export const PLANNER_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.PLANNER,
  governancePolicies: [
    {
      policyId: 'planner_delegation_policy',
      policyName: 'Delegation Policy',
      description: 'Governs task delegation',
      enforcementMode: PolicyEnforcementMode.STRICT,
      applicableAgents: [CanonicalAgentType.PLANNER],
      permissionBoundaries: [PermissionBoundaryType.WORKFLOW_BOUNDARY],
      auditLevel: AuditLevel.STANDARD,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [
    {
      triggerId: 'planner_policy_violation',
      condition: 'policy_violation',
      interveningAgent: CanonicalAgentType.GOVERNOR,
      interventionAction: 'reject_or_escalate',
    },
  ],
};

/**
 * EXECUTOR governance model
 */
export const EXECUTOR_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.EXECUTOR,
  governancePolicies: [
    {
      policyId: 'executor_execution_policy',
      policyName: 'Execution Policy',
      description: 'Governs task execution',
      enforcementMode: PolicyEnforcementMode.STRICT,
      applicableAgents: [CanonicalAgentType.EXECUTOR],
      permissionBoundaries: [PermissionBoundaryType.TASK_BOUNDARY],
      auditLevel: AuditLevel.STANDARD,
    },
  ],
  approvalRequirements: [
    {
      actionType: 'critical_execution',
      approvers: [CanonicalAgentType.PLANNER],
      threshold: 1,
    },
  ],
  interventionTriggers: [
    {
      triggerId: 'executor_failure',
      condition: 'execution_failure',
      interveningAgent: CanonicalAgentType.RECOVERER,
      interventionAction: 'initiate_recovery',
    },
  ],
};

/**
 * VALIDATOR governance model
 */
export const VALIDATOR_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.VALIDATOR,
  governancePolicies: [
    {
      policyId: 'validator_validation_policy',
      policyName: 'Validation Policy',
      description: 'Governs validation operations',
      enforcementMode: PolicyEnforcementMode.STRICT,
      applicableAgents: [CanonicalAgentType.VALIDATOR],
      permissionBoundaries: [PermissionBoundaryType.WORKFLOW_BOUNDARY],
      auditLevel: AuditLevel.STANDARD,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [
    {
      triggerId: 'validator_failure',
      condition: 'validation_failure',
      interveningAgent: CanonicalAgentType.GOVERNOR,
      interventionAction: 'review_or_escalate',
    },
  ],
};

/**
 * GOVERNOR governance model
 */
export const GOVERNOR_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.GOVERNOR,
  governancePolicies: BASE_GOVERNANCE_POLICIES.filter(
    p => p.policyId === 'policy_governance_authority'
  ),
  approvalRequirements: [
    {
      actionType: 'policy_enforcement',
      approvers: [CanonicalAgentType.GOVERNOR],
      threshold: 1,
    },
  ],
  interventionTriggers: [],
};

/**
 * ANALYZER governance model
 */
export const ANALYZER_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.ANALYZER,
  governancePolicies: [
    {
      policyId: 'analyzer_analysis_policy',
      policyName: 'Analysis Policy',
      description: 'Governs analysis operations',
      enforcementMode: PolicyEnforcementMode.PERMISSIVE,
      applicableAgents: [CanonicalAgentType.ANALYZER],
      permissionBoundaries: [PermissionBoundaryType.WORKFLOW_BOUNDARY],
      auditLevel: AuditLevel.MINIMAL,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [],
};

/**
 * ROUTER governance model
 */
export const ROUTER_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.ROUTER,
  governancePolicies: [
    {
      policyId: 'router_routing_policy',
      policyName: 'Routing Policy',
      description: 'Governs routing operations',
      enforcementMode: PolicyEnforcementMode.STRICT,
      applicableAgents: [CanonicalAgentType.ROUTER],
      permissionBoundaries: [PermissionBoundaryType.SESSION_BOUNDARY],
      auditLevel: AuditLevel.STANDARD,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [
    {
      triggerId: 'router_conflict',
      condition: 'routing_conflict',
      interveningAgent: CanonicalAgentType.PLANNER,
      interventionAction: 'resolve_conflict',
    },
  ],
};

/**
 * SIMULATOR governance model
 */
export const SIMULATOR_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.SIMULATOR,
  governancePolicies: [
    {
      policyId: 'simulator_simulation_policy',
      policyName: 'Simulation Policy',
      description: 'Governs simulation operations',
      enforcementMode: PolicyEnforcementMode.PERMISSIVE,
      applicableAgents: [CanonicalAgentType.SIMULATOR],
      permissionBoundaries: [PermissionBoundaryType.WORKFLOW_BOUNDARY],
      auditLevel: AuditLevel.MINIMAL,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [],
};

/**
 * RECOVERER governance model
 */
export const RECOVERER_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.RECOVERER,
  governancePolicies: [
    {
      policyId: 'recoverer_recovery_policy',
      policyName: 'Recovery Policy',
      description: 'Governs recovery operations',
      enforcementMode: PolicyEnforcementMode.STRICT,
      applicableAgents: [CanonicalAgentType.RECOVERER],
      permissionBoundaries: [PermissionBoundaryType.SYSTEM_BOUNDARY],
      auditLevel: AuditLevel.COMPREHENSIVE,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [],
};

/**
 * OBSERVER governance model
 */
export const OBSERVER_GOVERNANCE_MODEL: AgentGovernanceModel = {
  agentType: CanonicalAgentType.OBSERVER,
  governancePolicies: [
    {
      policyId: 'observer_observability_policy',
      policyName: 'Observability Policy',
      description: 'Governs observability operations',
      enforcementMode: PolicyEnforcementMode.PERMISSIVE,
      applicableAgents: [CanonicalAgentType.OBSERVER],
      permissionBoundaries: [PermissionBoundaryType.SYSTEM_BOUNDARY],
      auditLevel: AuditLevel.MINIMAL,
    },
  ],
  approvalRequirements: [],
  interventionTriggers: [],
};

/**
 * Map of agent types to governance models
 */
export const AGENT_GOVERNANCE_MODELS: Readonly<Record<CanonicalAgentType, AgentGovernanceModel>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_GOVERNANCE_MODEL,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_GOVERNANCE_MODEL,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_GOVERNANCE_MODEL,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_GOVERNANCE_MODEL,
  [CanonicalAgentType.ANALYZER]: ANALYZER_GOVERNANCE_MODEL,
  [CanonicalAgentType.ROUTER]: ROUTER_GOVERNANCE_MODEL,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_GOVERNANCE_MODEL,
  [CanonicalAgentType.RECOVERER]: RECOVERER_GOVERNANCE_MODEL,
  [CanonicalAgentType.OBSERVER]: OBSERVER_GOVERNANCE_MODEL,
};

/**
 * Get governance model by agent type
 */
export function getGovernanceModel(agentType: CanonicalAgentType): AgentGovernanceModel {
  return AGENT_GOVERNANCE_MODELS[agentType];
}
