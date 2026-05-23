/**
 * Agent Execution Registry
 * 
 * Canonical execution entrypoint for all agents in CLAUX V1.
 * Maps agent names → execution handlers, standardized execution lifecycle, standardized persistence lifecycle, standardized dashboard update lifecycle.
 * 
 * CRITICAL: This is the ONLY agent execution registry in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { generateTraceId } from '@/lib/utils/trace';
import { executionAuditService } from './execution-audit.service';
import { executionLockService } from './execution-lock.service';
import { agentPersistenceHelper } from '../persistence/agent-persistence-helper';
import { TaskGenerationService } from '../command-center/task-generation.service';
import { cronIdempotencyProtectionService } from './cron-idempotency.service';
import { vercelSafeExecutionStrategy } from './vercel-safe-execution';
import { safeRetryEngine } from './safe-retry-engine';
import { failureClassifier, ErrorType } from './failure-classification';

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  tenantId: UUID;
  agentName: string;
  executionId: UUID;
  traceId: UUID;
  token: string;
  payload?: Record<string, unknown>;
  isCron?: boolean;
}

/**
 * Agent execution result
 */
export interface AgentExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  errorType?: ErrorType;
  durationMs?: number;
}

/**
 * Agent execution handler
 */
export type AgentExecutionHandler = (context: AgentExecutionContext) => Promise<AgentExecutionResult>;

/**
 * Agent execution registry
 */
export class AgentExecutionRegistry {
  private logger: Logger;
  private handlers = new Map<string, AgentExecutionHandler>();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Register agent execution handler
   */
  register(agentName: string, handler: AgentExecutionHandler): void {
    this.logger.info('Registering agent execution handler', { agentName });
    this.handlers.set(agentName, handler);
  }

  /**
   * Get agent execution handler
   */
  getHandler(agentName: string): AgentExecutionHandler | undefined {
    return this.handlers.get(agentName);
  }

  /**
   * Check if agent is registered
   */
  isRegistered(agentName: string): boolean {
    return this.handlers.has(agentName);
  }

