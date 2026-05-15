/**
 * CLAUX Runtime Execution Engine Types
 * 
 * Pure execution layer types with no external dependencies.
 * Consumes runtime contracts only.
 */

import type {
  ExecutionId,
  TaskId,
  ExecutionStatus,
  TaskStatus,
  RuntimeEvent,
  RuntimeCheckpoint,
  CheckpointId,
} from '../contracts';

// Re-export commonly used types for convenience
export type { ExecutionId, TaskId, ExecutionStatus, TaskStatus, CheckpointId };

/**
 * Execution Engine Configuration
 */
export interface ExecutionEngineConfig {
  readonly maxParallelism: number;
  readonly checkpointIntervalMs: number;
  readonly retryMaxAttempts: number;
  readonly retryBackoffMs: number;
  readonly cancellationTimeoutMs: number;
  readonly deterministicReplay: boolean;
  readonly preserveCorrelationIds: boolean;
  readonly preserveCausationChains: boolean;
}

/**
 * DAG Node representing a task in the execution graph
 */
export interface DAGNode {
  readonly taskId: TaskId;
  readonly taskType: string;
  readonly dependencies: readonly TaskId[];
  readonly conditions?: readonly DAGCondition[];
  readonly retryPolicy?: RetryPolicy;
  readonly priority: number;
}

/**
 * DAG Condition for conditional execution
 */
export interface DAGCondition {
  readonly conditionId: string;
  readonly expression: string;
  readonly targetTaskId: TaskId;
}

/**
 * Directed Acyclic Graph
 */
export interface DAG {
  readonly nodes: readonly DAGNode[];
  readonly edges: readonly DAGEdge[];
  readonly rootNodes: readonly TaskId[];
  readonly leafNodes: readonly TaskId[];
}

/**
 * DAG Edge representing dependency relationship
 */
export interface DAGEdge {
  readonly from: TaskId;
  readonly to: TaskId;
  readonly edgeType: DAGEdgeType;
}

/**
 * DAG Edge Type
 */
export enum DAGEdgeType {
  DEPENDENCY = 'dependency',
  CONDITIONAL = 'conditional',
  RETRY = 'retry',
  RECOVERY = 'recovery',
}

/**
 * Retry Policy
 */
export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoffMs: number;
  readonly exponentialBackoff: boolean;
  readonly retryableErrors: readonly string[];
}

/**
 * Execution Graph State
 */
export interface ExecutionGraphState {
  readonly executionId: ExecutionId;
  readonly dag: DAG;
  readonly taskStates: Map<TaskId, TaskExecutionState>;
  readonly completedTasks: Set<TaskId>;
  readonly failedTasks: Set<TaskId>;
  readonly runnableTasks: Set<TaskId>;
  readonly inProgressTasks: Set<TaskId>;
  readonly cancelledTasks: Set<TaskId>;
  readonly checkpointId?: CheckpointId;
  readonly replayContext?: ReplayContext;
}

/**
 * Task Execution State
 */
export interface TaskExecutionState {
  readonly taskId: TaskId;
  readonly status: TaskStatus;
  readonly attempts: number;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly error?: ExecutionError;
  readonly result?: unknown;
  readonly checkpointed: boolean;
}

/**
 * Replay Context
 */
export interface ReplayContext {
  readonly originalExecutionId: ExecutionId;
  readonly replayExecutionId: ExecutionId;
  readonly replayCheckpointId: CheckpointId;
  readonly correlationId: string;
  readonly causationId: string;
  readonly preservedState: Map<TaskId, TaskExecutionState>;
}

/**
 * Execution Error
 */
export interface ExecutionError {
  readonly code: string;
  readonly message: string;
  readonly taskId?: TaskId;
  readonly timestamp: Date;
  readonly retryable: boolean;
  readonly recoverable: boolean;
}

/**
 * Runnable Task
 */
export interface RunnableTask {
  readonly taskId: TaskId;
  readonly node: DAGNode;
  readonly priority: number;
  readonly estimatedDurationMs?: number;
}

/**
 * Execution Window
 */
export interface ExecutionWindow {
  readonly maxConcurrency: number;
  readonly currentConcurrency: number;
  readonly availableSlots: number;
  readonly resourceLimits: ResourceLimits;
}

/**
 * Resource Limits
 */
