/**
 * CLAUX Canonical Agent System Types
 * 
 * This file defines the canonical 9 CLAUX core agents with their:
 * - canonical name
 * - system role
 * - execution responsibility
 * - orchestration responsibility
 * - memory ownership
 * - allowed capabilities
 * - forbidden capabilities
 * - coordination permissions
 * - escalation rules
 * - planning authority
 * - autonomy level
 * - execution boundaries
 * - governance scope
 * - observability scope
 * - failure semantics
 * - recovery semantics
 */

/**
 * The 9 canonical CLAUX agents
 */
export enum CanonicalAgentType {
  /**
   * PLANNER - Responsible for planning, decomposition, and task orchestration
   */
  PLANNER = 'planner',

  /**
   * EXECUTOR - Responsible for task execution and action implementation
   */
  EXECUTOR = 'executor',

  /**
   * VALIDATOR - Responsible for validation, verification, and quality assurance
   */
  VALIDATOR = 'validator',

  /**
   * GOVERNOR - Responsible for governance, policy enforcement, and compliance
   */
  GOVERNOR = 'governor',

  /**
   * ANALYZER - Responsible for analysis, pattern detection, and insight generation
   */
  ANALYZER = 'analyzer',

  /**
   * ROUTER - Responsible for routing, dispatch, and resource allocation
   */
  ROUTER = 'router',

  /**
   * SIMULATOR - Responsible for simulation, what-if analysis, and prediction
   */
  SIMULATOR = 'simulator',

  /**
   * RECOVERER - Responsible for recovery, fault tolerance, and resilience
   */
  RECOVERER = 'recoverer',

  /**
   * OBSERVER - Responsible for observability, monitoring, and diagnostics
   */
  OBSERVER = 'observer',
}

/**
 * Autonomy level for agents
 */
export enum AutonomyLevel {
  /**
   * FULL - Complete autonomy within boundaries
   */
  FULL = 'full',

  /**
   * CONSTRAINED - Autonomy with explicit constraints
   */
  CONSTRAINED = 'constrained',

  /**
   * SUPERVISED - Autonomy with supervision requirements
   */
  SUPERVISED = 'supervised',

  /**
   * DIRECTED - No autonomy, follows direct commands
   */
  DIRECTED = 'directed',
}

/**
 * Planning authority level
 */
export enum PlanningAuthority {
  /**
   * STRATEGIC - Can create strategic plans
   */
  STRATEGIC = 'strategic',

  /**
   * TACTICAL - Can create tactical plans within strategy
   */
  TACTICAL = 'tactical',

  /**
   * OPERATIONAL - Can create operational plans within tactics
   */
  OPERATIONAL = 'operational',

  /**
   * NONE - No planning authority
   */
  NONE = 'none',
}

/**
 * Execution boundary type
 */
export enum ExecutionBoundary {
  /**
   * TASK_BOUNDARY - Can execute within task scope
   */
  TASK_BOUNDARY = 'task_boundary',

  /**
   * WORKFLOW_BOUNDARY - Can execute within workflow scope
   */
  WORKFLOW_BOUNDARY = 'workflow_boundary',

  /**
   * SESSION_BOUNDARY - Can execute within session scope
   */
  SESSION_BOUNDARY = 'session_boundary',

  /**
   * SYSTEM_BOUNDARY - Can execute within system scope
   */
  SYSTEM_BOUNDARY = 'system_boundary',
}

/**
 * Governance scope
 */
export enum GovernanceScope {
  /**
   * SELF - Only governs own actions
   */
  SELF = 'self',

  /**
   * PEER - Can govern peer actions
   */
  PEER = 'peer',

  /**
   * HIERARCHY - Can govern subordinate actions
   */
  HIERARCHY = 'hierarchy',

  /**
   * SYSTEM - Can govern system-wide actions
   */
  SYSTEM = 'system',
}

/**
 * Failure semantic type
 */
export enum FailureSemantic {
  /**
   * FAIL_FAST - Immediate failure on error
   */
  FAIL_FAST = 'fail_fast',

  /**
   * FAIL_SOFT - Graceful degradation on error
   */
  FAIL_SOFT = 'fail_soft',

  /**
   * FAIL_RECOVER - Attempt recovery on error
   */
  FAIL_RECOVER = 'fail_recover',

  /**
   * FAIL_ESCALATE - Escalate on error
   */
  FAIL_ESCALATE = 'fail_escalate',
}

/**
 * Recovery semantic type
 */
export enum RecoverySemantic {
  /**
   * AUTO_RECOVER - Automatic recovery
   */
  AUTO_RECOVER = 'auto_recover',

  /**
   * MANUAL_RECOVER - Manual intervention required
   */
  MANUAL_RECOVER = 'manual_recover',

  /**
   * ESCALATE_RECOVER - Escalate for recovery
   */
  ESCALATE_RECOVER = 'escalate_recover',

  /**
   * NO_RECOVER - No recovery capability
   */
  NO_RECOVER = 'no_recover',
}

/**
 * Canonical agent specification
 */
export interface CanonicalAgent {
  /**
   * Canonical agent type
   */
  readonly type: CanonicalAgentType;

  /**
   * Canonical name
   */
  readonly canonicalName: string;

  /**
   * System role description
   */
  readonly systemRole: string;

  /**
   * Execution responsibility
   */
  readonly executionResponsibility: string;

  /**
   * Orchestration responsibility
   */
  readonly orchestrationResponsibility: string;

  /**
   * Memory ownership
   */
  readonly memoryOwnership: readonly string[];

  /**
   * Allowed capabilities
   */
  readonly allowedCapabilities: readonly string[];

  /**
   * Forbidden capabilities
   */
  readonly forbiddenCapabilities: readonly string[];

  /**
   * Coordination permissions
   */
  readonly coordinationPermissions: readonly string[];

  /**
   * Escalation rules
   */
  readonly escalationRules: readonly string[];

  /**
   * Planning authority
   */
  readonly planningAuthority: PlanningAuthority;

  /**
   * Autonomy level
   */
  readonly autonomyLevel: AutonomyLevel;

  /**
   * Execution boundaries
   */
  readonly executionBoundaries: readonly ExecutionBoundary[];

  /**
   * Governance scope
   */
  readonly governanceScope: GovernanceScope;

  /**
   * Observability scope
   */
  readonly observabilityScope: readonly string[];

  /**
   * Failure semantics
   */
  readonly failureSemantic: FailureSemantic;

  /**
   * Recovery semantics
   */
  readonly recoverySemantic: RecoverySemantic;
}

/**
 * Agent instance identifier
 */
export interface AgentInstanceId {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Unique instance ID
   */
  readonly instanceId: string;
}

/**
 * Agent state
 */
export interface AgentState {
  /**
   * Instance identifier
   */
  readonly instanceId: AgentInstanceId;

  /**
   * Current state (defined in runtime states)
   */
  readonly currentState: string;

  /**
   * State timestamp
   */
  readonly timestamp: number;
}

/**
 * Agent configuration
 */
export interface AgentConfiguration {
  /**
   * Agent type
   */
  readonly agentType: CanonicalAgentType;

  /**
   * Configuration parameters
   */
  readonly parameters: Readonly<Record<string, unknown>>;

  /**
   * Capability overrides
   */
  readonly capabilityOverrides?: Readonly<Record<string, boolean>>;

  /**
   * Autonomy override
   */
  readonly autonomyOverride?: AutonomyLevel;
}
