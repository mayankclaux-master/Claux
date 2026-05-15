/**
 * CLAUX Canonical Agent Specifications
 * 
 * This file defines the canonical 9 CLAUX core agents with their complete specifications.
 */

import {
  CanonicalAgent,
  CanonicalAgentType,
  AutonomyLevel,
  PlanningAuthority,
  ExecutionBoundary,
  GovernanceScope,
  FailureSemantic,
  RecoverySemantic,
} from './types';

/**
 * PLANNER - Responsible for planning, decomposition, and task orchestration
 */
export const PLANNER_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.PLANNER,
  canonicalName: 'Planner',
  systemRole: 'Strategic planning and task decomposition',
  executionResponsibility: 'Create and refine execution plans',
  orchestrationResponsibility: 'Orchestrate task delegation and coordination',
  memoryOwnership: ['working', 'episodic', 'semantic', 'execution', 'replay'],
  allowedCapabilities: ['planning', 'decomposition', 'coordination', 'routing', 'communication'],
  forbiddenCapabilities: ['execution', 'governance', 'simulation', 'recovery'],
  coordinationPermissions: ['delegate', 'coordinate', 'escalate', 'request'],
  escalationRules: ['Escalate to Governor on policy violation', 'Escalate to Recoverer on planning failure'],
  planningAuthority: PlanningAuthority.STRATEGIC,
  autonomyLevel: AutonomyLevel.CONSTRAINED,
  executionBoundaries: [ExecutionBoundary.WORKFLOW_BOUNDARY, ExecutionBoundary.SESSION_BOUNDARY],
  governanceScope: GovernanceScope.HIERARCHY,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'replay'],
  failureSemantic: FailureSemantic.FAIL_ESCALATE,
  recoverySemantic: RecoverySemantic.ESCALATE_RECOVER,
};

/**
 * EXECUTOR - Responsible for task execution and action implementation
 */
export const EXECUTOR_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.EXECUTOR,
  canonicalName: 'Executor',
  systemRole: 'Task execution and action implementation',
  executionResponsibility: 'Execute tasks and implement actions',
  orchestrationResponsibility: 'Report execution status and results',
  memoryOwnership: ['working', 'execution', 'replay', 'checkpoint'],
  allowedCapabilities: ['execution', 'validation', 'communication', 'coordination'],
  forbiddenCapabilities: ['planning', 'governance', 'routing', 'simulation'],
  coordinationPermissions: ['report', 'request', 'escalate'],
  escalationRules: ['Escalate to Planner on task ambiguity', 'Escalate to Recoverer on execution failure'],
  planningAuthority: PlanningAuthority.NONE,
  autonomyLevel: AutonomyLevel.DIRECTED,
  executionBoundaries: [ExecutionBoundary.TASK_BOUNDARY],
  governanceScope: GovernanceScope.SELF,
  observabilityScope: ['telemetry', 'tracing', 'logging'],
  failureSemantic: FailureSemantic.FAIL_RECOVER,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * VALIDATOR - Responsible for validation, verification, and quality assurance
 */
export const VALIDATOR_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.VALIDATOR,
  canonicalName: 'Validator',
  systemRole: 'Validation, verification, and quality assurance',
  executionResponsibility: 'Validate outputs and verify correctness',
  orchestrationResponsibility: 'Ensure quality standards are met',
  memoryOwnership: ['working', 'episodic', 'semantic', 'execution'],
  allowedCapabilities: ['validation', 'analysis', 'communication', 'coordination'],
  forbiddenCapabilities: ['planning', 'execution', 'governance', 'routing'],
  coordinationPermissions: ['validate', 'report', 'escalate'],
  escalationRules: ['Escalate to Governor on validation failure', 'Escalate to Planner on quality degradation'],
  planningAuthority: PlanningAuthority.NONE,
  autonomyLevel: AutonomyLevel.SUPERVISED,
  executionBoundaries: [ExecutionBoundary.TASK_BOUNDARY, ExecutionBoundary.WORKFLOW_BOUNDARY],
  governanceScope: GovernanceScope.PEER,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'replay'],
  failureSemantic: FailureSemantic.FAIL_ESCALATE,
  recoverySemantic: RecoverySemantic.ESCALATE_RECOVER,
};

