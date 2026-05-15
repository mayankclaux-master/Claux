/**
 * Recovery Orchestrator
 * 
 * Recovery workflows and failure handling
 * Safe retries, state reconciliation, and orphan cleanup
 */

import type { UUID, ISODateTime } from '../types';
import { ExecutionStatus, TaskStatus } from '../types';
import { RuntimeService } from '../services';
import {
  OrchestratorConfig,
  OrchestratorContext,
  RecoveryStrategy,
  OrchestratorResult,
  createOrchestratorError,
  toOrchestratorResult,
} from './types';

/**
 * Recovery orchestrator
 * Manages recovery workflows and failure handling
 */
export class RecoveryOrchestrator {
  private runtime: RuntimeService;
  private config: OrchestratorConfig;

  constructor(runtime: RuntimeService, config: OrchestratorConfig) {
    this.runtime = runtime;
    this.config = config;
  }

  /**
   * Recover execution
   */
  async recoverExecution(
    executionId: UUID,
    strategy: RecoveryStrategy
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('recoverExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId, strategy });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context) as OrchestratorResult<void>;
    }

    const execution = executionResult.data;

    if (!this.config.enableRecovery) {
      return {
        success: false,
        error: createOrchestratorError(
          'RECOVERY_DISABLED',
          'Recovery is disabled in configuration',
          { executionId },
          undefined,
          false
        ),
        context,
      };
    }

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        if (execution.status === ExecutionStatus.FAILED) {
          const result = await this.retryFailedExecution(executionId);
          return result;
        }
        break;

      case RecoveryStrategy.SKIP:
        if (execution.status === ExecutionStatus.FAILED) {
          await this.runtime.execution.cancelExecution(executionId);
        }
        break;

      case RecoveryStrategy.ABORT:
        await this.runtime.execution.cancelExecution(executionId);
        break;

      case RecoveryStrategy.MANUAL:
        // Manual recovery - no action
        break;
    }