export interface ResourceLimits {
  readonly maxCpu?: number;
  readonly maxMemory?: number;
  readonly maxBandwidth?: number;
}

/**
 * Priority Queue Item
 */
export interface PriorityQueueItem<T> {
  readonly item: T;
  readonly priority: number;
  readonly timestamp: Date;
}

/**
 * Concurrency Control State
 */
export interface ConcurrencyControlState {
  readonly activeExecutions: number;
  readonly queuedExecutions: number;
  readonly resourceUsage: ResourceUsage;
}

/**
 * Resource Usage
 */
export interface ResourceUsage {
  readonly cpu: number;
  readonly memory: number;
  readonly bandwidth: number;
}

/**
 * Checkpoint Engine State
 */
export interface CheckpointEngineState {
  readonly lastCheckpointAt?: Date;
  readonly checkpointCount: number;
  readonly checkpointSizeBytes: number;
  readonly pendingCheckpoint: boolean;
}

/**
 * Cancellation Engine State
 */
export interface CancellationEngineState {
  readonly cancelling: boolean;
  readonly cancelledTasks: Set<TaskId>;
  readonly cancellationReason?: string;
}

/**
 * Retry Engine State
 */
export interface RetryEngineState {
  readonly pendingRetries: Map<TaskId, RetryAttempt>;
  readonly retryHistory: Map<TaskId, readonly RetryAttempt[]>;
}

/**
 * Retry Attempt
 */
export interface RetryAttempt {
  readonly taskId: TaskId;
  readonly attemptNumber: number;
  readonly scheduledAt: Date;
  readonly error: ExecutionError;
}

/**
 * Execution Metrics
 */
export interface ExecutionMetrics {
  readonly queueLatencyMs: number;
  readonly taskRuntimeMs: number;
  readonly executionRuntimeMs: number;
  readonly retryCount: number;
  readonly replayCount: number;
  readonly recoveryCount: number;
  readonly concurrencyUtilization: number;
  readonly schedulingLatencyMs: number;
  readonly checkpointFrequency: number;
  readonly replayDeterminismViolations: number;
}

/**
 * Engine State
 */
export interface EngineState {
  readonly executionId: ExecutionId;
  readonly status: ExecutionEngineStatus;
  readonly graphState: ExecutionGraphState;
  readonly concurrencyState: ConcurrencyControlState;
  readonly checkpointState: CheckpointEngineState;
  readonly cancellationState: CancellationEngineState;
  readonly retryState: RetryEngineState;
  readonly metrics: ExecutionMetrics;
  readonly startedAt: Date;
  readonly updatedAt: Date;
}

/**
 * Execution Engine Status
 */
export enum ExecutionEngineStatus {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  CANCELLING = 'cancelling',
  RECOVERING = 'recovering',
  REPLAYING = 'replaying',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Execution Result
 */
export interface ExecutionResult {
  readonly executionId: ExecutionId;
  readonly status: ExecutionStatus;
  readonly completedTasks: readonly TaskId[];
  readonly failedTasks: readonly TaskId[];
  readonly cancelledTasks: readonly TaskId[];
  readonly durationMs: number;
  readonly metrics: ExecutionMetrics;
  readonly error?: ExecutionError;
}

/**
 * Task Dispatch Result
 */
export interface TaskDispatchResult {
  readonly taskId: TaskId;
  readonly dispatched: boolean;
  readonly queued: boolean;
  readonly error?: ExecutionError;
}

/**
 * Checkpoint Result
 */
export interface CheckpointResult {
  readonly checkpointId: CheckpointId;
  readonly success: boolean;
  readonly sizeBytes: number;
  readonly durationMs: number;
  readonly error?: ExecutionError;
}

/**
 * Replay Result
 */
export interface ReplayResult {
  readonly originalExecutionId: ExecutionId;
  readonly replayExecutionId: ExecutionId;
  readonly success: boolean;
  readonly durationMs: number;
  readonly determinismVerified: boolean;
  readonly error?: ExecutionError;
}

/**
 * Recovery Result
 */
export interface RecoveryResult {
  readonly originalExecutionId: ExecutionId;
  readonly recoveredExecutionId: ExecutionId;
  readonly success: boolean;
  readonly recoveredTasks: readonly TaskId[];
  readonly durationMs: number;
  readonly error?: ExecutionError;
}
