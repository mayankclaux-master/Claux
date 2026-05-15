/**
 * Metrics Repository
 * 
 * Read-only analytics repository for runtime metrics
 * Provides aggregated statistics and performance metrics
 */

import type { UUID } from '../types/common.types';
import { ExecutionStatus } from '../types/execution.types';
import { TaskStatus } from '../types/task.types';
import type { Result } from '../types/common.types';
import { RuntimeDatabaseError, RuntimeDbErrorCode, executeQuery } from '../db';

/**
 * Execution metrics interface
 */
export interface ExecutionMetrics {
  total_executions: number;
  by_status: Record<string, number>;
  by_agent: Record<string, number>;
  by_workflow_type: Record<string, number>;
  total_cost: number;
  total_tokens: number;
  avg_duration_ms: number;
  success_rate: number;
}

/**
 * Task metrics interface
 */
export interface TaskMetrics {
  total_tasks: number;
  by_status: Record<string, number>;
  by_task_type: Record<string, number>;
  total_duration_ms: number;
  avg_duration_ms: number;
  success_rate: number;
}

/**
 * Event metrics interface
 */
export interface EventMetrics {
  total_events: number;
  by_event_name: Record<string, number>;
  by_event_source: Record<string, number>;
  events_per_hour: number;
}

/**
 * Log metrics interface
 */
export interface LogMetrics {
  readonly total_logs: number;
  readonly by_log_level: Record<string, number>;
  readonly error_rate: number;
  readonly logs_per_execution: number;
}

/**
 * Error metrics interface
 */
export interface ErrorMetrics {
  total_errors: number;
  error_rate: number;
  logs_per_execution: number;
  by_error_type: Record<string, number>;
}

/**
 * Cost metrics interface
 */
export interface CostMetrics {
  readonly total_cost: number;
  readonly avg_cost_per_execution: number;
  readonly cost_by_agent: Record<string, number>;
  readonly cost_by_workflow: Record<string, number>;
  readonly cost_trend: Array<{ date: string; cost: number }>;
}

/**
 * Token metrics interface
 */
export interface TokenMetrics {
  readonly total_tokens: number;
  readonly tokens_by_agent: Record<string, number>;
  readonly tokens_by_workflow: Record<string, number>;
  readonly avg_tokens_per_execution: number;
  readonly token_efficiency: number;
}

/**
 * Failure rate metrics interface
 */
export interface FailureRateMetrics {
  overall_failure_rate: number;
  failure_by_agent: Record<string, number>;
  failure_by_workflow: Record<string, number>;
  failure_by_task_type: Record<string, number>;
}

/**
 * Duration metrics interface
 */
export interface DurationMetrics {
  readonly avg_execution_duration_ms: number;
  readonly avg_task_duration_ms: number;
  readonly p50_duration_ms: number;
  readonly p95_duration_ms: number;
  readonly p99_duration_ms: number;
}

/**
 * Metrics repository
 * Read-only analytics for runtime performance
 */
