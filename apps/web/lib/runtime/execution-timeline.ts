/**
 * Execution Timeline
 * 
 * Reconstructs execution timeline from agent_events and agent_logs
 * No synthetic state - only real runtime data
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TimelineEvent {
  id: string;
  timestamp: string;
  type: 'execution' | 'task' | 'event' | 'log' | 'checkpoint';
  source: string;
  description: string;
  metadata?: Record<string, unknown>;
  execution_id: string;
  task_id?: string;
}

export interface ExecutionTimeline {
  execution_id: string;
  agent_name: string;
  workflow_type: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  events: TimelineEvent[];
  tasks: TaskTimeline[];
}

export interface TaskTimeline {
  task_id: string;
  task_name: string;
  task_type: string;
  step_order: number;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  events: TimelineEvent[];
}

/**
 * Get execution timeline from agent_events and agent_logs
 */
export async function getExecutionTimeline(executionId: string): Promise<ExecutionTimeline | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get execution details
    const { data: execution, error: execError } = await supabase
      .from("agent_executions")
      .select("*")
      .eq("id", executionId)
      .single();

    if (execError || !execution) {
      return null;
    }

    // Get tasks for this execution
    const { data: tasks, error: tasksError } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("execution_id", executionId)
      .order("step_order", { ascending: true });

    if (tasksError || !tasks) {
      return {
        execution_id: execution.id,
        agent_name: execution.agent_name,
        workflow_type: execution.workflow_type,
        status: execution.status,
        created_at: execution.created_at,
        started_at: execution.started_at || undefined,
        completed_at: execution.completed_at || undefined,
        failed_at: execution.failed_at || undefined,
        events: [],
        tasks: [],
      };
    }

    // Get events for this execution
    const { data: events, error: eventsError } = await supabase
      .from("agent_events")
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at", { ascending: true });

    // Get logs for this execution
    const { data: logs, error: logsError } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("execution_id", executionId)
      .order("created_at", { ascending: true });

    // Build timeline events
    const timelineEvents: TimelineEvent[] = [];

    // Add execution lifecycle events
    timelineEvents.push({
      id: `exec-created-${execution.id}`,
      timestamp: execution.created_at,
      type: 'execution',
      source: 'orchestrator',
      description: `Execution created: ${execution.agent_name} - ${execution.workflow_type}`,
      metadata: {
        agent_name: execution.agent_name,
        workflow_type: execution.workflow_type,
        initiated_by: execution.initiated_by,
      },
      execution_id: execution.id,
    });

    if (execution.started_at) {
      timelineEvents.push({
        id: `exec-started-${execution.id}`,
        timestamp: execution.started_at,
        type: 'execution',
        source: 'orchestrator',
        description: 'Execution started',
        execution_id: execution.id,
      });
    }

    if (execution.completed_at) {
      timelineEvents.push({
        id: `exec-completed-${execution.id}`,
        timestamp: execution.completed_at,
        type: 'execution',
        source: 'orchestrator',
        description: 'Execution completed',
        metadata: {
          total_cost: execution.total_cost,
          total_tokens: execution.total_tokens,
        },
        execution_id: execution.id,
      });
    }

    if (execution.failed_at) {
      timelineEvents.push({
        id: `exec-failed-${execution.id}`,
        timestamp: execution.failed_at,
        type: 'execution',
        source: 'orchestrator',
        description: `Execution failed: ${execution.error_message || 'Unknown error'}`,
        metadata: {
          error_message: execution.error_message,
        },
        execution_id: execution.id,
      });
    }

    // Add task lifecycle events
    for (const task of tasks) {
      timelineEvents.push({
        id: `task-created-${task.id}`,
        timestamp: task.created_at,
        type: 'task',
        source: 'orchestrator',
        description: `Task created: ${task.task_name}`,
        metadata: {
          task_name: task.task_name,
          task_type: task.task_type,
          step_order: task.step_order,
        },
        execution_id: execution.id,
        task_id: task.id,
      });

      if (task.started_at) {
        timelineEvents.push({
          id: `task-started-${task.id}`,
          timestamp: task.started_at,
          type: 'task',
          source: 'orchestrator',
          description: `Task started: ${task.task_name}`,
          execution_id: execution.id,
          task_id: task.id,
        });
      }

      if (task.completed_at) {
        timelineEvents.push({
          id: `task-completed-${task.id}`,
          timestamp: task.completed_at,
          type: 'task',
          source: 'orchestrator',
          description: `Task completed: ${task.task_name}`,
          metadata: {
            duration_ms: task.duration_ms,
          },
          execution_id: execution.id,
          task_id: task.id,
        });
      }

      if (task.failed_at) {
        timelineEvents.push({
          id: `task-failed-${task.id}`,
          timestamp: task.failed_at,
          type: 'task',
          source: 'orchestrator',
          description: `Task failed: ${task.task_name}`,
          metadata: {
            error_message: task.error_message,
          },
          execution_id: execution.id,
          task_id: task.id,
        });
      }
    }

    // Add agent events
    if (events) {
      for (const event of events) {
        timelineEvents.push({
          id: event.id,
          timestamp: event.created_at,
          type: 'event',
          source: event.event_source,
          description: event.event_name,
          metadata: event.payload as Record<string, unknown>,
          execution_id: execution.id,
          task_id: undefined,
        });
      }
    }

    // Add logs
    if (logs) {
      for (const log of logs) {
        timelineEvents.push({
          id: log.id,
          timestamp: log.created_at,
          type: 'log',
          source: 'runtime',
          description: `[${log.log_level}] ${log.message}`,
          metadata: {
            log_level: log.log_level,
            context: log.context,
          },
          execution_id: execution.id,
          task_id: log.task_id || undefined,
        });
      }
    }

    // Sort timeline by timestamp
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Build task timelines
    const taskTimelines: TaskTimeline[] = tasks.map(task => {
      const taskEvents = timelineEvents.filter(e => e.task_id === task.id);

      return {
        task_id: task.id,
        task_name: task.task_name,
        task_type: task.task_type,
        step_order: task.step_order,
        status: task.status,
        created_at: task.created_at,
        started_at: task.started_at || undefined,
        completed_at: task.completed_at || undefined,
        failed_at: task.failed_at || undefined,
        events: taskEvents,
      };
    });

    return {
      execution_id: execution.id,
      agent_name: execution.agent_name,
      workflow_type: execution.workflow_type,
      status: execution.status,
      created_at: execution.created_at,
      started_at: execution.started_at || undefined,
      completed_at: execution.completed_at || undefined,
      failed_at: execution.failed_at || undefined,
      events: timelineEvents,
      tasks: taskTimelines,
    };
  } catch (error) {
    console.error("Error fetching execution timeline:", error);
    return null;
  }
}

/**
 * Get execution list for tenant
 */
export async function getExecutionList(tenantId: string, options?: {
  limit?: number;
  offset?: number;
  agentName?: string;
  status?: string;
}): Promise<{ executions: Array<{ id: string; agent_name: string; workflow_type: string; status: string; created_at: string; started_at?: string; completed_at?: string }>; total: number } | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    let query = supabase
      .from("agent_executions")
      .select("id, agent_name, workflow_type, status, created_at, started_at, completed_at", { count: "exact" })
      .eq("tenant_id", tenantId);

    if (options?.agentName) {
      query = query.eq("agent_name", options.agentName);
    }

    if (options?.status) {
      query = query.eq("status", options.status);
    }

    query = query.order("created_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data: executions, error, count } = await query;

    if (error || !executions) {
      return null;
    }

    return {
      executions: executions.map(e => ({
        id: e.id,
        agent_name: e.agent_name,
        workflow_type: e.workflow_type,
        status: e.status,
        created_at: e.created_at,
        started_at: e.started_at || undefined,
        completed_at: e.completed_at || undefined,
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error("Error fetching execution list:", error);
    return null;
  }
}
