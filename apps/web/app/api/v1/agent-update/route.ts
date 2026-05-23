import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";

// DEPRECATED: This V1 API route uses deprecated runtime tables (agent_runs, agent_states)
// Migrated to canonical RuntimeService and ExecutionOrchestrator (Phase 2B)
// See CLAUX_RUNTIME_TABLE_MIGRATION_REPORT.md for migration path

type AgentUpdateRequest = {
  api_secret: string;
  tenant_id: string;
  agent: string;
  status?: string;
  progress?: number;
  current_task?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();

  let payload: AgentUpdateRequest;

  try {
    payload = (await request.json()) as AgentUpdateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { api_secret, tenant_id, agent, status, progress, current_task, metadata } = payload;

  if (!api_secret || !tenant_id || !agent) {
    return NextResponse.json({ error: "Missing api_secret, tenant_id, or agent." }, { status: 400 });
  }

  // Validate tenant exists and api_secret matches
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, api_secret")
    .eq("id", tenant_id)
    .maybeSingle();

  if (tenantError) {
    console.error("[agent-update] Tenant query error:", tenantError);
    return NextResponse.json({ error: "Failed to validate tenant." }, { status: 500 });
  }

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  if (tenant.api_secret !== api_secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // REMOVED: Direct update to agent_states table (Phase 2B)
  // Using canonical RuntimeService and ExecutionOrchestrator instead
  // TODO: Refactor to use RuntimeService directly instead of orchestrator
  // Orchestrator is a V1 minimal stub - agents should use direct execution
  return NextResponse.json(
    { error: "Orchestrator usage deprecated - use RuntimeService directly" },
    { status: 501 }
  );

  const runtime = new RuntimeService({
    tenantId: tenant_id,
    logOperations: true,
    enableMetrics: false,
  });
  const orchestrator = new ExecutionOrchestrator(runtime, {
    tenantId: tenant_id,
  });

//   // Find latest execution for this agent
//   const { data: latestExecution } = await supabase
//     .from("agent_executions")
//     .select("id, status")
//     .eq("tenant_id", tenant_id)
//     .eq("agent_name", agent)
//     .order("created_at", { ascending: false })
//     .limit(1)
//     .maybeSingle();
// 
//   if (latestExecution) {
//     // Update existing execution status if provided
//     if (status) {
//       if (status === "completed") {
//         await orchestrator.completeExecution(latestExecution.id);
//       } else if (status === "failed") {
//         await orchestrator.failExecution(latestExecution.id, current_task || "Agent failed");
//       } else if (status === "running") {
//         await orchestrator.startExecution(latestExecution.id);
//       }
//     }
//   } else {
//     // Create new execution if none exists
//     const executionResult = await orchestrator.createExecution({
//       agentName: agent,
//       workflowType: current_task || "manual_update",
//       inputPayload: metadata || {},
//       tasks: [],
//       metadata: metadata || {},
//     });
// 
//     if (executionResult.success && executionResult.data) {
//       await orchestrator.startExecution(executionResult.data);
//     }
//   }
// 
//   // REMOVED: Insert into agent_runs table (Phase 2B)
  // Executions are now managed by canonical agent_executions table

  return NextResponse.json({ success: true });
}
