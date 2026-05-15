/**
 * CLAUX Runtime Execution Engine Errors
 * 
 * Execution layer error types with no external dependencies.
 */

import { ERROR_CODES } from './constants';
import type { ExecutionError } from './types';

/**
 * Base Execution Engine Error
 */
export class ExecutionEngineError extends Error {
  readonly code: string;
  readonly taskId?: string;
  readonly timestamp: Date;
  readonly retryable: boolean;
  readonly recoverable: boolean;

  constructor(
    code: string,
    message: string,
    taskId?: string,
    retryable: boolean = false,
    recoverable: boolean = false
  ) {
    super(message);
    this.name = 'ExecutionEngineError';
    this.code = code;
    this.taskId = taskId;
    this.timestamp = new Date();
    this.retryable = retryable;
    this.recoverable = recoverable;
    Object.setPrototypeOf(this, ExecutionEngineError.prototype);
  }

  toExecutionError(): ExecutionError {
    return {
      code: this.code,
      message: this.message,
      taskId: this.taskId,
      timestamp: this.timestamp,
      retryable: this.retryable,
      recoverable: this.recoverable,
    };
  }
}

/**
 * DAG Validation Error
 */
export class DAGValidationError extends ExecutionEngineError {
  constructor(message: string, taskId?: string) {
    super(ERROR_CODES.INVALID_DAG, message, taskId, false, false);
    this.name = 'DAGValidationError';
    Object.setPrototypeOf(this, DAGValidationError.prototype);
  }
}

/**
 * Cycle Detection Error
 */
export class CycleDetectionError extends ExecutionEngineError {
  readonly cycle: readonly string[];

  constructor(cycle: readonly string[], taskId?: string) {
    super(
      ERROR_CODES.CYCLE_DETECTED,
      `Cycle detected in execution graph: ${cycle.join(' -> ')}`,
      taskId,
      false,
      false
    );
    this.name = 'CycleDetectionError';
    this.cycle = cycle;
    Object.setPrototypeOf(this, CycleDetectionError.prototype);
  }
}

/**
 * Invalid Dependency Error
 */
export class InvalidDependencyError extends ExecutionEngineError {
  constructor(taskId: string, dependencyId: string) {
    super(
      ERROR_CODES.INVALID_DEPENDENCY,
      `Invalid dependency: task ${taskId} depends on non-existent task ${dependencyId}`,
      taskId,
      false,
      false
    );
    this.name = 'InvalidDependencyError';
    Object.setPrototypeOf(this, InvalidDependencyError.prototype);
  }
}

/**
 * Missing Dependency Error
 */
export class MissingDependencyError extends ExecutionEngineError {
  constructor(taskId: string, dependencyId: string) {
    super(
      ERROR_CODES.MISSING_DEPENDENCY,
      `Missing dependency: task ${taskId} requires ${dependencyId} to complete first`,
      taskId,
      false,
      true
    );
    this.name = 'MissingDependencyError';
    Object.setPrototypeOf(this, MissingDependencyError.prototype);
  }
}

/**
 * Task Timeout Error
 */
export class TaskTimeoutError extends ExecutionEngineError {
  constructor(taskId: string, timeoutMs: number) {
    super(
      ERROR_CODES.TASK_TIMEOUT,
      `Task ${taskId} timed out after ${timeoutMs}ms`,
      taskId,
      true,
      true
    );
    this.name = 'TaskTimeoutError';
    Object.setPrototypeOf(this, TaskTimeoutError.prototype);
  }
}

/**
 * Execution Timeout Error
 */
export class ExecutionTimeoutError extends ExecutionEngineError {
  constructor(executionId: string, timeoutMs: number) {
    super(
      ERROR_CODES.EXECUTION_TIMEOUT,
      `Execution ${executionId} timed out after ${timeoutMs}ms`,
      undefined,
      false,
      true
    );
    this.name = 'ExecutionTimeoutError';
    Object.setPrototypeOf(this, ExecutionTimeoutError.prototype);
  }
}

/**
 * Task Failed Error
 */
export class TaskFailedError extends ExecutionEngineError {
  readonly cause?: Error;

  constructor(taskId: string, cause?: Error) {
    super(
      ERROR_CODES.TASK_FAILED,
      `Task ${taskId} failed${cause ? `: ${cause.message}` : ''}`,
      taskId,
      true,
      true
    );
    this.name = 'TaskFailedError';
    this.cause = cause;
    Object.setPrototypeOf(this, TaskFailedError.prototype);
  }
}

/**
 * Execution Failed Error
 */
export class ExecutionFailedError extends ExecutionEngineError {
  readonly cause?: Error;

  constructor(executionId: string, cause?: Error) {
    super(
      ERROR_CODES.EXECUTION_FAILED,
      `Execution ${executionId} failed${cause ? `: ${cause.message}` : ''}`,
      undefined,
      false,
      true
    );
    this.name = 'ExecutionFailedError';
    this.cause = cause;
    Object.setPrototypeOf(this, ExecutionFailedError.prototype);
  }
}

/**
 * Checkpoint Failed Error
 */
