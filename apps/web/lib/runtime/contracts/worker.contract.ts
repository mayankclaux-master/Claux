/**
 * Runtime Worker Contract
 * 
 * Canonical interfaces for worker lifecycle and task processing
 * Framework-agnostic, database-agnostic, queue-agnostic abstractions
 */

/**
 * Unique identifier for workers
 */
export type WorkerId = string;

/**
 * Worker status
 */
export enum WorkerStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  STARTING = 'starting',
  STOPPING = 'stopping',
  STOPPED = 'stopped',
  ERROR = 'error',
}

/**
 * Worker type
 */
export type WorkerType = string;

/**
 * Worker capabilities
 */
export interface WorkerCapabilities {
  readonly supportedTaskTypes: readonly string[];
  readonly maxConcurrentTasks: number;
  readonly supportsCheckpointing: boolean;
  readonly supportsStreaming: boolean;
  readonly customCapabilities?: Record<string, unknown>;
}

/**
 * Worker configuration
 */
export interface WorkerConfig {
  readonly workerId?: WorkerId;
  readonly workerType: WorkerType;
  readonly capabilities: WorkerCapabilities;
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly heartbeatIntervalMs?: number;
  readonly enableMetrics?: boolean;
  readonly enableTracing?: boolean;
}

/**
 * Worker state
 */
export interface WorkerState {
  readonly workerId: WorkerId;
  readonly workerType: WorkerType;
  readonly status: WorkerStatus;
  readonly currentTasks: readonly string[];
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly uptimeMs: number;
  readonly lastHeartbeat?: Date;
  readonly error?: WorkerError;
}

/**
 * Worker error
 */
export interface WorkerError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: Date;
}

/**
 * Worker metrics
 */
export interface WorkerMetrics {
  readonly tasksProcessed: number;
  readonly tasksSucceeded: number;
  readonly tasksFailed: number;
  readonly averageTaskDurationMs: number;
  readonly memoryUsageMb: number;
  readonly cpuUsagePercent: number;
  readonly queueDepth: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Worker heartbeat
 */
export interface WorkerHeartbeat {
  readonly workerId: WorkerId;
  readonly timestamp: Date;
  readonly status: WorkerStatus;
  readonly currentTaskCount: number;
  readonly metrics?: WorkerMetrics;
}

/**
 * Runtime worker
 * Canonical interface for worker lifecycle
 */
export interface RuntimeWorker {
  /**
   * Start the worker
   */
  start(): Promise<void>;

  /**
   * Stop the worker gracefully
   */
  stop(): Promise<void>;

  /**
   * Stop the worker immediately
   */
  stopNow(): Promise<void>;

  /**
   * Get worker status
   */
  getStatus(): Promise<WorkerStatus>;

  /**
   * Get worker state
   */
  getState(): Promise<WorkerState>;

  /**
   * Get worker metrics
   */
  getMetrics(): Promise<WorkerMetrics>;

  /**
   * Send heartbeat
   */
  sendHeartbeat(): Promise<void>;

  /**
   * Process a task
   */
  processTask(
    taskId: string,
    taskType: string,
    input: Record<string, unknown>,
    signal?: AbortSignal
  ): Promise<WorkerTaskResult>;

  /**
   * Health check
   */
  healthCheck(): Promise<WorkerHealthStatus>;
}

/**
 * Worker task result
 */
export interface WorkerTaskResult {
  readonly taskId: string;
  readonly success: boolean;
  readonly output?: Record<string, unknown>;
  readonly error?: WorkerTaskError;
  readonly metrics?: WorkerTaskMetrics;
  readonly durationMs: number;
}

/**
 * Worker task error
 */
export interface WorkerTaskError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly retryable: boolean;
}

/**
 * Worker task metrics
 */
export interface WorkerTaskMetrics {
  readonly durationMs: number;
  readonly memoryUsageMb?: number;
  readonly cpuTimeMs?: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Worker health status
 */
export interface WorkerHealthStatus {
  readonly healthy: boolean;
  readonly status: WorkerStatus;
  readonly issues: readonly string[];
  readonly uptimeMs: number;
  readonly lastHeartbeat?: Date;
}

/**
 * Worker pool
 * Canonical interface for managing multiple workers
 */
export interface WorkerPool {
  /**
   * Add worker to pool
   */
  addWorker(config: WorkerConfig): Promise<WorkerId>;

  /**
   * Remove worker from pool
   */
  removeWorker(workerId: WorkerId): Promise<void>;

  /**
   * Get worker from pool
   */
  getWorker(workerId: WorkerId): RuntimeWorker | null;

  /**
   * Get all workers in pool
   */
  getWorkers(): readonly RuntimeWorker[];

  /**
   * Get pool status
   */
  getPoolStatus(): Promise<WorkerPoolStatus>;

  /**
   * Scale pool to target size
   */
  scale(targetSize: number): Promise<void>;

  /**
   * Start pool
   */
  start(): Promise<void>;

  /**
   * Stop pool gracefully
   */
  stop(): Promise<void>;

  /**
   * Stop pool immediately
   */
  stopNow(): Promise<void>;

  /**
   * Dispatch task to available worker
   */
  dispatchTask(
    taskType: string,
    input: Record<string, unknown>,
    options?: TaskDispatchOptions
  ): Promise<WorkerTaskResult>;

  /**
   * Get pool metrics
   */
  getPoolMetrics(): Promise<WorkerPoolMetrics>;
}

/**
 * Task dispatch options
 */
export interface TaskDispatchOptions {
  readonly priority?: 'low' | 'normal' | 'high' | 'critical';
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly workerId?: WorkerId; // Specific worker to use
}

/**
 * Worker pool status
 */
export interface WorkerPoolStatus {
  readonly totalWorkers: number;
  readonly activeWorkers: number;
  readonly idleWorkers: number;
  readonly errorWorkers: number;
  readonly queueDepth: number;
  readonly processingTasks: number;
}

/**
 * Worker pool metrics
 */
export interface WorkerPoolMetrics {
  readonly tasksProcessed: number;
  readonly tasksSucceeded: number;
  readonly tasksFailed: number;
  readonly averageTaskDurationMs: number;
  readonly poolUptimeMs: number;
  readonly throughputPerSecond: number;
  readonly customMetrics?: Record<string, number>;
}

/**
 * Worker factory
 * Factory function to create workers
 */
export interface WorkerFactory {
  /**
   * Create worker
   */
  createWorker(config: WorkerConfig): RuntimeWorker;

  /**
   * Create worker pool
   */
  createWorkerPool(config: WorkerPoolConfig): WorkerPool;

  /**
   * Get supported worker types
   */
  getSupportedWorkerTypes(): readonly WorkerType[];
}

/**
 * Worker pool configuration
 */
export interface WorkerPoolConfig {
  readonly poolId?: string;
  readonly workerType: WorkerType;
  readonly minWorkers: number;
  readonly maxWorkers: number;
  readonly workerConfig: WorkerConfig;
  readonly autoScale?: boolean;
  readonly scaleUpThreshold?: number;
  readonly scaleDownThreshold?: number;
}
