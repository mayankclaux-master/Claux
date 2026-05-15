/**
 * Runtime Recovery Contract
 * 
 * Canonical interfaces for recovery workflows and failure handling
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Recovery strategy
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  SKIP = 'skip',
  ABORT = 'abort',
  MANUAL = 'manual',
  ROLLBACK = 'rollback',
  COMPENSATE = 'compensate',
}

/**
 * Recovery status
 */
export enum RecoveryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Recovery scope
 */
export enum RecoveryScope {
  TASK = 'task',
  EXECUTION = 'execution',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
}

/**
 * Recovery trigger
 */
export enum RecoveryTrigger {
  FAILURE = 'failure',
  TIMEOUT = 'timeout',
  MANUAL = 'manual',
  HEALTH_CHECK = 'health_check',
  SCHEDULED = 'scheduled',
}

/**
 * Recovery context
 */
export interface RecoveryContext {
  readonly recoveryId: string;
  readonly scope: RecoveryScope;
  readonly targetId: string;
  readonly strategy: RecoveryStrategy;
  readonly trigger: RecoveryTrigger;
  readonly failureInfo?: FailureInfo;
  readonly metadata?: Record<string, unknown>;
  readonly traceId?: string;
  readonly signal?: AbortSignal;
}

/**
 * Failure info
 */
export interface FailureInfo {
  readonly failureCode: string;
  readonly failureMessage: string;
  readonly failureTime: Date;
  readonly failureType: 'task' | 'execution' | 'worker' | 'system';
  readonly retryCount: number;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Recovery result
 */
export interface RecoveryResult {
  readonly recoveryId: string;
  readonly status: RecoveryStatus;
  readonly success: boolean;
  readonly recoveredAt?: Date;
  readonly durationMs?: number;
  readonly output?: Record<string, unknown>;
  readonly error?: RecoveryError;
  readonly metrics?: RecoveryMetrics;
}

/**
 * Recovery error
 */
export interface RecoveryError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly retryable: boolean;
}

/**
 * Recovery metrics
 */
export interface RecoveryMetrics {
  readonly durationMs: number;
  readonly tasksRecovered: number;
  readonly tasksSkipped: number;
  readonly rollbackDurationMs?: number;
  readonly compensationDurationMs?: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Recovery options
 */
export interface RecoveryOptions {
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly timeoutMs?: number;
  readonly enableRollback?: boolean;
  readonly enableCompensation?: boolean;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: RecoveryProgress) => void;
  readonly onError?: (error: RecoveryError) => void;
}

/**
 * Recovery progress
 */
export interface RecoveryProgress {
  readonly recoveryId: string;
  readonly percentage: number;
  readonly currentStep: string;
  readonly estimatedRemainingMs?: number;
}

/**
 * Recovery workflow
 * Canonical interface for recovery workflows
 */
export interface RecoveryWorkflow {
  /**
   * Execute recovery
   */
  execute(
    context: RecoveryContext,
    options?: RecoveryOptions
  ): Promise<RecoveryResult>;

  /**
   * Cancel recovery
   */
  cancel(recoveryId: string): Promise<void>;

  /**
   * Get recovery status
   */
  getStatus(recoveryId: string): Promise<RecoveryStatus>;

  /**
   * Get recovery result
   */
  getResult(recoveryId: string): Promise<RecoveryResult | null>;

  /**
   * Validate recovery eligibility
   */
  validateEligibility(
    scope: RecoveryScope,
    targetId: string
  ): Promise<RecoveryEligibility>;

  /**
   * Get suggested recovery strategy
   */
  getSuggestedStrategy(
    scope: RecoveryScope,
    targetId: string
  ): Promise<RecoveryStrategy>;
}

/**
 * Recovery eligibility
 */
export interface RecoveryEligibility {
  readonly eligible: boolean;
  readonly reason: string;
  readonly suggestedStrategy?: RecoveryStrategy;
  readonly constraints?: RecoveryConstraints;
}

/**
 * Recovery constraints
 */
export interface RecoveryConstraints {
  readonly maxRetries: number;
  readonly currentRetries: number;
  readonly timeSinceFailureMs: number;
  readonly maxRecoveryWindowMs: number;
  readonly customConstraints?: Record<string, unknown>;
}

/**
 * Recovery policy
 */
export interface RecoveryPolicy {
  readonly policyId: string;
  readonly scope: RecoveryScope;
  readonly strategy: RecoveryStrategy;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly timeoutMs: number;
  readonly enableRollback: boolean;
  readonly enableCompensation: boolean;
  readonly conditions: RecoveryCondition[];
}

/**
 * Recovery condition
 */
export interface RecoveryCondition {
  readonly conditionType: 'failure_code' | 'failure_type' | 'retry_count' | 'time_elapsed' | 'custom';
  readonly operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  readonly value: string | number;
  readonly customEvaluator?: (context: RecoveryContext) => Promise<boolean>;
}

/**
 * Recovery policy engine
 * Canonical interface for recovery policy evaluation
 */
export interface RecoveryPolicyEngine {
  /**
   * Evaluate recovery policy
   */
  evaluatePolicy(
    context: RecoveryContext,
    policy: RecoveryPolicy
  ): Promise<PolicyEvaluationResult>;