export class CheckpointFailedError extends ExecutionEngineError {
  readonly cause?: Error;

  constructor(taskId?: string, cause?: Error) {
    super(
      ERROR_CODES.CHECKPOINT_FAILED,
      `Checkpoint failed${taskId ? ` for task ${taskId}` : ''}${cause ? `: ${cause.message}` : ''}`,
      taskId,
      false,
      true
    );
    this.name = 'CheckpointFailedError';
    this.cause = cause;
    Object.setPrototypeOf(this, CheckpointFailedError.prototype);
  }
}

/**
 * Checkpoint Restore Failed Error
 */
export class CheckpointRestoreFailedError extends ExecutionEngineError {
  readonly checkpointId: string;
  readonly cause?: Error;

  constructor(checkpointId: string, cause?: Error) {
    super(
      ERROR_CODES.CHECKPOINT_RESTORE_FAILED,
      `Failed to restore checkpoint ${checkpointId}${cause ? `: ${cause.message}` : ''}`,
      undefined,
      false,
      false
    );
    this.name = 'CheckpointRestoreFailedError';
    this.checkpointId = checkpointId;
    this.cause = cause;
    Object.setPrototypeOf(this, CheckpointRestoreFailedError.prototype);
  }
}

/**
 * Checkpoint Too Large Error
 */
export class CheckpointTooLargeError extends ExecutionEngineError {
  readonly sizeBytes: number;
  readonly maxSizeBytes: number;

  constructor(taskId: string, sizeBytes: number, maxSizeBytes: number) {
    super(
      ERROR_CODES.CHECKPOINT_TOO_LARGE,
      `Checkpoint for task ${taskId} is too large: ${sizeBytes} bytes (max: ${maxSizeBytes} bytes)`,
      taskId,
      false,
      false
    );
    this.name = 'CheckpointTooLargeError';
    this.sizeBytes = sizeBytes;
    this.maxSizeBytes = maxSizeBytes;
    Object.setPrototypeOf(this, CheckpointTooLargeError.prototype);
  }
}

/**
 * Retry Exhausted Error
 */
export class RetryExhaustedError extends ExecutionEngineError {
  readonly taskId: string;
  readonly attempts: number;
  readonly maxAttempts: number;

  constructor(taskId: string, attempts: number, maxAttempts: number) {
    super(
      ERROR_CODES.RETRY_EXHAUSTED,
      `Task ${taskId} retry exhausted after ${attempts}/${maxAttempts} attempts`,
      taskId,
      false,
      true
    );
    this.name = 'RetryExhaustedError';
    this.taskId = taskId;
    this.attempts = attempts;
    this.maxAttempts = maxAttempts;
    Object.setPrototypeOf(this, RetryExhaustedError.prototype);
  }
}

/**
 * Retry Failed Error
 */
export class RetryFailedError extends ExecutionEngineError {
  readonly taskId: string;
  readonly cause?: Error;

  constructor(taskId: string, cause?: Error) {
    super(
      ERROR_CODES.RETRY_FAILED,
      `Retry failed for task ${taskId}${cause ? `: ${cause.message}` : ''}`,
      taskId,
      true,
      true
    );
    this.name = 'RetryFailedError';
    this.taskId = taskId;
    this.cause = cause;
    Object.setPrototypeOf(this, RetryFailedError.prototype);
  }
}

/**
 * Cancellation Failed Error
 */
export class CancellationFailedError extends ExecutionEngineError {
  readonly taskId?: string;
  readonly cause?: Error;

  constructor(taskId?: string, cause?: Error) {
    super(
      ERROR_CODES.CANCELLATION_FAILED,
      `Cancellation failed${taskId ? ` for task ${taskId}` : ''}${cause ? `: ${cause.message}` : ''}`,
      taskId,
      false,
      false
    );
    this.name = 'CancellationFailedError';
    this.taskId = taskId;
    this.cause = cause;
    Object.setPrototypeOf(this, CancellationFailedError.prototype);
  }
}

/**
 * Cancellation Timeout Error
 */
export class CancellationTimeoutError extends ExecutionEngineError {
  readonly taskId?: string;
  readonly timeoutMs: number;

  constructor(taskId: string, timeoutMs: number) {
    super(
      ERROR_CODES.CANCELLATION_TIMEOUT,
      `Cancellation timeout for task ${taskId} after ${timeoutMs}ms`,
      taskId,
      false,
      false
    );
    this.name = 'CancellationTimeoutError';
    this.taskId = taskId;
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, CancellationTimeoutError.prototype);
  }
}

/**
 * Replay Failed Error
 */
export class ReplayFailedError extends ExecutionEngineError {
  readonly executionId: string;
  readonly cause?: Error;

  constructor(executionId: string, cause?: Error) {
    super(
      ERROR_CODES.REPLAY_FAILED,
      `Replay failed for execution ${executionId}${cause ? `: ${cause.message}` : ''}`,
      undefined,
      false,
      true
    );
    this.name = 'ReplayFailedError';
    this.executionId = executionId;
    this.cause = cause;
    Object.setPrototypeOf(this, ReplayFailedError.prototype);
  }
}

