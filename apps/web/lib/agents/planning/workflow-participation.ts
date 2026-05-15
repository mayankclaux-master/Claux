/**
 * CLAUX Agent Workflow Participation Definition
 * 
 * This file defines the canonical workflow participation for each agent.
 */

import {
  AgentWorkflowParticipation,
  WorkflowPermission,
  WorkflowPermissionType,
  PermissionLevel,
} from './types';
import { CanonicalAgentType } from '../system/types';

/**
 * PLANNER workflow participation
 */
export const PLANNER_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.PLANNER,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.PLANNER,
      permissionType: WorkflowPermissionType.AUTHORING,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      permissionType: WorkflowPermissionType.SUPERVISION,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      permissionType: WorkflowPermissionType.INTERRUPTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.PLANNER,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'workflow',
    },
  ],
};

/**
 * EXECUTOR workflow participation
 */
export const EXECUTOR_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.EXECUTOR,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.EXECUTOR,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'task',
    },
    {
      agentType: CanonicalAgentType.EXECUTOR,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'task',
    },
  ],
};

/**
 * VALIDATOR workflow participation
 */
export const VALIDATOR_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.VALIDATOR,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.VALIDATOR,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.VALIDATOR,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'workflow',
    },
  ],
};

/**
 * GOVERNOR workflow participation
 */
export const GOVERNOR_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.GOVERNOR,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.GOVERNOR,
      permissionType: WorkflowPermissionType.SUPERVISION,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
    {
      agentType: CanonicalAgentType.GOVERNOR,
      permissionType: WorkflowPermissionType.INTERRUPTION,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
    {
      agentType: CanonicalAgentType.GOVERNOR,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
  ],
};

/**
 * ANALYZER workflow participation
 */
export const ANALYZER_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.ANALYZER,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.ANALYZER,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.ANALYZER,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'workflow',
    },
  ],
};

/**
 * ROUTER workflow participation
 */
export const ROUTER_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.ROUTER,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.ROUTER,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'session',
    },
    {
      agentType: CanonicalAgentType.ROUTER,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'session',
    },
  ],
};

/**
 * SIMULATOR workflow participation
 */
export const SIMULATOR_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.SIMULATOR,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.SIMULATOR,
      permissionType: WorkflowPermissionType.EXECUTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'workflow',
    },
    {
      agentType: CanonicalAgentType.SIMULATOR,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.READ,
      scope: 'workflow',
    },
  ],
};

/**
 * RECOVERER workflow participation
 */
export const RECOVERER_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.RECOVERER,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.RECOVERER,
      permissionType: WorkflowPermissionType.RECOVERY,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
    {
      agentType: CanonicalAgentType.RECOVERER,
      permissionType: WorkflowPermissionType.INTERRUPTION,
      permissionLevel: PermissionLevel.WRITE,
      scope: 'system',
    },
    {
      agentType: CanonicalAgentType.RECOVERER,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
  ],
};

/**
 * OBSERVER workflow participation
 */
export const OBSERVER_WORKFLOW_PARTICIPATION: AgentWorkflowParticipation = {
  agentType: CanonicalAgentType.OBSERVER,
  workflowPermissions: [
    {
      agentType: CanonicalAgentType.OBSERVER,
      permissionType: WorkflowPermissionType.SUPERVISION,
      permissionLevel: PermissionLevel.READ,
      scope: 'system',
    },
    {
      agentType: CanonicalAgentType.OBSERVER,
      permissionType: WorkflowPermissionType.AUDIT,
      permissionLevel: PermissionLevel.ADMIN,
      scope: 'system',
    },
  ],
};

/**
 * Map of agent types to workflow participation
 */
export const AGENT_WORKFLOW_PARTICIPATION: Readonly<Record<CanonicalAgentType, AgentWorkflowParticipation>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.ANALYZER]: ANALYZER_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.ROUTER]: ROUTER_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.RECOVERER]: RECOVERER_WORKFLOW_PARTICIPATION,
  [CanonicalAgentType.OBSERVER]: OBSERVER_WORKFLOW_PARTICIPATION,
};

/**
 * Get workflow participation by agent type
 */
export function getWorkflowParticipation(agentType: CanonicalAgentType): AgentWorkflowParticipation {
  return AGENT_WORKFLOW_PARTICIPATION[agentType];
}
