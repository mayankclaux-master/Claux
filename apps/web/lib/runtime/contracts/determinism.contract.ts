/**
 * Deterministic Execution Contracts
 * 
 * Canonical interfaces for deterministic execution and replay
 * Enables durable execution, reproducible execution, and audit replay
 */

/**
 * Determinism level
 */
export enum DeterminismLevel {
  NONE = 'none',
  PARTIAL = 'partial',
  FULL = 'full',
}

/**
 * Execution seed
 * Canonical interface for execution seeding
 */
export interface ExecutionSeed {
  readonly seedId: string;
  readonly seedValue: string;
  readonly algorithm: SeedAlgorithm;
  readonly scope: SeedScope;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Seed algorithm
 */
export enum SeedAlgorithm {
  RANDOM = 'random',
  TIME_BASED = 'time_based',
  COUNTER_BASED = 'counter_based',
  HASH_BASED = 'hash_based',
  CUSTOM = 'custom',
}

/**
 * Seed scope
 */
export enum SeedScope {
  EXECUTION = 'execution',
  TASK = 'task',
  WORKFLOW = 'workflow',
  GLOBAL = 'global',
}

/**
 * Deterministic execution context
 */
export interface DeterministicExecutionContext {
  readonly executionId: string;
  readonly determinismLevel: DeterminismLevel;
  readonly seed: ExecutionSeed;
  readonly replayMode: boolean;
  readonly replaySource?: ReplaySource;
  readonly deterministicInputs: Record<string, unknown>;
  readonly nonDeterministicInputs: readonly string[];
  readonly traceId?: string;
}

/**
 * Replay source
 */
export interface ReplaySource {
  readonly sourceType: ReplaySourceType;
  readonly sourceId: string;
  readonly sourceVersion: string;
  readonly timestamp: Date;
}

/**
 * Replay source type
 */
export enum ReplaySourceType {
  EXECUTION = 'execution',
  CHECKPOINT = 'checkpoint',
  SNAPSHOT = 'snapshot',
  AUDIT_LOG = 'audit_log',
  CUSTOM = 'custom',
}

/**
 * Replay context
 */
export interface ReplayContext {
  readonly replayId: string;
  readonly originalExecutionId: string;
  readonly replayExecutionId: string;
  readonly replayStrategy: ReplayStrategy;
  readonly replayPoint: ReplayPoint;
  readonly deterministicMode: boolean;
  readonly seedOverride?: ExecutionSeed;
  readonly inputOverrides?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Replay strategy
 */
export enum ReplayStrategy {
  FULL_REPLAY = 'full_replay',
  PARTIAL_REPLAY = 'partial_replay',
  FAST_FORWARD = 'fast_forward',
  STEP_THROUGH = 'step_through',
  DRY_RUN = 'dry_run',
}

/**
 * Replay point
 */
export interface ReplayPoint {
  readonly pointType: ReplayPointType;
  readonly pointId: string;
  readonly timestamp: Date;
  readonly state: Record<string, unknown>;
}

/**
 * Replay point type
 */
export enum ReplayPointType {
  CHECKPOINT = 'checkpoint',
  TASK_COMPLETION = 'task_completion',
  EVENT = 'event',
  CUSTOM = 'custom',
}

/**
 * Replay result
 */
export interface ReplayResult {
  readonly replayId: string;
  readonly success: boolean;
  readonly replayedAt: Date;
  readonly durationMs: number;
  readonly originalExecutionId: string;
  readonly replayExecutionId: string;
  readonly divergenceReport?: DivergenceReport;
  readonly output?: Record<string, unknown>;
  readonly error?: ReplayError;
}

/**
 * Divergence report
 */
export interface DivergenceReport {
  readonly divergent: boolean;
  readonly divergencePoints: readonly DivergencePoint[];
  readonly divergenceScore: number; // 0-100
  readonly rootCause?: DivergenceRootCause;
}

/**
 * Divergence point
 */
export interface DivergencePoint {
  readonly pointId: string;
  readonly pointType: ReplayPointType;
  readonly originalValue: unknown;
  readonly replayedValue: unknown;
  readonly divergenceReason: string;
  readonly timestamp: Date;
}

/**
 * Divergence root cause
 */
export interface DivergenceRootCause {
  readonly causeType: DivergenceCauseType;
  readonly description: string;
  readonly affectedComponents: readonly string[];
  readonly suggestedRemediation?: string;
}

/**
 * Divergence cause type
 */
export enum DivergenceCauseType {
  INPUT_DIFFERENCE = 'input_difference',
  NON_DETERMINISTIC_OPERATION = 'non_deterministic_operation',
  EXTERNAL_DEPENDENCY = 'external_dependency',
  TIMING_DIFFERENCE = 'timing_difference',
  STATE_DIFFERENCE = 'state_difference',
  SEED_DIFFERENCE = 'seed_difference',
  UNKNOWN = 'unknown',
}

/**
 * Replay error
 */
export interface ReplayError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly replayPoint?: ReplayPoint;
}

/**
 * Deterministic execution engine
 * Canonical interface for deterministic execution
 */
export interface DeterministicExecutionEngine {
  /**
   * Execute with determinism
   */
  executeDeterministic(
    context: DeterministicExecutionContext,
    workflowId: string,
    input: Record<string, unknown>
  ): Promise<DeterministicExecutionResult>;

