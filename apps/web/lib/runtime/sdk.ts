/**
 * CLAUX Agent Runtime SDK
 * Core SDK for all agents to use for execution, event emission, logging, and tracking
 */

import { AgentRuntimeDatabase } from './database';
import {
  AgentExecution,
  AgentTask,
  AgentEvent,
  AgentLog,
  ExecutionConfig,
  TaskConfig,
  EventConfig,
  LogConfig,
  CostTracking,
  ExecutionStatus,
  TaskStatus,
  LogLevel,
  ExecutionContext,
} from './types';
import {
  AgentExecutionError,
  TaskExecutionError,
  EventEmissionError,
  RetryExhaustedError,
  ValidationError,
  isRetryableError,
} from './errors';

export class AgentRuntimeSDK {
  private db: AgentRuntimeDatabase;
  private currentExecution: AgentExecution | null = null;
  private currentTasks: Map<string, AgentTask> = new Map();
  private currentEvents: AgentEvent[] = [];
  private costTracking: CostTracking = {
    total_cost: 0,
    total_tokens: 0,
    model_costs: {},
  };

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.db = new AgentRuntimeDatabase(supabaseUrl, supabaseKey);
  }

  /**
   * Execution Lifecycle
   */
  async startExecution(config: ExecutionConfig): Promise<AgentExecution> {
    try {
      this.currentExecution = await this.db.createExecution(config);
      
      await this.log({
        execution_id: this.currentExecution.id,
        log_level: LogLevel.INFO,
        message: `Execution started for agent ${config.agent_name}`,
        metadata: {
          agent_name: config.agent_name,
          workflow_type: config.workflow_type,
          execution_source: config.execution_source,
        },
      });

      // Update status to running
      this.currentExecution = await this.db.updateExecutionStatus(
        this.currentExecution.id,
        ExecutionStatus.RUNNING,
        { started_at: new Date() }
      );

      return this.currentExecution;
    } catch (error) {
      throw new AgentExecutionError(
        `Failed to start execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_START_FAILED',
        false,
        { config }
      );
    }
  }

  async completeExecution(
    success: boolean = true,
    errorMessage?: string
  ): Promise<AgentExecution> {
    if (!this.currentExecution) {
      throw new ValidationError('No active execution to complete');
    }

    try {
      const status: ExecutionStatus = success ? ExecutionStatus.COMPLETED : ExecutionStatus.FAILED;
      const additionalData: Partial<AgentExecution> = {
        completed_at: new Date(),
        total_cost: this.costTracking.total_cost,
        total_tokens: this.costTracking.total_tokens,
      };

      if (!success && errorMessage) {
        additionalData.failed_at = new Date();
        additionalData.error_message = errorMessage;
      }

      this.currentExecution = await this.db.updateExecutionStatus(
        this.currentExecution.id,
        status,
        additionalData
      );

      await this.log({
        execution_id: this.currentExecution.id,
        log_level: success ? LogLevel.INFO : LogLevel.ERROR,
        message: `Execution ${status}`,
        metadata: {
          status,
          total_cost: this.costTracking.total_cost,
          total_tokens: this.costTracking.total_tokens,
        },
      });

      return this.currentExecution;
    } catch (error) {
      throw new AgentExecutionError(
        `Failed to complete execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EXECUTION_COMPLETE_FAILED',
        false
      );
    }
  }

  async failExecution(error: Error): Promise<AgentExecution> {
    return this.completeExecution(false, error.message);
  }

  /**
   * Task Management
   */
  async startTask(config: TaskConfig): Promise<AgentTask> {
    if (!this.currentExecution) {
      throw new ValidationError('No active execution to create task');
    }

    try {
      const task = await this.db.createTask(this.currentExecution.id, config);
      this.currentTasks.set(task.id, task);

      // Update status to running
      task.status = TaskStatus.RUNNING;
      task.started_at = new Date();
      await this.db.updateTaskStatus(task.id, TaskStatus.RUNNING, {
        started_at: task.started_at,
      });

      await this.log({
        execution_id: this.currentExecution.id,
        task_id: task.id,
        log_level: LogLevel.INFO,
        message: `Task started: ${config.task_name}`,
        metadata: {
          task_name: config.task_name,
          task_type: config.task_type,
          step_order: config.step_order,
        },
      });

      return task;
    } catch (error) {
      throw new TaskExecutionError(
        `Failed to start task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        'TASK_START_FAILED',
        true
      );
    }
  }

  async completeTask(
    taskId: string,
    outputPayload: Record<string, any>,
    durationMs?: number
  ): Promise<AgentTask> {
    try {
      const task = await this.db.updateTaskStatus(taskId, TaskStatus.COMPLETED, {
        output_payload: outputPayload,
        completed_at: new Date(),
        duration_ms: durationMs,
      });

      this.currentTasks.set(taskId, task);

      await this.log({
        execution_id: this.currentExecution!.id,
        task_id: taskId,
        log_level: LogLevel.INFO,
        message: `Task completed: ${task.task_name}`,
        metadata: {
          task_name: task.task_name,
          duration_ms: durationMs,
        },
      });

      return task;
    } catch (error) {
      throw new TaskExecutionError(
        `Failed to complete task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        taskId,
        'TASK_COMPLETE_FAILED',
        false
      );
    }
  }

  async failTask(
    taskId: string,
    error: Error,
    errorPayload?: Record<string, any>
  ): Promise<AgentTask> {
    try {
      const task = await this.getTask(taskId);
      
      if (task.retry_count < task.max_retries && isRetryableError(error)) {
        // Increment retry and keep task in retrying state
        const updatedTask = await this.db.incrementTaskRetry(taskId);
        this.currentTasks.set(taskId, updatedTask);
        
        await this.log({
          execution_id: this.currentExecution!.id,
          task_id: taskId,
          log_level: LogLevel.WARN,
          message: `Task retry ${updatedTask.retry_count}/${updatedTask.max_retries}: ${task.task_name}`,
          metadata: {
            task_name: task.task_name,
            error: error.message,
            retry_count: updatedTask.retry_count,
          },
        });

        return updatedTask;
      } else {
        // Mark as failed
        const failedTask = await this.db.updateTaskStatus(taskId, TaskStatus.FAILED, {
          failed_at: new Date(),
          error_payload: {
            message: error.message,
            ...errorPayload,
          },
        });

        this.currentTasks.set(taskId, failedTask);

        await this.log({
          execution_id: this.currentExecution!.id,
          task_id: taskId,
          log_level: LogLevel.ERROR,
          message: `Task failed: ${task.task_name}`,
          metadata: {
            task_name: task.task_name,
            error: error.message,
            retry_count: task.retry_count,
          },
        });

        if (task.retry_count >= task.max_retries) {
          throw new RetryExhaustedError(
            `Task ${task.task_name} exhausted retries`,
            { task_id: taskId, task_name: task.task_name }
          );
        }

        return failedTask;
      }
    } catch (error) {
      if (error instanceof RetryExhaustedError) {
        throw error;
      }
      throw new TaskExecutionError(
        `Failed to fail task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        taskId,
        'TASK_FAIL_FAILED',
        false
      );
    }
  }

  async getTask(taskId: string): Promise<AgentTask> {
    const task = this.currentTasks.get(taskId);
    if (task) {
      return task;
    }

    const dbTask = await this.db.getTask(taskId);
    if (!dbTask) {
      throw new ValidationError(`Task not found: ${taskId}`);
    }

    this.currentTasks.set(taskId, dbTask);
    return dbTask;
  }

  /**
   * Event Emission
   */
  async emitEvent(config: EventConfig): Promise<AgentEvent> {
    try {
      // If execution_id is not provided, use current execution
      const executionId = config.execution_id || this.currentExecution?.id;
      
      const event = await this.db.createEvent({
        ...config,
        execution_id: executionId,
      });

      this.currentEvents.push(event);

      await this.log({
        execution_id: this.currentExecution!.id,
        log_level: LogLevel.INFO,
        message: `Event emitted: ${config.event_name}`,
        metadata: {
          event_name: config.event_name,
          event_source: config.event_source,
          correlation_id: config.correlation_id,
        },
      });

      return event;
    } catch (error) {
      throw new EventEmissionError(
        `Failed to emit event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'EVENT_EMIT_FAILED',
        { config }
      );
    }
  }

  /**
   * Logging
   */
  async log(config: LogConfig): Promise<AgentLog> {
    try {
      return await this.db.createLog(config);
    } catch (error) {
      // Log failures should not throw
      console.error('Failed to create log:', error);
      throw error;
    }
  }

  /**
   * Cost Tracking
   */
  trackCost(cost: number, tokens: number, model?: string): void {
    this.costTracking.total_cost += cost;
    this.costTracking.total_tokens += tokens;
    
    if (model) {
      this.costTracking.model_costs = this.costTracking.model_costs || {};
      this.costTracking.model_costs[model] = 
        (this.costTracking.model_costs[model] || 0) + cost;
    }
  }

  async persistCostTracking(): Promise<void> {
    if (!this.currentExecution) {
      throw new ValidationError('No active execution to persist costs');
    }

    await this.db.updateExecutionCost(
      this.currentExecution.id,
      this.costTracking.total_cost,
      this.costTracking.total_tokens
    );
  }

  /**
   * Context Access
   */
  getExecutionContext(): ExecutionContext {
    if (!this.currentExecution) {
      throw new ValidationError('No active execution');
    }

    return {
      execution: this.currentExecution,
      tasks: this.currentTasks,
      events: this.currentEvents,
      cost: this.costTracking,
    };
  }

  getCurrentExecution(): AgentExecution | null {
    return this.currentExecution;
  }

  getCostTracking(): CostTracking {
    return this.costTracking;
  }

  /**
   * Utility Methods
   */
  async getExecutionHistory(executionId: string): Promise<{
    execution: AgentExecution;
    tasks: AgentTask[];
    events: AgentEvent[];
    logs: AgentLog[];
  }> {
    const execution = await this.db.getExecution(executionId);
    if (!execution) {
      throw new ValidationError(`Execution not found: ${executionId}`);
    }

    const [tasks, events, logs] = await Promise.all([
      this.db.getTasksByExecution(executionId),
      this.db.getEventsByExecution(executionId),
      this.db.getLogsByExecution(executionId),
    ]);

    return { execution, tasks, events, logs };
  }
}
