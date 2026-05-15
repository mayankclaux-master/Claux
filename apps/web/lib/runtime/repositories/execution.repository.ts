/**
 * Execution Repository
 * 
 * Data access layer for agent_executions table
 * Handles execution lifecycle, status tracking, and statistics
 */

import type { UUID, Result, PaginationOptions, SortOptions } from '../types/common.types';
import { ExecutionStatus, ExecutionSource } from '../types/execution.types';
import type {
  Execution,
  ExecutionInsert,
  ExecutionUpdate,
  ExecutionFilter,
  ExecutionStats,
} from '../types/execution.types';
import { BaseRepository, BaseFilter } from './base.repository';
import { RuntimeDatabaseError } from '../db';

/**
 * Execution filter interface
 * Extends base filter with execution-specific fields
 */
export interface ExecutionRepositoryFilter extends BaseFilter {
  readonly agent_name?: string;
  readonly status?: ExecutionStatus;
  readonly workflow_type?: string;
  readonly execution_source?: ExecutionSource;
  readonly inngest_run_id?: string;
}

/**
 * Execution repository
 * Manages execution CRUD operations and queries
 */
export class ExecutionRepository extends BaseRepository<
  Execution,
  ExecutionInsert,
  ExecutionUpdate,
  ExecutionRepositoryFilter
