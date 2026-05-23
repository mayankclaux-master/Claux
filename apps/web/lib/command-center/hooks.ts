/**
 * CLAUX Phase 3A — Dashboard Integration Hooks
 * React hooks for Command Centre task operations
 * Used by employee dashboard, client dashboard, and runtime feeds
 */

import { useState, useCallback } from 'react';
import type { TaskFilters, CommandCenterTask, TaskQueryResult } from './types';

/**
 * Use Tasks Hook
 * Fetch and manage tenant tasks
 */
export function useTasks(tenantId: string) {
  const [tasks, setTasks] = useState<CommandCenterTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchTasks = useCallback(async (filters?: TaskFilters, page = 1, pageSize = 50) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      if (filters?.agent_name) params.set('agent_name', filters.agent_name);
      if (filters?.task_type) params.set('task_type', filters.task_type);
      if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to);
      if (filters?.client_id) params.set('client_id', filters.client_id);
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());

      const response = await fetch(`/api/command-center/tasks?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  return { tasks, loading, error, total, fetchTasks };
}

/**
 * Use Task Hook
 * Fetch and manage single task
 */
export function useTask(tenantId: string) {
  const [task, setTask] = useState<CommandCenterTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch task');
      }

      setTask(data.task || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch task');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task status');
      }

      setTask(data.task || null);
      return data.task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const completeTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/command-center/tasks/${taskId}/complete`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to complete task');
      }

      setTask(data.task || null);
      return data.task;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  return { task, loading, error, fetchTask, updateTaskStatus, completeTask };
}

/**
 * Use Priority Queue Hook
 * Fetch tasks sorted by priority
 */
export function usePriorityQueue(tenantId: string) {
  const [tasks, setTasks] = useState<CommandCenterTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriorityQueue = useCallback(async (filters?: TaskFilters, limit = 50) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.priority) params.set('priority', filters.priority);
      if (filters?.agent_name) params.set('agent_name', filters.agent_name);
      if (filters?.task_type) params.set('task_type', filters.task_type);
      if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to);
      if (filters?.client_id) params.set('client_id', filters.client_id);
      params.set('limit', limit.toString());

      const response = await fetch(`/api/command-center/queue?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch priority queue');
      }

      setTasks(data.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch priority queue');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  return { tasks, loading, error, fetchPriorityQueue };
}

/**
 * Use Task Statistics Hook
 * Fetch task statistics for tenant
 */
export function useTaskStatistics(tenantId: string) {
  const [stats, setStats] = useState<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    blocked: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/command-center/tasks?tenant_id=${tenantId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch statistics');
      }

      // Calculate statistics from tasks
      const tasks = data.tasks || [];
      setStats({
        total: tasks.length,
        pending: tasks.filter((t: CommandCenterTask) => t.status === 'pending').length,
        in_progress: tasks.filter((t: CommandCenterTask) => t.status === 'in_progress').length,
        completed: tasks.filter((t: CommandCenterTask) => t.status === 'completed').length,
        blocked: tasks.filter((t: CommandCenterTask) => t.status === 'blocked').length,
        critical: tasks.filter((t: CommandCenterTask) => t.priority === 'critical').length,
        high: tasks.filter((t: CommandCenterTask) => t.priority === 'high').length,
        medium: tasks.filter((t: CommandCenterTask) => t.priority === 'medium').length,
        low: tasks.filter((t: CommandCenterTask) => t.priority === 'low').length,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  return { stats, loading, error, fetchStatistics };
}
