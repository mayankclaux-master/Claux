/**
 * Task Service
 * 
 * Business logic for task lifecycle management
 * Handles state transitions, validation, and duration tracking
 */

import type { UUID, ISODateTime, Result } from '../types/index';
import type { Task, TaskInsert, TaskStats } from '../types/index';
import { TaskStatus } from '../types/index';
import { TaskRepository } from '../repositories';
import { RuntimeDatabaseError } from '../db';
import {
  validateTaskTransition,
  calculateDuration,
  logServiceOperation,
  logServiceError,
  wrapRepositoryError,
  ServiceConfig,
  ServiceContext,
} from './types';

/**
 * Task service configuration
 */
export interface TaskServiceConfig extends ServiceConfig {
  readonly maxRetries?: number;
}

/**
 * Task service
 * Manages task lifecycle with business logic
 */
export class TaskService {
  private repository: TaskRepository;
  private config: TaskServiceConfig;

  constructor(config: TaskServiceConfig) {
    this.config = {
      maxRetries: 3,
      ...config,
    };
    this.repository = new TaskRepository(config.tenantId);
  }

  /**
   * Create a new task
   */
  async createTask(
    data: Omit<TaskInsert, 'created_at' | 'updated_at'>
  ): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'createTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { data });

    const insertData: TaskInsert = {
      ...data,
      created_at: new Date().toISOString() as ISODateTime,
      updated_at: new Date().toISOString() as ISODateTime,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(context, result.error, { data });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'createTask') };
    }

    logServiceOperation(context, { taskId: result.data.id });
    return result;
  }

  /**
   * Create multiple tasks in batch
   */
  async createTasksBatch(
    data: Omit<TaskInsert, 'created_at' | 'updated_at'>[]
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'createTasksBatch',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { count: data.length });

    const insertData: TaskInsert[] = data.map(d => ({
      ...d,
      created_at: new Date().toISOString() as ISODateTime,
      updated_at: new Date().toISOString() as ISODateTime,
    }));

    const result = await this.repository.createBatch(insertData);

    if (!result.success) {
      logServiceError(context, result.error, { count: data.length });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'createTasksBatch') };
    }

    logServiceOperation(context, { taskIds: result.data.map(t => t.id) });
    return result;
  }

  /**
   * Start a task (PENDING -> RUNNING)
   */
  async startTask(id: UUID): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'startTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const task = getResult.data;
    const validation = validateTaskTransition(task.status, TaskStatus.RUNNING);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { taskId: id, from: task.status, to: TaskStatus.RUNNING } }
      );
      logServiceError(context, error, { id, from: task.status, to: TaskStatus.RUNNING });
      return { success: false, error };
    }

    const result = await this.repository.updateStatus(id, TaskStatus.RUNNING, {
      started_at: new Date().toISOString() as ISODateTime,
    });

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'startTask') };
    }

    logServiceOperation(context, { taskId: id, status: TaskStatus.RUNNING });
    return result;
  }

  /**
   * Complete a task (RUNNING -> COMPLETED)
   */
  async completeTask(
    id: UUID,
    outputPayload?: Record<string, unknown>
  ): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'completeTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id, outputPayload });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const task = getResult.data;
    const validation = validateTaskTransition(task.status, TaskStatus.COMPLETED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { taskId: id, from: task.status, to: TaskStatus.COMPLETED } }
      );
      logServiceError(context, error, { id, from: task.status, to: TaskStatus.COMPLETED });
      return { success: false, error };
    }

    const metadata: Partial<Task> = {
      completed_at: new Date().toISOString() as ISODateTime,
    };

    if (outputPayload) {
      metadata.output_payload = outputPayload as any;
    }

    if (task.started_at) {
      metadata.duration_ms = calculateDuration(task.started_at, metadata.completed_at as ISODateTime);
    }

    const result = await this.repository.updateStatus(id, TaskStatus.COMPLETED, metadata);

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'completeTask') };
    }

    await this.repository.updateDuration(id, metadata.duration_ms || 0);

    logServiceOperation(context, { taskId: id, status: TaskStatus.COMPLETED, durationMs: metadata.duration_ms });
    return result;
  }

  /**
   * Fail a task (RUNNING -> FAILED)
   */
  async failTask(
    id: UUID,
    errorPayload?: Record<string, unknown>
  ): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'failTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id, errorPayload });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const task = getResult.data;
    const validation = validateTaskTransition(task.status, TaskStatus.FAILED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { taskId: id, from: task.status, to: TaskStatus.FAILED } }
      );
      logServiceError(context, error, { id, from: task.status, to: TaskStatus.FAILED });
      return { success: false, error };
    }

    const metadata: Partial<Task> = {
      failed_at: new Date().toISOString() as ISODateTime,
    };

    if (errorPayload) {
      metadata.error_payload = errorPayload as any;
    }

    if (task.started_at) {
      metadata.duration_ms = calculateDuration(task.started_at, metadata.failed_at as ISODateTime);
    }

    const result = await this.repository.updateStatus(id, TaskStatus.FAILED, metadata);

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'failTask') };
    }

    await this.repository.updateDuration(id, metadata.duration_ms || 0);

    logServiceOperation(context, { taskId: id, status: TaskStatus.FAILED, durationMs: metadata.duration_ms });
    return result;
  }

  /**
   * Skip a task (PENDING -> SKIPPED or RUNNING -> SKIPPED)
   */
  async skipTask(id: UUID): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'skipTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const task = getResult.data;
    const validation = validateTaskTransition(task.status, TaskStatus.SKIPPED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { taskId: id, from: task.status, to: TaskStatus.SKIPPED } }
      );
      logServiceError(context, error, { id, from: task.status, to: TaskStatus.SKIPPED });
      return { success: false, error };
    }

    const result = await this.repository.updateStatus(id, TaskStatus.SKIPPED, {
      completed_at: new Date().toISOString() as ISODateTime,
    });

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'TaskService', 'skipTask') };
    }

    logServiceOperation(context, { taskId: id, status: TaskStatus.SKIPPED });
    return result;
  }

  /**
   * Retry a task (FAILED -> RETRYING -> RUNNING)
   */
  async retryTask(id: UUID): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'retryTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const task = getResult.data;

    if (task.retry_count >= (this.config.maxRetries || 3)) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        'Max retries exceeded',
        { context: { taskId: id, retryCount: task.retry_count, maxRetries: this.config.maxRetries } }
      );
      logServiceError(context, error, { id });
      return { success: false, error };
    }

    const validation1 = validateTaskTransition(task.status, TaskStatus.RETRYING);
    if (!validation1.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation1.error || 'Invalid state transition',
        { context: { taskId: id, from: task.status, to: TaskStatus.RETRYING } }
      );
      logServiceError(context, error, { id, from: task.status, to: TaskStatus.RETRYING });
      return { success: false, error };
    }

    const retryResult = await this.repository.updateStatus(id, TaskStatus.RETRYING, {
      retry_count: task.retry_count + 1,
    });

    if (!retryResult.success) {
      logServiceError(context, retryResult.error, { id });
      return { success: false, error: wrapRepositoryError(retryResult.error, 'TaskService', 'retryTask') };
    }

    const startResult = await this.startTask(id);
    if (!startResult.success) {
      return startResult;
    }

    logServiceOperation(context, { taskId: id, retryCount: task.retry_count + 1 });
    return startResult;
  }

  /**
   * Get task by ID
   */
  async getTask(id: UUID): Promise<Result<Task, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'getTask',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const result = await this.repository.findById(id);

    if (!result.success) {
      logServiceError(context, result.error, { id });
    }

    return result;
  }

  /**
   * List tasks for an execution
   */
  async listExecutionTasks(
    executionId: UUID,
    options?: {
      status?: TaskStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'listExecutionTasks',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { executionId, options });

    const filter: any = { execution_id: executionId };
    if (options?.status) filter.status = options.status;

    const result = await this.repository.fetchByExecutionId(executionId, {
      filter,
      pagination: options?.limit || options?.offset ? { limit: options.limit, offset: options.offset } : undefined,
    });

    if (!result.success) {
      logServiceError(context, result.error, { executionId, options });
    }

    return result;
  }

  /**
   * Get task statistics for an execution
   */
  async getTaskStatistics(executionId: UUID): Promise<Result<TaskStats, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'TaskService',
      operation: 'getTaskStatistics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { executionId });

    const result = await this.repository.getExecutionStatistics(executionId);

    if (!result.success) {
      logServiceError(context, result.error, { executionId });
    }

    return result;
  }
}
