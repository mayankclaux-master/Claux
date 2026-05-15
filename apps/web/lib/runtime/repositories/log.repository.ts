/**
 * Log Repository
 * 
 * Data access layer for agent_logs table
 * Handles execution logs, task logs, and aggregation
 */

import type { UUID } from '../types/common.types';
import type {
  Log,
  LogInsert,
  LogUpdate,
  LogFilter,
  LogStats,
  LogAggregation,
} from '../types/log.types';
import { LogLevel } from '../types/log.types';
import type { Result } from '../types/common.types';
import { BaseRepository, BaseFilter } from './base.repository';
import { RuntimeDatabaseError } from '../db';

/**
 * Log filter interface
 * Extends base filter with log-specific fields
 */
export interface LogRepositoryFilter extends BaseFilter {
  readonly execution_id?: UUID;
  readonly task_id?: UUID;
  readonly log_level?: LogLevel;
}

/**
 * Log repository
 * Manages log CRUD operations and queries
 */
export class LogRepository extends BaseRepository<
  Log,
  LogInsert,
  LogUpdate,
  LogRepositoryFilter
> {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    super();
    this.tenantId = tenantId;
  }

  protected getTableName(): string {
    return 'agent_logs';
  }

  protected getTenantId(): UUID {
    return this.tenantId;
  }

  /**
   * Create a new log entry
   */
  async create(data: LogInsert): Promise<Result<Log, RuntimeDatabaseError>> {
    this.logOperation('create', { data });
    const result = await super.create(data);

    if (!result.success) {
      this.logError('create', result.error, { data });
    }

    return result;
  }

  /**
   * Create multiple log entries in batch
   */
  async createBatch(data: LogInsert[]): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('createBatch', { count: data.length });
    const result = await super.createBatch(data);

    if (!result.success) {
      this.logError('createBatch', result.error, { count: data.length });
    }

    return result;
  }

  /**
   * Fetch log by ID
   */
  async findById(id: UUID): Promise<Result<Log, RuntimeDatabaseError>> {
    this.logOperation('findById', { id });
    return super.findById(id);
  }

  /**
   * Fetch logs by execution ID
   */
  async fetchByExecutionId(
    executionId: UUID,
    options?: {
      filter?: Partial<LogRepositoryFilter>;
      pagination?: { limit?: number; offset?: number };
      sort?: { column: keyof Log; direction: 'asc' | 'desc' };
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('fetchByExecutionId', { executionId, options });

    const filter: LogRepositoryFilter = {
      execution_id: executionId,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: options?.sort || { column: 'created_at', direction: 'asc' },
    });
  }

  /**
   * Fetch logs by task ID
   */
  async fetchByTaskId(
    taskId: UUID,
    options?: {
      filter?: Partial<LogRepositoryFilter>;
      pagination?: { limit?: number; offset?: number };
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('fetchByTaskId', { taskId, options });

    const filter: LogRepositoryFilter = {
      task_id: taskId,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'asc' },
    });
  }

  /**
   * Fetch error logs
   */
  async fetchErrorLogs(
    options?: {
      pagination?: { limit?: number; offset?: number };
      created_after?: string;
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('fetchErrorLogs', options);

    const filter: LogRepositoryFilter = {
      log_level: LogLevel.ERROR,
      created_after: options?.created_after,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Fetch fatal logs
   */
  async fetchFatalLogs(
    options?: {
      pagination?: { limit?: number; offset?: number };
      created_after?: string;
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('fetchFatalLogs', options);

    const filter: LogRepositoryFilter = {
      log_level: LogLevel.FATAL,
      created_after: options?.created_after,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Fetch logs by log level
   */
  async fetchByLogLevel(
    logLevel: LogLevel,
    options?: {
      filter?: Partial<LogRepositoryFilter>;
      pagination?: { limit?: number; offset?: number };
    }
  ): Promise<Result<Log[], RuntimeDatabaseError>> {
    this.logOperation('fetchByLogLevel', { logLevel, options });

    const filter: LogRepositoryFilter = {
      log_level: logLevel,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Get log statistics
   */
  async getStatistics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<LogStats, RuntimeDatabaseError>> {
    this.logOperation('getStatistics', options);

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .select('log_level, created_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      this.getQueryConfig()
    );

    if (!result.success) {
      this.logError('getStatistics', result.error, options);
      return result;
    }

    const logs = result.data as any[];
    const by_level: Record<LogLevel, number> = {} as Record<LogLevel, number>;
    let error_count = 0;
    let fatal_count = 0;

    for (const log of logs) {
      const level = log.log_level as LogLevel;
      by_level[level] = (by_level[level] || 0) + 1;

      if (level === LogLevel.ERROR) {
        error_count++;
      }

      if (level === LogLevel.FATAL) {
        fatal_count++;
      }
    }

    const stats: LogStats = {
      total: logs.length,
      by_level: by_level as Readonly<Record<LogLevel, number>>,
      error_count,
      fatal_count,
    };

    return { success: true, data: stats };
  }

  /**
   * Get log aggregation for an execution
   */
  async getExecutionAggregation(
    executionId: UUID
  ): Promise<Result<LogAggregation, RuntimeDatabaseError>> {
    this.logOperation('getExecutionAggregation', { executionId });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .select('task_id, log_level, created_at, message')
      .eq('execution_id', executionId);

    const result = await executeQuery(
      () => query,
      this.getQueryConfig()
    );

    if (!result.success) {
      this.logError('getExecutionAggregation', result.error, { executionId });
      return result;
    }

    const logs = result.data as any[];
    const logLevelCounts: Record<LogLevel, number> = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 0,
      [LogLevel.WARN]: 0,
      [LogLevel.ERROR]: 0,
      [LogLevel.FATAL]: 0,
    };

    let firstLogAt: string | null = null;
    let lastLogAt: string | null = null;
    const sampleMessages: string[] = [];

    for (const log of logs) {
      const level = log.log_level as LogLevel;
      logLevelCounts[level]++;

      if (!firstLogAt || log.created_at < firstLogAt) {
        firstLogAt = log.created_at;
      }

      if (!lastLogAt || log.created_at > lastLogAt) {
        lastLogAt = log.created_at;
      }

      if (sampleMessages.length < 5) {
        sampleMessages.push(log.message);
      }
    }

    const aggregation: LogAggregation = {
      execution_id: executionId,
      task_id: null,
      log_level_counts: logLevelCounts as Readonly<Record<LogLevel, number>>,
      first_log_at: firstLogAt || '',
      last_log_at: lastLogAt || '',
      sample_messages: sampleMessages,
    };

    return { success: true, data: aggregation };
  }

  /**
   * Apply log-specific filters
   */
  protected applyFilters(query: any, filter?: LogRepositoryFilter): any {
    query = super.applyFilters(query, filter);

    if (!filter) {
      return query;
    }

    if (filter.execution_id) {
      query = query.eq('execution_id', filter.execution_id);
    }

    if (filter.task_id) {
      query = query.eq('task_id', filter.task_id);
    }

    if (filter.log_level) {
      query = query.eq('log_level', filter.log_level);
    }

    return query;
  }
}

// Helper function to execute query with proper typing
async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: any
): Promise<Result<T, RuntimeDatabaseError>> {
  const { executeQuery } = require('../db');
  return executeQuery(queryFn, config);
}
