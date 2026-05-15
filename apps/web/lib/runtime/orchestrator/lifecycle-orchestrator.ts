/**
 * Execution Orchestrator
 * 
 * Coordinates execution lifecycle using ExecutionService
 * Auto-publishes events and writes logs for lifecycle transitions
 */

import type { UUID, ISODateTime } from '../types';
import { ExecutionStatus, TaskStatus } from '../types';
import { RuntimeService } from '../services';
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
 * Lifecycle orchestrator
 * Coordinates cross-service lifecycle management
 */
export class LifecycleOrchestrator {
  private runtime: RuntimeService;
  private config: OrchestratorConfig;

  constructor(runtime: RuntimeService, config: OrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Initialize execution lifecycle
   */
  async initializeExecutionLifecycle(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('initializeExecutionLifecycle');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const result = await this.runtime.execution.startExecution(executionId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoLogging) {
      await this.runtime.log.writeLog({
        execution_id: executionId,
        log_level: 'info' as any,
        message: 'Execution lifecycle initialized',
        context: { orchestrator: true },
      });
    }

    return orchestratorResult;
  }

  /**
   * Finalize execution lifecycle
   */
  async finalizeExecutionLifecycle(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('finalizeExecutionLifecycle');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context);
    }

    const execution = executionResult.data;

    if (execution.status === ExecutionStatus.RUNNING) {
      await this.runtime.execution.completeExecution(executionId);
    }

    if (this.config.enableAutoLogging) {
      await this.runtime.log.writeLog({
        execution_id: executionId,
        log_level: 'info' as any,
        message: 'Execution lifecycle finalized',
        context: { orchestrator: true, finalStatus: execution.status },
      });
    }

