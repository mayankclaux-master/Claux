/**
 * CLAUX Phase 3A — Task Service
 * Canonical task service with status lifecycle validation
 * All operations tenant-isolated
 */

import { TaskRepository } from './task.repository';
import { TaskActivityRepository } from './task-activity.repository';
import { PriorityEngine } from './priority-engine';
import type {
  CommandCenterTask,
  CommandCenterTaskInsert,
  CommandCenterTaskUpdate,
  TaskFilters,
  TaskQueryResult,
  TaskStatus,
  TaskPriority,
} from './types';

/**
 * Valid status transitions
 */
const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'blocked', 'cancelled'],
  blocked: ['in_progress', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Task Service
 * Central service for all task operations
 */
export class TaskService {
  private taskRepository: TaskRepository;
  private activityRepository: TaskActivityRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.activityRepository = new TaskActivityRepository();
  }

  /**
   * Create a single task
   */
  async createTask(task: CommandCenterTaskInsert, actorId?: string): Promise<CommandCenterTask> {
    const createdTask = await this.taskRepository.createTask(task);

    // Log creation activity
    await this.activityRepository.createActivityLog({
      tenant_id: task.tenant_id,
      task_id: createdTask.id,
      action_type: 'created',
      actor_id: actorId,
      notes: 'Task created',
      metadata: {
        agent_name: task.agent_name,
        task_type: task.task_type,
        priority: task.priority,
      },
    });

    return createdTask;
  }

  /**
   * Bulk create tasks
   */
  async createBulkTasks(tasks: CommandCenterTaskInsert[], actorId?: string): Promise<CommandCenterTask[]> {
    const createdTasks = await this.taskRepository.bulkCreateTasks(tasks);

    // Log creation activities
    for (const task of createdTasks) {
      await this.activityRepository.createActivityLog({
        tenant_id: task.tenant_id,
        task_id: task.id,
        action_type: 'created',
        actor_id: actorId,
        notes: 'Task created',
        metadata: {
          agent_name: task.agent_name,
          task_type: task.task_type,
          priority: task.priority,
        },
      });
    }

    return createdTasks;
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string, tenantId: string): Promise<CommandCenterTask | null> {
    return this.taskRepository.getTaskById(taskId, tenantId);
  }

  /**
   * Get tenant tasks with filters and pagination
   */
  async getTenantTasks(
    tenantId: string,
    filters?: TaskFilters,
    page = 1,
    pageSize = 50
  ): Promise<TaskQueryResult> {
    return this.taskRepository.getTenantTasks(tenantId, filters, page, pageSize);
  }

  /**
   * Get client tasks
   */
  async getClientTasks(
    tenantId: string,
    clientId: string,
    filters?: TaskFilters
  ): Promise<CommandCenterTask[]> {
    return this.taskRepository.getClientTasks(tenantId, clientId, filters);
  }

  /**
   * Update task
   */
  async updateTask(
    taskId: string,
    tenantId: string,
    updates: CommandCenterTaskUpdate,
    actorId?: string
  ): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.updateTask(taskId, tenantId, updates);

    // Log update activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'updated',
      actor_id: actorId,
      notes: 'Task updated',
      metadata: updates as Record<string, unknown>,
    });

    return updatedTask;
  }

  /**
   * Update task status with lifecycle validation
   */
  async updateTaskStatus(
    taskId: string,
    tenantId: string,
    newStatus: TaskStatus,
    actorId?: string
  ): Promise<CommandCenterTask> {
    // Get current task
    const currentTask = await this.taskRepository.getTaskById(taskId, tenantId);
    if (!currentTask) {
      throw new Error('Task not found');
    }

    // Validate transition
    const validTransitions = VALID_TRANSITIONS[currentTask.status];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition: ${currentTask.status} -> ${newStatus}. Valid transitions: ${validTransitions.join(', ')}`
      );
    }

    // Update status
    const updatedTask = await this.taskRepository.updateTaskStatus(taskId, tenantId, newStatus);

    // Log status change activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: newStatus === 'in_progress' ? 'started' : 'updated',
      actor_id: actorId,
      notes: `Status changed to ${newStatus}`,
      metadata: {
        old_status: currentTask.status,
        new_status: newStatus,
      },
    });

    return updatedTask;
  }

  /**
   * Assign task to user
   */
  async assignTask(
    taskId: string,
    tenantId: string,
    assignedTo: string,
    actorId?: string
  ): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.updateTask(taskId, tenantId, {
      assigned_to: assignedTo,
    });

    // Log assignment activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'assigned',
      actor_id: actorId,
      notes: `Assigned to user ${assignedTo}`,
      metadata: {
        assigned_to: assignedTo,
      },
    });

    return updatedTask;
  }

  /**
   * Complete task
   */
  async completeTask(taskId: string, tenantId: string, actorId?: string): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.completeTask(taskId, tenantId);

    // Log completion activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'completed',
      actor_id: actorId,
      notes: 'Task completed',
      metadata: {
        completed_at: updatedTask.completed_at,
      },
    });

    return updatedTask;
  }

  /**
   * Block task
   */
  async blockTask(taskId: string, tenantId: string, reason?: string, actorId?: string): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.updateTaskStatus(taskId, tenantId, 'blocked');

    // Log blocked activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'blocked',
      actor_id: actorId,
      notes: reason || 'Task blocked',
      metadata: {
        reason,
      },
    });

    return updatedTask;
  }

  /**
   * Cancel task
   */
  async cancelTask(taskId: string, tenantId: string, reason?: string, actorId?: string): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.updateTaskStatus(taskId, tenantId, 'cancelled');

    // Log cancellation activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'cancelled',
      actor_id: actorId,
      notes: reason || 'Task cancelled',
      metadata: {
        reason,
      },
    });

    return updatedTask;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string, tenantId: string, actorId?: string): Promise<void> {
    await this.taskRepository.deleteTask(taskId, tenantId);

    // Log deletion activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'updated',
      actor_id: actorId,
      notes: 'Task deleted',
      metadata: {
        deleted: true,
      },
    });
  }

  /**
   * Get priority queue (tasks sorted by priority)
   */
  async getPriorityQueue(
    tenantId: string,
    filters?: TaskFilters,
    limit = 50
  ): Promise<CommandCenterTask[]> {
    const result = await this.taskRepository.getTenantTasks(tenantId, filters, 1, limit);
    return PriorityEngine.sortByPriority(result.tasks);
  }

  /**
   * Get task statistics
   */
  async getTaskStatistics(tenantId: string) {
    return this.taskRepository.getTaskStatistics(tenantId);
  }

  /**
   * Validate status transition
   */
  static isValidStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
    return VALID_TRANSITIONS[from].includes(to);
  }
}
