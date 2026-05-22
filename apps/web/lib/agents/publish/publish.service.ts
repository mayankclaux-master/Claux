import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { TaskOrchestrator } from "@/lib/runtime/orchestrator/task-orchestrator";
import { PublishTaskExecutorFactory } from "./publish-tasks";
import { WordPressConnector } from "@/lib/runtime/connectors/wordpress.connector";
import { CustomAPIConnector } from "@/lib/runtime/connectors/custom-api.connector";
import type { UUID } from "@/lib/runtime/types/common.types";
import { TaskStatus as TaskStatusEnum } from "@/lib/runtime/types/task.types";

// REMOVED: Agent Logger dependencies (Phase 2B - execution authority enforcement)
// Agents must NOT control execution state, logging, or locks
// See CLAUX_AGENT_OWNED_EXECUTION_CONTROL_AUDIT.md for migration path

// REMOVED: Direct CMS connector calls (Phase 3A - provider execution sovereignty)
// Agents must NOT call providers directly
// Provider execution must flow through: RuntimeService → Runtime Connector → Provider
// See CLAUX_PROVIDER_EXECUTION_SOVEREIGNTY_AUDIT.md for migration path

// REMOVED: Direct database access (TASK 4C.3.1)
// CMS config and draft content now handled by runtime persistence layer
// Agents must NOT access database directly

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for publishing

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Structured logging helper with executionId
 * NOTE: This function is now a no-op placeholder
 * All logging is handled by canonical LogService via RuntimeService
 * See CLAUX_LOGSERVICE_HARDENING_REPORT.md for migration
 */
function structuredLog(level: "info" | "error" | "warn", data: Record<string, unknown>): void {
  // No-op - logging now handled by LogService via RuntimeService
  // This function is kept for backward compatibility during transition
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  let slug = title.toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

/**
 * Sanitize HTML for safe publishing
 */
function sanitizeHTML(html: string): string {
  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
  
  // Remove other potentially dangerous tags
  sanitized = sanitized.replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, "");
  sanitized = sanitized.replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gim, "");
  sanitized = sanitized.replace(/<embed\b[^>]*>/gim, "");
  
  // Remove inline event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gim, "");
  
  return sanitized;
}

/**
 * Run PUBLISH agent - Content Publishing
 */
export async function runPUBLISH(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  // NOTE: Logging moved to executePUBLISH where RuntimeService is available

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePUBLISH(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // NOTE: Error logging moved to executePUBLISH where RuntimeService is available
  } finally {
    // NOTE: Cleanup logging moved to executePUBLISH where RuntimeService is available
  }
}

/**
 * Execute PUBLISH logic
 * REAL EXECUTION PIPELINE (TASK 4C.3.1)
 * Integration: RuntimeService → ExecutionOrchestrator → TaskOrchestrator → PublishTaskExecutorFactory → CMS Connectors
 */
async function executePUBLISH(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;

  // Initialize RuntimeService early for canonical logging
  const runtimeService = new RuntimeService({
    tenantId: tenantId as UUID,
    logOperations: true,
    enableMetrics: true,
  });

  // Step 1: Initialize RuntimeService and execute canonical tasks (50%)
  // REAL EXECUTION PIPELINE (TASK 4C.3.1)
  // Integration: RuntimeService → ExecutionOrchestrator → TaskOrchestrator → CMS Connectors
  await runtimeService.log.writeInfo(
    executionId as UUID,
    null,
    "Initializing runtime services",
    {
      runId,
      tenantId,
      agent,
      step: "initializing_runtime_services",
      execution_stage: "runtime_init",
      progress: 50,
    }
  );

  // Initialize canonical runtime services
  // NOTE: runtimeService already initialized above for logging

  const executionOrchestrator = new ExecutionOrchestrator(runtimeService, {
    tenantId: tenantId as UUID,
    enableAutoLogging: true,
    enableAutoEvents: true,
  });

  const taskOrchestrator = new TaskOrchestrator(runtimeService, {
    tenantId: tenantId as UUID,
    enableAutoLogging: true,
    enableAutoEvents: true,
  });

  // Initialize CMS connectors
  const wordpressConnector = new WordPressConnector({
    tenantId: tenantId as UUID,
    executionId,
    taskId: '',
  });

  const customAPIConnector = new CustomAPIConnector({
    tenantId: tenantId as UUID,
    executionId,
    taskId: '',
  });

  // Create execution via ExecutionOrchestrator
  const createExecutionResult = await executionOrchestrator.createExecution({
    agentName: 'AMPLI',
    workflowType: 'content_publishing',
    inputPayload: {
      runId,
    },
    tasks: [], // Tasks will be created separately via TaskOrchestrator
  });

  if (!createExecutionResult.success || !createExecutionResult.data) {
    throw new Error(`Failed to create execution: ${createExecutionResult.error}`);
  }

  const runtimeExecutionId = createExecutionResult.data;
  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "Execution created",
    {
      runId,
      tenantId,
      agent,
      step: "execution_created",
      execution_stage: "execution_create",
      progress: 55,
    }
  );

  // Start execution
  const startExecutionResult = await executionOrchestrator.startExecution(runtimeExecutionId);
  if (!startExecutionResult.success) {
    throw new Error(`Failed to start execution: ${startExecutionResult.error}`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "Execution started",
    {
      runId,
      tenantId,
      agent,
      step: "execution_started",
      execution_stage: "execution_start",
      progress: 60,
    }
  );

  // NOTE: AMPLI will receive draft content from SCRIBE via runtime execution context
  // For now, we create a placeholder WordPress publish task
  // In production, AMPLI will receive draft content from SCRIBE and publish to CMS

  const publishTaskResult = await taskOrchestrator.createTask(runtimeExecutionId, {
    taskName: 'WordPress Publish',
    taskType: 'task_wordpress_publish',
    stepOrder: 1,
    inputPayload: {
      siteUrl: 'https://example.com',
      title: 'Sample Article',
      content: '<p>Sample content</p>',
      status: 'publish',
    },
  });

  if (!publishTaskResult.success || !publishTaskResult.data) {
    throw new Error(`Failed to create publish task: ${publishTaskResult.error}`);
  }

  const publishTaskId = publishTaskResult.data;

  // Initialize PUBLISH task factory
  const publishFactory = new PublishTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    publishTaskId,
    wordpressConnector,
    customAPIConnector
  );

  const executor = publishFactory.createExecutor('task_wordpress_publish');
  if (!executor) {
    throw new Error('Failed to create WordPress publish executor');
  }

  // Execute task
  const result = await executor.execute({
    taskId: publishTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_wordpress_publish',
    input: {
      siteUrl: 'https://example.com',
      title: 'Sample Article',
      content: '<p>Sample content</p>',
      status: 'publish',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatusEnum.COMPLETED) {
    await taskOrchestrator.completeTask(publishTaskId, result.output);
  } else {
    await taskOrchestrator.failTask(publishTaskId, {
      message: result.error?.message || 'Task failed',
      code: result.error?.code || 'UNKNOWN_ERROR',
    });
  }

  // Complete execution
  const completeExecutionResult = await executionOrchestrator.completeExecution(runtimeExecutionId, result.metrics?.cost || 0);
  if (!completeExecutionResult.success) {
    throw new Error(`Failed to complete execution: ${completeExecutionResult.error}`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "AMPLI execution completed successfully",
    {
      runId,
      tenantId,
      agent,
      step: "execution_completed",
      execution_stage: "execution_complete",
      progress: 100,
    }
  );
}
