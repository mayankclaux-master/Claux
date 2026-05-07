import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  // Update agent_states
  const { error: updateError } = await supabase
    .from("agent_states")
    .update({
      status: status || null,
      progress: progress || null,
      current_task: current_task || null,
      last_run_at: new Date().toISOString()
    })
    .eq("tenant_id", tenant_id)
    .eq("agent", agent);

  if (updateError) {
    console.error("[agent-update] Agent states update error:", updateError);
    return NextResponse.json({ error: "Failed to update agent state." }, { status: 500 });
  }

  // Insert into agent_runs
  const { error: insertError } = await supabase
    .from("agent_runs")
    .insert({
      tenant_id,
      agent,
      started_at: new Date().toISOString(),
      status: status || "running",
      metadata: metadata || null
    });

  if (insertError) {
    console.error("[agent-update] Agent runs insert error:", insertError);
    // Don't fail the request if insert fails, just log it
  }

  return NextResponse.json({ success: true });
}
