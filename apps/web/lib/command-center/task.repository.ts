/**
 * CLAUX Phase 2B — Task Repository
 * Canonical repository for command center tasks
 * Tenant-safe queries only
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  CommandCenterTask,
  CommandCenterTaskInsert,
  CommandCenterTaskUpdate,
  TaskFilters,
  TaskQueryResult,
} from './types';

/**
 * Task Repository
 * Handles all task CRUD operations with tenant isolation
 */
export class TaskRepository {
  private supabase = createSupabaseBrowserClient();

  /**
   * Create a new task
   */
  async createTask(task: CommandCenterTaskInsert): Promise<CommandCenterTask> {
    const { data, error } = await this.supabase
      .from('command_center_tasks')
      .insert({
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data as CommandCenterTask;
  }

  /**
   * Bulk create tasks
   */
  async bulkCreateTasks(tasks: CommandCenterTaskInsert[]): Promise<CommandCenterTask[]> {
    const tasksWithTimestamps = tasks.map(task => ({
      ...task,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await this.supabase
      .from('command_center_tasks')
      .insert(tasksWithTimestamps)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create tasks: ${error.message}`);
    }

    return data as CommandCenterTask[];
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string, tenantId: string): Promise<CommandCenterTask | null> {
    const { data, error } = await this.supabase
      .from('command_center_tasks')
      .select()
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get task: ${error.message}`);
    }

    return data as CommandCenterTask;
  }

  /**
   * Get tenant tasks with filters
   */
  async getTenantTasks(
    tenantId: string,
    filters?: TaskFilters,
    page = 1,
    pageSize = 50
  ): Promise<TaskQueryResult> {
    let query = this.supabase
      .from('command_center_tasks')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.agent_name) {
      query = query.eq('agent_name', filters.agent_name);
    }
    if (filters?.task_type) {
      query = query.eq('task_type', filters.task_type);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id);
    }
    if (filters?.due_before) {
      query = query.lte('due_at', filters.due_before);
    }
    if (filters?.due_after) {
      query = query.gte('due_at', filters.due_after);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to get tasks: ${error.message}`);
    }

    return {
      tasks: data as CommandCenterTask[],
      total: count || 0,
      page,
      page_size: pageSize,
    };
  }

  /**
   * Get client tasks
   */
  async getClientTasks(
    tenantId: string,
    clientId: string,
    filters?: TaskFilters
  ): Promise<CommandCenterTask[]> {
    let query = this.supabase
      .from('command_center_tasks')
      .select()
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get client tasks: ${error.message}`);
    }

    return data as CommandCenterTask[];
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    tenantId: string,
    updates: CommandCenterTaskUpdate
  ): Promise<CommandCenterTask> {
    const { data, error } = await this.supabase
      .from('command_center_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data as CommandCenterTask;
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, tenantId: string): Promise<CommandCenterTask> {
    return this.updateTask(taskId, tenantId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    tenantId: string,
    status: CommandCenterTaskUpdate['status']
  ): Promise<CommandCenterTask> {
    return this.updateTask(taskId, tenantId, { status });
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('command_center_tasks')
      .delete()
      .eq('id', taskId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  /**
   * Get task statistics for tenant
   */
  async getTaskStatistics(tenantId: string): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  }> {
    const { data, error } = await this.supabase
      .from('command_center_tasks')
      .select('status, priority')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to get task statistics: ${error.message}`);
    }

    const tasks = data as { status: string; priority: string }[];

    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      critical: tasks.filter(t => t.priority === 'critical').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };
  }
}
