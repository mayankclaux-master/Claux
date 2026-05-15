/**
 * Execution Service
 * 
 * Business logic for execution lifecycle management
 * Handles state transitions, validation, and orchestration
 */

import type { UUID, ISODateTime, Result } from '../types/common.types';
import type {
  Execution,
  ExecutionInsert,
  ExecutionUpdate,
  ExecutionStats,
} from '../types/execution.types';
import { ExecutionStatus, ExecutionSource } from '../types/execution.types';
import { ExecutionRepository } from '../repositories';
import { RuntimeDatabaseError } from '../db';
import {
  validateExecutionTransition,
  calculateDuration,
  logServiceOperation,
  logServiceError,
  wrapRepositoryError,
  ServiceConfig,
  ServiceContext,
} from './types';

/**
 * Execution service configuration
 */
export interface ExecutionServiceConfig extends ServiceConfig {
  readonly maxRetries?: number;
}

/**
 * Execution service
 * Manages execution lifecycle with business logic
 */
export class ExecutionService {
  private repository: ExecutionRepository;
  private config: ExecutionServiceConfig;

  constructor(config: ExecutionServiceConfig) {
    this.config = {
      maxRetries: 3,
      ...config,
    };
    this.repository = new ExecutionRepository(config.tenantId);
  }

  /**
   * Create a new execution
   */
  async createExecution(
    data: Omit<ExecutionInsert, 'tenant_id' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'createExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { data });

    const insertData: ExecutionInsert = {
      ...data,
      tenant_id: this.config.tenantId,
      status: ExecutionStatus.PENDING,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(context, result.error, { data });
      return { success: false, error: wrapRepositoryError(result.error, 'ExecutionService', 'createExecution') };
    }

    logServiceOperation(context, { executionId: result.data.id });
    return result;
  }

