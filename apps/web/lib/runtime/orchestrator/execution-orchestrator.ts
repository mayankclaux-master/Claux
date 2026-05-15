/**
 * Execution Orchestrator
 * 
 * Coordinates execution lifecycle using ExecutionService
 * Auto-publishes events and writes logs for lifecycle transitions
 */

import type { UUID, ISODateTime } from '../types';
import { ExecutionStatus, TaskStatus } from '../types';
import { RuntimeService } from '../services';
import { RuntimeEvents } from '../constants/events';
import {
  OrchestratorConfig,
  OrchestratorContext,
  ExecutionPlan,
  ExecutionLifecycleState,
  OrchestratorResult,
  createOrchestratorError,
  toOrchestratorResult,
  calculateExecutionProgress,
} from './types';

/**
 * Execution orchestrator
 * Coordinates execution lifecycle with automatic event publishing and logging
 */
export class ExecutionOrchestrator {
  private runtime: RuntimeService;
  private config: OrchestratorConfig;

  constructor(runtime: RuntimeService, config: OrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Create execution from plan
   */
  async createExecution(plan: ExecutionPlan): Promise<OrchestratorResult<UUID>> {
    const context = this.createContext('createExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { plan });
    }

    const result = await this.runtime.execution.createExecution({
      agent_name: plan.agentName,
      workflow_type: plan.workflowType,
      metadata: { ...plan.metadata, input_payload: plan.inputPayload },
    });

    const orchestratorResult = toOrchestratorResult(result, context);

    if (!orchestratorResult.success || !orchestratorResult.data) {
      return { success: false, error: orchestratorResult.error, context: orchestratorResult.context };
    }

    if (this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: orchestratorResult.data.id,
        event_name: RuntimeEvents.EXECUTION_CREATED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: { plan },
      });
    }

