import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";

// DEPRECATED: This dev API route uses deprecated runtime tables (agent_states, agent_activities)
// Migrated to canonical RuntimeService and ExecutionOrchestrator (Phase 2B)
// See CLAUX_RUNTIME_TABLE_MIGRATION_REPORT.md for migration path

export const dynamic = "force-dynamic";

const AGENTS = [
  "ARIA",
  "SCRIBE",
  "LOCL",
  "LINX",
  "CORE",
  "REPUTE",
  "AMPLI",
  "PRISM",
  "PULSE"
] as const;

type AgentName = typeof AGENTS[number];

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const agentName: AgentName = body.agentName || AGENTS[Math.floor(Math.random() * AGENTS.length)];

  const progress = Math.floor(Math.random() * 60) + 10;

  // REMOVED: Direct update to agent_states table (Phase 2B)
  // Using canonical RuntimeService and ExecutionOrchestrator instead
  const runtime = new RuntimeService({
    tenantId: profile.tenant_id,
    logOperations: true,
    enableMetrics: false,
  });
  const orchestrator = new ExecutionOrchestrator(runtime, {
    tenantId: profile.tenant_id,
    enableAutoEvents: true,
    enableAutoLogging: true,
  });

  // Create execution
  const executionResult = await orchestrator.createExecution({
    agentName,
    workflowType: "dev_simulation",
    inputPayload: { simulation: true },
    tasks: [],
    metadata: { progress },
  });

  if (!executionResult.success || !executionResult.data) {
    return NextResponse.json({ error: "Failed to create execution" }, { status: 500 });
  }

  const executionId = executionResult.data;

  // Start execution
  const startResult = await orchestrator.startExecution(executionId);
  if (!startResult.success) {
    return NextResponse.json({ error: "Failed to start execution" }, { status: 500 });
  }

  // REMOVED: Insert into agent_activities table (Phase 2B)
  // Events are now managed by canonical agent_events table via RuntimeService

  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Complete execution
  const completeResult = await orchestrator.completeExecution(executionId);
  if (!completeResult.success) {
    return NextResponse.json({ error: "Failed to complete execution" }, { status: 500 });
  }

  // REMOVED: Update agent_states and insert agent_activities (Phase 2B)
  // Execution state and events are now managed by canonical RuntimeService

  return NextResponse.json({ success: true });
}
