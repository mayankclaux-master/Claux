/**
 * Execution Pipeline Service
 * 
 * Canonical pipeline wiring for CLAUX V1.
 * Wires: CronExecutionService → RuntimeService → AgentExecutionRegistry → AgentService → Persistence → Command Centre Tasks → Dashboard Metrics.
 * 
 * CRITICAL: This is the ONLY execution pipeline service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createLogger, Logger } from '@/lib/utils/logger';
import { generateTraceId } from '@/lib/utils/trace';
import { cronExecutionService } from './cron-execution.service';
import { agentExecutionRegistry } from './agent-execution-registry';
import { executionAuditService } from './execution-audit.service';
import { productionSafetyService } from './production-safety';

/**
 * Execution pipeline service
 */
export class ExecutionPipelineService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Execute scheduled agent
   */
  async executeScheduledAgent(
    tenantId: UUID,
    agentName: string,
    scheduleId: UUID,
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    this.logger.info('Executing scheduled agent', { tenantId, agentName, scheduleId });

    // Validate production safety
    const safetyResult = await productionSafetyService.validateExecutionSafety(
      tenantId,
      token,
      { isCron: true }
    );

    if (!safetyResult.allowed) {
      this.logger.warn('Production safety validation failed', { 
        tenantId, 
        agentName, 
        errors: safetyResult.errors 
      });
      return { 
        success: false, 
        error: `Production safety validation failed: ${safetyResult.errors.join(', ')}` 
      };
    }

    // Generate execution context
    const executionId = crypto.randomUUID();
    const traceId = generateTraceId();

    const context = {
      tenantId,
      agentName,
      executionId,
      traceId,
      token,
      isCron: true,
    };

    // Execute agent via registry
    const result = await agentExecutionRegistry.executeAgent(context);

    if (!result.success) {
      this.logger.error('Scheduled agent execution failed', { 
        tenantId, 
        agentName, 
        error: result.error 
      });
      return { success: false, error: result.error };
    }

    this.logger.info('Scheduled agent execution succeeded', { tenantId, agentName });
    return { success: true };
  }

  /**
   * Execute manual agent
   */
  async executeManualAgent(
    tenantId: UUID,
    agentName: string,
    payload: Record<string, unknown>,
    token: string
  ): Promise<{ success: boolean; error?: string; executionId?: UUID; traceId?: UUID }> {
    this.logger.info('Executing manual agent', { tenantId, agentName });

    // Validate production safety
    const safetyResult = await productionSafetyService.validateExecutionSafety(
      tenantId,
      token,
      { isCron: false }
    );

    if (!safetyResult.allowed) {
      this.logger.warn('Production safety validation failed', { 
        tenantId, 
        agentName, 
        errors: safetyResult.errors 
      });
      return { 
        success: false, 
        error: `Production safety validation failed: ${safetyResult.errors.join(', ')}` 
      };
    }

    // Generate execution context
    const executionId = crypto.randomUUID();
    const traceId = generateTraceId();

    const context = {
      tenantId,
      agentName,
      executionId,
      traceId,
      token,
      payload,
      isCron: false,
    };

    // Execute agent via registry
    const result = await agentExecutionRegistry.executeAgent(context);

    if (!result.success) {
      this.logger.error('Manual agent execution failed', { 
        tenantId, 
        agentName, 
        error: result.error 
      });
      return { success: false, error: result.error };
    }

    this.logger.info('Manual agent execution succeeded', { tenantId, agentName });
    return { success: true, executionId, traceId };
  }

  /**
   * Execute agent with persistence
   */
  async executeAgentWithPersistence(
    tenantId: UUID,
    agentName: string,
    payload: Record<string, unknown>,
    persistenceData: Record<string, unknown>,
    token: string,
    isCron: boolean = false
  ): Promise<{ success: boolean; error?: string; executionId?: UUID; traceId?: UUID }> {
    this.logger.info('Executing agent with persistence', { tenantId, agentName });

    // Generate execution context
    const executionId = crypto.randomUUID();
    const traceId = generateTraceId();

    const context = {
      tenantId,
      agentName,
      executionId,
      traceId,
      token,
      payload,
      isCron,
    };

    // Execute agent with persistence
    const result = await agentExecutionRegistry.executeAgentWithPersistence(
      context,
      persistenceData
    );

    if (!result.success) {
      this.logger.error('Agent execution with persistence failed', { 
        tenantId, 
        agentName, 
        error: result.error 
      });
      return { success: false, error: result.error };
    }

    this.logger.info('Agent execution with persistence succeeded', { tenantId, agentName });
    return { success: true, executionId, traceId };
  }

  /**
   * Execute agent with tasks
   */
  async executeAgentWithTasks(
    tenantId: UUID,
    agentName: string,
    payload: Record<string, unknown>,
    taskData: {
      tasks: Array<{
        type: string;
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        dueDate?: string;
        payload?: Record<string, unknown>;
      }>;
    },
    token: string,
    isCron: boolean = false
  ): Promise<{ success: boolean; error?: string; executionId?: UUID; traceId?: UUID }> {
    this.logger.info('Executing agent with tasks', { tenantId, agentName });

    // Generate execution context
    const executionId = crypto.randomUUID();
    const traceId = generateTraceId();

    const context = {
      tenantId,
      agentName,
      executionId,
      traceId,
      token,
      payload,
      isCron,
    };

    // Execute agent with tasks
    const result = await agentExecutionRegistry.executeAgentWithTasks(
      context,
      taskData
    );

    if (!result.success) {
      this.logger.error('Agent execution with tasks failed', { 
        tenantId, 
        agentName, 
        error: result.error 
      });
      return { success: false, error: result.error };
    }

    this.logger.info('Agent execution with tasks succeeded', { tenantId, agentName });
    return { success: true, executionId, traceId };
  }

  /**
   * Execute full pipeline (schedule → execution → persistence → tasks)
   */
  async executeFullPipeline(
    tenantId: UUID,
    agentName: string,
    payload: Record<string, unknown>,
    persistenceData: Record<string, unknown>,
    taskData: {
      tasks: Array<{
        type: string;
        title: string;
        description: string;
        priority: 'high' | 'medium' | 'low';
        dueDate?: string;
        payload?: Record<string, unknown>;
      }>;
    },
    token: string,
    isCron: boolean = false
  ): Promise<{ success: boolean; error?: string; executionId?: UUID; traceId?: UUID }> {
    this.logger.info('Executing full pipeline', { tenantId, agentName });

    // Generate execution context
    const executionId = crypto.randomUUID();
    const traceId = generateTraceId();

    const context = {
      tenantId,
      agentName,
      executionId,
      traceId,
      token,
      payload,
      isCron,
    };

    // Execute agent
    const result = await agentExecutionRegistry.executeAgent(context);

    if (!result.success) {
      this.logger.error('Full pipeline execution failed', { 
        tenantId, 
        agentName, 
        error: result.error 
      });
      return { success: false, error: result.error };
    }

    // Persist outputs
    try {
      await agentExecutionRegistry['persistAgentOutputs'](
        tenantId,
        traceId,
        executionId,
        agentName,
        persistenceData,
        token
      );
    } catch (error) {
      this.logger.error('Failed to persist outputs', { error, tenantId, agentName });
      // Don't fail the pipeline if persistence fails
    }

    // Generate tasks
    try {
      const taskGenerationService = require('../command-center/task-generation.service').TaskGenerationService;
      const service = new taskGenerationService();
      
      for (const task of taskData.tasks) {
        await service.createTask({
          tenant_id: tenantId,
          task_type: task.type as any,
          title: task.title,
          description: task.description,
          priority: task.priority as any,
          due_at: task.dueDate,
          agent_name: agentName,
          source_execution_id: executionId,
          metadata: task.payload,
        });
      }
    } catch (error) {
      this.logger.error('Failed to generate tasks', { error, tenantId, agentName });
      // Don't fail the pipeline if task generation fails
    }

    this.logger.info('Full pipeline execution succeeded', { tenantId, agentName });
    return { success: true, executionId, traceId };
  }

  /**
   * Scan and execute due schedules
   */
  async scanAndExecuteDueSchedules(token: string): Promise<{
    scanned: number;
    executed: number;
    failed: number;
    skipped: number;
  }> {
    this.logger.info('Scanning and executing due schedules');

    // Get due schedules
    const schedules = await cronExecutionService.getSchedules('00000000-0000-0000-0000-000000000000' as UUID, token);

    let executed = 0;
    let failed = 0;
    let skipped = 0;

    for (const schedule of schedules as Array<Record<string, unknown>>) {
      const tenantId = schedule.tenant_id as UUID;
      const agentName = schedule.agent_name as string;
      const scheduleId = schedule.id as UUID;
      const enabled = schedule.enabled as boolean;
      const nextRunAt = schedule.next_run_at as string;

      if (!enabled) {
        skipped++;
        continue;
      }

      if (new Date(nextRunAt) > new Date()) {
        skipped++;
        continue;
      }

      try {
        const result = await this.executeScheduledAgent(tenantId, agentName, scheduleId, token);
        
        if (result.success) {
          executed++;
        } else {
          failed++;
        }
      } catch (error) {
        this.logger.error('Failed to execute scheduled agent', { 
          tenantId, 
          agentName, 
          error 
        });
        failed++;
      }
    }

    this.logger.info('Schedule scan and execution completed', { 
      scanned: schedules.length, 
      executed, 
      failed, 
      skipped 
    });

    return {
      scanned: schedules.length,
      executed,
      failed,
      skipped,
    };
  }
}

/**
 * Singleton instance
 */
export const executionPipelineService = new ExecutionPipelineService();