/**
 * Replay Determinism Violation Error
 */
export class ReplayDeterminismViolationError extends ExecutionEngineError {
  readonly executionId: string;
  readonly taskId: string;
  readonly expectedState: string;
  readonly actualState: string;

  constructor(
    executionId: string,
    taskId: string,
    expectedState: string,
    actualState: string
  ) {
    super(
      ERROR_CODES.REPLAY_DETERMINISM_VIOLATION,
      `Replay determinism violation in execution ${executionId}, task ${taskId}: expected ${expectedState}, got ${actualState}`,
      taskId,
      false,
      false
    );
    this.name = 'ReplayDeterminismViolationError';
    this.executionId = executionId;
    this.taskId = taskId;
    this.expectedState = expectedState;
    this.actualState = actualState;
    Object.setPrototypeOf(this, ReplayDeterminismViolationError.prototype);
  }
}

/**
 * Recovery Failed Error
 */
export class RecoveryFailedError extends ExecutionEngineError {
  readonly executionId: string;
  readonly cause?: Error;

  constructor(executionId: string, cause?: Error) {
    super(
      ERROR_CODES.RECOVERY_FAILED,
      `Recovery failed for execution ${executionId}${cause ? `: ${cause.message}` : ''}`,
      undefined,
      false,
      true
    );
    this.name = 'RecoveryFailedError';
    this.executionId = executionId;
    this.cause = cause;
    Object.setPrototypeOf(this, RecoveryFailedError.prototype);
  }
}

/**
 * Recovery No Checkpoint Error
 */
export class RecoveryNoCheckpointError extends ExecutionEngineError {
  readonly executionId: string;

  constructor(executionId: string) {
    super(
      ERROR_CODES.RECOVERY_NO_CHECKPOINT,
      `No checkpoint available for recovery of execution ${executionId}`,
      undefined,
      false,
      false
    );
    this.name = 'RecoveryNoCheckpointError';
    this.executionId = executionId;
    Object.setPrototypeOf(this, RecoveryNoCheckpointError.prototype);
  }
}

/**
 * Concurrency Limit Exceeded Error
 */
export class ConcurrencyLimitExceededError extends ExecutionEngineError {
  readonly currentConcurrency: number;
  readonly maxConcurrency: number;

  constructor(currentConcurrency: number, maxConcurrency: number) {
    super(
      ERROR_CODES.CONCURRENCY_LIMIT_EXCEEDED,
      `Concurrency limit exceeded: ${currentConcurrency}/${maxConcurrency}`,
      undefined,
      true,
      true
    );
    this.name = 'ConcurrencyLimitExceededError';
    this.currentConcurrency = currentConcurrency;
    this.maxConcurrency = maxConcurrency;
    Object.setPrototypeOf(this, ConcurrencyLimitExceededError.prototype);
  }
}

/**
 * Resource Limit Exceeded Error
 */
export class ResourceLimitExceededError extends ExecutionEngineError {
  readonly resourceType: string;
  readonly currentUsage: number;
  readonly maxLimit: number;

  constructor(resourceType: string, currentUsage: number, maxLimit: number) {
    super(
      ERROR_CODES.RESOURCE_LIMIT_EXCEEDED,
      `Resource limit exceeded for ${resourceType}: ${currentUsage}/${maxLimit}`,
      undefined,
      true,
      true
    );
    this.name = 'ResourceLimitExceededError';
    this.resourceType = resourceType;
    this.currentUsage = currentUsage;
    this.maxLimit = maxLimit;
    Object.setPrototypeOf(this, ResourceLimitExceededError.prototype);
  }
}

/**
 * Invalid State Transition Error
 */
export class InvalidStateTransitionError extends ExecutionEngineError {
  readonly currentState: string;
  readonly targetState: string;
  readonly allowedTransitions: readonly string[];

  constructor(
    currentState: string,
    targetState: string,
    allowedTransitions: readonly string[]
  ) {
    super(
      ERROR_CODES.INVALID_STATE_TRANSITION,
      `Invalid state transition from ${currentState} to ${targetState}. Allowed: ${allowedTransitions.join(', ')}`,
      undefined,
      false,
      false
    );
    this.name = 'InvalidStateTransitionError';
    this.currentState = currentState;
    this.targetState = targetState;
    this.allowedTransitions = allowedTransitions;
    Object.setPrototypeOf(this, InvalidStateTransitionError.prototype);
  }
}

/**
 * State Machine Error
 */
export class StateMachineError extends ExecutionEngineError {
  readonly stateMachine: string;
  readonly cause?: Error;

  constructor(stateMachine: string, cause?: Error) {
    super(
      ERROR_CODES.STATE_MACHINE_ERROR,
      `State machine error in ${stateMachine}${cause ? `: ${cause.message}` : ''}`,
      undefined,
      false,
      false
    );
    this.name = 'StateMachineError';
    this.stateMachine = stateMachine;
    this.cause = cause;
    Object.setPrototypeOf(this, StateMachineError.prototype);
  }
}