  /**
   * Replay execution
   */
  replay(
    context: ReplayContext
  ): Promise<ReplayResult>;

  /**
   * Validate determinism
   */
  validateDeterminism(
    executionId: string
  ): Promise<DeterminismValidationResult>;

  /**
   * Generate execution seed
   */
  generateSeed(
    scope: SeedScope,
    algorithm: SeedAlgorithm,
    input?: Record<string, unknown>
  ): Promise<ExecutionSeed>;

  /**
   * Capture execution snapshot
   */
  captureSnapshot(
    executionId: string,
    pointType: ReplayPointType
  ): Promise<ExecutionSnapshot>;

  /**
   * Restore from snapshot
   */
  restoreSnapshot(
    snapshotId: string
  ): Promise<SnapshotRestoreResult>;

  /**
   * Compare executions
   */
  compareExecutions(
    executionId1: string,
    executionId2: string
  ): Promise<ExecutionComparisonResult>;
}

/**
 * Deterministic execution result
 */
export interface DeterministicExecutionResult {
  readonly executionId: string;
  readonly success: boolean;
  readonly determinismVerified: boolean;
  readonly seed: ExecutionSeed;
  readonly output?: Record<string, unknown>;
  readonly determinismReport?: DeterminismReport;
  readonly error?: DeterministicExecutionError;
}

/**
 * Determinism report
 */
export interface DeterminismReport {
  readonly determinismLevel: DeterminismLevel;
  readonly verified: boolean;
  readonly nonDeterministicOperations: readonly string[];
  readonly externalDependencies: readonly string[];
  readonly seedConsistency: boolean;
  readonly recommendations: readonly string[];
}

/**
 * Deterministic execution error
 */
export interface DeterministicExecutionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly determinismViolated: boolean;
}

/**
 * Determinism validation result
 */
export interface DeterminismValidationResult {
  readonly valid: boolean;
  readonly determinismLevel: DeterminismLevel;
  readonly violations: readonly DeterminismViolation[];
  readonly warnings: readonly string[];
  readonly seedConsistency: boolean;
}

/**
 * Determinism violation
 */