    return { success: true, data: orchestratorResult.data.id, context: orchestratorResult.context };
  }

  /**
   * Start execution
   */
  async startExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('startExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.execution.startExecution(executionId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.EXECUTION_STARTED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: {},
      });
    }

    return orchestratorResult;
  }

  /**
   * Complete execution
   */
  async completeExecution(
    executionId: UUID,
    cost?: number,
    tokens?: number
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('completeExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, cost, tokens });
    }

    const result = await this.runtime.execution.completeExecution(executionId, cost, tokens);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.EXECUTION_COMPLETED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: { cost, tokens },
      });
    }

    return orchestratorResult;
  }

  /**
   * Fail execution
   */
  async failExecution(
    executionId: UUID,
    errorMessage: string
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('failExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, errorMessage });
    }

    const result = await this.runtime.execution.failExecution(executionId, errorMessage);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.EXECUTION_FAILED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: { errorMessage },
      });
    }

    if (orchestratorResult.success && this.config.enableAutoLogging) {
      await this.runtime.log.writeError(executionId, null, errorMessage, {
        orchestrator: true,
      });
    }

    return orchestratorResult;
  }

  /**
   * Cancel execution
   */
  async cancelExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('cancelExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.execution.cancelExecution(executionId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.EXECUTION_CANCELLED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: {},
      });
    }

    return orchestratorResult;
  }

  /**
   * Retry execution
   */
  async retryExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('retryExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.execution.retryExecution(executionId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoEvents) {
      await this.runtime.event.publishEvent({
        tenant_id: this.config.tenantId,
        execution_id: executionId,
        event_name: RuntimeEvents.EXECUTION_RETRIED,
        event_source: 'orchestrator',
        event_version: '1.0',
        payload: {},
      });
    }

    return orchestratorResult;
  }

  /**
   * Get execution state
   */
  async getExecutionState(executionId: UUID): Promise<OrchestratorResult<ExecutionLifecycleState>> {
    const context = this.createContext('getExecutionState');

    const result = await this.runtime.execution.getExecution(executionId);

    if (!result.success) {
      return toOrchestratorResult(result, context) as OrchestratorResult<ExecutionLifecycleState>;
    }

    const execution = result.data;
    const tasksResult = await this.runtime.task.listExecutionTasks(executionId);
    
    const taskCount = tasksResult.success ? tasksResult.data.length : 0;
    const completedTasks = tasksResult.success ? tasksResult.data.filter((t: any) => t.status === TaskStatus.COMPLETED).length : 0;
    const failedTasks = tasksResult.success ? tasksResult.data.filter((t: any) => t.status === TaskStatus.FAILED).length : 0;

    const progress = calculateExecutionProgress(taskCount, completedTasks, failedTasks);
    const health = this.calculateHealth(execution.status, progress, failedTasks);

    const state: ExecutionLifecycleState = {
      executionId: execution.id,
      status: execution.status,
      startedAt: execution.started_at ?? undefined,
      completedAt: execution.completed_at ?? undefined,
      taskCount,
      completedTasks,
      failedTasks,
      progress,
      health,
    };

    return {
      success: true,
      data: state,
      context,
    };
  }

  /**
   * Get execution progress
   */
  async getExecutionProgress(executionId: UUID): Promise<OrchestratorResult<number>> {
    const stateResult = await this.getExecutionState(executionId);

    if (!stateResult.success) {
      return stateResult as unknown as OrchestratorResult<number>;
    }

    return {
      success: true,
      data: stateResult.data?.progress ?? 0,
      context: stateResult.context,
    };
  }

  /**
   * Validate execution lifecycle
   */
  async validateExecutionLifecycle(executionId: UUID): Promise<OrchestratorResult<boolean>> {
    const context = this.createContext('validateExecutionLifecycle');

    const stateResult = await this.getExecutionState(executionId);

    if (!stateResult.success) {
      return stateResult as unknown as OrchestratorResult<boolean>;
    }

    const state = stateResult.data;
    const errors: string[] = [];

    if (!state) {
      return {
        success: false,
        error: { code: 'STATE_NOT_FOUND', message: 'Execution state not found', recoverable: false },
        context,
      };
    }

    // Check for stalled executions
    if (state.status === ExecutionStatus.RUNNING && state.startedAt) {
      const elapsed = Date.now() - new Date(state.startedAt).getTime();
      const timeout = this.config.stallDetectionTimeoutMs || 3600000; // 1 hour default
      if (elapsed > timeout) {
        errors.push('Execution appears stalled (timeout exceeded)');
      }
    }

    // Check for inconsistent state
    if (state.status === ExecutionStatus.COMPLETED && state.progress < 100) {
      errors.push('Execution completed but progress is incomplete');
    }

    if (state.status === ExecutionStatus.FAILED && state.failedTasks === 0) {
      errors.push('Execution failed but no failed tasks detected');
    }

    const valid = errors.length === 0;

    if (!valid && this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, errors });
    }

    return {
      success: true,
      data: valid,
      context,
      error: valid ? undefined : createOrchestratorError(
        'LIFECYCLE_VALIDATION_FAILED',
        'Execution lifecycle validation failed',
        { errors },
        undefined,
        true
      ),
    };
  }

  /**
   * Calculate execution health
   */
  private calculateHealth(
    status: ExecutionStatus,
    progress: number,
    failedTasks: number
  ): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    if (status === ExecutionStatus.COMPLETED && progress === 100) {
      return 'healthy';
    }

    if (status === ExecutionStatus.FAILED) {
      return 'unhealthy';
    }

    if (status === ExecutionStatus.CANCELLED) {
      return 'degraded';
    }

    if (status === ExecutionStatus.RUNNING && failedTasks > 0) {
      return 'degraded';
    }

    if (status === ExecutionStatus.RUNNING && progress > 50) {
      return 'healthy';
    }

    if (status === ExecutionStatus.RUNNING) {
      return 'degraded';
    }

    return 'unknown';
  }

  /**
   * Create orchestrator context
   */
  private createContext(operation: string): OrchestratorContext {
    return {
      tenantId: this.config.tenantId,
      orchestrator: 'ExecutionOrchestrator',
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