  /**
   * Start an execution (PENDING -> RUNNING)
   */
  async startExecution(
    id: UUID
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'startExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const execution = getResult.data;
    const validation = validateExecutionTransition(execution.status, ExecutionStatus.RUNNING);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { executionId: id, from: execution.status, to: ExecutionStatus.RUNNING } }
      );
      logServiceError(context, error, { id, from: execution.status, to: ExecutionStatus.RUNNING });
      return { success: false, error };
    }

    const result = await this.repository.updateStatus(id, ExecutionStatus.RUNNING, {
      started_at: new Date().toISOString() as ISODateTime,
    });

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'ExecutionService', 'startExecution') };
    }

    logServiceOperation(context, { executionId: id, status: ExecutionStatus.RUNNING });
    return result;
  }

  /**
   * Complete an execution (RUNNING -> COMPLETED)
   */
  async completeExecution(
    id: UUID,
    cost?: number,
    tokens?: number
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'completeExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id, cost, tokens });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const execution = getResult.data;
    const validation = validateExecutionTransition(execution.status, ExecutionStatus.COMPLETED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { executionId: id, from: execution.status, to: ExecutionStatus.COMPLETED } }
      );
      logServiceError(context, error, { id, from: execution.status, to: ExecutionStatus.COMPLETED });
      return { success: false, error };
    }

    const metadata: ExecutionUpdate = {
      completed_at: new Date().toISOString() as ISODateTime,
      ...(cost !== undefined && { total_cost: cost }),
      ...(tokens !== undefined && { total_tokens: tokens }),
    };

    const result = await this.repository.updateStatus(id, ExecutionStatus.COMPLETED, metadata as Record<string, unknown>);

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'ExecutionService', 'completeExecution') };
    }

    logServiceOperation(context, { executionId: id, status: ExecutionStatus.COMPLETED });
    return result;
  }

  /**
   * Fail an execution (RUNNING -> FAILED)
   */
  async failExecution(
    id: UUID,
    errorMessage: string
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'failExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id, errorMessage });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const execution = getResult.data;
    const validation = validateExecutionTransition(execution.status, ExecutionStatus.FAILED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { executionId: id, from: execution.status, to: ExecutionStatus.FAILED } }
      );
      logServiceError(context, error, { id, from: execution.status, to: ExecutionStatus.FAILED });
      return { success: false, error };
    }

    const result = await this.repository.updateStatus(id, ExecutionStatus.FAILED, {
      failed_at: new Date().toISOString() as ISODateTime,
      error_message: errorMessage,
    });

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'ExecutionService', 'failExecution') };
    }

    logServiceOperation(context, { executionId: id, status: ExecutionStatus.FAILED });
    return result;
  }

  /**
   * Cancel an execution (any state -> CANCELLED)
   */
  async cancelExecution(
    id: UUID
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'cancelExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const execution = getResult.data;
    const validation = validateExecutionTransition(execution.status, ExecutionStatus.CANCELLED);

    if (!validation.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation.error || 'Invalid state transition',
        { context: { executionId: id, from: execution.status, to: ExecutionStatus.CANCELLED } }
      );
      logServiceError(context, error, { id, from: execution.status, to: ExecutionStatus.CANCELLED });
      return { success: false, error };
    }

    const result = await this.repository.updateStatus(id, ExecutionStatus.CANCELLED, {
      completed_at: new Date().toISOString() as ISODateTime,
    });

    if (!result.success) {
      logServiceError(context, result.error, { id });
      return { success: false, error: wrapRepositoryError(result.error, 'ExecutionService', 'cancelExecution') };
    }

    logServiceOperation(context, { executionId: id, status: ExecutionStatus.CANCELLED });
    return result;
  }

  /**
   * Retry an execution (FAILED -> RETRYING -> RUNNING)
   */
  async retryExecution(
    id: UUID
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'retryExecution',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { id });

    const getResult = await this.repository.findById(id);
    if (!getResult.success) {
      logServiceError(context, getResult.error, { id });
      return getResult;
    }

    const execution = getResult.data;

    if (execution.retry_count >= (this.config.maxRetries || 3)) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        'Max retries exceeded',
        { context: { executionId: id, retryCount: execution.retry_count, maxRetries: this.config.maxRetries } }
      );
      logServiceError(context, error, { id });
      return { success: false, error };
    }

    const validation1 = validateExecutionTransition(execution.status, ExecutionStatus.RETRYING);
    if (!validation1.valid) {
      const error = new RuntimeDatabaseError(
        'INVALID_INPUT' as any,
        validation1.error || 'Invalid state transition',
        { context: { executionId: id, from: execution.status, to: ExecutionStatus.RETRYING } }
      );
      logServiceError(context, error, { id, from: execution.status, to: ExecutionStatus.RETRYING });
      return { success: false, error };
    }

    const retryResult = await this.repository.updateStatus(id, ExecutionStatus.RETRYING, {
      retry_count: execution.retry_count + 1,
    });

    if (!retryResult.success) {
      logServiceError(context, retryResult.error, { id });
      return { success: false, error: wrapRepositoryError(retryResult.error, 'ExecutionService', 'retryExecution') };
    }

    const startResult = await this.startExecution(id);
    if (!startResult.success) {
      return startResult;
    }

    logServiceOperation(context, { executionId: id, retryCount: execution.retry_count + 1 });
    return startResult;
  }

  /**
   * Get execution by ID
   */
  async getExecution(id: UUID): Promise<Result<Execution, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'getExecution',
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
   * List executions with filters
   */
  async listExecutions(options?: {
    agentName?: string;
    status?: ExecutionStatus;
    workflowType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Result<Execution[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'listExecutions',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const filter: any = {};
    if (options?.agentName) filter.agent_name = options.agentName;
    if (options?.status) filter.status = options.status;
    if (options?.workflowType) filter.workflow_type = options.workflowType;

    const result = await this.repository.findByTenant({
      filter,
      pagination: options?.limit || options?.offset ? { limit: options.limit, offset: options.offset } : undefined,
      sort: { column: 'created_at', direction: 'desc' },
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
    }

    return result;
  }

  /**
   * Get execution statistics
   */
  async getExecutionStatistics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<ExecutionStats, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'ExecutionService',
      operation: 'getExecutionStatistics',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { options });

    const result = await this.repository.getStatistics({
      created_after: options?.createdAfter,
      created_before: options?.createdBefore,
    });

    if (!result.success) {
      logServiceError(context, result.error, { options });
    }

    return result;
  }
}
