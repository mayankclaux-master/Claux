/**
 * Task Orchestrator
 * 
 * Coordinates task lifecycle using TaskService
 * Auto-publishes events and writes logs for task transitions
 */

import type { UUID, ISODateTime } from '../types';
import { TaskStatus } from '../types';
import { RuntimeService } from '../services';
import { RuntimeEvents } from '../constants/events';
import {
  OrchestratorConfig,
  OrchestratorContext,
  TaskPlan,
  TaskLifecycleState,
  OrchestratorResult,
  createOrchestratorError,
  toOrchestratorResult,
  validateTaskDependencies,
  calculateTaskProgress,
} from './types';

/**
 * Task orchestrator
 * Coordinates task lifecycle with automatic event publishing and logging
 */
export class TaskOrchestrator {
  private runtime: RuntimeService;
  private config: OrchestratorConfig;

  constructor(runtime: RuntimeService, config: OrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Create task from plan
   */
  async createTask(executionId: UUID, plan: TaskPlan): Promise<OrchestratorResult<UUID>> {
    const context = this.createContext('createTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, plan });
    }

    const result = await this.runtime.task.createTask({
      execution_id: executionId,
      task_name: plan.taskName,
      task_type: plan.taskType,
      step_order: plan.stepOrder,
      input_payload: plan.inputPayload,
    });

    if (!result.success) {
      return toOrchestratorResult(result, context) as OrchestratorResult<UUID>;
    }

    const orchestratorResult = toOrchestratorResult({ success: true, data: result.data.id }, context) as OrchestratorResult<UUID>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.TASK_CREATED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: { taskId: orchestratorResult.data, plan },
      });
    }

    return orchestratorResult;
  }

  /**
   * Create task batch from plans
   */
  async createTaskBatch(
    executionId: UUID,
    plans: TaskPlan[]
  ): Promise<OrchestratorResult<UUID[]>> {
    const context = this.createContext('createTaskBatch');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, count: plans.length });
    }

    // Validate dependencies before batch creation
    for (const plan of plans) {
      const validation = validateTaskDependencies(plan, plans);
      if (!validation.valid) {
        return {
          success: false,
          error: createOrchestratorError(
            'DEPENDENCY_VALIDATION_FAILED',
            'Task dependency validation failed',
            { taskName: plan.taskName, errors: validation.errors },
            undefined,
            false
          ),
          context,
        };
      }
    }

    const tasksData = plans.map(plan => ({
      execution_id: executionId,
      task_name: plan.taskName,
      task_type: plan.taskType,
      step_order: plan.stepOrder,
      input_payload: plan.inputPayload,
    }));

    const result = await this.runtime.task.createTasksBatch(tasksData);

    if (!result.success) {
      return toOrchestratorResult(result, context) as OrchestratorResult<UUID[]>;
    }

    const orchestratorResult = toOrchestratorResult(
      { success: true, data: result.data.map(task => task.id) },
      context
    ) as OrchestratorResult<UUID[]>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEventsBatch(plans.map(plan => ({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.TASK_CREATED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: { taskName: plan.taskName },
      })));
    }

    return orchestratorResult;
  }

  /**
   * Start task
   */
  async startTask(taskId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('startTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId });
    }

    const result = await this.runtime.task.startTask(taskId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success) {
      const taskResult = await this.runtime.task.getTask(taskId);
      if (taskResult.success && this.config.enableAutoEvents) {
        await this.runtime.event.publishEvent({
          tenant_id: this.config.tenantId,
          execution_id: taskResult.data.execution_id,
          event_name: RuntimeEvents.TASK_STARTED,
          event_source: 'orchestrator',
          event_version: '1.0',
          payload: { taskId },
        });
      }
    }

    return orchestratorResult;
  }

  /**
   * Complete task
   */
  async completeTask(
    taskId: UUID,
    outputPayload?: Record<string, unknown>
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('completeTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId, outputPayload });
    }

    const result = await this.runtime.task.completeTask(taskId, outputPayload);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success) {
      const taskResult = await this.runtime.task.getTask(taskId);
      if (taskResult.success && this.config.enableAutoEvents) {
        await this.runtime.event.publishEvent({
          tenant_id: this.config.tenantId,
          execution_id: taskResult.data.execution_id,
          event_name: RuntimeEvents.TASK_COMPLETED,
          event_source: 'orchestrator',
          event_version: '1.0',
          payload: { taskId, outputPayload },
        });
      }

      if (taskResult.success && this.config.enableAutoLogging) {
        await this.runtime.log.writeLog({
          execution_id: taskResult.data.execution_id,
          task_id: taskId,
          log_level: 'info' as any,
          message: 'Task completed successfully',
          context: { orchestrator: true },
        });
      }
    }

    return orchestratorResult;
  }

  /**
   * Fail task
   */
  async failTask(
    taskId: UUID,
    errorPayload?: Record<string, unknown>
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('failTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId, errorPayload });
    }

    const result = await this.runtime.task.failTask(taskId, errorPayload);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success) {
      const taskResult = await this.runtime.task.getTask(taskId);
      if (taskResult.success && this.config.enableAutoEvents) {
        await this.runtime.event.publishEvent({
          tenant_id: this.config.tenantId,
          execution_id: taskResult.data.execution_id,
          event_name: RuntimeEvents.TASK_FAILED,
          event_source: 'orchestrator',
          event_version: '1.0',
          payload: { taskId, errorPayload },
        });
      }

      if (taskResult.success && this.config.enableAutoLogging) {
        await this.runtime.log.writeError(
          taskResult.data.execution_id,
          taskId,
          errorPayload?.message ? String(errorPayload.message) : 'Task failed',
          { orchestrator: true, errorPayload }
        );
      }
    }

    return orchestratorResult;
  }

  /**
   * Retry task
   */
  async retryTask(taskId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('retryTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId });
    }

    const result = await this.runtime.task.retryTask(taskId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success) {
      const taskResult = await this.runtime.task.getTask(taskId);
      if (taskResult.success && this.config.enableAutoEvents) {
        await this.runtime.event.publishEvent({
          tenant_id: this.config.tenantId,
          execution_id: taskResult.data.execution_id,
          event_name: RuntimeEvents.TASK_RETRIED,
          event_source: 'orchestrator',
          event_version: '1.0',
          payload: { taskId },
        });
      }
    }

    return orchestratorResult;
  }

  /**
   * Skip task
   */
  async skipTask(taskId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('skipTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId });
    }

    const result = await this.runtime.task.skipTask(taskId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success) {
      const taskResult = await this.runtime.task.getTask(taskId);
      if (taskResult.success && this.config.enableAutoEvents) {
        await this.runtime.event.publishEvent({
          tenant_id: this.config.tenantId,
          execution_id: taskResult.data.execution_id,
          event_name: RuntimeEvents.TASK_SKIPPED,
          event_source: 'orchestrator',
          event_version: '1.0',
          payload: { taskId },
        });
      }
    }

    return orchestratorResult;
  }

  /**
   * Get task state
   */
  async getTaskState(taskId: UUID): Promise<OrchestratorResult<TaskLifecycleState>> {
    const context = this.createContext('getTaskState');

    const result = await this.runtime.task.getTask(taskId);

    if (!result.success) {
      return toOrchestratorResult(result, context) as OrchestratorResult<TaskLifecycleState>;
    }

    const task = result.data;
    const dependenciesMet = await this.checkDependenciesMet(task);

    const state: TaskLifecycleState = {
      taskId: task.id,
      executionId: task.execution_id,
      status: task.status,
      startedAt: task.started_at || undefined,
      completedAt: task.completed_at || undefined,
      stepOrder: task.step_order,
      dependenciesMet,
      retryCount: task.retry_count,
      progress: calculateTaskProgress(task.status, task.started_at || undefined, task.completed_at || undefined),
    };

    return {
      success: true,
      data: state,
      context,
    };
  }

  /**
   * Get task progress
   */
  async getTaskProgress(taskId: UUID): Promise<OrchestratorResult<number>> {
    const stateResult = await this.getTaskState(taskId);

    if (!stateResult.success) {
      return {
        success: false,
        error: stateResult.error,
        context: stateResult.context,
      };
    }

    if (!stateResult.data) {
      return {
        success: false,
        error: createOrchestratorError('NO_STATE', 'Task state not found'),
        context: stateResult.context,
      };
    }

    return {
      success: true,
      data: stateResult.data.progress,
      context: stateResult.context,
    };
  }

  /**
   * Validate task lifecycle
   */
  async validateTaskLifecycle(taskId: UUID): Promise<OrchestratorResult<boolean>> {
    const context = this.createContext('validateTaskLifecycle');

    const stateResult = await this.getTaskState(taskId);

    if (!stateResult.success) {
      return {
        success: false,
        error: stateResult.error,
        context: stateResult.context,
      };
    }

    const state = stateResult.data;
    if (!state) {
      return {
        success: false,
        error: createOrchestratorError('NO_STATE', 'Task state not found'),
        context,
      };
    }

    const errors: string[] = [];

    // Check for stalled tasks
    if (state.status === TaskStatus.RUNNING && state.startedAt) {
      const elapsed = Date.now() - new Date(state.startedAt).getTime();
      const timeout = this.config.stallDetectionTimeoutMs || 1800000; // 30 minutes default
      if (elapsed > timeout) {
        errors.push('Task appears stalled (timeout exceeded)');
      }
    }

    // Check for inconsistent state
    if (state.status === TaskStatus.COMPLETED && !state.dependenciesMet) {
      errors.push('Task completed but dependencies not met');
    }

    if (state.status === TaskStatus.RUNNING && !state.dependenciesMet) {
      errors.push('Task running but dependencies not met');
    }

    const valid = errors.length === 0;

    if (!valid && this.config.enableAutoLogging) {
      this.logOperation(context, { taskId, errors });
    }

    return {
      success: true,
      data: valid,
      context,
      error: valid ? undefined : createOrchestratorError(
        'LIFECYCLE_VALIDATION_FAILED',
        'Task lifecycle validation failed',
        { errors },
        undefined,
        true
      ),
    };
  }

  /**
   * Validate task dependencies
   */
  async validateTaskDependencies(taskId: UUID): Promise<OrchestratorResult<boolean>> {
    const context = this.createContext('validateTaskDependencies');

    const result = await this.runtime.task.getTask(taskId);

    if (!result.success) {
      return toOrchestratorResult(result, context) as OrchestratorResult<boolean>;
    }

    const task = result.data;
    const tasksResult = await this.runtime.task.listExecutionTasks(task.execution_id);

    if (!tasksResult.success) {
      return toOrchestratorResult(tasksResult, context) as OrchestratorResult<boolean>;
    }

    const allTasks = tasksResult.data;
    const taskPlan: TaskPlan = {
      taskId: task.id,
      taskName: task.task_name,
      taskType: task.task_type,
      stepOrder: task.step_order,
      inputPayload: task.input_payload,
      dependencies: [],
    };

    const validation = validateTaskDependencies(taskPlan, allTasks.map((t: any) => ({
      taskId: t.id,
      taskName: t.task_name,
      taskType: t.task_type,
      stepOrder: t.step_order,
      inputPayload: t.input_payload,
      dependencies: [],
    })));

    return {
      success: true,
      data: validation.valid,
      context,
      error: validation.valid ? undefined : createOrchestratorError(
        'DEPENDENCY_VALIDATION_FAILED',
        'Task dependency validation failed',
        { errors: validation.errors },
        undefined,
        false
      ),
    };
  }

  /**
   * Check if task dependencies are met
   */
  private async checkDependenciesMet(task: any): Promise<boolean> {
    // In a real implementation, this would check if all dependencies are completed
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Create orchestrator context
   */
  private createContext(operation: string): OrchestratorContext {
    return {
      tenantId: this.config.tenantId,
      orchestrator: 'TaskOrchestrator',
      operation,
      timestamp: new Date().toISOString() as ISODateTime,
    };
  }

  /**
   * Log operation
   */
  private logOperation(context: OrchestratorContext, data: Record<string, unknown>): void {
    console.log(JSON.stringify({
      timestamp: context.timestamp,
      level: 'info',
      orchestrator: context.orchestrator,
      operation: context.operation,
      tenant_id: context.tenantId,
      ...data,
    }));
  }
}
