import type { AgentContext } from "../base/agent.types";
import {
  updateAgentState,
  logAgentActivity,
  updateAgentRunStatus,
  releaseAgentLock
} from "../base/agent.logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchKeywordRank } from "../shared/serp.client";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for ranking checks

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
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

/**
 * Check if result URL matches target domain
 */
function isDomainMatch(resultUrl: string, domain: string): boolean {
  try {
    const resultDomain = extractDomain(resultUrl);
    return resultDomain.includes(domain) || domain.includes(resultDomain);
  } catch {
    return false;
  }
}

/**
 * Calculate tracking priority based on search volume and intent
 */
function calculateTrackingPriority(searchVolume: number, intent: string): 'high' | 'medium' | 'low' {
  if (searchVolume > 1000 && (intent === 'transactional' || intent === 'commercial')) {
    return 'high';
  } else if (searchVolume > 100) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Calculate visibility score from rank
 */
function calculateVisibilityScore(rank: number | null): number | null {
  if (rank === null) return null;
  return Math.max(0, 101 - rank);
}

/**
 * Run PULSE agent - Keyword Ranking Tracking
 */
export async function runPULSE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runPULSE_start",
    message: "Starting PULSE execution"
  });

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePULSE(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runPULSE_error",
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

      await logAgentActivity(tenantId, agent, runId, "failed", `PULSE failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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

        await logAgentActivity(tenantId, agent, runId, "failed", "PULSE forced to failed by safety check: execution did not complete");
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
      step: "runPULSE_complete",
      message: "PULSE execution finished (cleanup complete)"
    });
  }
}

/**
 * Execute PULSE logic
 */
async function executePULSE(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Step 1: Update state to running
  await updateAgentState(tenantId, agent, runId, {
    status: "running",
    progress: 0,
    current_task: "Initializing PULSE agent"
  });

  await updateAgentRunStatus(runId, tenantId, "running");

  await logAgentActivity(tenantId, agent, runId, "running", "PULSE agent started: initialization");

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "state_running",
    progress: 0
  });

  // Step 2: Fetch business profile and extract domain (20%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 20,
    current_task: "Fetching business profile"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "PULSE agent: fetching business profile");

  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("website")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profileError || !businessProfile?.website) {
    throw new Error("Business profile or website not found");
  }

  const domain = extractDomain(businessProfile.website);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "domain_extracted",
    domain
  });

  // Step 3: Fetch tracked keywords from ARIA (50%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 50,
    current_task: "Fetching tracked keywords"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "PULSE agent: fetching tracked keywords");

  const { data: keywords, error: keywordsError } = await supabase
    .from("aria_keywords")
    .select("keyword, search_volume, intent")
    .eq("tenant_id", tenantId)
    .order("search_volume", { ascending: false })
    .limit(20);

  if (keywordsError) {
    throw new Error(`Failed to fetch keywords: ${keywordsError.message}`);
  }

  if (!keywords || keywords.length === 0) {
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_keywords_found",
      message: "No keywords found, completing without ranking checks"
    });

    await updateAgentState(tenantId, agent, runId, {
      status: "completed",
      progress: 100,
      current_task: "Completed (no keywords found)"
    });

    await updateAgentRunStatus(runId, tenantId, "completed", {
      rankings_checked: 0,
      message: "No keywords found for ranking checks"
    });

    await logAgentActivity(tenantId, agent, runId, "completed", "PULSE agent completed: no keywords found");

    return;
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "keywords_fetched",
    count: keywords.length
  });

  // Step 4: Fetch rankings (80%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 80,
    current_task: "Fetching rankings"
  });

  const rankings: Array<{
    keyword: string;
    current_rank: number | null;
    url: string;
    search_volume: number;
    intent: string;
  }> = [];

  for (const keywordData of keywords) {
    await logAgentActivity(tenantId, agent, runId, "running", `PULSE agent: checking rank for ${keywordData.keyword}`);

    const rankResult = await fetchKeywordRank({
      keyword: keywordData.keyword,
      domain
    });

    // Validate domain match
    const domainMatch = isDomainMatch(rankResult.url, domain);
    const finalRank = domainMatch ? rankResult.rank : null;

    rankings.push({
      keyword: keywordData.keyword,
      current_rank: finalRank,
      url: rankResult.url,
      search_volume: keywordData.search_volume || 0,
      intent: keywordData.intent || 'informational'
    });

    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "rank_fetched",
      keyword: keywordData.keyword,
      rank: rankResult.rank
    });
  }

  // Step 5: Process movement and store rankings (100%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 100,
    current_task: "Processing movement"
  });

  const rankingInserts = [];

  for (const ranking of rankings) {
    // Fetch previous ranking for this keyword
    const { data: previousRanking } = await supabase
      .from("pulse_rankings")
      .select("current_rank")
      .eq("tenant_id", tenantId)
      .eq("keyword", ranking.keyword)
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousRank = previousRanking?.current_rank;
    const rankChange = (previousRank && ranking.current_rank) ? previousRank - ranking.current_rank : null;

    // Calculate tracking priority and visibility score
    const trackingPriority = calculateTrackingPriority(ranking.search_volume, ranking.intent);
    const visibilityScore = calculateVisibilityScore(ranking.current_rank);
    const status = ranking.current_rank !== null ? 'success' : 'failed';

    rankingInserts.push({
      tenant_id: tenantId,
      keyword: ranking.keyword,
      url: ranking.url,
      search_engine: "google",
      location: "us",
      device: "desktop",
      current_rank: ranking.current_rank,
      previous_rank: previousRank,
      rank_change: rankChange,
      tracking_priority: trackingPriority,
      visibility_score: visibilityScore,
      status: status,
      checked_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "movement_calculated",
      keyword: ranking.keyword,
      currentRank: ranking.current_rank,
      previousRank,
      rankChange
    });
  }

  const { error: insertError } = await supabase
    .from("pulse_rankings")
    .insert(rankingInserts);

  if (insertError) {
    throw new Error(`Failed to store rankings: ${insertError.message}`);
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "rankings_stored",
    count: rankingInserts.length
  });

  // Step 6: Complete
  await updateAgentState(tenantId, agent, runId, {
    status: "completed",
    progress: 100,
    current_task: "Completed"
  });

  await updateAgentRunStatus(runId, tenantId, "completed", {
    rankings_checked: rankings.length,
    domain
  });

  await logAgentActivity(tenantId, agent, runId, "completed", `PULSE agent completed successfully: ${rankings.length} rankings checked`);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runPULSE_complete",
    progress: 100,
    rankingsChecked: rankings.length,
    domain,
    message: "PULSE execution completed successfully"
  });
}
