/**
 * Runtime Service Types
 * 
 * Service-specific types, validation helpers, and transition guards
 */

import type { UUID, ISODateTime, Result } from '../types';
import { ExecutionStatus, TaskStatus, ExecutionSource } from '../types';
import { RuntimeDatabaseError, RuntimeDbErrorCode } from '../db';

/**
 * State transition validation result
 */
export interface TransitionValidation {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Execution state transition map
 */
export const EXECUTION_TRANSITIONS: Readonly<Record<ExecutionStatus, readonly ExecutionStatus[]>> = {
  [ExecutionStatus.PENDING]: [ExecutionStatus.RUNNING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.RUNNING]: [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED],
  [ExecutionStatus.FAILED]: [ExecutionStatus.RETRYING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.RETRYING]: [ExecutionStatus.RUNNING, ExecutionStatus.CANCELLED],
  [ExecutionStatus.COMPLETED]: [],
  [ExecutionStatus.CANCELLED]: [],
};

/**
 * Task state transition map
 */
export const TASK_TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  [TaskStatus.PENDING]: [TaskStatus.RUNNING, TaskStatus.SKIPPED],
  [TaskStatus.RUNNING]: [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.SKIPPED],
  [TaskStatus.FAILED]: [TaskStatus.RETRYING, TaskStatus.SKIPPED],
  [TaskStatus.RETRYING]: [TaskStatus.RUNNING, TaskStatus.SKIPPED],
  [TaskStatus.COMPLETED]: [],
  [TaskStatus.SKIPPED]: [],
};

/**
 * Validate execution state transition
 */
export function validateExecutionTransition(
  from: ExecutionStatus,
  to: ExecutionStatus
): TransitionValidation {
  const allowed = EXECUTION_TRANSITIONS[from];
  
  if (!allowed.includes(to)) {
    return {
      valid: false,
      error: `Invalid execution state transition: ${from} -> ${to}. Allowed: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate task state transition
 */
export function validateTaskTransition(
  from: TaskStatus,
  to: TaskStatus
): TransitionValidation {
  const allowed = TASK_TRANSITIONS[from];
  
  if (!allowed.includes(to)) {
    return {
      valid: false,
      error: `Invalid task state transition: ${from} -> ${to}. Allowed: ${allowed.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate duration between two timestamps
 */
export function calculateDuration(
  start: ISODateTime,
  end: ISODateTime
): number {
  return new Date(end).getTime() - new Date(start).getTime();
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Generate correlation ID for event chain
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate causation ID for event chain
 */
export function generateCausationId(parentId: string): string {
  return `caus_${parentId}_${Date.now()}`;
}

/**
 * Validate tenant ID format
 */
export function isValidTenantId(tenantId: string): boolean {
  try {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId);
  } catch {
    return false;
  }
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  try {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
  } catch {
    return false;
  }
}

/**
 * Create a transition error
 */
export function createTransitionError(
  from: string,
  to: string,
  context?: Record<string, unknown>
): RuntimeDatabaseError {
  const validation = validateExecutionTransition(from as ExecutionStatus, to as ExecutionStatus);
  
  return new RuntimeDatabaseError(
    RuntimeDbErrorCode.INVALID_INPUT,
    validation.error || 'Invalid state transition',
    { context }
  );
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  readonly tenantId: UUID;
  readonly logOperations?: boolean;
  readonly enableMetrics?: boolean;
}

/**
 * Service context for logging
 */
export interface ServiceContext {
  readonly tenantId: UUID;
  readonly service: string;
  readonly operation: string;
  readonly timestamp: ISODateTime;
}

/**
 * Log service operation
 */
export function logServiceOperation(
  context: ServiceContext,
  data?: Record<string, unknown>
): void {
  console.log(JSON.stringify({
    timestamp: context.timestamp,
    level: 'info',
    service: context.service,
    operation: context.operation,
    tenant_id: context.tenantId,
    ...data,
  }));
}

/**
 * Log service error
 */
export function logServiceError(
  context: ServiceContext,
  error: unknown,
  data?: Record<string, unknown>
): void {
  console.error(JSON.stringify({
    timestamp: context.timestamp,
    level: 'error',
    service: context.service,
    operation: context.operation,
    tenant_id: context.tenantId,
    error: error instanceof Error ? error.message : String(error),
    ...data,
  }));
}

/**
 * Wrap repository error with service context
 */
export function wrapRepositoryError(
  error: RuntimeDatabaseError,
  service: string,
  operation: string
): RuntimeDatabaseError {
  return new RuntimeDatabaseError(
    error.code,
    `${service}.${operation}: ${error.message}`,
    {
      table: error.table,
      column: error.column,
      constraint: error.constraint,
      context: {
        ...error.context,
        service,
        operation,
      },
    }
  );
}
