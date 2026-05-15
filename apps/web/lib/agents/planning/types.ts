/**
 * CLAUX Agent Workflow Participation Types
 * 
 * This file defines the agent workflow participation including:
 * - workflow authoring permissions
 * - workflow execution permissions
 * - workflow supervision permissions
 * - workflow interruption permissions
 * - workflow recovery permissions
 * - workflow audit permissions
 */

import { CanonicalAgentType } from '../system/types';

/**
 * Workflow permission type
 */
export enum WorkflowPermissionType {
  /**
   * AUTHORING - Workflow authoring permission
   */
  AUTHORING = 'authoring',

  /**
   * EXECUTION - Workflow execution permission
   */
  EXECUTION = 'execution',

  /**
   * SUPERVISION - Workflow supervision permission
   */
  SUPERVISION = 'supervision',

  /**
   * INTERRUPTION - Workflow interruption permission
   */
  INTERRUPTION = 'interruption',

  /**
   * RECOVERY - Workflow recovery permission
   */
  RECOVERY = 'recovery',

  /**
   * AUDIT - Workflow audit permission
   */
  AUDIT = 'audit',
}

/**
 * Permission level
 */
export enum PermissionLevel {
  /**
   * NONE - No permission
   */
  NONE = 'none',

  /**
   * READ - Read permission
   */
  READ = 'read',

  /**
   * WRITE - Write permission
   */
  WRITE = 'write',

  /**
   * ADMIN - Admin permission
   */
  ADMIN = 'admin',
}

/**
 * Workflow permission
 */
export interface WorkflowPermission {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Permission type
   */
  readonly permissionType: WorkflowPermissionType;

  /**
   * Permission level
   */
  readonly permissionLevel: PermissionLevel;

  /**
   * Scope
   */
  readonly scope: 'task' | 'workflow' | 'session' | 'system';

  /**
   * Conditions
   */
  readonly conditions?: readonly string[];
}

/**
 * Agent workflow participation
 */
export interface AgentWorkflowParticipation {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Workflow permissions
   */
  readonly workflowPermissions: readonly WorkflowPermission[];
}