> {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    super();
    this.tenantId = tenantId;
  }

  protected getTableName(): string {
    return 'agent_executions';
  }

  protected getTenantId(): UUID {
    return this.tenantId;
  }

  /**
   * Create a new execution
   */
  async create(data: ExecutionInsert): Promise<Result<Execution, RuntimeDatabaseError>> {
    return super.create(data);
  }

  /**
   * Update execution status
   */
  async updateStatus(
    id: UUID,
    status: ExecutionStatus,
    metadata?: Record<string, unknown>
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    this.logOperation('updateStatus', { id, status, metadata });

    const updateData: ExecutionUpdate = {
      status,
    } as ExecutionUpdate;

    if (status === ExecutionStatus.RUNNING && !metadata?.started_at) {
      (updateData as any).started_at = new Date().toISOString();
    }

    if (status === ExecutionStatus.COMPLETED) {
      (updateData as any).completed_at = new Date().toISOString();
    }

    if (status === ExecutionStatus.FAILED) {
      (updateData as any).failed_at = new Date().toISOString();
    }

    if (metadata) {
      Object.assign(updateData, metadata);
    }

    return this.updateById(id, updateData);
  }

  /**
   * Fetch execution by ID
   */
  async findById(id: UUID): Promise<Result<Execution, RuntimeDatabaseError>> {
    return super.findById(id);
  }

  /**
   * Fetch executions by tenant
   */
  async findByTenant(
    options?: {
      filter?: ExecutionRepositoryFilter;
      pagination?: PaginationOptions;
      sort?: SortOptions;
    }
  ): Promise<Result<Execution[], RuntimeDatabaseError>> {
    return super.findByTenant(options);
  }

  /**
   * Fetch running executions
   */
  async fetchRunningExecutions(
    options?: {
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Execution[], RuntimeDatabaseError>> {
    this.logOperation('fetchRunningExecutions', options);

    const filter: ExecutionRepositoryFilter = {
      status: ExecutionStatus.RUNNING,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'started_at', direction: 'asc' },
    });
  }

  /**
   * Fetch failed executions
   */
  async fetchFailedExecutions(
    options?: {
      pagination?: PaginationOptions;
      created_after?: string;
    }
  ): Promise<Result<Execution[], RuntimeDatabaseError>> {
    this.logOperation('fetchFailedExecutions', options);

    const filter: ExecutionRepositoryFilter = {
      status: ExecutionStatus.FAILED,
      created_after: options?.created_after,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'failed_at', direction: 'desc' },
    });
  }

  /**
   * Fetch executions by agent name
   */
  async fetchByAgentName(
    agentName: string,
    options?: {
      filter?: Partial<ExecutionRepositoryFilter>;
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Execution[], RuntimeDatabaseError>> {
    this.logOperation('fetchByAgentName', { agentName, options });

    const filter: ExecutionRepositoryFilter = {
      agent_name: agentName,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Fetch executions by workflow type
   */
  async fetchByWorkflowType(
    workflowType: string,
    options?: {
      filter?: Partial<ExecutionRepositoryFilter>;
      pagination?: PaginationOptions;
    }
  ): Promise<Result<Execution[], RuntimeDatabaseError>> {
    this.logOperation('fetchByWorkflowType', { workflowType, options });

    const filter: ExecutionRepositoryFilter = {
      workflow_type: workflowType,
      ...options?.filter,
    };

    return this.findByTenant({
      filter,
      pagination: options?.pagination,
      sort: { column: 'created_at', direction: 'desc' },
    });
  }

  /**
   * Increment retry count
   */
  async incrementRetryCount(id: UUID): Promise<Result<Execution, RuntimeDatabaseError>> {
    this.logOperation('incrementRetryCount', { id });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .update({ retry_count: (client as any).rpc('increment_retry_count', { row_id: id }) } as any)
      .eq('id', id)
      .select()
      .single();

    const result = await this.executeExecutionUpdate(() => query);

    if (!result.success) {
      this.logError('incrementRetryCount', result.error, { id });
    }

    return result as unknown as Result<Execution, RuntimeDatabaseError>;
  }

  /**
   * Update cost tracking
   */
  async updateCost(
    id: UUID,
    cost: number,
    tokens: number
  ): Promise<Result<Execution, RuntimeDatabaseError>> {
    this.logOperation('updateCost', { id, cost, tokens });

    const client = this.getAdminClient();
    const query = client
      .from(this.getTableName())
      .update({
        total_cost: cost,
        total_tokens: tokens,
      } as ExecutionUpdate)
      .eq('id', id)
      .select()
      .single();

    const result = await this.executeExecutionUpdate(() => query);

    if (!result.success) {
      this.logError('updateCost', result.error, { id, cost, tokens });
    }

    return result as unknown as Result<Execution, RuntimeDatabaseError>;
  }

  /**
   * Get execution statistics
   */
  async getStatistics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<ExecutionStats, RuntimeDatabaseError>> {
    this.logOperation('getStatistics', options);

    const client = this.getAdminClient();
    let query = client
      .from(this.getTableName())
      .select('status, execution_source, total_cost, total_tokens, started_at, completed_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await this.executeExecutionQuery(() => query);

    if (!result.success) {
      this.logError('getStatistics', result.error, options);
      return result;
    }

    const executions = result.data as any[];
    const by_status: Record<ExecutionStatus, number> = {} as Record<ExecutionStatus, number>;
    const by_source: Record<ExecutionSource, number> = {} as Record<ExecutionSource, number>;
    let total_cost = 0;
    let total_tokens = 0;
    let avg_duration_ms = 0;

    const durations: number[] = [];

    for (const exec of executions) {
      const status = exec.status as ExecutionStatus;
      const source = exec.execution_source as ExecutionSource;

      by_status[status] = (by_status[status] || 0) + 1;
      by_source[source] = (by_source[source] || 0) + 1;
      total_cost += exec.total_cost || 0;
      total_tokens += exec.total_tokens || 0;

      if (exec.started_at && exec.completed_at) {
        const duration = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime();
        durations.push(duration);
      }
    }

    if (durations.length > 0) {
      avg_duration_ms = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
    }

    const stats: ExecutionStats = {
      total: executions.length,
      by_status: by_status as Readonly<Record<ExecutionStatus, number>>,
      by_source: by_source as Readonly<Record<ExecutionSource, number>>,
      total_cost,
      total_tokens,
      avg_duration_ms,
    };

    return { success: true, data: stats };
  }

  /**
   * Execute query with proper typing
   */
  private async executeExecutionQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeQuery } = require('../db');
    return executeQuery(queryFn, this.getQueryConfig());
  }

  /**
   * Execute update with proper typing
   */
  private async executeExecutionUpdate<T>(
    queryFn: () => Promise<{ data: T | null; error: Error | null }>
  ): Promise<Result<T, RuntimeDatabaseError>> {
    const { executeUpdateQuery } = require('../db');
    return executeUpdateQuery(queryFn, this.getQueryConfig());
  }
}
