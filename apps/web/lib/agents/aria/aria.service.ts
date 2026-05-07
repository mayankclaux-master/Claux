import type { AgentContext } from "../base/agent.types";
import {
  updateAgentState,
  logAgentActivity,
  updateAgentRunStatus,
  releaseAgentLock
} from "../base/agent.logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchKeywordsForSite, extractDomain } from "../shared/dataforseo.client";

const EXECUTION_TIMEOUT_MS = 30000; // 10 seconds

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Structured logging helper with executionId
 */
function structuredLog(level: "info" | "error" | "warn", data: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...data
  }));
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

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runARIA_start",
    message: "Starting ARIA execution"
  });

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
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runARIA_error",
      error: error instanceof Error ? error.message : "Unknown error"
    });

    // Failure handling: update states to failed
    try {
      await updateAgentState(tenantId, agent, runId, {
        status: "failed",
        last_error: error instanceof Error ? error.message : "Unknown error"
      });

      await updateAgentRunStatus(runId, tenantId, "failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        failed_at: new Date().toISOString()
      });

      await logAgentActivity(tenantId, agent, runId, "failed", `ARIA failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } catch (updateError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "failure_handling_error",
        error: updateError instanceof Error ? updateError.message : "Failed to update error state"
      });
    }
  } finally {
    // Safety: Double check final state before exiting
    // Ensure state is never stuck in "running" or "queued"
    try {
      const supabase = createSupabaseAdminClient();
      const { data: currentState } = await supabase
        .from("agent_states")
        .select("status")
        .eq("tenant_id", tenantId)
        .eq("agent", agent)
        .maybeSingle();

      if (currentState && (currentState.status === "running" || currentState.status === "queued")) {
        structuredLog("warn", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "final_state_safety_check",
          currentStatus: currentState.status,
          message: "State not terminal, forcing failed state"
        });

        // Force mark as failed
        await updateAgentState(tenantId, agent, runId, {
          status: "failed",
          last_error: "Execution did not complete properly (forced failure by safety check)"
        });

        await updateAgentRunStatus(runId, tenantId, "failed", {
          reason: "safety_check_forced_failure",
          original_status: currentState.status,
          forced_at: new Date().toISOString()
        });

        await logAgentActivity(tenantId, agent, runId, "failed", "ARIA forced to failed by safety check: execution did not complete");
      }
    } catch (safetyError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "final_state_safety_check_error",
        error: safetyError instanceof Error ? safetyError.message : "Failed to run safety check"
      });
    }

    // Release lock regardless of outcome
    try {
      await releaseAgentLock(tenantId, agent);
    } catch (lockError) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "lock_release_error",
        error: lockError instanceof Error ? lockError.message : "Failed to release lock"
      });
    }

    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runARIA_complete",
      message: "ARIA execution finished (cleanup complete)"
    });
  }
}

/**
 * Execute ARIA logic
 */
async function executeARIA(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Step 1: Update state to running
  await updateAgentState(tenantId, agent, runId, {
    status: "running",
    progress: 0,
    current_task: "Initializing ARIA agent"
  });

  await updateAgentRunStatus(runId, tenantId, "running");

  await logAgentActivity(tenantId, agent, runId, "running", "ARIA agent started: initialization");

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "state_running",
    progress: 0
  });

  // Step 2: Fetch business profile (20%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 20,
    current_task: "Fetching business profile"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "ARIA agent: fetching business profile");

  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("website_url, category")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profileError || !businessProfile?.website_url) {
    throw new Error("Business profile or website URL not found");
  }

  const domain = extractDomain(businessProfile.website_url);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "business_profile_fetched",
    domain,
    category: businessProfile.category
  });

  // Step 3: Fetch keywords (50%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 50,
    current_task: "Fetching keywords"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "ARIA agent: fetching keywords");

  const keywords = await fetchKeywordsForSite(domain);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "keywords_fetched",
    totalKeywords: keywords.length
  });

  // Step 4: Classify intent and process (80%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 80,
    current_task: "Classifying intent and processing"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "ARIA agent: classifying intent");

  const totalRaw = keywords.length;

  // Normalize and validate keywords
  const normalizedKeywords = keywords.filter((kw) => isValidKeyword(kw.keyword));
  const totalNormalized = normalizedKeywords.length;

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "normalization",
    totalRaw,
    totalNormalized
  });

  // Quality filter: volume > 50, difficulty < 80
  const qualityFilteredKeywords = normalizedKeywords.filter((kw) => 
    kw.volume > 50 && kw.difficulty < 80
  );

  const totalFiltered = qualityFilteredKeywords.length;

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "quality_filter",
    totalRaw,
    totalNormalized,
    totalFiltered
  });

  // Data limit: max 100 keywords
  const limitedKeywords = qualityFilteredKeywords.slice(0, 100);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "data_limit",
    beforeLimit: qualityFilteredKeywords.length,
    afterLimit: limitedKeywords.length
  });

  // Safety check: if no valid keywords, complete without insert
  if (limitedKeywords.length === 0) {
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_valid_keywords",
      totalRaw,
      totalNormalized,
      totalFiltered,
      message: "No valid keywords found, completing without insert"
    });

    await updateAgentState(tenantId, agent, runId, {
      status: "completed",
      progress: 100,
      current_task: "Completed (no valid keywords)"
    });

    await updateAgentRunStatus(runId, tenantId, "completed", {
      total_keywords: 0,
      domain,
      category: businessProfile.category,
      total_raw: totalRaw,
      total_normalized: totalNormalized,
      total_filtered: totalFiltered,
      total_inserted: 0,
      message: "No valid keywords found after filtering"
    });

    await logAgentActivity(tenantId, agent, runId, "completed", "ARIA agent completed: no valid keywords found");

    return;
  }

  const processedKeywords = limitedKeywords.map((kw) => ({
    keyword: normalizeKeyword(kw.keyword),
    search_volume: kw.volume,
    difficulty: kw.difficulty,
    intent: classifyIntent(kw.keyword)
  }));

  // Step 5: Store keywords in aria_keywords with deduplication
  await logAgentActivity(tenantId, agent, runId, "running", "ARIA agent: storing keywords");

  const keywordInserts = processedKeywords.map((kw) => ({
    tenant_id: tenantId,
    run_id: runId,
    keyword: kw.keyword,
    search_volume: kw.search_volume,
    difficulty: kw.difficulty,
    intent: kw.intent,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  // Use upsert for deduplication on tenant_id + keyword
  const { error: insertError, count: insertCount } = await supabase
    .from("aria_keywords")
    .upsert(keywordInserts, {
      onConflict: "tenant_id,keyword"
    });

  if (insertError) {
    throw new Error(`Failed to store keywords: ${insertError.message}`);
  }

  const totalInserted = insertCount || processedKeywords.length;

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "keywords_stored",
    count: totalInserted,
    totalInserted: keywordInserts.length
  });

  // Step 6: Complete (100%)
  await updateAgentState(tenantId, agent, runId, {
    status: "completed",
    progress: 100,
    current_task: "Completed"
  });

  await updateAgentRunStatus(runId, tenantId, "completed", {
    total_keywords: processedKeywords.length,
    domain,
    category: businessProfile.category,
    total_raw: totalRaw,
    total_normalized: totalNormalized,
    total_filtered: totalFiltered,
    total_inserted: totalInserted
  });

  await logAgentActivity(tenantId, agent, runId, "completed", `ARIA agent completed successfully: ${processedKeywords.length} keywords gathered`);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runARIA_complete",
    progress: 100,
    totalKeywords: processedKeywords.length,
    totalRaw,
    totalNormalized,
    totalFiltered,
    totalInserted,
    message: "ARIA execution completed successfully"
  });
}
