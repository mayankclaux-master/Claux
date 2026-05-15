/**
 * Execution Tracer
 * Provides execution tracing and timeline visualization
 */

import { AgentRuntimeDatabase } from '../runtime/database';
import { AgentExecution, AgentTask, AgentEvent, AgentLog } from '../runtime/types';

export interface ExecutionTimeline {
  execution: AgentExecution;
  timeline: TimelineEvent[];
  summary: ExecutionSummary;
}

export interface TimelineEvent {
  id: string;
  type: 'execution' | 'task' | 'event' | 'log';
  timestamp: Date;
  data: any;
}

export interface ExecutionSummary {
  total_duration_ms: number;
  task_count: number;
  completed_tasks: number;
  failed_tasks: number;
  event_count: number;
  log_count: number;
  error_count: number;
  total_cost: number;
  total_tokens: number;
}

export class ExecutionTracer {
  private db: AgentRuntimeDatabase;

  constructor(db: AgentRuntimeDatabase) {
    this.db = db;
  }

  /**
   * Get full execution timeline
   */
  async getExecutionTimeline(executionId: string): Promise<ExecutionTimeline> {
    const [execution, tasks, events, logs] = await Promise.all([
      this.db.getExecution(executionId),
      this.db.getTasksByExecution(executionId),
      this.db.getEventsByExecution(executionId),
      this.db.getLogsByExecution(executionId),
    ]);

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const timeline = this.buildTimeline(execution, tasks, events, logs);
    const summary = this.buildSummary(execution, tasks, events, logs);

    return {
      execution,
      timeline,
      summary,
    };
  }

  /**
   * Build timeline from execution data
   */
  private buildTimeline(
    execution: AgentExecution,
    tasks: AgentTask[],
    events: AgentEvent[],
    logs: AgentLog[]
  ): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    // Add execution start
    if (execution.started_at) {
      timeline.push({
        id: execution.id,
        type: 'execution',
        timestamp: execution.started_at,
        data: {
          action: 'started',
          agent_name: execution.agent_name,
          workflow_type: execution.workflow_type,
        },
      });
    }

    // Add tasks
    tasks.forEach(task => {
      if (task.started_at) {
        timeline.push({
          id: task.id,
          type: 'task',
          timestamp: task.started_at,
          data: {
            action: 'started',
            task_name: task.task_name,
            task_type: task.task_type,
            step_order: task.step_order,
          },
        });
      }

      if (task.completed_at) {
        timeline.push({
          id: task.id,
          type: 'task',
          timestamp: task.completed_at,
          data: {
            action: 'completed',
            task_name: task.task_name,
            duration_ms: task.duration_ms,
          },
        });
      }

      if (task.failed_at) {
        timeline.push({
          id: task.id,
          type: 'task',
          timestamp: task.failed_at,
          data: {
            action: 'failed',
            task_name: task.task_name,
            error: task.error_payload,
          },
        });
      }
    });

    // Add events
    events.forEach(event => {
      timeline.push({
        id: event.id,
        type: 'event',
        timestamp: event.created_at,
        data: {
          event_name: event.event_name,
          event_source: event.event_source,
          payload: event.payload,
        },
      });
    });

    // Add logs (only errors and warnings for brevity)
    logs
      .filter(log => log.log_level === 'error' || log.log_level === 'warn')
      .forEach(log => {
        timeline.push({
          id: log.id,
          type: 'log',
          timestamp: log.created_at,
          data: {
            log_level: log.log_level,
            message: log.message,
            metadata: log.metadata,
          },
        });
      });

    // Add execution end
    if (execution.completed_at) {
      timeline.push({
        id: execution.id,
        type: 'execution',
        timestamp: execution.completed_at,
        data: {
          action: 'completed',
          status: execution.status,
        },
      });
    }

    if (execution.failed_at) {
      timeline.push({
        id: execution.id,
        type: 'execution',
        timestamp: execution.failed_at,
        data: {
          action: 'failed',
          error: execution.error_message,
        },
      });
    }

    // Sort by timestamp
    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Build execution summary
   */
  private buildSummary(
    execution: AgentExecution,
    tasks: AgentTask[],
    events: AgentEvent[],
    logs: AgentLog[]
  ): ExecutionSummary {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const failedTasks = tasks.filter(t => t.status === 'failed').length;
    const errorLogs = logs.filter(l => l.log_level === 'error' || l.log_level === 'fatal').length;

    let totalDuration = 0;
    if (execution.started_at && execution.completed_at) {
      totalDuration = execution.completed_at.getTime() - execution.started_at.getTime();
    } else if (execution.started_at && execution.failed_at) {
      totalDuration = execution.failed_at.getTime() - execution.started_at.getTime();
    }

    return {
      total_duration_ms: totalDuration,
      task_count: tasks.length,
      completed_tasks: completedTasks,
      failed_tasks: failedTasks,
      event_count: events.length,
      log_count: logs.length,
      error_count: errorLogs,
      total_cost: execution.total_cost,
      total_tokens: execution.total_tokens,
    };
  }

  /**
   * Get execution diagnostics
   */
  async getDiagnostics(executionId: string): Promise<{
    execution: AgentExecution;
    failedTasks: AgentTask[];
    errorLogs: AgentLog[];
    recommendations: string[];
  }> {
    const [execution, tasks, logs] = await Promise.all([
      this.db.getExecution(executionId),
      this.db.getTasksByExecution(executionId),
      this.db.getErrorLogsByExecution(executionId),
    ]);

    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const failedTasks = tasks.filter(t => t.status === 'failed');
    const recommendations = this.generateRecommendations(execution, failedTasks, logs);

    return {
      execution,
      failedTasks,
      errorLogs: logs,
      recommendations,
    };
  }

  /**
   * Generate diagnostic recommendations
   */
  private generateRecommendations(
    execution: AgentExecution,
    failedTasks: AgentTask[],
    errorLogs: AgentLog[]
  ): string[] {
    const recommendations: string[] = [];

    if (execution.status === 'failed') {
      if (execution.retry_count >= execution.max_retries) {
        recommendations.push('Execution exhausted retry limit. Consider increasing max_retries or fixing the underlying issue.');
      }
    }

    if (failedTasks.length > 0) {
      recommendations.push(`${failedTasks.length} task(s) failed. Review error payloads for root cause.`);
    }

    if (errorLogs.length > 5) {
      recommendations.push('High number of errors detected. Review error patterns for systemic issues.');
    }

    if (execution.total_cost > 10) {
      recommendations.push('High execution cost detected. Consider optimizing task efficiency or reducing token usage.');
    }

    if (execution.total_tokens > 100000) {
      recommendations.push('High token usage detected. Consider implementing token optimization strategies.');
    }

    return recommendations;
  }
}
