/**
 * CLAUX Phase 2B — Client Activity Feed Service
 * Generate clean activity feed from canonical DB-driven events
 * Powers client dashboard feed and "agents working continuously" perception
 * DO NOT fake data - ONLY canonical DB-driven events
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ActivityFeedEvent } from '@/lib/command-center/types';

/**
 * Client Activity Feed Service
 * Generates activity feed from agent executions, tasks, and completions
 */
export class ClientActivityFeedService {
  private supabase = createSupabaseBrowserClient();

  /**
   * Get tenant activity feed
   * Combines agent executions, task creations, and task completions
   */
  async getTenantActivityFeed(tenantId: string, limit = 50): Promise<ActivityFeedEvent[]> {
    const events: ActivityFeedEvent[] = [];

    // Get recent agent executions
    const { data: executions } = await this.supabase
      .from('agent_executions')
      .select('id, agent_name, created_at, status')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (executions) {
      for (const exec of executions) {
        events.push({
          id: `exec-${exec.id}`,
          type: 'agent_execution',
          tenant_id: tenantId,
          title: `${exec.agent_name} Execution`,
          description: `Agent execution ${exec.status}`,
          metadata: {
            agent_name: exec.agent_name,
            status: exec.status,
          },
          created_at: exec.created_at,
        });
      }
    }

    // Get recent task creations
    const { data: tasks } = await this.supabase
      .from('command_center_tasks')
      .select('id, agent_name, task_type, title, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (tasks) {
      for (const task of tasks) {
        events.push({
          id: `task-${task.id}`,
          type: 'task_created',
          tenant_id: tenantId,
          title: `New Task: ${task.title}`,
          description: `${task.agent_name} generated ${task.task_type} task`,
          metadata: {
            agent_name: task.agent_name,
            task_type: task.task_type,
            task_id: task.id,
          },
          created_at: task.created_at,
        });
      }
    }

    // Get recent task completions
    const { data: completedTasks } = await this.supabase
      .from('command_center_tasks')
      .select('id, title, completed_at, created_at')
      .eq('tenant_id', tenantId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(20);

    if (completedTasks) {
      for (const task of completedTasks) {
        events.push({
          id: `completed-${task.id}`,
          type: 'task_completed',
          tenant_id: tenantId,
          title: `Task Completed: ${task.title}`,
          description: 'Task marked as completed',
          metadata: {
            task_id: task.id,
          },
          created_at: task.completed_at || task.created_at,
        });
      }
    }

    // Sort by created_at descending and limit
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return events.slice(0, limit);
  }

  /**
   * Get client activity feed
   */
  async getClientActivityFeed(tenantId: string, clientId: string, limit = 50): Promise<ActivityFeedEvent[]> {
    const events: ActivityFeedEvent[] = [];

    // Get recent task creations for client
    const { data: tasks } = await this.supabase
      .from('command_center_tasks')
      .select('id, agent_name, task_type, title, created_at')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (tasks) {
      for (const task of tasks) {
        events.push({
          id: `task-${task.id}`,
          type: 'task_created',
          tenant_id: tenantId,
          title: `New Task: ${task.title}`,
          description: `${task.agent_name} generated ${task.task_type} task`,
          metadata: {
            agent_name: task.agent_name,
            task_type: task.task_type,
            task_id: task.id,
          },
          created_at: task.created_at,
        });
      }
    }

    // Get recent task completions for client
    const { data: completedTasks } = await this.supabase
      .from('command_center_tasks')
      .select('id, title, completed_at, created_at')
      .eq('tenant_id', tenantId)
      .eq('client_id', clientId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(30);

    if (completedTasks) {
      for (const task of completedTasks) {
        events.push({
          id: `completed-${task.id}`,
          type: 'task_completed',
          tenant_id: tenantId,
          title: `Task Completed: ${task.title}`,
          description: 'Task marked as completed',
          metadata: {
            task_id: task.id,
          },
          created_at: task.completed_at || task.created_at,
        });
      }
    }

    // Sort by created_at descending and limit
    events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return events.slice(0, limit);
  }
}
