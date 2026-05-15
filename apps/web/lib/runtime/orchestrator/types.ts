/**
 * Runtime Orchestrator Types
 * 
 * Orchestrator-specific types, configurations, and helpers
 * Provides coordination primitives for execution lifecycle management
 */

import type { UUID, ISODateTime, Result } from '../types';
import { ExecutionStatus, TaskStatus } from '../types';
import { RuntimeDatabaseError } from '../db';
import { generateCorrelationId, generateCausationId } from '../services/types';

export { generateCorrelationId, generateCausationId };

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
  readonly tenantId: UUID;
  readonly enableAutoLogging?: boolean;
  readonly enableAutoEvents?: boolean;
  readonly enableRecovery?: boolean;
  readonly maxExecutionRetries?: number;
  readonly maxTaskRetries?: number;
  readonly stallDetectionTimeoutMs?: number;
}

/**
 * Orchestrator context for operations
 */
export interface OrchestratorContext {
  readonly tenantId: UUID;
  readonly orchestrator: string;
  readonly operation: string;
  readonly timestamp: ISODateTime;
  readonly correlationId?: string;
}

/**
 * Execution plan definition
 */
export interface ExecutionPlan {
  readonly executionId?: UUID;
  readonly agentName: string;
  readonly workflowType: string;
  readonly inputPayload: Record<string, unknown>;
  readonly tasks: TaskPlan[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * Task plan definition
 */
export interface TaskPlan {
  readonly taskId?: UUID;
  readonly taskName: string;
  readonly taskType: string;
  readonly stepOrder: number;
  readonly inputPayload?: Record<string, unknown>;
  readonly dependencies?: readonly string[]; // task names this depends on
  readonly retryPolicy?: RetryPolicy;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Execution lifecycle state
 */
export interface ExecutionLifecycleState {
  readonly executionId: UUID;
  readonly status: ExecutionStatus;
  readonly startedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly taskCount: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
  readonly progress: number; // 0-100
  readonly health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

/**
 * Task lifecycle state
 */
export interface TaskLifecycleState {
  readonly taskId: UUID;
  readonly executionId: UUID;
  readonly status: TaskStatus;
  readonly startedAt?: ISODateTime;
  readonly completedAt?: ISODateTime;
  readonly stepOrder: number;
  readonly dependenciesMet: boolean;
  readonly retryCount: number;
  readonly progress: number; // 0-100
}

/**
 * Recovery strategy
 */
export enum RecoveryStrategy {
  RETRY = 'retry',
  SKIP = 'skip',
  ABORT = 'abort',
  MANUAL = 'manual',
}

/**
 * Retry policy
 */
export interface RetryPolicy {
  readonly maxRetries: number;
  readonly backoffMs: number;
  readonly strategy: 'fixed' | 'exponential' | 'linear';
}

/**
 * Orchestrator result wrapper
 */
export interface OrchestratorResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: OrchestratorError;
  readonly context?: OrchestratorContext;
}

/**
 * Orchestrator error
 */
export interface OrchestratorError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
  readonly recoverable: boolean;
  readonly suggestedRecovery?: RecoveryStrategy;
}

/**
 * Lifecycle hooks
 */
export interface LifecycleHooks {
  readonly onExecutionStart?: (executionId: UUID) => Promise<void>;
  readonly onExecutionComplete?: (executionId: UUID) => Promise<void>;
  readonly onExecutionFail?: (executionId: UUID, error: string) => Promise<void>;
  readonly onTaskStart?: (taskId: UUID) => Promise<void>;
  readonly onTaskComplete?: (taskId: UUID) => Promise<void>;
  readonly onTaskFail?: (taskId: UUID, error: string) => Promise<void>;
  readonly onRecovery?: (executionId: UUID, strategy: RecoveryStrategy) => Promise<void>;
}

/**
 * Generate execution plan from basic inputs
 */
export function generateExecutionPlan(
  agentName: string,
  workflowType: string,
  inputPayload: Record<string, unknown>,
  taskDefinitions: Array<{
    taskName: string;
    taskType: string;
    stepOrder: number;
    inputPayload?: Record<string, unknown>;
    dependencies?: string[];
  }>
): ExecutionPlan {
  const tasks: TaskPlan[] = taskDefinitions.map(def => ({
    taskId: undefined,
    taskName: def.taskName,
    taskType: def.taskType,
    stepOrder: def.stepOrder,
    inputPayload: def.inputPayload,
    dependencies: def.dependencies,
    retryPolicy: { maxRetries: 3, backoffMs: 1000, strategy: 'exponential' as const },
    metadata: undefined,
  }));

  return {
    executionId: undefined,
    agentName,
    workflowType,
    inputPayload,
    tasks,
    metadata: undefined,
  };
}

/**
 * Validate execution plan
 */
export function validateExecutionPlan(plan: ExecutionPlan): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  if (!plan.agentName || plan.agentName.trim() === '') {
    errors.push('agentName is required');
  }

  if (!plan.workflowType || plan.workflowType.trim() === '') {
    errors.push('workflowType is required');
  }

  if (!plan.inputPayload || Object.keys(plan.inputPayload).length === 0) {
    errors.push('inputPayload is required');
  }

  if (!plan.tasks || plan.tasks.length === 0) {
    errors.push('At least one task is required');
  }

  if (plan.tasks) {
    const stepOrders = plan.tasks.map(t => t.stepOrder);
    const uniqueStepOrders = new Set(stepOrders);
    if (stepOrders.length !== uniqueStepOrders.size) {
      errors.push('Step orders must be unique');
    }

    plan.tasks.forEach((task, index) => {
      if (!task.taskName || task.taskName.trim() === '') {
        errors.push(`Task ${index}: taskName is required`);
      }

      if (!task.taskType || task.taskType.trim() === '') {
        errors.push(`Task ${index}: taskType is required`);
      }

      if (task.stepOrder < 0) {
        errors.push(`Task ${index}: stepOrder must be >= 0`);
      }

      if (task.dependencies && task.dependencies.length > 0) {
        const dependencyNames = task.dependencies;
        const taskNames = plan.tasks.map(t => t.taskName);
        const missingDeps = dependencyNames.filter(dep => !taskNames.includes(dep));
        if (missingDeps.length > 0) {
          errors.push(`Task ${index}: Unknown dependencies: ${missingDeps.join(', ')}`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate task dependencies
 */
export function validateTaskDependencies(
  task: TaskPlan,
  allTasks: readonly TaskPlan[]
): {
  readonly valid: boolean;
  readonly errors: readonly string[];
} {
  const errors: string[] = [];

  if (!task.dependencies || task.dependencies.length === 0) {
    return { valid: true, errors: [] };
  }

  const taskNames = new Set(allTasks.map(t => t.taskName));
  
  for (const dep of task.dependencies) {
    if (!taskNames.has(dep)) {
      errors.push(`Unknown dependency: ${dep}`);
    }

    const depTask = allTasks.find(t => t.taskName === dep);
    if (depTask && depTask.stepOrder >= task.stepOrder) {
      errors.push(`Dependency ${dep} must have stepOrder < current task stepOrder`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate execution progress
 */
export function calculateExecutionProgress(
  totalTasks: number,
  completedTasks: number,
  failedTasks: number
): number {
  if (totalTasks === 0) return 0;
  const progressTasks = completedTasks + failedTasks;
  return Math.round((progressTasks / totalTasks) * 100);
}

/**
 * Calculate task progress
 */
export function calculateTaskProgress(
  status: TaskStatus,
  startedAt?: ISODateTime,
  completedAt?: ISODateTime
): number {
  if (status === TaskStatus.COMPLETED || status === TaskStatus.SKIPPED) {
    return 100;
  }

  if (status === TaskStatus.FAILED) {
    return 0;
  }

  if (status === TaskStatus.PENDING) {
    return 0;
  }

  if (status === TaskStatus.RUNNING && startedAt) {
    // Estimate progress based on time elapsed (simple heuristic)
    const now = new Date().getTime();
    const start = new Date(startedAt).getTime();
    const elapsed = now - start;
    const estimatedDuration = 60000; // 1 minute estimate
    return Math.min(Math.round((elapsed / estimatedDuration) * 100), 99);
  }

  if (status === TaskStatus.RETRYING) {
    return 0;
  }

  return 0;
}

/**
 * Create orchestrator error
 */
export function createOrchestratorError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error,
  recoverable: boolean = false,
  suggestedRecovery?: RecoveryStrategy
): OrchestratorError {
  return {
    code,
    message,
    details,
    cause,
    recoverable,
    suggestedRecovery,
  };
}

/**
 * Convert Result<T, E> to OrchestratorResult<T>
 */
export function toOrchestratorResult<T>(
  result: Result<T>,
  context: OrchestratorContext
): OrchestratorResult<T> {
  if (result.success) {
    return {
      success: true,
      data: result.data,
      context,
    };
  }

  return {
    success: false,
    error: createOrchestratorError(
      'CONVERSION_ERROR',
      'Failed to convert result',
      context as unknown as Record<string, unknown>,
      undefined,
      false
    ),
    context,
  };
}