  /**
   * Execute agent with full lifecycle
   */
  async executeAgent(context: AgentExecutionContext): Promise<AgentExecutionResult> {
    const { tenantId, agentName, executionId, traceId, token, isCron } = context;

    this.logger.info('Executing agent', { tenantId, agentName, executionId, traceId });

    // Check if agent is registered
    const handler = this.getHandler(agentName);
    if (!handler) {
      this.logger.error('Agent not registered', { agentName });
      return {
        success: false,
        error: `Agent not registered: ${agentName}`,
        errorType: ErrorType.VALIDATION,
      };
    }

    // Record execution start
    await executionAuditService.recordExecutionStart(
      tenantId,
      executionId,
      traceId,
      agentName,
      isCron ? 'cron' : 'manual',
      token
    );

    const startTime = Date.now();

    try {
      // Acquire lock to prevent duplicate execution
      const lockResult = await executionLockService.acquireLock(
        tenantId,
        agentName,
        'execution',
        token,
        executionId,
        60000 // 1 minute TTL
      );

      if (!lockResult.acquired) {
        this.logger.warn('Lock already held, skipping execution', { tenantId, agentName, executionId });
        return {
          success: false,
          error: 'Lock already held',
          errorType: ErrorType.VALIDATION,
        };
      }

      const lockId = lockResult.lockId!;

      try {
        // Check idempotency for cron executions
        if (isCron) {
          const idempotencyResult = await cronIdempotencyProtectionService.preventDuplicateCronRun(
            tenantId,
            executionId,
            agentName,
            async () => {
              return this.executeAgentInternal(context, handler);
            }
          );

          if (!idempotencyResult.success) {
            this.logger.warn('Duplicate cron run detected', { tenantId, agentName, executionId });
            return {
              success: false,
              error: idempotencyResult.error,
              errorType: ErrorType.VALIDATION,
            };
          }

          return idempotencyResult as AgentExecutionResult;
        }

        // Execute agent
        const result = await this.executeAgentInternal(context, handler);

        // Record execution completion
        await executionAuditService.recordExecutionCompletion(
          tenantId,
          executionId,
          result.success ? 'success' : 'failed',
          token,
          result.errorType,
          result.error
        );

        return result;
      } finally {
        // Release lock
        await executionLockService.releaseLock(tenantId, lockId, token);
      }
    } catch (error) {
      const errorType = failureClassifier.getErrorType(error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('Agent execution failed', { tenantId, agentName, executionId, error });

      // Record execution failure
      await executionAuditService.recordExecutionCompletion(
        tenantId,
        executionId,
        'failed',
        token,
        errorType,
        errorMessage
      );

      return {
        success: false,
        error: errorMessage,
        errorType,
      };
    }
  }

  /**
   * Execute agent internal logic
   */
  private async executeAgentInternal(
    context: AgentExecutionContext,
    handler: AgentExecutionHandler
  ): Promise<AgentExecutionResult> {
    const { tenantId, agentName, executionId, traceId, token } = context;

    // Execute with Vercel safety
    const result = await vercelSafeExecutionStrategy.executeWithVercelSafety(
      async () => {
        // Execute with retry
        const retryResult = await safeRetryEngine.executeWithRetry(
          async () => {
            return await handler(context);
          },
          {
            maxRetries: 3,
            tenantId,
            executionId,
            traceId,
            token,
          }
        );

        if (!retryResult.success) {
          return {
            success: false,
            error: retryResult.error instanceof Error ? retryResult.error.message : 'Unknown error',
            errorType: retryResult.errorType,
          };
        }

        return retryResult.data || {
          success: false,
          error: 'No data returned from handler',
          errorType: ErrorType.VALIDATION,
        };
      },
      {
        timeoutMs: 55000, // 55 seconds (Vercel limit is 60s)
      }
    );

    return result;
  }

  /**
   * Execute agent with persistence
   */
  async executeAgentWithPersistence(
    context: AgentExecutionContext,
    persistenceData: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const { tenantId, agentName, executionId, traceId, token } = context;

    this.logger.info('Executing agent with persistence', { tenantId, agentName });

    // Execute agent
    const result = await this.executeAgent(context);

    if (result.success) {
      // Persist outputs based on agent
      try {
        await this.persistAgentOutputs(tenantId, traceId, executionId, agentName, persistenceData, token);
      } catch (error) {
        this.logger.error('Failed to persist agent outputs', { error, tenantId, agentName });
        // Don't fail the execution if persistence fails
      }
    }

    return result;
  }

  /**
   * Persist agent outputs
   */
  private async persistAgentOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    agentName: string,
    data: Record<string, unknown>,
    token: string
  ): Promise<void> {
    switch (agentName) {
      case 'ARIA':
        await agentPersistenceHelper.persistAriaOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'SCRIBE':
        await agentPersistenceHelper.persistScribeOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'PULSE':
        await agentPersistenceHelper.persistPulseOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'LINX':
        await agentPersistenceHelper.persistLinxOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'CORE':
        await agentPersistenceHelper.persistCoreOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'REPUTE':
        await agentPersistenceHelper.persistReputeOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'PRISM':
        await agentPersistenceHelper.persistPrismOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'LOCL':
        await agentPersistenceHelper.persistLoclOutputs(tenantId, traceId, executionId, data, token);
        break;
      case 'PUBLISH':
        await agentPersistenceHelper.persistPublishOutputs(tenantId, traceId, executionId, data, token);
        break;
      default:
        this.logger.warn('Unknown agent for persistence', { agentName });
    }
  }

  /**
   * Execute agent with task generation
   */
  async executeAgentWithTasks(
    context: AgentExecutionContext,
    taskData: {
      tasks: Array<{
        type: string;
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        dueDate?: string;
        payload?: Record<string, unknown>;
      }>;
    }
  ): Promise<AgentExecutionResult> {
    const { tenantId, agentName, executionId, traceId, token } = context;

    this.logger.info('Executing agent with task generation', { tenantId, agentName });

    // Execute agent
    const result = await this.executeAgent(context);

    if (result.success) {
      // Generate tasks
      try {
        const taskGenerationService = new TaskGenerationService();
        
        for (const task of taskData.tasks) {
          await taskGenerationService.createTask({
            tenant_id: tenantId,
            task_type: task.type as any, // Cast to TaskType
            title: task.title,
            description: task.description,
            priority: task.priority as any, // Cast to TaskPriority
            due_at: task.dueDate,
            agent_name: agentName,
            source_execution_id: executionId,
            metadata: task.payload,
          });
        }
      } catch (error) {
        this.logger.error('Failed to generate tasks', { error, tenantId, agentName });
        // Don't fail the execution if task generation fails
      }
    }

    return result;
  }

  /**
   * Get registered agents
   */
  getRegisteredAgents(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Singleton instance
 */
export const agentExecutionRegistry = new AgentExecutionRegistry();
