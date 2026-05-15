/**
 * CLAUX Runtime Execution Engine Constants
 * 
 * Execution layer constants with no external dependencies.
 */

/**
 * Default execution engine configuration
 */
export const DEFAULT_EXECUTION_ENGINE_CONFIG = {
  maxParallelism: 10,
  checkpointIntervalMs: 30000, // 30 seconds
  retryMaxAttempts: 3,
  retryBackoffMs: 1000,
  cancellationTimeoutMs: 30000, // 30 seconds
  deterministicReplay: true,
  preserveCorrelationIds: true,
  preserveCausationChains: true,
} as const;

/**
 * Execution timeout constants
 */
export const EXECUTION_TIMEOUTS = {
  TASK_TIMEOUT_MS: 300000, // 5 minutes
  EXECUTION_TIMEOUT_MS: 3600000, // 1 hour
  CHECKPOINT_TIMEOUT_MS: 10000, // 10 seconds
  CANCELLATION_TIMEOUT_MS: 30000, // 30 seconds
  RECOVERY_TIMEOUT_MS: 60000, // 1 minute
  REPLAY_TIMEOUT_MS: 120000, // 2 minutes
} as const;

/**
 * Retry policy constants
 */
export const RETRY_POLICIES = {
  DEFAULT_MAX_ATTEMPTS: 3,
  DEFAULT_BACKOFF_MS: 1000,
  EXPONENTIAL_BACKOFF_MULTIPLIER: 2,
  MAX_BACKOFF_MS: 60000, // 1 minute
} as const;

/**
 * Concurrency limits
 */
export const CONCURRENCY_LIMITS = {
  DEFAULT_MAX_PARALLELISM: 10,
  MIN_PARALLELISM: 1,
  MAX_PARALLELISM: 100,
  DEFAULT_QUEUE_SIZE: 1000,
} as const;

/**
 * Checkpoint constants
 */
export const CHECKPOINT_CONSTANTS = {
  DEFAULT_INTERVAL_MS: 30000, // 30 seconds
  MIN_INTERVAL_MS: 5000, // 5 seconds
  MAX_INTERVAL_MS: 300000, // 5 minutes
  MAX_CHECKPOINT_SIZE_BYTES: 10485760, // 10 MB
  MAX_CHECKPOINT_COUNT: 100,
} as const;

/**
 * Priority levels
 */
export const PRIORITY_LEVELS = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
  MINIMAL: 0,
} as const;

/**
 * Resource limits
 */
export const RESOURCE_LIMITS = {
  DEFAULT_MAX_CPU: 100, // 100%
  DEFAULT_MAX_MEMORY: 1073741824, // 1 GB in bytes
  DEFAULT_MAX_BANDWIDTH: 104857600, // 100 MB/s
} as const;

/**
 * Error codes
 */
export const ERROR_CODES = {
  // DAG errors
  INVALID_DAG: 'INVALID_DAG',
  CYCLE_DETECTED: 'CYCLE_DETECTED',
  INVALID_DEPENDENCY: 'INVALID_DEPENDENCY',
  MISSING_DEPENDENCY: 'MISSING_DEPENDENCY',

  // Execution errors
  TASK_TIMEOUT: 'TASK_TIMEOUT',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  TASK_FAILED: 'TASK_FAILED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',

  // Checkpoint errors
  CHECKPOINT_FAILED: 'CHECKPOINT_FAILED',
  CHECKPOINT_RESTORE_FAILED: 'CHECKPOINT_RESTORE_FAILED',
  CHECKPOINT_TOO_LARGE: 'CHECKPOINT_TOO_LARGE',

  // Retry errors
  RETRY_EXHAUSTED: 'RETRY_EXHAUSTED',
  RETRY_FAILED: 'RETRY_FAILED',

  // Cancellation errors
  CANCELLATION_FAILED: 'CANCELLATION_FAILED',
  CANCELLATION_TIMEOUT: 'CANCELLATION_TIMEOUT',

  // Replay errors
  REPLAY_FAILED: 'REPLAY_FAILED',
  REPLAY_DETERMINISM_VIOLATION: 'REPLAY_DETERMINISM_VIOLATION',

  // Recovery errors
  RECOVERY_FAILED: 'RECOVERY_FAILED',
  RECOVERY_NO_CHECKPOINT: 'RECOVERY_NO_CHECKPOINT',

  // Concurrency errors
  CONCURRENCY_LIMIT_EXCEEDED: 'CONCURRENCY_LIMIT_EXCEEDED',
  RESOURCE_LIMIT_EXCEEDED: 'RESOURCE_LIMIT_EXCEEDED',

  // State machine errors
  INVALID_STATE_TRANSITION: 'INVALID_STATE_TRANSITION',
  STATE_MACHINE_ERROR: 'STATE_MACHINE_ERROR',
} as const;

/**
 * State transition timeouts
 */
export const STATE_TRANSITION_TIMEOUTS = {
  DEFAULT_TIMEOUT_MS: 5000, // 5 seconds
  CANCELLATION_TIMEOUT_MS: 30000, // 30 seconds
  RECOVERY_TIMEOUT_MS: 60000, // 1 minute
} as const;

/**
 * Metrics collection intervals
 */
export const METRICS_INTERVALS = {
  QUEUE_LATENCY_MS: 1000,
  TASK_RUNTIME_MS: 100,
  EXECUTION_RUNTIME_MS: 1000,
  CONCURRENCY_UTILIZATION_MS: 1000,
  SCHEDULING_LATENCY_MS: 100,
} as const;

/**
 * Determinism validation constants
 */
export const DETERMINISM_CONSTANTS = {
  MAX_CORRELATION_ID_LENGTH: 256,
  MAX_CAUSATION_CHAIN_LENGTH: 100,
  MAX_EVENT_LATENCY_MS: 60000, // 1 minute
  STRICT_ORDERING: true,
} as const;
