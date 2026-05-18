import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AgentContext, AgentName } from "./agent.types";

type AgentStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

// Status machine: allowed transitions
const ALLOWED_TRANSITIONS: Record<AgentStatus, AgentStatus[]> = {
  queued: ["running", "cancelled"],
  running: ["completed", "failed", "cancelled"],
  completed: [],
  failed: [],
  cancelled: []
};

/**
 * Validate status transition
 */
function validateStatusTransition(currentStatus: AgentStatus, newStatus: AgentStatus): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Structured logging helper
 */
function structuredLog(level: "info" | "error" | "warn", data: Record<string, unknown>): void {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...data
  }));
}

/**
 * Acquire DB-level transaction lock for agent
 * Uses pg_advisory_xact_lock which auto-releases on transaction end
 * Returns true if lock acquired, false if already locked
 */
export async function acquireAgentLock(tenantId: string, agent: AgentName): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  const lockKey = `${tenantId}:${agent}`;

  const { data, error } = await supabase.rpc("pg_advisory_xact_lock", {
    lock_key: lockKey
  });

  if (error) {
    structuredLog("error", {
      tenantId,
      agent,
      step: "acquireAgentLock",
      error: error.message
    });
    throw new Error(`Failed to acquire lock: ${error.message}`);
  }

  const acquired = data === true;

  structuredLog("info", {
    tenantId,
    agent,
    step: "acquireAgentLock",
    acquired,
    lockKey
  });

  return acquired;
}

/**
 * Release DB-level transaction lock for agent
 * NOTE: With pg_advisory_xact_lock, lock auto-releases on transaction end
 * This function is kept for cleanup but may not be needed in most cases
 */
export async function releaseAgentLock(tenantId: string, agent: AgentName): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const lockKey = `${tenantId}:${agent}`;

  const { error } = await supabase.rpc("pg_advisory_unlock", {
    lock_key: lockKey
  });

  if (error) {
    structuredLog("error", {
      tenantId,
      agent,
      step: "releaseAgentLock",
      error: error.message
    });
    // Don't throw on release failure, just log
    return;
  }

  structuredLog("info", {
    tenantId,
    agent,
    step: "releaseAgentLock",
    lockKey
  });
}

/**
 * Get active run from agent_runs (source of truth)
 */
export async function getActiveRun(
  tenantId: string,
  agent: AgentName
): Promise<{ id: string; status: string; created_at: string } | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agent_runs")
    .select("id, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("agent", agent)
    .in("status", ["queued", "running"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    structuredLog("error", {
      tenantId,
      agent,
      step: "getActiveRun",
      error: error.message
    });
    throw new Error(`Failed to get active run: ${error.message}`);
  }

  return data;
}

/**
 * Failsafe recovery: mark stale running states as failed
 */
export async function recoverStaleRuns(tenantId: string, agent: AgentName): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

  // Find stale runs
  const { data: staleRuns, error: queryError } = await supabase
    .from("agent_runs")
    .select("id, status, created_at")
    .eq("tenant_id", tenantId)
    .eq("agent", agent)
    .eq("status", "running")
    .lt("created_at", staleThreshold);

  if (queryError) {
    structuredLog("error", {
      tenantId,
      agent,
      step: "recoverStaleRuns_query",
      error: queryError.message
    });
    return; // Don't fail on recovery check
  }

  if (!staleRuns || staleRuns.length === 0) {
    return; // No stale runs
  }

  structuredLog("warn", {
    tenantId,
    agent,
    step: "recoverStaleRuns",
    staleRunsCount: staleRuns.length
  });

  // Mark each stale run as failed
  for (const run of staleRuns) {
    await updateAgentRunStatus(run.id, tenantId, "failed", {
      reason: "stale_run",
      recovered_at: new Date().toISOString(),
      original_created_at: run.created_at
    });

    await updateAgentState(tenantId, agent, run.id, {
      status: "failed",
      last_error: "Run marked as failed due to stale state (exceeded 10 minutes)"
    });

    structuredLog("warn", {
      runId: run.id,
      tenantId,
      agent,
      step: "recoverStaleRun",
      recovered: true
    });
  }
}

/**
 * Create a new agent run record
 */
export async function createAgentRun(
  tenantId: string,
  agent: AgentName,
  triggeredBy: string = "manual"
): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const runId = crypto.randomUUID();

  structuredLog("info", {
    runId,
    tenantId,
    agent,
    step: "createAgentRun",
    triggeredBy
  });

  const { error } = await supabase.from("agent_runs").insert({
    id: runId,
    tenant_id: tenantId,
    agent,
    status: "queued",
    triggered_by: triggeredBy,
    created_at: new Date().toISOString()
  });

  if (error) {
    structuredLog("error", {
      runId,
      tenantId,
      agent,
      step: "createAgentRun",
      error: error.message
    });
    throw new Error(`Failed to create agent run: ${error.message}`);
  }

  return runId;
}

