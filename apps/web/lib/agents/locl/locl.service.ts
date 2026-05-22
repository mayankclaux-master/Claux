import type { AgentContext } from "../base/agent.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// REMOVED: Agent Logger dependencies (Phase 2B - execution authority enforcement)
// Agents must NOT control execution state, logging, or locks
// See CLAUX_AGENT_OWNED_EXECUTION_CONTROL_AUDIT.md for migration path

// REMOVED: Direct provider client calls (Phase 3A - provider execution sovereignty)
// Agents must NOT call providers directly
// Provider execution must flow through: RuntimeService → Runtime Connector → Provider
// See CLAUX_PROVIDER_EXECUTION_SOVEREIGNTY_AUDIT.md for migration path

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for GMB audit

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

    // Failure handling: log error only
    // REMOVED: Agent state, run status, and activity logging (Phase 2B)
    // Execution state is now managed by RuntimeService/ExecutionOrchestrator
    structuredLog("error", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "failure_handling",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  } finally {
    // REMOVED: Safety check and lock release (Phase 2B)
    // Execution state and locks are now managed by RuntimeService/ExecutionOrchestrator
    // Agents are pure business logic executors, NOT execution controllers
    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "cleanup_complete",
      message: "LOCL agent cleanup complete"
    });

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

  // Step 1: Log start
  // REMOVED: State and run status updates (Phase 2B)
  // Execution state is now managed by RuntimeService/ExecutionOrchestrator
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "initialization",
    progress: 0,
    message: "LOCL agent started"
  });

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "state_running",
    progress: 0
  });

  // Step 2: Fetch business profile (20%)
  // REMOVED: State and activity logging (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "fetching_business_profile",
    progress: 20
  });

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
  // REMOVED: State and activity logging (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "fetching_gmb_data",
    progress: 50
  });

  // FORBIDDEN MOCK EXECUTION REMOVED (TASK 4A.0.4)
  // Must use canonical RuntimeService execution flow
  // Integration required: RuntimeService → TaskOrchestrator → GMB Connector
  throw new Error("RuntimeService integration required for GMB audit");
}
