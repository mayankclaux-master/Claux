import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const supabase = createSupabaseServerClient();
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

  // Insert record in agent_runs (status: 'queued')
  const { error: runError } = await adminClient.from("agent_runs").insert({
    id: runId,
    tenant_id: tenantId,
    agent: agentName,
    status: "queued",
    triggered_by: "manual",
    created_at: now
  });

  if (runError) {
    return NextResponse.json({ error: runError.message }, { status: 500 });
  }

  // Set agent status to 'running' in agent_states
  const { error: stateError } = await adminClient
    .from("agent_states")
    .update({
      status: "running",
      progress: 0,
      current_task: taskType,
      last_run_at: now
    })
    .eq("tenant_id", tenantId)
    .eq("agent", agentName);

  if (stateError) {
    return NextResponse.json({ error: stateError.message }, { status: 500 });
  }

  // POST to n8n webhook
  const n8nTriggerUrl = process.env.N8N_HOST
    ? `${process.env.N8N_HOST.replace(/\/$/, "")}/webhook/trigger-agent`
    : "";

  if (!n8nTriggerUrl) {
    return NextResponse.json({ error: "N8N trigger webhook URL is not configured." }, { status: 500 });
  }

  try {
    const triggerResponse = await fetch(n8nTriggerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        tenant_id: tenantId,
        run_id: runId,
        agent_name: agentName,
        task_type: taskType,
        api_secret: apiSecret,
        payload: body.payload ?? {},
        requested_by_user_id: user.id,
        requested_at: now
      })
    });

    if (!triggerResponse.ok) {
      // Update agent_runs status to failed
      await adminClient
        .from("agent_runs")
        .update({ status: "failed", completed_at: new Date().toISOString() })
        .eq("id", runId)
        .eq("tenant_id", tenantId);

      // Update agent_states status to failed
      await adminClient
        .from("agent_states")
        .update({ status: "failed", last_error: `n8n trigger failed: ${triggerResponse.status}` })
        .eq("tenant_id", tenantId)
        .eq("agent", agentName);

      return NextResponse.json(
        { error: `n8n trigger failed with status ${triggerResponse.status}.` },
        { status: 502 }
      );
    }
  } catch (fetchError) {
    // Update agent_runs status to failed
    await adminClient
      .from("agent_runs")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", runId)
      .eq("tenant_id", tenantId);

    // Update agent_states status to failed
    await adminClient
      .from("agent_states")
      .update({ status: "failed", last_error: "n8n webhook connection failed" })
      .eq("tenant_id", tenantId)
      .eq("agent", agentName);

    return NextResponse.json({ error: "Failed to connect to n8n webhook." }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    tenant_id: tenantId,
    agent_name: agentName,
    run_id: runId,
    task_type: taskType
  });
}
