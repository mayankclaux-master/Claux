import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { ScribeTaskExecutorFactory } from "./scribe-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { TaskStatus as TaskStatusEnum } from "@/lib/runtime/types/task.types";

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

  // Initialize canonical runtime services
  // NOTE: runtimeService already initialized above for logging

//   const executionOrchestrator = new ExecutionOrchestrator(runtimeService, {
//     tenantId: tenantId as UUID,
//     enableAutoLogging: true,
//     enableAutoEvents: true,
//   });
// 
//   const taskOrchestrator = new TaskOrchestrator(runtimeService, {
//     tenantId: tenantId as UUID,
//     enableAutoLogging: true,
//     enableAutoEvents: true,
//   });
// 
//   // Create execution via ExecutionOrchestrator
//   const createExecutionResult = await executionOrchestrator.createExecution({
//     agentName: 'SCRIBE',
//     workflowType: 'content_generation',
//     inputPayload: {
//       runId,
//     },
//     tasks: [], // Tasks will be created separately via TaskOrchestrator
//   });
// 
//   if (!createExecutionResult.success || !createExecutionResult.data) {
//     throw new Error(`Failed to create execution: ${createExecutionResult.error}`);
//   }
// 
//   const runtimeExecutionId = createExecutionResult.data;
//   await runtimeService.log.writeInfo(
//     runtimeExecutionId,
//     null,
//     "Execution created",
//     {
//       runId,
//       tenantId,
//       agent,
//       step: "execution_created",
//       execution_stage: "execution_create",
//       progress: 55,
//     }
//   );
// 
//   // Start execution
//   const startExecutionResult = await executionOrchestrator.startExecution(runtimeExecutionId);
//   if (!startExecutionResult.success) {
//     throw new Error(`Failed to start execution: ${startExecutionResult.error}`);
//   }
// 
//   await runtimeService.log.writeInfo(
//     runtimeExecutionId,
//     null,
//     "Execution started",
//     {
//       runId,
//       tenantId,
//       agent,
//       step: "execution_started",
//       execution_stage: "execution_start",
//       progress: 60,
//     }
//   );
// 
//   // NOTE: SCRIBE will receive keywords from ARIA via runtime execution context
//   // For now, we create a placeholder article generation task
//   // In production, SCRIBE will receive keywords from ARIA and generate content for each
// 
//   const articleTaskResult = await taskOrchestrator.createTask(runtimeExecutionId, {
//     taskName: 'Article Generation',
//     taskType: 'task_generate_article',
//     stepOrder: 1,
//     inputPayload: {
//       keyword: 'seo services',
//       businessCategory: 'Marketing',
//       tone: 'professional',
//       wordCount: 1000,
//     },
//   });
// 
//   if (!articleTaskResult.success || !articleTaskResult.data) {
//     throw new Error(`Failed to create article generation task: ${articleTaskResult.error}`);
//   }
// 
//   const articleTaskId = articleTaskResult.data;
// 
//   // Initialize SCRIBE task factory
//   const scribeFactory = new ScribeTaskExecutorFactory(
//     tenantId as UUID,
//     runtimeExecutionId,
//     articleTaskId
//   );
// 
//   const executor = scribeFactory.createExecutor('task_generate_article');
//   if (!executor) {
//     throw new Error('Failed to create article generation executor');
//   }
// 
//   // Execute task
//   const result = await executor.execute({
//     taskId: articleTaskId,
//     executionId: runtimeExecutionId,
//     taskType: 'task_generate_article',
//     input: {
//       keyword: 'seo services',
//       businessCategory: 'Marketing',
//       tone: 'professional',
//       wordCount: 1000,
//     },
//     retryCount: 0,
//   });
// 
//   // Complete or fail task based on result
//   if (result.status === TaskStatusEnum.COMPLETED) {
//     await taskOrchestrator.completeTask(articleTaskId, result.output);
//   } else {
//     await taskOrchestrator.failTask(articleTaskId, {
//       message: result.error?.message || 'Task failed',
//       code: result.error?.code || 'UNKNOWN_ERROR',
//     });
//   }
// 
//   // Complete execution
//   const completeExecutionResult = await executionOrchestrator.completeExecution(runtimeExecutionId, result.metrics?.cost || 0);
//   if (!completeExecutionResult.success) {
//     throw new Error(`Failed to complete execution: ${completeExecutionResult.error}`);
//   }
// 
//   await runtimeService.log.writeInfo(
//     runtimeExecutionId,
//     null,
//     "SCRIBE execution completed successfully",
//     {
//       runId,
//       tenantId,
//       agent,
//       step: "execution_completed",
//       execution_stage: "execution_complete",
//       progress: 100,
//     }
//   );
//   */

  // TODO: Refactor to use RuntimeService directly instead of orchestrator
  // Orchestrator is a V1 minimal stub - agents should use direct execution
  throw new Error("Orchestrator usage deprecated - use RuntimeService directly");
}
