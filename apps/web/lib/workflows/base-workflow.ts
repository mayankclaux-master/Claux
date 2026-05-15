/**
 * Base Workflow Class
 * Abstract base class for all CLAUX agent workflows
 */

import { AgentRuntimeSDK } from '../runtime/sdk';
import { ExecutionConfig, TaskConfig } from '../runtime/types';
import { EventEmitter } from '../events/emitter';

export abstract class BaseWorkflow {
  protected sdk: AgentRuntimeSDK;
  protected eventEmitter: EventEmitter;
  protected executionId: string | null = null;

  constructor(sdk: AgentRuntimeSDK, eventEmitter: EventEmitter) {
    this.sdk = sdk;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Execute the workflow
   * This is the main entry point for the workflow
   */
  abstract execute(config: ExecutionConfig): Promise<void>;

  /**
   * Get the workflow type
   */
  abstract getWorkflowType(): string;

  /**
   * Get the agent name
   */
  abstract getAgentName(): string;

  /**
   * Initialize the execution
   */
  protected async initializeExecution(config: ExecutionConfig): Promise<void> {
    const execution = await this.sdk.startExecution(config);
    this.executionId = execution.id;
  }

  /**
   * Complete the execution
   */
  protected async completeExecution(success: boolean = true, errorMessage?: string): Promise<void> {
    if (this.executionId) {
      await this.sdk.completeExecution(success, errorMessage);
    }
  }

  /**
   * Execute a task with automatic error handling and retry
   */
  protected async executeTask(config: TaskConfig, taskFn: () => Promise<any>): Promise<any> {
    const task = await this.sdk.startTask(config);

    try {
      const startTime = Date.now();
      const result = await taskFn();
      const durationMs = Date.now() - startTime;

      await this.sdk.completeTask(task.id, result, durationMs);
      return result;
    } catch (error) {
      await this.sdk.failTask(task.id, error as Error);
      throw error;
    }
  }

  /**
   * Emit an event with execution context
   */
  protected async emitEvent(event: Omit<any, 'id' | 'created_at' | 'event_version'>): Promise<any> {
    if (this.executionId) {
      return this.eventEmitter.emitWithContext(event, this.executionId);
    }
    return this.eventEmitter.emit(event);
  }
}
