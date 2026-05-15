/**
 * Task Introspection
 * 
 * Provides detailed task-level information including:
 * - inputs
 * - outputs
 * - retries
 * - timing
 * - provider used
 * - model used
 * - tokens used
 * - costs
 * - validation results
 * - reasoning
 * - artifacts generated
 */

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface TaskIntrospection {
  task_id: string;
  execution_id: string;
  task_name: string;
  task_type: string;
  step_order: number;
  status: string;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  duration_ms?: number;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  metadata?: Record<string, unknown>;
  logs: TaskLog[];
  events: TaskEvent[];
  artifacts: TaskArtifact[];
}

export interface TaskLog {
  id: string;
  log_level: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface TaskEvent {
  id: string;
  event_name: string;
  event_source: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface TaskArtifact {
  artifact_type: string;
  artifact_id: string;
  description?: string;
  created_at: string;
}

/**
 * Get task introspection details
 */
export async function getTaskIntrospection(taskId: string): Promise<TaskIntrospection | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (taskError || !task) {
      return null;
    }

    // Get logs for this task
    const { data: logs, error: logsError } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    // Get events related to this task (via execution_id and filter by task_id in payload)
    const { data: events, error: eventsError } = await supabase
      .from("agent_events")
      .select("*")
      .eq("execution_id", task.execution_id)
      .order("created_at", { ascending: true });

    // Filter events to those related to this task
    const taskEvents = events?.filter(e => {
      const payload = e.payload as Record<string, unknown>;
      return payload?.task_id === taskId;
    }) || [];

    // Extract artifacts from logs and events
    const artifacts: TaskArtifact[] = [];
    
    // Check logs for artifact references
    if (logs) {
      for (const log of logs) {
        const context = log.context as Record<string, unknown>;
        if (context?.artifact_id && context?.artifact_type) {
          artifacts.push({
            artifact_type: context.artifact_type as string,
            artifact_id: context.artifact_id as string,
            description: context.description as string,
            created_at: log.created_at,
          });
        }
      }
    }

    // Check events for artifact references
    for (const event of taskEvents) {
      const payload = event.payload as Record<string, unknown>;
      if (payload?.artifact_id && payload?.artifact_type) {
        artifacts.push({
          artifact_type: payload.artifact_type as string,
          artifact_id: payload.artifact_id as string,
          description: payload.description as string,
          created_at: event.created_at,
        });
      }
    }

    // Map logs
    const taskLogs: TaskLog[] = logs?.map(log => ({
      id: log.id,
      log_level: log.log_level,
      message: log.message,
      timestamp: log.created_at,
      context: log.context as Record<string, unknown>,
    })) || [];

    // Map events
    const mappedEvents: TaskEvent[] = taskEvents.map(event => ({
      id: event.id,
      event_name: event.event_name,
      event_source: event.event_source,
      payload: event.payload as Record<string, unknown>,
      timestamp: event.created_at,
    }));

    return {
      task_id: task.id,
      execution_id: task.execution_id,
      task_name: task.task_name,
      task_type: task.task_type,
      step_order: task.step_order,
      status: task.status,
      input_payload: task.input_payload as Record<string, unknown>,
      output_payload: task.output_payload as Record<string, unknown>,
      created_at: task.created_at,
      started_at: task.started_at || undefined,
      completed_at: task.completed_at || undefined,
      failed_at: task.failed_at || undefined,
      duration_ms: task.duration_ms || undefined,
      retry_count: task.retry_count,
      max_retries: task.max_retries,
      error_message: task.error_message || undefined,
      metadata: task.metadata as Record<string, unknown>,
      logs: taskLogs,
      events: mappedEvents,
      artifacts,
    };
  } catch (error) {
    console.error("Error fetching task introspection:", error);
    return null;
  }
}

/**
 * Get tasks for an execution with introspection
 */
export async function getExecutionTasksIntrospection(executionId: string): Promise<TaskIntrospection[] | null> {
  try {
    const supabase = createSupabaseBrowserClient();

    // Get tasks for this execution
    const { data: tasks, error: tasksError } = await supabase
      .from("agent_tasks")
      .select("id")
      .eq("execution_id", executionId)
      .order("step_order", { ascending: true });

    if (tasksError || !tasks) {
      return null;
    }

    // Get introspection for each task
    const introspections = await Promise.all(
      tasks.map(task => getTaskIntrospection(task.id))
    );

    return introspections.filter((i): i is TaskIntrospection => i !== null);
  } catch (error) {
    console.error("Error fetching execution tasks introspection:", error);
    return null;
  }
}
