/**
 * CLAUX Agent Governance Model Types
 * 
 * This file defines the agent governance model including:
 * - policy enforcement
 * - permission boundaries
 * - action validation
 * - escalation requirements
 * - audit requirements
 * - observability requirements
 * - approval semantics
 * - intervention semantics
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Policy enforcement mode
 */
export enum PolicyEnforcementMode {
  /**
   * STRICT - Strict enforcement
   */
  STRICT = 'strict',

  /**
   * PERMISSIVE - Permissive enforcement
   */
  PERMISSIVE = 'permissive',

  /**
   * ADVISORY - Advisory enforcement
   */
  ADVISORY = 'advisory',

  /**
   * DISABLED - Disabled enforcement
   */
  DISABLED = 'disabled',
}

/**
 * Permission boundary type
 */
export enum PermissionBoundaryType {
  /**
   * TASK_BOUNDARY - Task boundary
   */
  TASK_BOUNDARY = 'task_boundary',

  /**
   * WORKFLOW_BOUNDARY - Workflow boundary
   */
  WORKFLOW_BOUNDARY = 'workflow_boundary',

  /**
   * SESSION_BOUNDARY - Session boundary
   */
  SESSION_BOUNDARY = 'session_boundary',

  /**
   * SYSTEM_BOUNDARY - System boundary
   */
  SYSTEM_BOUNDARY = 'system_boundary',
}

/**
 * Action validation result
 */
export enum ActionValidationResult {
  /**
   * APPROVED - Action approved
   */
  APPROVED = 'approved',

  /**
   * DENIED - Action denied
   */
  DENIED = 'denied',

  /**
   * CONDITIONAL - Action conditional
   */
  CONDITIONAL = 'conditional',

  /**
   * ESCALATION_REQUIRED - Escalation required
   */
  ESCALATION_REQUIRED = 'escalation_required',

  /**
   * PENDING - Pending approval
   */
  PENDING = 'pending',
}

/**
 * Escalation priority
 */
export enum EscalationPriority {
  /**
   * LOW - Low priority
   */
  LOW = 'low',

  /**
   * MEDIUM - Medium priority
   */
  MEDIUM = 'medium',

  /**
   * HIGH - High priority
   */
  HIGH = 'high',

  /**
   * CRITICAL - Critical priority
   */
  CRITICAL = 'critical',
}

/**
 * Audit level
 */
export enum AuditLevel {
  /**
   * NONE - No audit
   */
  NONE = 'none',

  /**
   * MINIMAL - Minimal audit
   */
  MINIMAL = 'minimal',

  /**
   * STANDARD - Standard audit
   */
  STANDARD = 'standard',

  /**
   * COMPREHENSIVE - Comprehensive audit
   */
  COMPREHENSIVE = 'comprehensive',
}

/**
 * Approval requirement
 */
export interface ApprovalRequirement {
  /**
   * Action type
   */
  readonly actionType: string;

  /**
   * Approver agent types
   */
  readonly approvers: readonly CanonicalAgentType[];

  /**
   * Approval threshold
   */
  readonly threshold: number;

  /**
   * Timeout
   */
  readonly timeout?: number;
}

/**
 * Intervention trigger
 */
export interface InterventionTrigger {
  /**
   * Trigger identifier
   */
  readonly triggerId: string;

  /**
   * Trigger condition
   */
  readonly condition: string;

  /**
   * Intervening agent type
   */
  readonly interveningAgent: CanonicalAgentType;

  /**
   * Intervention action
   */
  readonly interventionAction: string;
}

/**
 * Governance policy
 */
export interface GovernancePolicy {
  /**
   * Policy identifier
   */
  readonly policyId: string;

  /**
   * Policy name
   */
  readonly policyName: string;

  /**
   * Policy description
   */
  readonly description: string;

  /**
   * Enforcement mode
   */
  readonly enforcementMode: PolicyEnforcementMode;

  /**
   * Applicable agent types
   */
  readonly applicableAgents: readonly CanonicalAgentType[];

  /**
   * Permission boundaries
   */
  readonly permissionBoundaries: readonly PermissionBoundaryType[];

  /**
   * Audit level
   */
  readonly auditLevel: AuditLevel;
}

/**
 * Agent governance model
 */
export interface AgentGovernanceModel {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Governance policies
   */
  readonly governancePolicies: readonly GovernancePolicy[];

  /**
   * Approval requirements
   */
  readonly approvalRequirements: readonly ApprovalRequirement[];

  /**
   * Intervention triggers
   */
  readonly interventionTriggers: readonly InterventionTrigger[];
}
