/**
 * Agent Runtime Errors
 * Standardized error types for the CLAUX Agent Runtime System
 */

import { AgentRuntimeError } from './types';

export class AgentExecutionError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'EXECUTION_ERROR',
    retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AgentExecutionError';
    this.code = code;
    this.retryable = retryable;
    this.context = context;
  }
}

export class TaskExecutionError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    task_id?: string,
    code: string = 'TASK_ERROR',
    retryable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TaskExecutionError';
    this.code = code;
    this.task_id = task_id;
    this.retryable = retryable;
    this.context = context;
  }
}

export class EventEmissionError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'EVENT_ERROR',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'EventEmissionError';
    this.code = code;
    this.retryable = false; // Event emission errors should not retry
    this.context = context;
  }
}

export class RetryExhaustedError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'RetryExhaustedError';
    this.code = 'RETRY_EXHAUSTED';
    this.retryable = false;
    this.context = context;
  }
}

export class ValidationError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
    this.retryable = false;
    this.context = context;
  }
}

export class CostTrackingError extends Error implements AgentRuntimeError {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any>;

  constructor(
    message: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CostTrackingError';
    this.code = 'COST_TRACKING_ERROR';
    this.retryable = false;
    this.context = context;
  }
}

export function isRetryableError(error: Error): boolean {
  if (
    error instanceof AgentExecutionError ||
    error instanceof TaskExecutionError ||
    error instanceof EventEmissionError ||
    error instanceof RetryExhaustedError ||
    error instanceof ValidationError ||
    error instanceof CostTrackingError
  ) {
    return error.retryable;
  }
  return false;
}

export function getErrorCode(error: Error): string {
  if (
    error instanceof AgentExecutionError ||
    error instanceof TaskExecutionError ||
    error instanceof EventEmissionError ||
    error instanceof RetryExhaustedError ||
    error instanceof ValidationError ||
    error instanceof CostTrackingError
  ) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}