/**
 * Atomic run creation: create run and update state in single logical flow
 */
export async function createAgentRunWithState(
  tenantId: string,
  agent: AgentName,
  triggeredBy: string = "manual",
  executionId?: string
): Promise<string> {
  const runId = await createAgentRun(tenantId, agent, triggeredBy);

  // Immediately update state to ensure atomicity
  await updateAgentState(tenantId, agent, runId, {
    status: "queued",
    progress: 0,
    current_task: "Run created, awaiting execution"
  });

  structuredLog("info", {
    runId,
    tenantId,
    agent,
    step: "createAgentRunWithState",
    executionId,
    message: "Atomic run creation completed"
  });

  return runId;
}

/**
 * Update agent state in agent_states table with run ownership
 */
export async function updateAgentState(
  tenantId: string,
  agent: AgentName,
  runId: string,
  updates: {
    status?: AgentStatus;
    progress?: number;
    current_task?: string | null;
    last_error?: string | null;
  }
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  // Validate status transition if status is being updated
  if (updates.status) {
    const { data: currentState } = await supabase
      .from("agent_states")
      .select("status")
      .eq("tenant_id", tenantId)
      .eq("agent", agent)
      .single();

    if (currentState && !validateStatusTransition(currentState.status as AgentStatus, updates.status)) {
      const error = `Invalid status transition: ${currentState.status} → ${updates.status}`;
      structuredLog("error", {
        runId,
        tenantId,
        agent,
        step: "updateAgentState",
        currentStatus: currentState.status,
        newStatus: updates.status,
        error
      });
      throw new Error(error);
    }
  }

  structuredLog("info", {
    runId,
    tenantId,
    agent,
    step: "updateAgentState",
    updates
  });

  const { error } = await supabase
    .from("agent_states")
    .update({
      ...updates,
      last_run_at: new Date().toISOString(),
      current_run_id: runId // Enforce run ownership
    })
    .eq("tenant_id", tenantId)
    .eq("agent", agent);

  if (error) {
    structuredLog("error", {
      runId,
      tenantId,
      agent,
      step: "updateAgentState",
      error: error.message
    });
    throw new Error(`Failed to update agent state: ${error.message}`);
  }
}

/**
 * Update agent run status
 */
export async function updateAgentRunStatus(
  runId: string,
  tenantId: string,
  status: "queued" | "running" | "completed" | "failed" | "cancelled",
  metadata?: Record<string, unknown>
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  structuredLog("info", {
    runId,
    tenantId,
    step: "updateAgentRunStatus",
    status,
    hasMetadata: !!metadata
  });

  const updateData: Record<string, unknown> = {
    status
  };

  if (status === "completed" || status === "failed" || status === "cancelled") {
    updateData.completed_at = new Date().toISOString();
  }

  if (metadata) {
    updateData.metadata = metadata;
  }

  const { error } = await supabase
    .from("agent_runs")
    .update(updateData)
    .eq("id", runId)
    .eq("tenant_id", tenantId);

  if (error) {
    structuredLog("error", {
      runId,
      tenantId,
      step: "updateAgentRunStatus",
      error: error.message
    });
    throw new Error(`Failed to update agent run status: ${error.message}`);
  }
}

/**
 * Log an agent activity to agent_activities table with run ownership
 */
export async function logAgentActivity(
  tenantId: string,
  agent: AgentName,
  runId: string,
  status: "running" | "completed" | "failed",
  statusMessage: string
): Promise<void> {
  const supabase = createSupabaseAdminClient();

  structuredLog("info", {
    runId,
    tenantId,
    agent,
    step: "logAgentActivity",
    status,
    statusMessage
  });

  const { error } = await supabase.from("agent_activities").insert({
    tenant_id: tenantId,
    agent_name: agent,
    run_id: runId, // Enforce run ownership
    status,
    status_message: statusMessage,
    created_at: new Date().toISOString()
  });

  if (error) {
    structuredLog("error", {
      runId,
      tenantId,
      agent,
      step: "logAgentActivity",
      error: error.message
    });
    throw new Error(`Failed to log agent activity: ${error.message}`);
  }
}

/**
 * Get current agent state for idempotency check
 */
export async function getAgentState(
  tenantId: string,
  agent: AgentName
): Promise<{ status: AgentStatus; current_run_id?: string | null } | null> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agent_states")
    .select("status, current_run_id")
    .eq("tenant_id", tenantId)
    .eq("agent", agent)
    .maybeSingle();

  if (error) {
    structuredLog("error", {
      tenantId,
      agent,
      step: "getAgentState",
      error: error.message
    });
    throw new Error(`Failed to get agent state: ${error.message}`);
  }

  return data;
}
