import type { AgentContext } from "../base/agent.types";
import {
  updateAgentState,
  logAgentActivity,
  updateAgentRunStatus,
  releaseAgentLock
} from "../base/agent.logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchBusinessProfile } from "../shared/gmb.client";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for GMB audit

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
 * Calculate completeness score (0-100)
 */
function calculateCompletenessScore(profile: {
  review_count: number;
  photos_count: number;
  posts_count: number;
}): number {
  let score = 0;

  // Reviews: max 40 points (50+ reviews = full points)
  const reviewScore = Math.min(40, (profile.review_count / 50) * 40);
  score += reviewScore;

  // Photos: max 40 points (20+ photos = full points)
  const photoScore = Math.min(40, (profile.photos_count / 20) * 40);
  score += photoScore;

  // Posts: max 20 points (5+ posts = full points)
  const postScore = Math.min(20, (profile.posts_count / 5) * 20);
  score += postScore;

  return Math.round(score);
}

/**
 * Calculate optimization score (0-100)
 */
function calculateOptimizationScore(profile: {
  review_count: number;
  average_rating: number;
  photos_count: number;
  posts_count: number;
}): number {
  let score = 0;

  // Rating impact: max 30 points
  const ratingScore = Math.min(30, (profile.average_rating / 5) * 30);
  score += ratingScore;

  // Review volume: max 30 points
  const reviewScore = Math.min(30, (profile.review_count / 100) * 30);
  score += reviewScore;

  // Photo count: max 20 points
  const photoScore = Math.min(20, (profile.photos_count / 30) * 20);
  score += photoScore;

  // Post count: max 20 points
  const postScore = Math.min(20, (profile.posts_count / 10) * 20);
  score += postScore;

  return Math.round(score);
}

/**
 * Detect missing optimization items
 */
function detectMissingItems(profile: {
  review_count: number;
  photos_count: number;
  posts_count: number;
}): string[] {
  const missingItems: string[] = [];

  if (profile.review_count < 50) {
    missingItems.push("Low review count (target: 50+)");
  }

  if (profile.photos_count < 20) {
    missingItems.push("Insufficient photos (target: 20+)");
  }

  if (profile.posts_count < 5) {
    missingItems.push("No recent posts (target: 5+)");
  }

  return missingItems;
}

/**
 * Generate recommendations
 */
function generateRecommendations(profile: {
  gmb_name: string;
  review_count: number;
  photos_count: number;
  posts_count: number;
}): string[] {
  const recommendations: string[] = [];

  if (profile.review_count < 50) {
    recommendations.push(`Request reviews from recent customers to reach 50+ reviews for ${profile.gmb_name}`);
  }

  if (profile.photos_count < 20) {
    recommendations.push("Upload 10 new business photos to improve visual appeal");
  }

  if (profile.posts_count < 5) {
    recommendations.push("Publish weekly GMB updates to increase engagement");
  }

  if (profile.review_count >= 50 && profile.photos_count >= 20 && profile.posts_count >= 5) {
    recommendations.push("Maintain current optimization level and monitor for improvements");
  }

  return recommendations;
}

/**
 * Run LOCL agent - Google My Business Audit
 */
export async function runLOCL(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runLOCL_start",
    message: "Starting LOCL execution"
  });

  // Timeout protection wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeLOCL(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "runLOCL_error",
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

      await logAgentActivity(tenantId, agent, runId, "failed", `LOCL failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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

        await logAgentActivity(tenantId, agent, runId, "failed", "LOCL forced to failed by safety check: execution did not complete");
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
      step: "runLOCL_complete",
      message: "LOCL execution finished (cleanup complete)"
    });
  }
}

/**
 * Execute LOCL logic
 */
async function executeLOCL(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;
  const supabase = createSupabaseAdminClient();

  // Step 1: Update state to running
  await updateAgentState(tenantId, agent, runId, {
    status: "running",
    progress: 0,
    current_task: "Initializing LOCL agent"
  });

  await updateAgentRunStatus(runId, tenantId, "running");

  await logAgentActivity(tenantId, agent, runId, "running", "LOCL agent started: initialization");

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

  await logAgentActivity(tenantId, agent, runId, "running", "LOCL agent: fetching business profile");

  const { data: businessProfile, error: profileError } = await supabase
    .from("business_profiles")
    .select("business_name")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (profileError || !businessProfile?.business_name) {
    throw new Error("Business profile or business name not found");
  }

  const businessName = businessProfile.business_name;

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "profile_fetched",
    businessName
  });

  // Step 3: Fetch GMB data (50%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 50,
    current_task: "Fetching GMB data"
  });

  await logAgentActivity(tenantId, agent, runId, "running", "LOCL agent: fetching GMB data");

  const gmbProfile = await fetchBusinessProfile(tenantId, businessName);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "gmb_fetched",
    gmbName: gmbProfile.gmb_name,
    reviewCount: gmbProfile.review_count,
    averageRating: gmbProfile.average_rating
  });

  // Step 4: Generate audit (80%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 80,
    current_task: "Generating audit"
  });

  // Calculate scores
  const completenessScore = calculateCompletenessScore(gmbProfile);
  const optimizationScore = calculateOptimizationScore(gmbProfile);

  // Detect missing items
  const missingItems = detectMissingItems(gmbProfile);

  // Generate recommendations
  const recommendations = generateRecommendations(gmbProfile);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "audit_generated",
    completenessScore,
    optimizationScore,
    missingItems,
    recommendations
  });

  // Step 5: Store audit (100%)
  await updateAgentState(tenantId, agent, runId, {
    progress: 100,
    current_task: "Storing audit"
  });

  const { error: insertError } = await supabase
    .from("locl_audits")
    .insert({
      tenant_id: tenantId,
      gmb_name: gmbProfile.gmb_name,
      primary_category: gmbProfile.primary_category,
      review_count: gmbProfile.review_count,
      average_rating: gmbProfile.average_rating,
      photos_count: gmbProfile.photos_count,
      posts_count: gmbProfile.posts_count,
      completeness_score: completenessScore,
      optimization_score: optimizationScore,
      missing_items: missingItems,
      recommendations: recommendations,
      checked_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

  if (insertError) {
    throw new Error(`Failed to store audit: ${insertError.message}`);
  }

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "audit_stored",
    completenessScore,
    optimizationScore
  });

  // Step 6: Complete
  await updateAgentState(tenantId, agent, runId, {
    status: "completed",
    progress: 100,
    current_task: "Completed"
  });

  await updateAgentRunStatus(runId, tenantId, "completed", {
    completeness_score: completenessScore,
    optimization_score: optimizationScore,
    missing_items_count: missingItems.length
  });

  await logAgentActivity(tenantId, agent, runId, "completed", `LOCL agent completed successfully: completeness=${completenessScore}, optimization=${optimizationScore}`);

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runLOCL_complete",
    progress: 100,
    completenessScore,
    optimizationScore,
    message: "LOCL execution completed successfully"
  });
}