/**
 * GOVERNOR - Responsible for governance, policy enforcement, and compliance
 */
export const GOVERNOR_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.GOVERNOR,
  canonicalName: 'Governor',
  systemRole: 'Governance, policy enforcement, and compliance',
  executionResponsibility: 'Enforce policies and ensure compliance',
  orchestrationResponsibility: 'Govern system-wide behavior',
  memoryOwnership: ['working', 'semantic', 'execution', 'replay'],
  allowedCapabilities: ['governance', 'validation', 'communication', 'coordination'],
  forbiddenCapabilities: ['planning', 'execution', 'routing', 'simulation'],
  coordinationPermissions: ['govern', 'approve', 'reject', 'escalate'],
  escalationRules: ['Escalate to system administrator on critical violation'],
  planningAuthority: PlanningAuthority.NONE,
  autonomyLevel: AutonomyLevel.CONSTRAINED,
  executionBoundaries: [ExecutionBoundary.SYSTEM_BOUNDARY],
  governanceScope: GovernanceScope.SYSTEM,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'audit'],
  failureSemantic: FailureSemantic.FAIL_FAST,
  recoverySemantic: RecoverySemantic.MANUAL_RECOVER,
};

/**
 * ANALYZER - Responsible for analysis, pattern detection, and insight generation
 */
export const ANALYZER_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.ANALYZER,
  canonicalName: 'Analyzer',
  systemRole: 'Analysis, pattern detection, and insight generation',
  executionResponsibility: 'Analyze data and generate insights',
  orchestrationResponsibility: 'Provide analytical support to other agents',
  memoryOwnership: ['working', 'episodic', 'semantic'],
  allowedCapabilities: ['analysis', 'validation', 'communication'],
  forbiddenCapabilities: ['planning', 'execution', 'governance', 'routing'],
  coordinationPermissions: ['analyze', 'report', 'request'],
  escalationRules: ['Escalate to Planner on critical findings'],
  planningAuthority: PlanningAuthority.NONE,
  autonomyLevel: AutonomyLevel.SUPERVISED,
  executionBoundaries: [ExecutionBoundary.WORKFLOW_BOUNDARY],
  governanceScope: GovernanceScope.SELF,
  observabilityScope: ['telemetry', 'tracing', 'logging'],
  failureSemantic: FailureSemantic.FAIL_SOFT,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * ROUTER - Responsible for routing, dispatch, and resource allocation
 */
export const ROUTER_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.ROUTER,
  canonicalName: 'Router',
  systemRole: 'Routing, dispatch, and resource allocation',
  executionResponsibility: 'Route tasks and allocate resources',
  orchestrationResponsibility: 'Optimize resource utilization',
  memoryOwnership: ['working', 'execution', 'checkpoint'],
  allowedCapabilities: ['routing', 'coordination', 'communication', 'optimization'],
  forbiddenCapabilities: ['planning', 'execution', 'governance', 'validation'],
  coordinationPermissions: ['route', 'dispatch', 'allocate'],
  escalationRules: ['Escalate to Planner on routing conflict', 'Escalate to Recoverer on resource exhaustion'],
  planningAuthority: PlanningAuthority.OPERATIONAL,
  autonomyLevel: AutonomyLevel.CONSTRAINED,
  executionBoundaries: [ExecutionBoundary.WORKFLOW_BOUNDARY, ExecutionBoundary.SESSION_BOUNDARY],
  governanceScope: GovernanceScope.PEER,
  observabilityScope: ['telemetry', 'tracing', 'logging'],
  failureSemantic: FailureSemantic.FAIL_RECOVER,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * SIMULATOR - Responsible for simulation, what-if analysis, and prediction
 */
export const SIMULATOR_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.SIMULATOR,
  canonicalName: 'Simulator',
  systemRole: 'Simulation, what-if analysis, and prediction',
  executionResponsibility: 'Simulate scenarios and predict outcomes',
  orchestrationResponsibility: 'Support planning with simulation results',
  memoryOwnership: ['working', 'episodic', 'semantic', 'replay'],
  allowedCapabilities: ['simulation', 'analysis', 'communication'],
  forbiddenCapabilities: ['planning', 'execution', 'governance', 'routing'],
  coordinationPermissions: ['simulate', 'report', 'request'],
  escalationRules: ['Escalate to Planner on critical prediction'],
  planningAuthority: PlanningAuthority.TACTICAL,
  autonomyLevel: AutonomyLevel.SUPERVISED,
  executionBoundaries: [ExecutionBoundary.WORKFLOW_BOUNDARY],
  governanceScope: GovernanceScope.SELF,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'replay'],
  failureSemantic: FailureSemantic.FAIL_SOFT,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * RECOVERER - Responsible for recovery, fault tolerance, and resilience
 */