export class MetricsRepository {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    this.tenantId = tenantId;
  }

  /**
   * Get execution metrics
   */
  async getExecutionMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<ExecutionMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    let query = client
      .from('agent_executions')
      .select('status, agent_name, workflow_type, total_cost, total_tokens, started_at, completed_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const executions = result.data as any[];
    const by_status: Record<string, number> = {};
    const by_agent: Record<string, number> = {};
    const by_workflow_type: Record<string, number> = {};
    let total_cost = 0;
    let total_tokens = 0;
    let avg_duration_ms = 0;
    let success_rate = 0;

    let totalDuration = 0;
    let successCount = 0;

    for (const exec of executions) {
      by_status[exec.status] = (by_status[exec.status] || 0) + 1;
      by_agent[exec.agent_name] = (by_agent[exec.agent_name] || 0) + 1;
      by_workflow_type[exec.workflow_type] = (by_workflow_type[exec.workflow_type] || 0) + 1;
      total_cost += exec.total_cost || 0;
      total_tokens += exec.total_tokens || 0;

      if (exec.started_at && exec.completed_at) {
        const duration = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime();
        totalDuration += duration;
      }

      if (exec.status === 'completed') {
        successCount++;
      }
    }

    if (executions.length > 0) {
      avg_duration_ms = totalDuration / executions.length;
      success_rate = successCount / executions.length;
    }

    const metrics: ExecutionMetrics = {
      total_executions: executions.length,
      by_status: by_status as Readonly<Record<string, number>>,
      by_agent: by_agent as Readonly<Record<string, number>>,
      by_workflow_type: by_workflow_type as Readonly<Record<string, number>>,
      total_cost,
      total_tokens,
      avg_duration_ms,
      success_rate,
    };

    return { success: true, data: metrics };
  }

  /**
   * Get task metrics
   */
  async getTaskMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<TaskMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    const query = client
      .from('agent_tasks')
      .select('status, task_type, duration_ms, started_at, completed_at')
      .eq('tenant_id', this.tenantId);

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const tasks = result.data as any[];
    const by_status: Record<string, number> = {};
    const by_type: Record<string, number> = {};
    let total_duration_ms = 0;
    let avg_duration_ms = 0;
    let success_rate = 0;

    let totalDuration = 0;
    let successCount = 0;

    for (const task of tasks) {
      by_status[task.status] = (by_status[task.status] || 0) + 1;
      by_type[task.task_type] = (by_type[task.task_type] || 0) + 1;
      total_duration_ms += task.duration_ms || 0;

      if (task.started_at && task.completed_at) {
        const duration = new Date(task.completed_at).getTime() - new Date(task.started_at).getTime();
        totalDuration += duration;
      }

      if (task.status === 'completed') {
        successCount++;
      }
    }

    if (tasks.length > 0) {
      avg_duration_ms = totalDuration / tasks.length;
      success_rate = successCount / tasks.length;
    }

    const metrics: TaskMetrics = {
      total_tasks: tasks.length,
      by_status: by_status as Readonly<Record<string, number>>,
      by_task_type: by_type as Readonly<Record<string, number>>,
      total_duration_ms,
      avg_duration_ms,
      success_rate,
    };

    return { success: true, data: metrics };
  }

  /**
   * Get event metrics
   */
  async getEventMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<EventMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    const query = client
      .from('agent_events')
      .select('event_name, event_source, created_at')
      .eq('tenant_id', this.tenantId);

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const events = result.data as any[];
    const metrics: EventMetrics = {
      total_events: events.length,
      by_event_name: {},
      by_event_source: {},
      events_per_hour: 0,
    };

    for (const event of events) {
      metrics.by_event_name[event.event_name] = (metrics.by_event_name[event.event_name] || 0) + 1;
      metrics.by_event_source[event.event_source] = (metrics.by_event_source[event.event_source] || 0) + 1;
    }

    if (events.length > 0) {
      const firstEvent = new Date(events[0].created_at);
      const lastEvent = new Date(events[events.length - 1].created_at);
      const hours = Math.max(1, (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60));
      metrics.events_per_hour = events.length / hours;
    }

    return { success: true, data: metrics };
  }

  /**
   * Get log metrics
   */
  async getLogMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<LogMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    const execQuery = client
      .from('agent_executions')
      .select('id')
      .eq('tenant_id', this.tenantId);

    const logQuery = client
      .from('agent_logs')
      .select('log_level')
      .eq('tenant_id', this.tenantId);

    const [execResult, logResult] = await Promise.all([
      executeQuery(() => execQuery, { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }),
      executeQuery(() => logQuery, { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }),
    ]);

    if (!execResult.success) {
      return execResult as any;
    }

    if (!logResult.success) {
      return logResult as any;
    }

    const executions = execResult.data as any[];
    const logs = logResult.data as any[];
    const by_log_level: Record<string, number> = {};
    let error_rate = 0;
    let logs_per_execution = 0;

    let errorCount = 0;

    for (const log of logs) {
      by_log_level[log.log_level] = (by_log_level[log.log_level] || 0) + 1;
      if (log.log_level === 'error' || log.log_level === 'fatal') {
        errorCount++;
      }
    }

    if (logs.length > 0) {
      error_rate = errorCount / logs.length;
    }

    if (executions.length > 0) {
      logs_per_execution = logs.length / executions.length;
    }

    const metrics: LogMetrics = {
      total_logs: logs.length,
      by_log_level: by_log_level as Readonly<Record<string, number>>,
      error_rate,
      logs_per_execution,
    };

    return { success: true, data: metrics };
  }

  /**
   * Get cost metrics
   */
  async getCostMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<CostMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    let query = client
      .from('agent_executions')
      .select('agent_name, workflow_type, total_cost, created_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const executions = result.data as any[];
    const cost_by_agent: Record<string, number> = {};
    const cost_by_workflow: Record<string, number> = {};
    let total_cost = 0;
    let avg_cost_per_execution = 0;
    const cost_trend: Array<{ date: string; cost: number }> = [];

    const costByDate: Record<string, number> = {};

    for (const exec of executions) {
      const cost = exec.total_cost || 0;
      total_cost += cost;
      cost_by_agent[exec.agent_name] = (cost_by_agent[exec.agent_name] || 0) + cost;
      cost_by_workflow[exec.workflow_type] = (cost_by_workflow[exec.workflow_type] || 0) + cost;

      const date = new Date(exec.created_at).toISOString().split('T')[0];
      costByDate[date] = (costByDate[date] || 0) + cost;
    }

    if (executions.length > 0) {
      avg_cost_per_execution = total_cost / executions.length;
    }

    cost_trend.push(...Object.entries(costByDate)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date)));

    const metrics: CostMetrics = {
      total_cost,
      avg_cost_per_execution,
      cost_by_agent: cost_by_agent as Readonly<Record<string, number>>,
      cost_by_workflow: cost_by_workflow as Readonly<Record<string, number>>,
      cost_trend,
    };

    return { success: true, data: metrics };
  }

  /**
   * Get token metrics
   */
  async getTokenMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<TokenMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    let query = client
      .from('agent_executions')
      .select('agent_name, workflow_type, total_tokens')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const executions = result.data as any[];
    const tokens_by_agent: Record<string, number> = {};
    const tokens_by_workflow: Record<string, number> = {};
    let total_tokens = 0;
    let avg_tokens_per_execution = 0;
    let token_efficiency = 0;

    for (const exec of executions) {
      const tokens = exec.total_tokens || 0;
      total_tokens += tokens;
      tokens_by_agent[exec.agent_name] = (tokens_by_agent[exec.agent_name] || 0) + tokens;
      tokens_by_workflow[exec.workflow_type] = (tokens_by_workflow[exec.workflow_type] || 0) + tokens;
    }

    if (executions.length > 0) {
      avg_tokens_per_execution = total_tokens / executions.length;
    }

    token_efficiency = total_tokens > 0 ? 1 : 0;

    const metrics: TokenMetrics = {
      total_tokens,
      tokens_by_agent: tokens_by_agent as Readonly<Record<string, number>>,
      tokens_by_workflow: tokens_by_workflow as Readonly<Record<string, number>>,
      avg_tokens_per_execution,
      token_efficiency,
    };

    return { success: true, data: metrics };
  }

  /**
   * Get failure rate metrics
   */
  async getFailureRateMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<FailureRateMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    let query = client
      .from('agent_executions')
      .select('status, agent_name, workflow_type, task_type')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const executions = result.data as any[];
    const metrics: FailureRateMetrics = {
      overall_failure_rate: 0,
      failure_by_agent: {},
      failure_by_workflow: {},
      failure_by_task_type: {},
    };

    let failureCount = 0;

    for (const exec of executions) {
      if (exec.status === ExecutionStatus.FAILED) {
        failureCount++;
        metrics.failure_by_agent[exec.agent_name] = (metrics.failure_by_agent[exec.agent_name] || 0) + 1;
        metrics.failure_by_workflow[exec.workflow_type] = (metrics.failure_by_workflow[exec.workflow_type] || 0) + 1;
      }
    }

    if (executions.length > 0) {
      metrics.overall_failure_rate = failureCount / executions.length;
    }

    return { success: true, data: metrics };
  }

  /**
   * Get duration metrics
   */
  async getDurationMetrics(
    options?: {
      created_after?: string;
      created_before?: string;
    }
  ): Promise<Result<DurationMetrics, RuntimeDatabaseError>> {
    const client = this.getAdminClient();
    let query = client
      .from('agent_executions')
      .select('started_at, completed_at')
      .eq('tenant_id', this.tenantId);

    if (options?.created_after) {
      query = query.gte('created_at', options.created_after);
    }

    if (options?.created_before) {
      query = query.lte('created_at', options.created_before);
    }

    const result = await executeQuery(
      () => query,
      { retryCount: 2, retryDelayMs: 100, timeoutMs: 30000 }
    );

    if (!result.success) {
      return result;
    }

    const executions = result.data as any[];
    const durations: number[] = [];

    for (const exec of executions) {
      if (exec.started_at && exec.completed_at) {
        const duration = new Date(exec.completed_at).getTime() - new Date(exec.started_at).getTime();
        durations.push(duration);
      }
    }

    if (durations.length === 0) {
      return {
        success: true,
        data: {
          avg_execution_duration_ms: 0,
          avg_task_duration_ms: 0,
          p50_duration_ms: 0,
          p95_duration_ms: 0,
          p99_duration_ms: 0,
        },
      };
    }

    durations.sort((a, b) => a - b);

    const metrics: DurationMetrics = {
      avg_execution_duration_ms: durations.reduce((a, b) => a + b, 0) / durations.length,
      avg_task_duration_ms: 0,
      p50_duration_ms: durations[Math.floor(durations.length * 0.5)],
      p95_duration_ms: durations[Math.floor(durations.length * 0.95)],
      p99_duration_ms: durations[Math.floor(durations.length * 0.99)],
    };

    return { success: true, data: metrics };
  }

  /**
   * Get admin client for repository operations
   */
  private getAdminClient() {
    const { getRuntimeAdminClient } = require('../db');
    return getRuntimeAdminClient();
  }
}
