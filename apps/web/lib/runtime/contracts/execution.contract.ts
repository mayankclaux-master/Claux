/**
 * Runtime Execution Contract
 * 
 * Canonical interfaces for execution lifecycle and workflow execution
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Unique identifier for executions
 */
export type ExecutionId = string;

/**
 * Execution status
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

/**
 * Execution context
 * Provides contextual information for execution
 */
export interface ExecutionContext {
  readonly executionId: ExecutionId;
  readonly tenantId: string;
  readonly workflowId: string;
  readonly workflowVersion: string;
  readonly input: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly traceId?: string;
  readonly parentExecutionId?: ExecutionId;
  readonly startedAt?: Date;
  readonly signal?: AbortSignal;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  readonly executionId: ExecutionId;
  readonly status: ExecutionStatus;
  readonly output?: Record<string, unknown>;
  readonly error?: ExecutionError;
  readonly metrics?: ExecutionMetrics;
  readonly completedAt?: Date;
  readonly durationMs?: number;
}

/**
 * Execution metrics
 */
export interface ExecutionMetrics {
  readonly taskCount: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly retriedTasks: number;
  readonly skippedTasks: number;
  readonly totalDurationMs: number;
  readonly cost?: number;
  readonly tokens?: number;
}

/**
 * Execution error
 */
export interface ExecutionError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly taskId?: string;
  readonly recoverable: boolean;
}

/**
 * Execution checkpoint
 */
export interface ExecutionCheckpoint {
  readonly checkpointId: string;
  readonly executionId: ExecutionId;
  readonly timestamp: Date;
  readonly status: ExecutionStatus;
  readonly state: Record<string, unknown>;
  readonly completedTaskIds: readonly string[];
  readonly nextTaskId?: string;
}

/**
 * Execution options
 */
export interface ExecutionOptions {
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly enableCheckpointing?: boolean;
  readonly enableMetrics?: boolean;
  readonly enableTracing?: boolean;
  readonly checkpointIntervalMs?: number;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: ExecutionProgress) => void;
  readonly onCheckpoint?: (checkpoint: ExecutionCheckpoint) => void;
  readonly onError?: (error: ExecutionError) => void;
}

/**
 * Execution progress
 */
export interface ExecutionProgress {
  readonly executionId: ExecutionId;
  readonly percentage: number;
  readonly completedTasks: number;
  readonly totalTasks: number;
  readonly currentTaskId?: string;
  readonly estimatedRemainingMs?: number;
}

/**
 * Workflow execution engine
 * Canonical interface for workflow execution
 */
export interface WorkflowExecutionEngine {
  /**
   * Execute a workflow
   */
  execute(
    workflowId: string,
    input: Record<string, unknown>,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;

  /**
   * Resume a paused or failed execution
   */
  resume(
    executionId: ExecutionId,
    checkpoint?: ExecutionCheckpoint,
    options?: ExecutionOptions
  ): Promise<ExecutionResult>;

  /**
   * Cancel a running execution
   */
  cancel(executionId: ExecutionId): Promise<void>;

  /**
   * Pause a running execution
   */
  pause(executionId: ExecutionId): Promise<ExecutionCheckpoint>;

  /**
   * Get execution status
   */
  getStatus(executionId: ExecutionId): Promise<ExecutionStatus>;

  /**
   * Get execution result
   */
  getResult(executionId: ExecutionId): Promise<ExecutionResult | null>;

  /**
   * List executions
   */
  listExecutions(filter?: ExecutionFilter): Promise<readonly ExecutionInfo[]>;

  /**
   * Create checkpoint
   */
  createCheckpoint(executionId: ExecutionId): Promise<ExecutionCheckpoint>;

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(checkpointId: string): Promise<ExecutionCheckpoint>;
}

/**
 * Execution info
 */
export interface ExecutionInfo {
  readonly executionId: ExecutionId;
  readonly workflowId: string;
  readonly status: ExecutionStatus;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly progress: number;
  readonly error?: ExecutionError;
}

/**
 * Execution filter
 */
export interface ExecutionFilter {
  readonly workflowId?: string;
  readonly status?: ExecutionStatus;
  readonly tenantId?: string;
  readonly startedAfter?: Date;
  readonly startedBefore?: Date;
  readonly limit?: number;
  readonly offset?: number;
}
