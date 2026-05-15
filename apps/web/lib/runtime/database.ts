/**
 * Agent Runtime Database Client
 * Handles all database operations for the runtime system
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AgentExecution,
  AgentTask,
  AgentEvent,
  AgentLog,
  ExecutionConfig,
  TaskConfig,
  EventConfig,
  LogConfig,
  ExecutionStatus,
  TaskStatus,
} from './types';

export class AgentRuntimeDatabase {
  private client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Execution Operations
   */
  async createExecution(config: ExecutionConfig): Promise<AgentExecution> {
    const { data, error } = await this.client
      .from('agent_executions')
      .insert({
        tenant_id: config.tenant_id,
        agent_name: config.agent_name,
        workflow_type: config.workflow_type,
        execution_source: config.execution_source || 'manual',
        initiated_by: config.initiated_by,
        max_retries: config.max_retries || 3,
        metadata: config.metadata || {},
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create execution: ${error.message}`);
    }

    return data as AgentExecution;
  }

  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    additionalData?: Partial<AgentExecution>
  ): Promise<AgentExecution> {
    const { data, error } = await this.client
      .from('agent_executions')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update execution status: ${error.message}`);
    }

    return data as AgentExecution;
  }

  async getExecution(executionId: string): Promise<AgentExecution | null> {
    const { data, error } = await this.client
      .from('agent_executions')
      .select()
      .eq('id', executionId)
      .single();

    if (error) {
      return null;
    }

    return data as AgentExecution;
  }

  async incrementExecutionRetry(executionId: string): Promise<AgentExecution> {
    const execution = await this.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    return this.updateExecutionStatus(executionId, ExecutionStatus.RETRYING, {
      retry_count: execution.retry_count + 1,
    });
  }

  async updateExecutionCost(
    executionId: string,
    cost: number,
    tokens: number
  ): Promise<AgentExecution> {
    const execution = await this.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const { data, error } = await this.client
      .from('agent_executions')
      .update({
        total_cost: execution.total_cost + cost,
        total_tokens: execution.total_tokens + tokens,
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update execution cost: ${error.message}`);
    }

    return data as AgentExecution;
  }

  /**
   * Task Operations
   */
  async createTask(
    executionId: string,
    config: TaskConfig
  ): Promise<AgentTask> {
    const { data, error } = await this.client
      .from('agent_tasks')
      .insert({
        execution_id: executionId,
        task_name: config.task_name,
        task_type: config.task_type,
        input_payload: config.input_payload,
        step_order: config.step_order,
        max_retries: config.max_retries || 3,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data as AgentTask;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    additionalData?: Partial<AgentTask>
  ): Promise<AgentTask> {
    const { data, error } = await this.client
      .from('agent_tasks')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task status: ${error.message}`);
    }

    return data as AgentTask;
  }

  async getTask(taskId: string): Promise<AgentTask | null> {
    const { data, error } = await this.client
      .from('agent_tasks')
      .select()
      .eq('id', taskId)
      .single();

    if (error) {
      return null;
    }

    return data as AgentTask;
  }

  async getTasksByExecution(executionId: string): Promise<AgentTask[]> {
    const { data, error } = await this.client
      .from('agent_tasks')
      .select()
      .eq('execution_id', executionId)
      .order('step_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }

    return data as AgentTask[];
  }

  async incrementTaskRetry(taskId: string): Promise<AgentTask> {
    const task = await this.getTask(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return this.updateTaskStatus(taskId, TaskStatus.RETRYING, {
      retry_count: task.retry_count + 1,
    });
  }

  /**
   * Event Operations
   */
  async createEvent(config: EventConfig): Promise<AgentEvent> {
    const { data, error } = await this.client
      .from('agent_events')
      .insert({
        tenant_id: config.tenant_id,
        event_name: config.event_name,
        event_source: config.event_source,
        payload: config.payload,
        execution_id: config.execution_id,
        correlation_id: config.correlation_id,
        causation_id: config.causation_id,
        event_version: config.event_version || '1.0',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return data as AgentEvent;
  }

  async getEventsByExecution(executionId: string): Promise<AgentEvent[]> {
    const { data, error } = await this.client
      .from('agent_events')
      .select()
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return data as AgentEvent[];
  }

  async getEventsByTenant(tenantId: string, limit = 100): Promise<AgentEvent[]> {
    const { data, error } = await this.client
      .from('agent_events')
      .select()
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return data as AgentEvent[];
  }

  /**
   * Log Operations
   */
  async createLog(config: LogConfig): Promise<AgentLog> {
    const { data, error } = await this.client
      .from('agent_logs')
      .insert({
        execution_id: config.execution_id,
        task_id: config.task_id,
        log_level: config.log_level,
        message: config.message,
        metadata: config.metadata || {},
        context: config.context || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create log: ${error.message}`);
    }

    return data as AgentLog;
  }

  async getLogsByExecution(executionId: string): Promise<AgentLog[]> {
    const { data, error } = await this.client
      .from('agent_logs')
      .select()
      .eq('execution_id', executionId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }

    return data as AgentLog[];
  }

  async getErrorLogsByExecution(executionId: string): Promise<AgentLog[]> {
    const { data, error } = await this.client
      .from('agent_logs')
      .select()
      .eq('execution_id', executionId)
      .in('log_level', ['error', 'fatal'])
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get error logs: ${error.message}`);
    }

    return data as AgentLog[];
  }
}