    return {
      success: true,
      context,
    };
  }

  /**
   * Recover task
   */
  async recoverTask(
    taskId: UUID,
    strategy: RecoveryStrategy
  ): Promise<OrchestratorResult<void>> {
    const context = this.createContext('recoverTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId, strategy });
    }

    const taskResult = await this.runtime.task.getTask(taskId);

    if (!taskResult.success) {
      return toOrchestratorResult(taskResult, context) as OrchestratorResult<void>;
    }

    const task = taskResult.data;

    if (!this.config.enableRecovery) {
      return {
        success: false,
        error: createOrchestratorError(
          'RECOVERY_DISABLED',
          'Recovery is disabled in configuration',
          { taskId },
          undefined,
          false
        ),
        context,
      };
    }

    switch (strategy) {
      case RecoveryStrategy.RETRY:
        if (task.status === TaskStatus.FAILED) {
          const result = await this.retryFailedTask(taskId);
          return result;
        }
        break;

      case RecoveryStrategy.SKIP:
        if (task.status === TaskStatus.FAILED || task.status === TaskStatus.PENDING) {
          await this.runtime.task.skipTask(taskId);
        }
        break;

      case RecoveryStrategy.ABORT:
        // Cancel parent execution
        await this.runtime.execution.cancelExecution(task.execution_id);
        break;

      case RecoveryStrategy.MANUAL:
        // Manual recovery - no action
        break;
    }

    return {
      success: true,
      context,
    };
  }

  /**
   * Retry failed execution
   */
  async retryFailedExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('retryFailedExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context) as OrchestratorResult<void>;
    }

    const execution = executionResult.data;

    if (execution.status !== ExecutionStatus.FAILED) {
      return {
        success: false,
        error: createOrchestratorError(
          'INVALID_STATE',
          'Execution is not in FAILED state',
          { executionId, status: execution.status },
          undefined,
          false
        ),
        context,
      };
    }

    if (execution.retry_count >= (this.config.maxExecutionRetries || 3)) {
      return {
        success: false,
        error: createOrchestratorError(
          'MAX_RETRIES_EXCEEDED',
          'Maximum retry count exceeded',
          { executionId, retryCount: execution.retry_count },
          undefined,
          false,
          RecoveryStrategy.MANUAL
        ),
        context,
      };
    }

    const result = await this.runtime.execution.retryExecution(executionId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoLogging) {
      await this.runtime.log.writeLog({
        execution_id: executionId,
        log_level: 'info' as any,
        message: 'Execution retry initiated',
        context: { orchestrator: true, retryCount: execution.retry_count + 1 },
      });
    }

    return orchestratorResult;
  }

  /**
   * Retry failed task
   */
  async retryFailedTask(taskId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('retryFailedTask');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { taskId });
    }

    const taskResult = await this.runtime.task.getTask(taskId);

    if (!taskResult.success) {
      return toOrchestratorResult(taskResult, context) as OrchestratorResult<void>;
    }

    const task = taskResult.data;

    if (task.status !== TaskStatus.FAILED) {
      return {
        success: false,
        error: createOrchestratorError(
          'INVALID_STATE',
          'Task is not in FAILED state',
          { taskId, status: task.status },
          undefined,
          false
        ),
        context,
      };
    }

    if (task.retry_count >= (this.config.maxTaskRetries || 3)) {
      return {
        success: false,
        error: createOrchestratorError(
          'MAX_RETRIES_EXCEEDED',
          'Maximum retry count exceeded',
          { taskId, retryCount: task.retry_count },
          undefined,
          false,
          RecoveryStrategy.SKIP
        ),
        context,
      };
    }

    const result = await this.runtime.task.retryTask(taskId);
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoLogging) {
      await this.runtime.log.writeLog({
        execution_id: task.execution_id,
        task_id: taskId,
        log_level: 'info' as any,
        message: 'Task retry initiated',
        context: { orchestrator: true, retryCount: task.retry_count + 1 },
      });
    }

    return orchestratorResult;
  }

  /**
   * Recover stalled execution
   */
  async recoverStalledExecution(executionId: UUID): Promise<OrchestratorResult<void>> {
    const context = this.createContext('recoverStalledExecution');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, { executionId });
    }

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context) as OrchestratorResult<void>;
    }

    const execution = executionResult.data;

    if (execution.status !== ExecutionStatus.RUNNING) {
      return {
        success: false,
        error: createOrchestratorError(
          'INVALID_STATE',
          'Execution is not in RUNNING state',
          { executionId, status: execution.status },
          undefined,
          false
        ),
        context,
      };
    }

    if (execution.started_at) {
      const elapsed = Date.now() - new Date(execution.started_at).getTime();
      const timeout = this.config.stallDetectionTimeoutMs || 3600000; // 1 hour default
      if (elapsed <= timeout) {
        return {
          success: false,
          error: createOrchestratorError(
            'NOT_STALLED',
            'Execution is not stalled',
            { executionId, elapsedMs: elapsed, timeoutMs: timeout },
            undefined,
            false
          ),
          context,
        };
      }
    }

    // Fail the stalled execution
    const result = await this.runtime.execution.failExecution(
      executionId,
      'Execution stalled - timeout exceeded'
    );
    const orchestratorResult = toOrchestratorResult(result, context) as OrchestratorResult<void>;

    if (orchestratorResult.success && this.config.enableAutoLogging) {
      await this.runtime.log.writeFatal(
        executionId,
        null,
        'Execution stalled - timeout exceeded',
        { orchestrator: true }
      );
    }

    return orchestratorResult;
  }

  /**
   * Detect recovery candidates
   */
  async detectRecoveryCandidates(): Promise<OrchestratorResult<readonly {
    readonly executionId: UUID;
    readonly type: 'stalled' | 'failed' | 'orphaned';
    readonly suggestedStrategy: RecoveryStrategy;
  }[]>> {
    const context = this.createContext('detectRecoveryCandidates');

    const candidates: Array<{
      executionId: UUID;
      type: 'stalled' | 'failed' | 'orphaned';
      suggestedStrategy: RecoveryStrategy;
    }> = [];

    // Detect stalled executions
    const failedExecutionsResult = await this.runtime.execution.listExecutions({ status: ExecutionStatus.FAILED });

    if (!failedExecutionsResult.success) {
      return toOrchestratorResult(failedExecutionsResult, context) as OrchestratorResult<readonly {
        executionId: UUID;
        type: 'stalled' | 'failed' | 'orphaned';
        suggestedStrategy: RecoveryStrategy;
      }[]>;
    }

    const failedExecutions = failedExecutionsResult.data;

    for (const execution of failedExecutions) {
      if (execution.retry_count < (this.config.maxExecutionRetries || 3)) {
        candidates.push({
          executionId: execution.id,
          type: 'failed',
          suggestedStrategy: RecoveryStrategy.RETRY,
        });
      } else {
        candidates.push({
          executionId: execution.id,
          type: 'failed',
          suggestedStrategy: RecoveryStrategy.MANUAL,
        });
      }
    }

    // Detect stalled executions (RUNNING but timeout exceeded)
    const runningExecutionsResult = await this.runtime.execution.listExecutions({ status: ExecutionStatus.RUNNING });

    if (runningExecutionsResult.success) {
      const timeout = this.config.stallDetectionTimeoutMs || 3600000;
      for (const execution of runningExecutionsResult.data) {
        if (execution.started_at) {
          const elapsed = Date.now() - new Date(execution.started_at).getTime();
          if (elapsed > timeout) {
            candidates.push({
              executionId: execution.id,
              type: 'stalled',
              suggestedStrategy: RecoveryStrategy.ABORT,
            });
          }
        }
      }
    }

    if (candidates.length > 0 && this.config.enableAutoLogging) {
      this.logOperation(context, { candidates });
    }

    return {
      success: true,
      data: candidates,
      context,
    };
  }

  /**
   * Cleanup orphaned records
   */
  async cleanupOrphanedRecords(): Promise<OrchestratorResult<{
    readonly cleanedTasks: number;
    readonly cleanedLogs: number;
    readonly cleanedEvents: number;
  }>> {
    const context = this.createContext('cleanupOrphanedRecords');

    if (this.config.enableAutoLogging) {
      this.logOperation(context, {});
    }

    // This is a placeholder for orphan cleanup logic
    // In a real implementation, this would:
    // 1. Find tasks with non-existent executions
    // 2. Find logs with non-existent executions/tasks
    // 3. Find events with non-existent executions/tasks
    // 4. Clean them up safely

    const result = {
      cleanedTasks: 0,
      cleanedLogs: 0,
      cleanedEvents: 0,
    };

    return {
      success: true,
      data: result,
      context,
    };
  }

  /**
   * Validate recovery eligibility
   */
  async validateRecoveryEligibility(executionId: UUID): Promise<OrchestratorResult<{
    readonly eligible: boolean;
    readonly reason: string;
    readonly suggestedStrategy?: RecoveryStrategy;
  }>> {
    const context = this.createContext('validateRecoveryEligibility');

    const executionResult = await this.runtime.execution.getExecution(executionId);

    if (!executionResult.success) {
      return toOrchestratorResult(executionResult, context) as OrchestratorResult<{
        readonly eligible: boolean;
        readonly reason: string;
        readonly suggestedStrategy?: RecoveryStrategy;
      }>;
    }

    const execution = executionResult.data;

    if (execution.status === ExecutionStatus.COMPLETED) {
      return {
        success: true,
        data: {
          eligible: false,
          reason: 'Execution is already completed',
        },
        context,
      };
    }

    if (execution.status === ExecutionStatus.CANCELLED) {
      return {
        success: true,
        data: {
          eligible: false,
          reason: 'Execution is cancelled',
        },
        context,
      };
    }

    if (execution.status === ExecutionStatus.RUNNING) {
      if (execution.started_at) {
        const elapsed = Date.now() - new Date(execution.started_at).getTime();
        const timeout = this.config.stallDetectionTimeoutMs || 3600000;
        if (elapsed > timeout) {
          return {
            success: true,
            data: {
              eligible: true,
              reason: 'Execution is stalled',
              suggestedStrategy: RecoveryStrategy.ABORT,
            },
            context,
          };
        }
      }
      return {
        success: true,
        data: {
          eligible: false,
          reason: 'Execution is still running',
        },
        context,
      };
    }

    if (execution.status === ExecutionStatus.FAILED) {
      if (execution.retry_count >= (this.config.maxExecutionRetries || 3)) {
        return {
          success: true,
          data: {
            eligible: true,
            reason: 'Max retries exceeded',
            suggestedStrategy: RecoveryStrategy.MANUAL,
          },
          context,
        };
      }
      return {
        success: true,
        data: {
          eligible: true,
          reason: 'Execution failed with retries available',
          suggestedStrategy: RecoveryStrategy.RETRY,
        },
        context,
      };
    }

    return {
      success: true,
      data: {
        eligible: false,
        reason: 'Unknown execution state',
      },
      context,
    };
  }

  /**
   * Create orchestrator context
   */
  private createContext(operation: string): OrchestratorContext {
    return {
      tenantId: this.config.tenantId,
      orchestrator: 'RecoveryOrchestrator',
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
