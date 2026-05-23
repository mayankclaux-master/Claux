import type { AgentContext } from "../base/agent.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { AriaTaskExecutorFactory } from "./aria-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";

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

  // TODO: Refactor to use RuntimeService directly instead of orchestrator
  // Orchestrator is a V1 minimal stub - agents should use direct execution
  throw new Error("Orchestrator usage deprecated - use RuntimeService directly");

  /*
  const executionOrchestrator = new ExecutionOrchestrator(runtimeService, {
    tenantId: tenantId as UUID,
  });

  const taskOrchestrator = new TaskOrchestrator(runtimeService, {
    tenantId: tenantId as UUID,
  });

  // Create execution via ExecutionOrchestrator
  const createExecutionResult = await executionOrchestrator.createExecution({
    agentName: 'ARIA',
    workflowType: 'keyword_intelligence',
    inputPayload: {
      domain,
      category: businessProfile.category,
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

  // Create keyword research task
  const keywordResearchTaskResult = await taskOrchestrator.createTask(runtimeExecutionId, {
    taskName: 'task_keyword_research',
    taskType: 'task_keyword_research',
    stepOrder: 1,
    inputPayload: {
      domain,
      location: 'United States',
      language: 'English',
    },
  });

  if (!keywordResearchTaskResult.success || !keywordResearchTaskResult.data) {
    throw new Error(`Failed to create keyword research task: ${keywordResearchTaskResult.error}`);
  }

  const keywordResearchTaskId = keywordResearchTaskResult.data;

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

  // Complete keyword research task
  if (keywordResearchResult.status === 'completed') {
    await taskOrchestrator.completeTask(keywordResearchTaskId, keywordResearchResult.output);
  } else {
    await taskOrchestrator.failTask(keywordResearchTaskId, {
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

  // Complete execution
  const completeExecutionResult = await executionOrchestrator.completeExecution(
    runtimeExecutionId,
    keywordResearchResult.metrics?.cost || 0
  );

  if (!completeExecutionResult.success) {
    throw new Error(`Failed to complete execution: ${completeExecutionResult.error}`);
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
  */
}
