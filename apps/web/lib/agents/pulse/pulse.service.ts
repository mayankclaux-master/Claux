import type { AgentContext } from "../base/agent.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// REMOVED: Agent Logger dependencies (Phase 2B - execution authority enforcement)
// Agents must NOT control execution state, logging, or locks
// See CLAUX_AGENT_OWNED_EXECUTION_CONTROL_AUDIT.md for migration path

// REMOVED: Direct provider client calls (Phase 3A - provider execution sovereignty)
// Agents must NOT call providers directly
// Provider execution must flow through: RuntimeService → Runtime Connector → Provider
// See CLAUX_PROVIDER_EXECUTION_SOVEREIGNTY_AUDIT.md for migration path

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for ranking checks

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
 * Generate deterministic hash from string (for testing only)
 */
function stringToHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
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
      message: "PULSE agent cleanup complete"
    });

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
    message: "PULSE agent started"
  });

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "state_running",
    progress: 0
  });

  // Step 2: Fetch business profile and extract domain (20%)
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
  // REMOVED: State and activity logging (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "fetching_keywords",
    progress: 50
  });

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

    // REMOVED: State and run status updates (Phase 2B)
    structuredLog("warn", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "no_keywords_found",
      progress: 100,
      message: "No keywords found, completing without ranking checks"
    });

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
  // REMOVED: State updates (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "fetching_rankings",
    progress: 80
  });

  const rankings: Array<{
    keyword: string;
    current_rank: number | null;
    url: string;
    search_volume: number;
    intent: string;
  }> = [];

  for (const keywordData of keywords) {
    // REMOVED: Activity logging (Phase 2B)
    structuredLog("info", {
      runId,
      executionId,
      tenantId,
      agent,
      step: "checking_rank",
      keyword: keywordData.keyword
    });

    // FORBIDDEN MOCK EXECUTION REMOVED (TASK 4A.0.4)
    // Must use canonical RuntimeService execution flow
    // Integration required: RuntimeService → TaskOrchestrator → SERP Connector
    throw new Error("RuntimeService integration required for ranking tracking");

  }

  // Step 5: Process movement and store rankings (100%)
  // REMOVED: State updates (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "processing_movement",
    progress: 100
  });

  // Step 6: Complete
  // REMOVED: State and run status updates (Phase 2B)
  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "complete",
    progress: 100,
    message: "PULSE execution completed successfully"
  });

  structuredLog("info", {
    runId,
    executionId,
    tenantId,
    agent,
    step: "runPULSE_complete",
    progress: 100,
    message: "PULSE execution completed successfully"
  });
}