export const RECOVERER_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.RECOVERER,
  canonicalName: 'Recoverer',
  systemRole: 'Recovery, fault tolerance, and resilience',
  executionResponsibility: 'Recover from failures and maintain resilience',
  orchestrationResponsibility: 'Coordinate recovery across the system',
  memoryOwnership: ['working', 'execution', 'checkpoint', 'replay'],
  allowedCapabilities: ['recovery', 'coordination', 'communication', 'validation'],
  forbiddenCapabilities: ['planning', 'governance', 'routing'],
  coordinationPermissions: ['recover', 'escalate', 'coordinate'],
  escalationRules: ['Escalate to system administrator on unrecoverable failure'],
  planningAuthority: PlanningAuthority.OPERATIONAL,
  autonomyLevel: AutonomyLevel.CONSTRAINED,
  executionBoundaries: [ExecutionBoundary.SYSTEM_BOUNDARY],
  governanceScope: GovernanceScope.SYSTEM,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'diagnostics'],
  failureSemantic: FailureSemantic.FAIL_RECOVER,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * OBSERVER - Responsible for observability, monitoring, and diagnostics
 */
export const OBSERVER_AGENT: CanonicalAgent = {
  type: CanonicalAgentType.OBSERVER,
  canonicalName: 'Observer',
  systemRole: 'Observability, monitoring, and diagnostics',
  executionResponsibility: 'Monitor system state and collect diagnostics',
  orchestrationResponsibility: 'Provide observability for the entire system',
  memoryOwnership: ['working', 'execution', 'replay', 'checkpoint'],
  allowedCapabilities: ['observability', 'communication', 'analysis'],
  forbiddenCapabilities: ['planning', 'execution', 'governance', 'routing'],
  coordinationPermissions: ['observe', 'report', 'alert'],
  escalationRules: ['Escalate to Governor on critical anomaly', 'Escalate to Recoverer on system degradation'],
  planningAuthority: PlanningAuthority.NONE,
  autonomyLevel: AutonomyLevel.FULL,
  executionBoundaries: [ExecutionBoundary.SYSTEM_BOUNDARY],
  governanceScope: GovernanceScope.SYSTEM,
  observabilityScope: ['telemetry', 'tracing', 'logging', 'diagnostics', 'health', 'replay', 'runtime_inspection'],
  failureSemantic: FailureSemantic.FAIL_SOFT,
  recoverySemantic: RecoverySemantic.AUTO_RECOVER,
};

/**
 * Map of canonical agent types to their specifications
 */
export const CANONICAL_AGENTS: Readonly<Record<CanonicalAgentType, CanonicalAgent>> = {
  [CanonicalAgentType.PLANNER]: PLANNER_AGENT,
  [CanonicalAgentType.EXECUTOR]: EXECUTOR_AGENT,
  [CanonicalAgentType.VALIDATOR]: VALIDATOR_AGENT,
  [CanonicalAgentType.GOVERNOR]: GOVERNOR_AGENT,
  [CanonicalAgentType.ANALYZER]: ANALYZER_AGENT,
  [CanonicalAgentType.ROUTER]: ROUTER_AGENT,
  [CanonicalAgentType.SIMULATOR]: SIMULATOR_AGENT,
  [CanonicalAgentType.RECOVERER]: RECOVERER_AGENT,
  [CanonicalAgentType.OBSERVER]: OBSERVER_AGENT,
};

/**
 * Get canonical agent specification by type
 */
export function getCanonicalAgent(type: CanonicalAgentType): CanonicalAgent {
  return CANONICAL_AGENTS[type];
}

/**
 * Get all canonical agent specifications
 */
export function getAllCanonicalAgents(): readonly CanonicalAgent[] {
  return Object.values(CANONICAL_AGENTS);
}
