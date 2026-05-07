import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import {
  getActiveRun,
  createAgentRunWithState,
  recoverStaleRuns
} from "@/lib/agents/base/agent.logger";
import { runPULSE } from "@/lib/agents/pulse/pulse.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  // Get tenant from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = profile.tenant_id;

  try {
    // Failsafe recovery: check for stale running states
    await recoverStaleRuns(tenantId, "PULSE");

    // Idempotency check: use agent_runs as source of truth
    const activeRun = await getActiveRun(tenantId, "PULSE");
    
    if (activeRun && (activeRun.status === "queued" || activeRun.status === "running")) {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "info",
        tenantId,
        agent: "PULSE",
        step: "idempotency_check",
        existingRunId: activeRun.id,
        status: activeRun.status,
        message: "Agent already has active run, returning existing runId"
      }));

      return NextResponse.json({
        success: true,
        runId: activeRun.id,
        agent: "PULSE",
        tenantId,
        alreadyRunning: true
      });
    }

    // Atomic run creation: uses RPC with transaction lock internally
    const executionId = `${crypto.randomUUID()}:${Date.now()}`;
    const runId = await createAgentRunWithState(tenantId, "PULSE", userId, executionId);

    // Create context
    const context = {
      tenantId,
      agent: "PULSE" as const,
      runId
    };

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      runId,
      executionId,
      tenantId,
      agent: "PULSE",
      step: "api_trigger",
      message: "PULSE triggered successfully"
    }));

    // Background execution: void to ensure non-blocking
    void runPULSE(context);

    return NextResponse.json({
      success: true,
      runId,
      agent: "PULSE",
      tenantId
    });
  } catch (error) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      tenantId,
      agent: "PULSE",
      step: "api_error",
      error: error instanceof Error ? error.message : "Failed to start PULSE"
    }));
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start PULSE" },
      { status: 500 }
    );
  }
}
