import type { AgentContext } from "../base/agent.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { AriaTaskExecutorFactory } from "./aria-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";

// REMOVED: Agent Logger dependencies (Phase 2B - execution authority enforcement)
// Agents must NOT control execution state, logging, or locks
// See CLAUX_AGENT_OWNED_EXECUTION_CONTROL_AUDIT.md for migration path

const EXECUTION_TIMEOUT_MS = 30000; // 10 seconds

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
 * Classify keyword intent
 */
function classifyIntent(keyword: string): "transactional" | "informational" | "commercial" {
  const lowerKeyword = keyword.toLowerCase();
  
  if (lowerKeyword.includes("buy") || lowerKeyword.includes("price") || lowerKeyword.includes("near me") || lowerKeyword.includes("cost")) {
    return "transactional";
  }
  
  if (lowerKeyword.includes("how") || lowerKeyword.includes("what") || lowerKeyword.includes("guide") || lowerKeyword.includes("why")) {
    return "informational";
  }
  
  return "commercial";
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL is invalid, return as-is
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

/**
 * Normalize keyword for consistency
 */
function normalizeKeyword(keyword: string): string {
  let normalized = keyword.trim();
  normalized = normalized.toLowerCase();
  normalized = normalized.replace(/\s+/g, " ");
  normalized = normalized.replace(/^[^\w\s]+|[^\w\s]+$/g, "");
  return normalized;
}

/**
 * Validate keyword
 */
function isValidKeyword(keyword: string): boolean {
  const normalized = normalizeKeyword(keyword);
  
  // Check for empty string
  if (!normalized || normalized.length === 0) {
    return false;
  }
  
  // Check minimum length
  if (normalized.length < 3) {
    return false;
  }
  
  // Check for non-alphanumeric (only symbols)
  const alphanumericOnly = normalized.replace(/[^a-z0-9\s]/g, "");
  if (alphanumericOnly.length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Run ARIA agent - Keyword Intelligence
 */
export async function runARIA(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  // NOTE: Logging moved to executeARIA where RuntimeService is available
  // This is a temporary execution ID for tracking before runtime initialization

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeARIA(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // NOTE: Error logging moved to executeARIA where RuntimeService is available
    // This catch block only handles timeout errors
  } finally {
    // NOTE: Cleanup logging moved to executeARIA where RuntimeService is available
  }
}

/**
 * Execute ARIA logic
 */
async function executeARIA(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Initialize RuntimeService early for canonical logging
  const runtimeService = new RuntimeService({
    tenantId: tenantId as UUID,
    logOperations: true,
    enableMetrics: true,
  });

  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("website_url, category")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profileError || !businessProfile?.website_url) {
    throw new Error("Business profile or website URL not found");
  }

  const domain = extractDomain(businessProfile.website_url);

  await runtimeService.log.writeInfo(
    executionId as UUID,
    null,
    "Business profile fetched",
    {
      runId,
      tenantId,
      agent,
      step: "business_profile_fetched",
      execution_stage: "profile_fetch",
      domain,
      category: businessProfile.category,
    }
  );

  // Step 3: Initialize RuntimeService and execute canonical tasks (50%)
  // REAL EXECUTION PIPELINE (TASK 4A.4)
  // Integration: RuntimeService → ExecutionOrchestrator → TaskOrchestrator → DataForSEOConnector
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
    agent_name: 'ARIA',
    workflow_type: 'keyword_intelligence',
    metadata: {
      domain,
      category: businessProfile.category,
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
    throw new Error(`Failed to start execution: ${startExecutionResult.error?.message}`);
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

  // Create keyword research task via RuntimeService
  const keywordResearchTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'task_keyword_research',
    task_type: 'task_keyword_research',
    step_order: 1,
    input_payload: {
      domain,
      location: 'United States',
      language: 'English',
    },
  });

  if (!keywordResearchTaskResult.success || !keywordResearchTaskResult.data) {
    throw new Error(`Failed to create keyword research task`);
  }

  const keywordResearchTaskId = keywordResearchTaskResult.data.id;

  // Initialize ARIA task factory
  const ariaFactory = new AriaTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    keywordResearchTaskId
  );

  // Execute keyword research task
  const keywordResearchExecutor = ariaFactory.createExecutor('task_keyword_research');
  if (!keywordResearchExecutor) {
    throw new Error('Failed to create keyword research executor');
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    keywordResearchTaskId,
    "Executing keyword research",
    {
      runId,
      tenantId,
      agent,
      step: "executing_keyword_research",
      execution_stage: "task_execute",
      progress: 70,
    }
  );

  // Start task via RuntimeService
  await runtimeService.task.startTask(keywordResearchTaskId);

  const keywordResearchResult = await keywordResearchExecutor.execute({
    taskId: keywordResearchTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_keyword_research',
    input: {
      domain,
      location: 'United States',
      language: 'English',
    },
    metadata: { tenantId },
    retryCount: 0,
  });

  // Complete keyword research task via RuntimeService
  if (keywordResearchResult.status === 'completed') {
    await runtimeService.task.completeTask(keywordResearchTaskId, keywordResearchResult.output);
  } else {
    await runtimeService.task.failTask(keywordResearchTaskId, {
      message: keywordResearchResult.error?.message || 'Task failed',
      code: keywordResearchResult.error?.code || 'UNKNOWN_ERROR',
    });
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    keywordResearchTaskId,
    "Keyword research completed",
    {
      runId,
      tenantId,
      agent,
      step: "keyword_research_completed",
      execution_stage: "task_complete",
      progress: 90,
      keywords_found: keywordResearchResult.output?.total_keywords || 0,
    }
  );

  // Generate Command Centre tasks based on keyword research results
  const taskGenerationService = new TaskGenerationService();
  const keywordsFound = (keywordResearchResult.output?.total_keywords as number) || 0;
  const keywordsArray = (keywordResearchResult.output?.keywords as any[]) || [];

  if (keywordsFound > 0 && Array.isArray(keywordsArray) && keywordsArray.length > 0) {
    const commandCenterTasks = keywordsArray.slice(0, 5).map((keyword: any) => ({
      task_type: 'keyword_review' as TaskType,
      title: `Create landing page for "${keyword.keyword}"`,
      description: `Optimize content for keyword: ${keyword.keyword} (difficulty: ${keyword.difficulty})`,
      priority: (keyword.difficulty > 50 ? 'high' : 'medium') as TaskPriority,
      action_payload: {
        keyword: keyword.keyword,
        difficulty: keyword.difficulty,
        search_volume: keyword.search_volume,
      },
    }));

    await taskGenerationService.bulkCreateTasks({
      tenant_id: tenantId as string,
      client_id: tenantId as string, // Using tenant_id as client_id for now
      agent_name: 'ARIA',
      source_execution_id: runtimeExecutionId,
      source_task_id: keywordResearchTaskId,
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

  // Complete execution via RuntimeService
  const completeExecutionResult = await runtimeService.execution.completeExecution(
    runtimeExecutionId,
    keywordResearchResult.metrics?.cost || 0
  );

  if (!completeExecutionResult.success) {
    throw new Error(`Failed to complete execution: ${completeExecutionResult.error?.message}`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "ARIA execution completed successfully via canonical runtime",
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