  /**
   * Get applicable policy
   */
  getApplicablePolicy(
    scope: RecoveryScope,
    targetId: string
  ): Promise<RecoveryPolicy | null>;

  /**
   * Register policy
   */
  registerPolicy(policy: RecoveryPolicy): Promise<void>;

  /**
   * Unregister policy
   */
  unregisterPolicy(policyId: string): Promise<void>;

  /**
   * List policies
   */
  listPolicies(filter?: PolicyFilter): Promise<readonly RecoveryPolicy[]>;
}

/**
 * Policy evaluation result
 */
export interface PolicyEvaluationResult {
  readonly applicable: boolean;
  readonly suggestedStrategy: RecoveryStrategy;
  readonly reason: string;
  readonly conditionsMet: readonly string[];
  readonly conditionsNotMet: readonly string[];
}

/**
 * Policy filter
 */
export interface PolicyFilter {
  readonly scope?: RecoveryScope;
  readonly strategy?: RecoveryStrategy;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Rollback manager
 * Canonical interface for rollback operations
 */
export interface RollbackManager {
  /**
   * Execute rollback
   */
  executeRollback(
    executionId: string,
    checkpointId?: string
  ): Promise<RollbackResult>;

  /**
   * Get rollback status
   */
  getStatus(rollbackId: string): Promise<RollbackStatus>;

  /**
   * Validate rollback eligibility
   */
  validateEligibility(executionId: string): Promise<RollbackEligibility>;

  /**
   * Create rollback checkpoint
   */
  createCheckpoint(executionId: string): Promise<string>;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  readonly rollbackId: string;
  readonly success: boolean;
  readonly rolledBackAt?: Date;
  readonly durationMs?: number;
  readonly error?: RollbackError;
}

/**
 * Rollback error
 */
export interface RollbackError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Rollback status
 */
export enum RollbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Rollback eligibility
 */
export interface RollbackEligibility {
  readonly eligible: boolean;
  readonly reason: string;
  readonly availableCheckpoints: readonly string[];
}

/**
 * Compensation manager
 * Canonical interface for compensation operations
 */
export interface CompensationManager {
  /**
   * Execute compensation
   */
  executeCompensation(
    executionId: string,
    taskIds: readonly string[]
  ): Promise<CompensationResult>;

  /**
   * Get compensation status
   */
  getStatus(compensationId: string): Promise<CompensationStatus>;

  /**
   * Validate compensation eligibility
   */
  validateEligibility(
    executionId: string,
    taskIds: readonly string[]
  ): Promise<CompensationEligibility>;
}

/**
 * Compensation result
 */
export interface CompensationResult {
  readonly compensationId: string;
  readonly success: boolean;
  readonly compensatedAt?: Date;
  readonly durationMs?: number;
  readonly compensatedTasks: readonly string[];
  readonly error?: CompensationError;
}

/**
 * Compensation error
 */
export interface CompensationError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly failedTaskIds: readonly string[];
}

/**
 * Compensation status
 */
export enum CompensationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PARTIALLY_COMPLETED = 'partially_completed',
  FAILED = 'failed',
}

/**
 * Compensation eligibility
 */
export interface CompensationEligibility {
  readonly eligible: boolean;
  readonly reason: string;
  readonly compensatableTasks: readonly string[];
  readonly nonCompensatableTasks: readonly string[];
}

/**
 * Recovery coordinator
 * Canonical interface for coordinating recovery operations
 */
export interface RecoveryCoordinator {
  /**
   * Coordinate recovery
   */
  coordinateRecovery(
    context: RecoveryContext,
    options?: RecoveryOptions
  ): Promise<RecoveryResult>;

  /**
   * Get recovery candidates
   */
  getRecoveryCandidates(filter?: RecoveryCandidateFilter): Promise<readonly RecoveryCandidate[]>;

  /**
   * Execute batch recovery
   */
  executeBatchRecovery(
    contexts: readonly RecoveryContext[],
    options?: RecoveryOptions
  ): Promise<readonly RecoveryResult[]>;

  /**
   * Get recovery statistics
   */
  getStatistics(): Promise<RecoveryStatistics>;
}

/**
 * Recovery candidate
 */
export interface RecoveryCandidate {
  readonly scope: RecoveryScope;
  readonly targetId: string;
  readonly failureInfo: FailureInfo;
  readonly suggestedStrategy: RecoveryStrategy;
  readonly priority: number;
}

/**
 * Recovery candidate filter
 */
export interface RecoveryCandidateFilter {
  readonly scope?: RecoveryScope;
  readonly strategy?: RecoveryStrategy;
  readonly failureType?: string;
  readonly limit?: number;
}

/**
 * Recovery statistics
 */
export interface RecoveryStatistics {
  readonly totalRecoveries: number;
  readonly successfulRecoveries: number;
  readonly failedRecoveries: number;
  readonly averageRecoveryDurationMs: number;
  readonly recoveriesByStrategy: Record<RecoveryStrategy, number>;
  readonly recoveriesByScope: Record<RecoveryScope, number>;
}