    return {
      success: true,
      context,
    };
  }

  /**
   * Sync execution state
   */
  async syncExecutionState(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('syncExecutionState');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context);
    }

    const execution = executionResult.data;
    const tasksResult = await this.runtime.task.listExecutionTasks(executionId);

    if (!tasksResult.success) {
      return toOrchestratorResult(tasksResult, context);
    }

    const tasks = tasksResult.data;
    const completedTasks = tasks.filter((t: any) => t.status === TaskStatus.COMPLETED).length;
    const failedTasks = tasks.filter((t: any) => t.status === TaskStatus.FAILED).length;
    const totalTasks = tasks.length;

    // Sync execution state based on task states
    if (execution.status === ExecutionStatus.RUNNING && completedTasks === totalTasks) {
      await this.runtime.execution.completeExecution(executionId);
    }

    if (execution.status === ExecutionStatus.RUNNING && failedTasks > 0 && completedTasks + failedTasks === totalTasks) {
      await this.runtime.execution.failExecution(executionId, 'Tasks failed');
    }

    return {
      success: true,
      context,
    };
  }

  /**
   * Reconcile task states
   */
  async reconcileTaskStates(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('reconcileTaskStates');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const tasksResult = await this.runtime.task.listExecutionTasks(executionId);

    if (!tasksResult.success) {
      return toOrchestratorResult(tasksResult, context);
    }

    const tasks = tasksResult.data;
    let reconciledCount = 0;

    for (const task of tasks) {
      // Reconcile orphaned running tasks
      if ((task as any).status === TaskStatus.RUNNING && (task as any).started_at) {
        const startedAt = (task as any).started_at as string;
        const elapsed = Date.now() - new Date(startedAt).getTime();
        const timeout = this.config.stallDetectionTimeoutMs || 1800000; // 30 minutes default
        if (elapsed > timeout) {
          await this.runtime.task.failTask(task.id, { message: 'Task stalled - timeout exceeded' });
          reconciledCount++;
        }
      }
    }

    if (reconciledCount > 0 && this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, reconciledCount });
    }

    return {
      success: true,
      context,
    };
  }

  /**
   * Calculate execution health
   */
  async calculateExecutionHealth(executionId: UUID): Promise<OrchestratorResult<{
    readonly health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    readonly issues: readonly string[];
  }>> {
    const context = this.createContext('calculateExecutionHealth');

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context);
    }

    const execution = executionResult.data;
    const issues: string[] = [];

    // Check execution status
    if (execution.status === ExecutionStatus.FAILED) {
      issues.push('Execution failed');
    }

    if (execution.status === ExecutionStatus.CANCELLED) {
      issues.push('Execution cancelled');
    }

    // Check task states
    const tasksResult = await this.runtime.task.listExecutionTasks(executionId);

    if (tasksResult.success) {
      const tasks = tasksResult.data;
      const failedTasks = tasks.filter((t: any) => (t as any).status === TaskStatus.FAILED);
      const stalledTasks = tasks.filter((t: any) => {
        if ((t as any).status === TaskStatus.RUNNING && (t as any).started_at) {
          const elapsed = Date.now() - new Date((t as any).started_at).getTime();
          return elapsed > (this.config.stallDetectionTimeoutMs || 1800000);
        }
        return false;
      });

      if (failedTasks.length > 0) {
        issues.push(`${failedTasks.length} failed tasks`);
      }

      if (stalledTasks.length > 0) {
        issues.push(`${stalledTasks.length} stalled tasks`);
      }
    }

    let health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

    if (issues.length === 0) {
      health = 'healthy';
    } else if (execution.status === ExecutionStatus.FAILED) {
      health = 'unhealthy';
    } else if (execution.status === ExecutionStatus.CANCELLED) {
      health = 'degraded';
    } else {
      health = 'degraded';
    }

    return {
      success: true,
      data: { health, issues },
      context,
    };
  }

  /**
   * Detect stalled executions
   */
  async detectStalledExecutions(): Promise<OrchestratorResult<readonly UUID[]>> {
    const context = this.createContext('detectStalledExecutions');

    // Use listExecutions with status filter instead of fetchRunningExecutions
    const result = await this.runtime.execution.listExecutions({
      status: ExecutionStatus.RUNNING,
    });

    if (!result.success) {
      return toOrchestratorResult(result, context);
    }

    const executions = result.data;
    const stalledExecutions: UUID[] = [];
    const timeout = this.config.stallDetectionTimeoutMs || 3600000; // 1 hour default

    for (const execution of executions) {
      if ((execution as any).started_at) {
        const elapsed = Date.now() - new Date((execution as any).started_at).getTime();
        if (elapsed > timeout) {
          stalledExecutions.push(execution.id);
        }
      }
    }

    if (stalledExecutions.length > 0 && this.config.enableAutoLogging) {
      this.logOperation(context, { stalledExecutions });
    }

    return {
      success: true,
      data: stalledExecutions,
      context,
    };
  }

  /**

  if (issues.length === 0) {
    health = 'healthy';
  } else if (execution.status === ExecutionStatus.FAILED) {
    health = 'unhealthy';
  } else if (execution.status === ExecutionStatus.CANCELLED) {
    health = 'degraded';
  } else {
    health = 'degraded';
  }

  return {
    success: true,
    data: { health, issues },
    context,
  };
   */
  async recoverIncompleteExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('recoverIncompleteExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context);
    }

    const execution = executionResult.data;

    if (execution.status === ExecutionStatus.RUNNING) {
      // Check if execution is stalled
      if (execution.started_at) {
        const elapsed = Date.now() - new Date(execution.started_at).getTime();
        const timeout = this.config.stallDetectionTimeoutMs || 3600000;
        if (elapsed > timeout) {
          await this.runtime.execution.failExecution(executionId, 'Execution stalled - timeout exceeded');
        }
      }
    }

    // Reconcile task states
    await this.reconcileTaskStates(executionId);

    // Sync execution state
    await this.syncExecutionState(executionId);

    return {
      success: true,
      context,
    };
  }

  /**
   * Create orchestrator context
   */
  private createContext(operation: string): OrchestratorContext {
    return {
      tenantId: this.config.tenantId,
      orchestrator: 'LifecycleOrchestrator',
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
