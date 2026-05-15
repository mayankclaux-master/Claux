/**
 * Task Repository
 * 
 * Data access layer for agent_tasks table
 * Handles task lifecycle, status tracking, and aggregation
 */

import type { UUID } from '../types/common.types';
import type {
  Task,
  TaskInsert,
  TaskUpdate,
  TaskFilter,
  TaskStats,
} from '../types/task.types';
import { TaskStatus } from '../types/task.types';
import type { Result } from '../types/common.types';
import { BaseRepository, BaseFilter } from './base.repository';
import { RuntimeDatabaseError } from '../db';

/**
 * Task filter interface
 * Extends base filter with task-specific fields
 */
export interface TaskRepositoryFilter extends BaseFilter {
  readonly execution_id?: UUID;
  readonly task_name?: string;
  readonly task_type?: string;
  readonly status?: TaskStatus;
  readonly step_order?: number;
}

/**
 * Task repository
 * Manages task CRUD operations and queries
 */
export class TaskRepository extends BaseRepository<
  Task,
  TaskInsert,
  TaskUpdate,
  TaskRepositoryFilter
> {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    super();
    this.tenantId = tenantId;
  }

  protected getTableName(): string {
    return 'agent_tasks';
  }

  protected getTenantId(): UUID {
    return this.tenantId;
  }

  /**
   * Create a new task
   */
  async create(data: TaskInsert): Promise<Result<Task, RuntimeDatabaseError>> {
    this.logOperation('create', { data });
    const result = await super.create(data);

    if (!result.success) {
      this.logError('create', result.error, { data });
    }

    return result;
  }

  /**
   * Create multiple tasks in batch
   */
  async createBatch(data: TaskInsert[]): Promise<Result<Task[], RuntimeDatabaseError>> {
    this.logOperation('createBatch', { count: data.length });
    const result = await super.createBatch(data);

    if (!result.success) {
      this.logError('createBatch', result.error, { count: data.length });
    }

    return result;
  }

  /**
   * Update task status
   */
  async updateStatus(
    id: UUID,
    status: TaskStatus,
    metadata?: Partial<TaskUpdate>
  ): Promise<Result<Task, RuntimeDatabaseError>> {
    this.logOperation('updateStatus', { id, status });

    const mutableUpdateData: any = {
      status,
      ...metadata,
    };

    if (status === TaskStatus.RUNNING && !mutableUpdateData.started_at) {
      mutableUpdateData.started_at = new Date().toISOString();
    }

    if (
      status === TaskStatus.COMPLETED ||
      status === TaskStatus.FAILED ||
      status === TaskStatus.SKIPPED
    ) {
      if (!mutableUpdateData.completed_at && !mutableUpdateData.failed_at) {
        mutableUpdateData.completed_at = new Date().toISOString();
      }
    }

    const updateData = mutableUpdateData as TaskUpdate;

    const result = await this.updateById(id, updateData);

    if (!result.success) {
      this.logError('updateStatus', result.error, { id, status });
    }

    return result;
  }

  /**
   * Fetch task by ID
   */
  async findById(id: UUID): Promise<Result<Task, RuntimeDatabaseError>> {
    this.logOperation('findById', { id });
    return super.findById(id);
  }

  /**
   * Fetch tasks by execution ID
   */
  async fetchByExecutionId(
    executionId: UUID,
    options?: {
      filter?: Partial<TaskRepositoryFilter>;
      pagination?: { limit?: number; offset?: number };
      sort?: { column: keyof Task; direction: 'asc' | 'desc' };
    }
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    this.logOperation('fetchByExecutionId', { executionId, options });

    const filter: TaskRepositoryFilter = {
      execution_id: executionId,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: options?.sort || { column: 'step_order', direction: 'asc' },
    });
  }

  /**
   * Fetch pending tasks
   */
  async fetchPendingTasks(
    options?: {
      pagination?: { limit?: number; offset?: number };
    }
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    this.logOperation('fetchPendingTasks', options);

    const filter: TaskRepositoryFilter = {
      status: TaskStatus.PENDING,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'step_order', direction: 'asc' },
    });
  }

  /**
   * Fetch failed tasks
   */
  async fetchFailedTasks(
    options?: {
      pagination?: { limit?: number; offset?: number };
      created_after?: string;
    }
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    this.logOperation('fetchFailedTasks', options);

    const filter: TaskRepositoryFilter = {
      status: TaskStatus.FAILED,
      created_after: options?.created_after,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'failed_at', direction: 'desc' },
    });
  }

  /**
   * Fetch tasks by task type
   */
  async fetchByTaskType(
    taskType: string,
    options?: {
      filter?: Partial<TaskRepositoryFilter>;
      pagination?: { limit?: number; offset?: number };
    }
  ): Promise<Result<Task[], RuntimeDatabaseError>> {
    this.logOperation('fetchByTaskType', { taskType, options });

    const filter: TaskRepositoryFilter = {
      task_type: taskType,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Update task duration
   */
  async updateDuration(
    id: UUID,
    durationMs: number
  ): Promise<Result<Task, RuntimeDatabaseError>> {
    this.logOperation('updateDuration', { id, durationMs });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .update({ duration_ms: durationMs } as any)
      .eq('id', id)
      .select()
      .single();

    const result = await executeUpdate(
      () => query,
      this.getQueryConfig()
    );

    if (!result.success) {
      this.logError('updateDuration', result.error, { id, durationMs });
    }

    return result as unknown as Result<Task, RuntimeDatabaseError>;
  }

  /**
   * Get task statistics for an execution
   */
  async getExecutionStatistics(
    executionId: UUID
  ): Promise<Result<TaskStats, RuntimeDatabaseError>> {
    this.logOperation('getExecutionStatistics', { executionId });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .select('status, task_type, duration_ms, started_at, completed_at')
      .eq('execution_id', executionId);

    const result = await executeQuery(
      () => query,
      this.getQueryConfig()
    );

    if (!result.success) {
      this.logError('getExecutionStatistics', result.error, { executionId });
      return result;
    }

    const tasks = result.data as any[];
    const by_status: Record<TaskStatus, number> = {} as Record<TaskStatus, number>;
    const by_type: Record<string, number> = {};
    let total_duration_ms = 0;
    let avg_duration_ms = 0;
    let success_rate = 0;

    let completedCount = 0;

    for (const task of tasks) {
      const status = task.status as TaskStatus;
      const type = task.task_type;

      by_status[status] = (by_status[status] || 0) + 1;
      by_type[type] = (by_type[type] || 0) + 1;
      total_duration_ms += task.duration_ms || 0;

      if (status === TaskStatus.COMPLETED) {
        completedCount++;
      }
    }

    if (tasks.length > 0) {
      avg_duration_ms = total_duration_ms / tasks.length;
      success_rate = completedCount / tasks.length;
    }

    const stats: TaskStats = {
      total: tasks.length,
      by_status: by_status as Readonly<Record<TaskStatus, number>>,
      by_type: by_type as Readonly<Record<string, number>>,
      total_duration_ms,
      avg_duration_ms,
      success_rate,
    };

    return { success: true, data: stats };
  }

  /**
   * Apply task-specific filters
   */
  protected applyFilters(query: any, filter?: TaskRepositoryFilter): any {
    query = super.applyFilters(query, filter);

    if (!filter) {
      return query;
    }

    if (filter.execution_id) {
      query = query.eq('execution_id', filter.execution_id);
    }

    if (filter.task_name) {
      query = query.eq('task_name', filter.task_name);
    }

    if (filter.task_type) {
      query = query.eq('task_type', filter.task_type);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.step_order !== undefined) {
      query = query.eq('step_order', filter.step_order);
    }

    return query;
  }
}

// Helper function to execute update with proper typing
async function executeUpdate<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: any
): Promise<Result<T, RuntimeDatabaseError>> {
  const { executeUpdateQuery } = require('../db');
  return executeUpdateQuery(queryFn, config);
}

// Helper function to execute query with proper typing
async function executeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>,
  config?: any
): Promise<Result<T, RuntimeDatabaseError>> {
  const { executeQuery } = require('../db');
  return executeQuery(queryFn, config);
}
