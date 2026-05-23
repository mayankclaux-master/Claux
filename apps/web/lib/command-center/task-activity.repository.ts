/**
 * CLAUX Phase 2B — Task Activity Repository
 * Canonical repository for task activity logs
 * Tenant-safe queries only
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  TaskActivityLog,
  TaskActivityLogInsert,
} from './types';

/**
 * Task Activity Repository
 * Handles all task activity log operations with tenant isolation
 */
export class TaskActivityRepository {
  private supabase = createSupabaseBrowserClient();

  /**
   * Create a new activity log
   */
  async createActivityLog(activity: TaskActivityLogInsert): Promise<TaskActivityLog> {
    const { data, error } = await this.supabase
      .from('task_activity_logs')
      .insert({
        ...activity,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create activity log: ${error.message}`);
    }

    return data as TaskActivityLog;
  }

  /**
   * Get activity logs for a task
   */
  async getTaskActivityLogs(taskId: string, tenantId: string): Promise<TaskActivityLog[]> {
    const { data, error } = await this.supabase
      .from('task_activity_logs')
      .select()
      .eq('task_id', taskId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get task activity logs: ${error.message}`);
    }

    return data as TaskActivityLog[];
  }

  /**
   * Get recent activity logs for tenant
   */
  async getTenantActivityLogs(
    tenantId: string,
    limit = 50
  ): Promise<TaskActivityLog[]> {
    const { data, error } = await this.supabase
      .from('task_activity_logs')
      .select()
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get tenant activity logs: ${error.message}`);
    }

    return data as TaskActivityLog[];
  }

  /**
   * Get activity logs by action type
   */
  async getActivityLogsByActionType(
    tenantId: string,
    actionType: string,
    limit = 50
  ): Promise<TaskActivityLog[]> {
    const { data, error } = await this.supabase
      .from('task_activity_logs')
      .select()
      .eq('tenant_id', tenantId)
      .eq('action_type', actionType)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get activity logs by action type: ${error.message}`);
    }

    return data as TaskActivityLog[];
  }
}
