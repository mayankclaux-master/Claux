/**
 * Runtime Task Contract
 * 
 * Canonical interfaces for task execution and task executors
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Unique identifier for tasks
 */
export type TaskId = string;

/**
 * Task status
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

/**
 * Task type
 */
export type TaskType = string;

/**
 * Task priority
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Task execution context
 * Provides contextual information for task execution
 */
export interface TaskExecutionContext {
  readonly taskId: TaskId;
  readonly executionId: string;
  readonly taskType: TaskType;
  readonly input: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly traceId?: string;
  readonly parentTaskId?: TaskId;
  readonly dependencies?: readonly TaskId[];
  readonly retryCount: number;
  readonly signal?: AbortSignal;
}

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  readonly taskId: TaskId;
  readonly status: TaskStatus;
  readonly output?: Record<string, unknown>;
  readonly error?: TaskError;
  readonly metrics?: TaskMetrics;
  readonly completedAt?: Date;
  readonly durationMs?: number;
  readonly checkpoint?: TaskCheckpoint;
}

/**
 * Task error
 */
export interface TaskError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly recoverable: boolean;
  readonly retryable: boolean;
}

/**
 * Task metrics
 */
export interface TaskMetrics {
  readonly durationMs: number;
  readonly memoryUsageMb?: number;
  readonly cpuTimeMs?: number;
  readonly cost?: number;
  readonly tokens?: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Task checkpoint
 */
export interface TaskCheckpoint {
  readonly checkpointId: string;
  readonly taskId: TaskId;
  readonly timestamp: Date;
  readonly status: TaskStatus;
  readonly state: Record<string, unknown>;
  readonly progress: number;
}

/**
 * Task options
 */
export interface TaskOptions {
  readonly maxRetries?: number;
  readonly retryDelayMs?: number;
  readonly timeoutMs?: number;
  readonly priority?: TaskPriority;
  readonly enableCheckpointing?: boolean;
  readonly enableMetrics?: number;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: TaskProgress) => void;
  readonly onCheckpoint?: (checkpoint: TaskCheckpoint) => void;
  readonly onError?: (error: TaskError) => void;
}

/**
 * Task progress
 */
export interface TaskProgress {
  readonly taskId: TaskId;
  readonly percentage: number;
  readonly currentStep?: string;
  readonly estimatedRemainingMs?: number;
}

/**
 * Task definition
 */
export interface TaskDefinition {
  readonly taskId?: TaskId;
  readonly taskType: TaskType;
  readonly input: Record<string, unknown>;
  readonly dependencies?: readonly TaskId[];
  readonly options?: TaskOptions;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Runtime task executor
 * Canonical interface for task execution
 */
export interface RuntimeTaskExecutor {
  /**
   * Execute a task
   */
  execute(
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult>;

  /**
   * Resume a task from checkpoint
   */
  resume(
    taskId: TaskId,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult>;

  /**
   * Cancel a running task
   */
  cancel(taskId: TaskId): Promise<void>;

  /**
   * Get task status
   */
  getStatus(taskId: TaskId): Promise<TaskStatus>;

  /**
   * Get task result
   */
  getResult(taskId: TaskId): Promise<TaskExecutionResult | null>;

  /**
   * Create checkpoint
   */
  createCheckpoint(taskId: TaskId): Promise<TaskCheckpoint>;

  /**
   * Restore from checkpoint
   */
  restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint>;

  /**
   * Validate task input
   */
  validateInput(taskType: TaskType, input: Record<string, unknown>): Promise<ValidationResult>;

  /**
   * Validate task output
   */
  validateOutput(taskType: TaskType, output: Record<string, unknown>): Promise<ValidationResult>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

/**
 * Task executor factory
 * Factory function to create task executors for specific task types
 */
export interface TaskExecutorFactory {
  /**
   * Create task executor for task type
   */
  createExecutor(taskType: TaskType): RuntimeTaskExecutor | null;

  /**
   * Get supported task types
   */
  getSupportedTaskTypes(): readonly TaskType[];
}

/**
 * Task scheduler
 * Canonical interface for task scheduling
 */
export interface TaskScheduler {
  /**
   * Schedule a task
   */
  schedule(definition: TaskDefinition): Promise<TaskId>;

  /**
   * Schedule multiple tasks
   */
  scheduleBatch(definitions: readonly TaskDefinition[]): Promise<readonly TaskId[]>;

  /**
   * Cancel scheduled task
   */
  unschedule(taskId: TaskId): Promise<void>;

  /**
   * Get scheduled tasks
   */
  getScheduledTasks(filter?: TaskFilter): Promise<readonly TaskInfo[]>;

  /**
   * Get task queue status
   */
  getQueueStatus(): Promise<TaskQueueStatus>;
}

/**
 * Task filter
 */
export interface TaskFilter {
  readonly taskType?: TaskType;
  readonly status?: TaskStatus;
  readonly executionId?: string;
  readonly priority?: TaskPriority;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * Task info
 */
export interface TaskInfo {
  readonly taskId: TaskId;
  readonly taskType: TaskType;
  readonly status: TaskStatus;
  readonly executionId: string;
  readonly priority: TaskPriority;
  readonly scheduledAt: Date;
  readonly startedAt?: Date;
  readonly completedAt?: Date;
  readonly retryCount: number;
  readonly error?: TaskError;
}

/**
 * Task queue status
 */
export interface TaskQueueStatus {
  readonly pendingTasks: number;
  readonly runningTasks: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly queueDepth: number;
}
