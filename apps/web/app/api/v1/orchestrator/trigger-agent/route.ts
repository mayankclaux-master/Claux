import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";

// DEPRECATED: This V1 API route uses deprecated runtime tables (agent_runs, agent_states)
// Migrated to canonical RuntimeService and ExecutionOrchestrator (Phase 2B)
// See CLAUX_RUNTIME_TABLE_MIGRATION_REPORT.md for migration path

type AgentName = "ARIA" | "SCRIBE" | "LOCL" | "LINX" | "CORE" | "REPUTE" | "AMPLI" | "PRISM" | "PULSE";

type TriggerAgentRequest = {
  tenant_id?: string;
  agent_name?: string;
  task_type?: string;
  payload?: Record<string, unknown>;
};

const VALID_AGENTS = new Set<AgentName>([
  "ARIA",
  "SCRIBE",
  "LOCL",
  "LINX",
  "CORE",
  "REPUTE",
  "AMPLI",
  "PRISM",
  "PULSE"
]);

function toAgentName(value: string | undefined): AgentName | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  return VALID_AGENTS.has(normalized as AgentName) ? (normalized as AgentName) : null;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as TriggerAgentRequest;
  const agentName = toAgentName(body.agent_name);

  if (!agentName) {
    return NextResponse.json({ error: "Invalid agent name." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
  }

  const tenantId = body.tenant_id ?? profile.tenant_id;

  if (profile.tenant_id !== tenantId) {
    return NextResponse.json({ error: "Forbidden tenant access." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();

  // Get tenant's api_secret
  const { data: tenant, error: tenantError } = await adminClient
    .from("tenants")
    .select("api_secret")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError || !tenant?.api_secret) {
    return NextResponse.json({ error: "Could not retrieve tenant secret." }, { status: 500 });
  }

  const apiSecret = tenant.api_secret;
  const now = new Date().toISOString();
  const runId = randomUUID();
  const taskType = String(body.task_type ?? `manual_${agentName.toLowerCase()}_run`).trim();

  // REMOVED: Direct insert into agent_runs table (Phase 2B)
  // Using canonical RuntimeService and ExecutionOrchestrator instead
  // TODO: Refactor to use RuntimeService directly instead of orchestrator
  // Orchestrator is a V1 minimal stub - agents should use direct execution
  return NextResponse.json(
    { error: "Orchestrator usage deprecated - use RuntimeService directly" },
    { status: 501 }
  );

//   const runtime = new RuntimeService({
//     tenantId,
//     logOperations: true,
//     enableMetrics: false,
//   });
//   const orchestrator = new ExecutionOrchestrator(runtime, {
//     tenantId,
//   });
// 
//   // Create execution using canonical orchestrator
//   const executionResult = await orchestrator.createExecution({
//     agentName,
//     workflowType: taskType,
//     inputPayload: body.payload ?? {},
//     tasks: [], // No pre-defined tasks for manual trigger
//     metadata: {
//       triggered_by: "manual",
//       requested_by_user_id: user.id,
//     },
//   });
// 
//   if (!executionResult.success || !executionResult.data) {
//     return NextResponse.json(
//       { error: executionResult.error?.message || "Failed to create execution" },
//       { status: 500 }
//     );
//   }
// 
//   const executionId = executionResult.data;
// 
//   // Start execution
//   const startResult = await orchestrator.startExecution(executionId);
//   if (!startResult.success) {
//     await orchestrator.failExecution(executionId, startResult.error?.message || "Failed to start execution");
//     return NextResponse.json(
//       { error: startResult.error?.message || "Failed to start execution" },
//       { status: 500 }
//     );
//   }
// 
//   // REMOVED: Direct update to agent_states table (Phase 2B)
//   // Execution state is now managed by canonical ExecutionOrchestrator
// 
//   // REMOVED: n8n webhook trigger (Phase 2B)
//   // External orchestration is forbidden by canonical architecture
//   // Agents are now executed directly via RuntimeService/ExecutionOrchestrator
//   // The agent service functions should be called directly instead of via webhook
// 
//   // For now, return success with execution ID
//   // TODO: Integrate with agent service execution via RuntimeService
//   return NextResponse.json({
//     ok: true,
//     tenant_id: tenantId,
//     agent_name: agentName,
//     execution_id: executionId,
//     task_type: taskType,
//     message: "Execution created successfully via canonical runtime"
//   });
}
