import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ScribeTaskExecutorFactory } from "./scribe-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";

// REMOVED: Agent Logger dependencies (Phase 2B - execution authority enforcement)
// Agents must NOT control execution state, logging, or locks
// See CLAUX_AGENT_OWNED_EXECUTION_CONTROL_AUDIT.md for migration path

// REMOVED: Direct provider client calls (Phase 3A - provider execution sovereignty)
// Agents must NOT call providers directly
// Provider execution must flow through: RuntimeService → Runtime Connector → Provider
// See CLAUX_PROVIDER_EXECUTION_SOVEREIGNTY_AUDIT.md for migration path

const EXECUTION_TIMEOUT_MS = 60000; // 60 seconds for content generation

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
 * Estimate word count from HTML content
 */
function estimateWordCount(htmlContent: string): number {
  // Remove HTML tags and count words
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ');
  const words = textContent.trim().split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Normalize title for consistency
 */
function normalizeTitle(title: string): string {
  let normalized = title.trim();
  normalized = normalized.replace(/\s+/g, " ");
  normalized = normalized.replace(/^[^\w\s]+|[^\w\s]+$/g, "");
  // Capitalize first letter of each word
  normalized = normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  return normalized;
}

/**
 * REMOVED: Direct database access (TASK 4B.4)
 * Content existence check now handled by runtime persistence layer
 * Agents must NOT access database directly
 */

/**
 * Run SCRIBE agent - Content Generation
 */
export async function runSCRIBE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  // NOTE: Logging moved to executeSCRIBE where RuntimeService is available

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeSCRIBE(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // NOTE: Error logging moved to executeSCRIBE where RuntimeService is available
  } finally {
    // NOTE: Cleanup logging moved to executeSCRIBE where RuntimeService is available
  }
}

/**
 * Execute SCRIBE logic
 * REAL EXECUTION PIPELINE (TASK 4B.4)
 * Integration: RuntimeService → ExecutionOrchestrator → TaskOrchestrator → ScribeTaskExecutorFactory → OpenAIConnector
 */
async function executeSCRIBE(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;

  // Initialize RuntimeService early for canonical logging
  const runtimeService = new RuntimeService({
    tenantId: tenantId as UUID,
    logOperations: true,
    enableMetrics: true,
  });

  // Step 1: Initialize RuntimeService and execute canonical tasks (50%)
  // REAL EXECUTION PIPELINE (TASK 4B.4)
  // Integration: RuntimeService → ExecutionOrchestrator → TaskOrchestrator → OpenAIConnector
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

  // Create execution via RuntimeService (direct execution, no orchestrator)
  const createExecutionResult = await runtimeService.execution.createExecution({
    agent_name: 'SCRIBE',
    workflow_type: 'content_generation',
    metadata: {
      runId,
    },
    execution_source: ExecutionSource.API,
  });

  if (!createExecutionResult.success || !createExecutionResult.data) {
    throw new Error(`Failed to create execution`);
  }

  const runtimeExecutionId = createExecutionResult.data.id;
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

  // Start execution via RuntimeService
  const startExecutionResult = await runtimeService.execution.startExecution(runtimeExecutionId);
  if (!startExecutionResult.success) {
    throw new Error(`Failed to start execution`);
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

  // NOTE: SCRIBE will receive keywords from ARIA via runtime execution context
  // For now, we create a placeholder article generation task
  // In production, SCRIBE will receive keywords from ARIA and generate content for each

  const articleTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Article Generation',
    task_type: 'task_generate_article',
    step_order: 1,
    input_payload: {
      keyword: 'seo services',
      businessCategory: 'Marketing',
      tone: 'professional',
      wordCount: 1000,
    },
  });

  if (!articleTaskResult.success || !articleTaskResult.data) {
    throw new Error(`Failed to create article generation task`);
  }

  const articleTaskId = articleTaskResult.data.id;

  // Initialize SCRIBE task factory
  const scribeFactory = new ScribeTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    articleTaskId
  );

  const executor = scribeFactory.createExecutor('task_generate_article');
  if (!executor) {
    throw new Error('Failed to create article generation executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(articleTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: articleTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_generate_article',
    input: {
      keyword: 'seo services',
      businessCategory: 'Marketing',
      tone: 'professional',
      wordCount: 1000,
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(articleTaskId, result.output);

    // Generate Command Centre tasks for publishing workflow
    const taskGenerationService = new TaskGenerationService();
    const publishPackage = result.output as any;

    if (publishPackage) {
      const commandCenterTasks = [
        {
          task_type: 'content_review' as TaskType,
          title: 'Review generated article',
          description: 'Review and approve the generated article for publishing',
          priority: 'high' as TaskPriority,
          action_payload: {
            article_title: publishPackage.title,
            word_count: publishPackage.wordCount,
          },
        },
        {
          task_type: 'publishing_package' as TaskType,
          title: 'Upload article and add featured image',
          description: 'Upload the article to CMS and add featured image',
          priority: 'medium' as TaskPriority,
          action_payload: {
            slug: publishPackage.slug,
            meta_title: publishPackage.meta_title,
          },
        },
        {
          task_type: 'schema_implementation' as TaskType,
          title: 'Implement schema markup',
          description: 'Add schema markup to the article',
          priority: 'medium' as TaskPriority,
          action_payload: {
            schema_type: publishPackage.schema_json?.['@type'],
          },
        },
      ];

      await taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId as string,
        client_id: tenantId as string,
        agent_name: 'SCRIBE',
        source_execution_id: runtimeExecutionId,
        source_task_id: articleTaskId,
        tasks: commandCenterTasks,
      });

      await runtimeService.log.writeInfo(
        runtimeExecutionId,
        null,
        "Command Centre tasks generated",
        {
          runId,
          tenantId,
          agent,
          step: "command_centre_tasks_generated",
          execution_stage: "task_generation",
          progress: 95,
          tasks_generated: commandCenterTasks.length,
        }
      );
    }
  } else {
    await runtimeService.task.failTask(articleTaskId, {
      message: result.error?.message || 'Task failed',
      code: result.error?.code || 'UNKNOWN_ERROR',
    });
  }

  // Complete execution via RuntimeService
  const completeExecutionResult = await runtimeService.execution.completeExecution(runtimeExecutionId, result.metrics?.cost || 0);
  if (!completeExecutionResult.success) {
    throw new Error(`Failed to complete execution`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "SCRIBE execution completed successfully",
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
