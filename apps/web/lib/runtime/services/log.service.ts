/**
 * Log Service
 * 
 * Business logic for log writing and aggregation
 * Handles execution logs, task logs, and severity filtering
 */

import type { UUID, ISODateTime, Result } from '../types/common.types';
import type { Log, LogInsert, LogStats } from '../types/log.types';
import { LogLevel } from '../types/log.types';
import { LogRepository } from '../repositories';
import { RuntimeDatabaseError } from '../db';
import {
  logServiceOperation,
  logServiceError,
  wrapRepositoryError,
  ServiceConfig,
  ServiceContext,
} from './types';

/**
 * Log service configuration
 */
export interface LogServiceConfig extends ServiceConfig {}

/**
 * Log service
 * Manages log writing and aggregation
 */
export class LogService {
  private repository: LogRepository;
  private config: LogServiceConfig;

  constructor(config: LogServiceConfig) {
    this.config = config;
    this.repository = new LogRepository(config.tenantId);
  }

  /**
   * Write a single log entry
   */
  async writeLog(
    data: Omit<LogInsert, 'created_at' | 'updated_at'>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeLog',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { data });

    const insertData: LogInsert = {
      ...data,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(context, result.error, { data });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeLog') };
    }

    logServiceOperation(context, { logId: result.data.id });
    return result;
  }

  /**
   * Write multiple log entries in batch
   */
  async writeLogsBatch(
    data: Omit<LogInsert, 'created_at' | 'updated_at'>[]
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeLogsBatch',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { count: data.length });

    const insertData: LogInsert[] = data.map(d => ({
      ...d,
    }));

    const result = await this.repository.createBatch(insertData);

    if (!result.success) {
      logServiceError(context, result.error, { count: data.length });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeLogsBatch') };
    }

    logServiceOperation(context, { logIds: result.data.map(l => l.id) });
    return result;
  }

  /**
   * Write an error log entry
   */
  async writeError(
    executionId: UUID,
    taskId: UUID | null,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const contextObj: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeError',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(contextObj, { executionId, taskId, errorMessage });

    const insertData: LogInsert = {
      execution_id: executionId,
      task_id: taskId,
      log_level: LogLevel.ERROR,
      message: errorMessage,
      context: context as any,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(contextObj, result.error, { executionId, taskId, errorMessage });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeError') };
    }

    logServiceOperation(contextObj, { logId: result.data.id });
    return result;
  }

  /**
   * Write a fatal log entry
   */
  async writeFatal(
    executionId: UUID,
    taskId: UUID | null,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const contextObj: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeFatal',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(contextObj, { executionId, taskId, errorMessage });

    const insertData: LogInsert = {
      execution_id: executionId,
      task_id: taskId,
      log_level: LogLevel.FATAL,
      message: errorMessage,
      context: context as any,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(contextObj, result.error, { executionId, taskId, errorMessage });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeFatal') };
    }

    logServiceOperation(contextObj, { logId: result.data.id });
    return result;
  }

  /**
   * Write an info log entry
   */
  async writeInfo(
    executionId: UUID,
    taskId: UUID | null,
    message: string,
    context?: Record<string, unknown>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const contextObj: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeInfo',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(contextObj, { executionId, taskId, message });

    const insertData: LogInsert = {
      execution_id: executionId,
      task_id: taskId,
      log_level: LogLevel.INFO,
      message,
      context: context as any,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(contextObj, result.error, { executionId, taskId, message });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeInfo') };
    }

    logServiceOperation(contextObj, { logId: result.data.id });
    return result;
  }

  /**
   * Write a warning log entry
   */
  async writeWarning(
    executionId: UUID,
    taskId: UUID | null,
    message: string,
    context?: Record<string, unknown>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const contextObj: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeWarning',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(contextObj, { executionId, taskId, message });

    const insertData: LogInsert = {
      execution_id: executionId,
      task_id: taskId,
      log_level: LogLevel.WARN,
      message,
      context: context as any,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(contextObj, result.error, { executionId, taskId, message });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeWarning') };
    }

    logServiceOperation(contextObj, { logId: result.data.id });
    return result;
  }

  /**
   * Write a critical log entry
   */
  async writeCritical(
    executionId: UUID,
    taskId: UUID | null,
    message: string,
    context?: Record<string, unknown>
  ): Promise<Result<Log, RuntimeDatabaseError>> {
    const contextObj: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'writeCritical',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(contextObj, { executionId, taskId, message });

    const insertData: LogInsert = {
      execution_id: executionId,
      task_id: taskId,
      log_level: LogLevel.FATAL,
      message,
      context: context as any,
    };

    const result = await this.repository.create(insertData);

    if (!result.success) {
      logServiceError(contextObj, result.error, { executionId, taskId, message });
      return { success: false, error: wrapRepositoryError(result.error, 'LogService', 'writeCritical') };
    }

    logServiceOperation(contextObj, { logId: result.data.id });
    return result;
  }

  /**
   * Get logs for an execution
   */
  async getExecutionLogs(
    executionId: UUID,
    options?: {
      logLevel?: LogLevel;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'getExecutionLogs',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { executionId, options });

    const filter: any = { execution_id: executionId };
    if (options?.logLevel) filter.log_level = options.logLevel;

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
   * Get logs for a task
   */
  async getTaskLogs(
    taskId: UUID,
    options?: {
      logLevel?: LogLevel;
      limit?: number;
      offset?: number;
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'getTaskLogs',
      timestamp: new Date().toISOString() as ISODateTime,
    };

    logServiceOperation(context, { taskId, options });

    const filter: any = { task_id: taskId };
    if (options?.logLevel) filter.log_level = options.logLevel;

    const result = await this.repository.fetchByTaskId(taskId, {
      filter,
      pagination: options?.limit || options?.offset ? { limit: options.limit, offset: options.offset } : undefined,
    });

    if (!result.success) {
      logServiceError(context, result.error, { taskId, options });
    }

    return result;
  }

  /**
   * Get log statistics
   */
  async getLogStatistics(options?: {
    createdAfter?: string;
    createdBefore?: string;
  }): Promise<Result<LogStats, RuntimeDatabaseError>> {
    const context: ServiceContext = {
      tenantId: this.config.tenantId,
      service: 'LogService',
      operation: 'getLogStatistics',
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