export interface DeterminismViolation {
  readonly violationType: DeterminismViolationType;
  readonly component: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Determinism violation type
 */
export enum DeterminismViolationType {
  NON_DETERMINISTIC_OPERATION = 'non_deterministic_operation',
  EXTERNAL_DEPENDENCY = 'external_dependency',
  STATE_MUTATION = 'state_mutation',
  TIMING_DEPENDENCY = 'timing_dependency',
  SEED_INCONSISTENCY = 'seed_inconsistency',
}

/**
 * Execution snapshot
 */
export interface ExecutionSnapshot {
  readonly snapshotId: string;
  readonly executionId: string;
  readonly pointType: ReplayPointType;
  readonly timestamp: Date;
  readonly state: ExecutionState;
  readonly inputs: Record<string, unknown>;
  readonly outputs?: Record<string, unknown>;
  readonly seed: ExecutionSeed;
  readonly traceId?: string;
}

/**
 * Execution state
 */
export interface ExecutionState {
  readonly executionId: string;
  readonly status: string;
  readonly completedTasks: readonly string[];
  readonly currentTask?: string;
  readonly stateData: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Snapshot restore result
 */
export interface SnapshotRestoreResult {
  readonly snapshotId: string;
  readonly success: boolean;
  readonly restoredAt: Date;
  readonly restoredExecutionId: string;
  readonly state: ExecutionState;
  readonly error?: SnapshotRestoreError;
}

/**
 * Snapshot restore error
 */
export interface SnapshotRestoreError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Execution comparison result
 */
export interface ExecutionComparisonResult {
  readonly executionId1: string;
  readonly executionId2: string;
  readonly identical: boolean;
  readonly similarityScore: number; // 0-100
  readonly differences: readonly ExecutionDifference[];
  readonly summary: ComparisonSummary;
}

/**
 * Execution difference
 */
export interface ExecutionDifference {
  readonly component: string;
  readonly differenceType: DifferenceType;
  readonly value1: unknown;
  readonly value2: unknown;
  readonly impact: 'low' | 'medium' | 'high';
}

/**
 * Difference type
 */
export enum DifferenceType {
  INPUT = 'input',
  OUTPUT = 'output',
  STATE = 'state',
  TIMING = 'timing',
  SEQUENCE = 'sequence',
  METADATA = 'metadata',
}

/**
 * Comparison summary
 */
export interface ComparisonSummary {
  readonly totalDifferences: number;
  readonly criticalDifferences: number;
  readonly highImpactDifferences: number;
  readonly mediumImpactDifferences: number;
  readonly lowImpactDifferences: number;
  readonly recommendation: string;
}

/**
 * Audit replay
 * Canonical interface for audit replay
 */
export interface AuditReplay {
  /**
   * Replay from audit log
   */
  replayFromAudit(
    auditLogId: string,
    options?: AuditReplayOptions
  ): Promise<AuditReplayResult>;

  /**
   * Generate audit log
   */
  generateAuditLog(
    executionId: string
  ): Promise<AuditLog>;

  /**
   * Validate audit log
   */
  validateAuditLog(
    auditLogId: string
  ): Promise<AuditValidationResult>;

  /**
   * Replay audit step
   */
  replayAuditStep(
    auditLogId: string,
    stepId: string,
    context?: ReplayContext
  ): Promise<StepReplayResult>;
}

/**
 * Audit replay options
 */
export interface AuditReplayOptions {
  readonly replayStrategy?: ReplayStrategy;
  readonly inputOverrides?: Record<string, unknown>;
  readonly seedOverride?: ExecutionSeed;
  readonly stopAtStep?: string;
  readonly validateDeterminism?: boolean;
}

/**
 * Audit replay result
 */
export interface AuditReplayResult {
  readonly auditLogId: string;
  readonly replayId: string;
  readonly success: boolean;
  readonly replayedSteps: number;
  readonly divergenceReport?: DivergenceReport;
  readonly error?: AuditReplayError;
}

/**
 * Audit replay error
 */
export interface AuditReplayError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly failedAtStep?: string;
}

/**
 * Audit log
 */
export interface AuditLog {
  readonly auditLogId: string;
  readonly executionId: string;
  readonly createdAt: Date;
  readonly steps: readonly AuditStep[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Audit step
 */
export interface AuditStep {
  readonly stepId: string;
  readonly stepType: string;
  readonly timestamp: Date;
  readonly inputs: Record<string, unknown>;
  readonly outputs?: Record<string, unknown>;
  readonly state?: Record<string, unknown>;
  readonly seed?: ExecutionSeed;
  readonly durationMs?: number;
}

/**
 * Audit validation result
 */
export interface AuditValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly completenessScore: number; // 0-100
}

/**
 * Step replay result
 */
export interface StepReplayResult {
  readonly stepId: string;
  readonly success: boolean;
  readonly output?: Record<string, unknown>;
  readonly divergence?: DivergencePoint;
  readonly error?: ReplayError;
}
