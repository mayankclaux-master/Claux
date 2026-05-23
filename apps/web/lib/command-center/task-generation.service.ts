/**
 * CLAUX Phase 2B — Task Generation Service
 * Canonical service all agents use to generate human tasks
 * CENTRAL ENGINE of V1
 */

import { TaskRepository } from './task.repository';
import { TaskActivityRepository } from './task-activity.repository';
import type {
  CommandCenterTask,
  CommandCenterTaskInsert,
  AgentTaskGenerationPayload,
  TaskFilters,
  TaskQueryResult,
} from './types';

/**
 * Task Generation Service
 * Central engine for all agent task generation
 * All future agents pipe through this
 */
export class TaskGenerationService {
  private taskRepository: TaskRepository;
  private activityRepository: TaskActivityRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
    this.activityRepository = new TaskActivityRepository();
  }

  /**
   * Create a single task
   */
  async createTask(task: CommandCenterTaskInsert): Promise<CommandCenterTask> {
    const createdTask = await this.taskRepository.createTask(task);

    // Log creation activity
    await this.activityRepository.createActivityLog({
      tenant_id: task.tenant_id,
      task_id: createdTask.id,
      action_type: 'created',
      metadata: {
        agent_name: task.agent_name,
        task_type: task.task_type,
      },
    });

    return createdTask;
  }

  /**
   * Bulk create tasks from agent payload
   * This is the primary method agents use to generate tasks
   */
  async bulkCreateTasks(payload: AgentTaskGenerationPayload): Promise<CommandCenterTask[]> {
    const tasksToInsert: CommandCenterTaskInsert[] = payload.tasks.map(task => ({
      tenant_id: payload.tenant_id,
      client_id: payload.client_id,
      agent_name: payload.agent_name,
      source_execution_id: payload.source_execution_id,
      source_task_id: payload.source_task_id,
      ...task,
    }));

    const createdTasks = await this.taskRepository.bulkCreateTasks(tasksToInsert);

    // Log creation activities
    for (const task of createdTasks) {
      await this.activityRepository.createActivityLog({
        tenant_id: payload.tenant_id,
        task_id: task.id,
        action_type: 'created',
        metadata: {
          agent_name: payload.agent_name,
          task_type: task.task_type,
        },
      });
    }

    return createdTasks;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, tenantId: string, actorId?: string): Promise<CommandCenterTask> {
    const completedTask = await this.taskRepository.completeTask(taskId, tenantId);

    // Log completion activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'completed',
      actor_id: actorId,
      metadata: {
        completed_at: completedTask.completed_at,
      },
    });

    return completedTask;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    taskId: string,
    tenantId: string,
    status: CommandCenterTaskInsert['status'],
    actorId?: string
  ): Promise<CommandCenterTask> {
    const updatedTask = await this.taskRepository.updateTaskStatus(taskId, tenantId, status);

    // Log status change activity
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: 'updated',
      actor_id: actorId,
      notes: `Status changed to ${status}`,
      metadata: {
        old_status: updatedTask.status,
        new_status: status,
      },
    });

    return updatedTask;
  }

  /**
   * Add task activity
   */
  async addTaskActivity(
    taskId: string,
    tenantId: string,
    actionType: string,
    actorId?: string,
    notes?: string
  ): Promise<void> {
    await this.activityRepository.createActivityLog({
      tenant_id: tenantId,
      task_id: taskId,
      action_type: actionType as any,
      actor_id: actorId,
      notes,
    });
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
   * Get task statistics
   */
  async getTaskStatistics(tenantId: string) {
    return this.taskRepository.getTaskStatistics(tenantId);
  }
}
