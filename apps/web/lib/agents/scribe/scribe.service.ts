import type { AgentContext } from "../base/agent.types";
import {
  updateAgentState,
  logAgentActivity,
  updateAgentRunStatus,
  releaseAgentLock
} from "../base/agent.logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateArticle, estimateWordCount } from "../shared/openai.client";

const EXECUTION_TIMEOUT_MS = 60000; // 60 seconds for content generation

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
 * Check if content already exists for keyword
 */
async function contentExistsForKeyword(tenantId: string, keyword: string): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("scribe_content")
    .select("id")
    .eq("tenant_id", tenantId)
    .contains("target_keywords", [keyword])
    .limit(1)
    .maybeSingle();

  if (error) {
    return false; // On error, assume doesn't exist and proceed
  }

  return !!data;
}

/**
 * Run SCRIBE agent - Content Generation
 */
export async function runSCRIBE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runSCRIBE_start",
    message: "Starting SCRIBE execution"
  });

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
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runSCRIBE_error",
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

      await logAgentActivity(tenantId, agent, runId, "failed", `SCRIBE failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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

        await updateAgentState(tenantId, agent, runId, {
          status: "failed",
          last_error: "Execution did not complete properly (forced failure by safety check)"
        });

        await updateAgentRunStatus(runId, tenantId, "failed", {
          reason: "safety_check_forced_failure",
          original_status: currentState.status,
          forced_at: new Date().toISOString()
        });

        await logAgentActivity(tenantId, agent, runId, "failed", "SCRIBE forced to failed by safety check: execution did not complete");
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
      step: "runSCRIBE_complete",
      message: "SCRIBE execution finished (cleanup complete)"
    });
  }
}

/**
 * Execute SCRIBE logic
 */
async function executeSCRIBE(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Step 1: Update state to running
  await updateAgentState(tenantId, agent, runId, {
    status: "running",
    progress: 0,
    current_task: "Initializing SCRIBE agent"
  });

  await updateAgentRunStatus(runId, tenantId, "running");

  await logAgentActivity(tenantId, agent, runId, "running", "SCRIBE agent started: initialization");

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

  await logAgentActivity(tenantId, agent, runId, "running", "SCRIBE agent: fetching business profile");

  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("category")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profileError || !businessProfile?.category) {
    throw new Error("Business profile or category not found");
  }

  const businessCategory = businessProfile.category;

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "business_profile_fetched",
    category: businessCategory
  });

  // Step 3: Fetch high intent keywords from ARIA with diversification (50%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 50,
    current_task: "Fetching high intent keywords"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "SCRIBE agent: fetching high intent keywords");

  const { data: allKeywords, error: keywordsError } = await supabase
    .from("aria_keywords")
    .select("keyword, search_volume")
    .eq("tenant_id", tenantId)
    .in("intent", ["transactional", "commercial"])
    .order("search_volume", { ascending: false })
    .limit(20); // Fetch more to allow diversification

  if (keywordsError) {
    throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
  }

  if (!allKeywords || allKeywords.length === 0) {
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_keywords_found",
      message: "No high intent keywords found, completing without content generation"
    });

    await updateAgentState(tenantId, agent, runId, {
      status: "completed",
      progress: 100,
      current_task: "Completed (no keywords found)"
    });

    await updateAgentRunStatus(runId, tenantId, "completed", {
      attempted: 0,
      generated: 0,
      skipped_existing: 0,
      skipped_low_quality: 0,
      message: "No high intent keywords found for content generation"
    });

    await logAgentActivity(tenantId, agent, runId, "completed", "SCRIBE agent completed: no keywords found");

    return;
  }

  // Diversify: 2 high volume, 2 medium volume, 1 low volume
  const highVolume = allKeywords.slice(0, 2);
  const mediumVolume = allKeywords.slice(2, 4);
  const lowVolume = allKeywords.slice(-1);
  const diversifiedKeywords = [...highVolume, ...mediumVolume, ...lowVolume];

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "keywords_diversified",
    totalFetched: allKeywords.length,
    selected: diversifiedKeywords.length
  });

  // Step 4: Generate articles with safe loop (80%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 80,
    current_task: "Generating content"
  });

  const generatedArticles: Array<{
    title: string;
    body_html: string;
    word_count: number;
    target_keywords: string[];
  }> = [];

  let attempted = 0;
  let skippedExisting = 0;
  let skippedLowQuality = 0;

  for (const keywordData of diversifiedKeywords) {
    attempted++;

    try {
      // Check for duplicate content
      const exists = await contentExistsForKeyword(tenantId, keywordData.keyword);
      if (exists) {
        skippedExisting++;
        structuredLog("info", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "content_exists",
          keyword: keywordData.keyword,
          message: "Content already exists, skipping"
        });
        continue;
      }

      await logAgentActivity(tenantId, agent, runId, "running", `SCRIBE agent: generating article for ${keywordData.keyword}`);

      const article = await generateArticle({
        keyword: keywordData.keyword,
        businessCategory
      });

      const wordCount = estimateWordCount(article.content);

      // Quality check: minimum 300 words
      if (wordCount < 300) {
        skippedLowQuality++;
        structuredLog("warn", {
          runId,
          executionId,
          tenantId,
          agent,
          step: "low_quality_content",
          keyword: keywordData.keyword,
          wordCount,
          message: "Content below quality threshold, skipping"
        });
        continue;
      }

      generatedArticles.push({
        title: normalizeTitle(article.title),
        body_html: article.content,
        word_count: wordCount,
        target_keywords: [keywordData.keyword]
      });

      structuredLog("info", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "article_generated",
        keyword: keywordData.keyword,
        wordCount
      });
    } catch (error) {
      structuredLog("error", {
        runId,
        executionId,
        tenantId,
        agent,
        step: "article_generation_error",
        keyword: keywordData.keyword,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      // Continue with next keyword, don't fail entire run
    }
  }

  // Step 5: Store content in scribe_content
  await logAgentActivity(tenantId, agent, runId, "running", "SCRIBE agent: storing content");

  const contentInserts = generatedArticles.map((article) => ({
    tenant_id: tenantId,
    run_id: runId,
    title: article.title,
    body_html: article.body_html,
    status: "draft",
    target_keywords: article.target_keywords,
    word_count: article.word_count,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  const { error: insertError } = await supabase
    .from("scribe_content")
    .insert(contentInserts);

  if (insertError) {
    throw new Error(`Failed to store content: ${insertError.message}`);
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "content_stored",
    count: contentInserts.length
  });

  // Step 6: Complete (100%)
  await updateAgentState(tenantId, agent, runId, {
    status: "completed",
    progress: 100,
    current_task: "Completed"
  });

  await updateAgentRunStatus(runId, tenantId, "completed", {
    attempted,
    generated: generatedArticles.length,
    skipped_existing: skippedExisting,
    skipped_low_quality: skippedLowQuality,
    category: businessCategory
  });

  await logAgentActivity(tenantId, agent, runId, "completed", `SCRIBE agent completed successfully: ${generatedArticles.length} articles generated`);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runSCRIBE_complete",
    progress: 100,
    attempted,
    generated: generatedArticles.length,
    skippedExisting,
    skippedLowQuality,
    message: "SCRIBE execution completed successfully"
  });
}
