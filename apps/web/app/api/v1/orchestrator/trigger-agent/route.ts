import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getOrCreateOrganizationApiSecret } from "@/lib/organization-secret";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AgentName = "ARIA" | "SCRIBE" | "VISUAL" | "FORGE" | "CORE" | "LINX" | "LOCL" | "REPUTE" | "AMPLI";

type TriggerAgentRequest = {
  org_id?: string;
  agent_name?: string;
  task_type?: string;
  payload?: Record<string, unknown>;
  idempotency_key?: string;
};

const VALID_AGENTS = new Set<AgentName>([
  "ARIA",
  "SCRIBE",
  "VISUAL",
  "FORGE",
  "CORE",
  "LINX",
  "LOCL",
  "REPUTE",
  "AMPLI"
]);

function toAgentName(value: string | undefined): AgentName | null {
  const normalized = String(value ?? "")
    .trim()
    .toUpperCase();

  return VALID_AGENTS.has(normalized as AgentName) ? (normalized as AgentName) : null;
}

function getConnectionColumns(agentName: AgentName) {
  const lower = agentName.toLowerCase();
  return {
    statusColumn: `${lower}_status`,
    progressColumn: `${lower}_progress`
  };
}

export async function POST(request: Request) {
  let body: TriggerAgentRequest;

  try {
    body = (await request.json()) as TriggerAgentRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orgId = String(body.org_id ?? "").trim();
  const agentName = toAgentName(body.agent_name);

  if (!orgId || !agentName) {
    return NextResponse.json({ error: "org_id and a valid agent_name are required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const profile = profileData as { org_id: string; role: string } | null;

  if (profileError || !profile) {
    return NextResponse.json({ error: "Could not verify requester profile." }, { status: 403 });
  }

  if (profile.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden org access." }, { status: 403 });
  }

  if (!new Set(["owner", "admin"]).has(profile.role)) {
    return NextResponse.json({ error: "Only owner/admin users can trigger agents." }, { status: 403 });
  }

  const n8nTriggerUrl =
    process.env.N8N_AGENT_TRIGGER_WEBHOOK_URL ??
    (process.env.N8N_HOST ? `${process.env.N8N_HOST.replace(/\/$/, "")}/webhook/trigger-agent` : "");

  if (!n8nTriggerUrl) {
    return NextResponse.json({ error: "N8N trigger webhook URL is not configured." }, { status: 500 });
  }

  const adminClient = createSupabaseAdminClient();
  const { apiSecret } = await getOrCreateOrganizationApiSecret(adminClient, orgId);

  const now = new Date().toISOString();
  const taskId = randomUUID();
  const orchestratorRunId = randomUUID();
  const taskType = String(body.task_type ?? `manual_${agentName.toLowerCase()}_run`).trim();
  const idempotencyKey =
    String(body.idempotency_key ?? "").trim() || `manual-trigger:${orgId}:${agentName}:${taskType}`;

  const { error: taskError } = await adminClient.from("agent_tasks").insert({
    id: taskId,
    org_id: orgId,
    orchestrator_run_id: orchestratorRunId,
    agent_name: agentName,
    task_type: taskType,
    status: "queued",
    payload: body.payload ?? {},
    requested_by: "manual_trigger",
    scheduled_at: now,
    updated_at: now
  });

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  const { statusColumn, progressColumn } = getConnectionColumns(agentName);
  const { error: connectionError } = await adminClient
    .from("connections")
    .update({ [statusColumn]: "in_progress", [progressColumn]: 1, updated_at: now })
    .eq("org_id", orgId);

  if (connectionError) {
    return NextResponse.json({ error: connectionError.message }, { status: 500 });
  }

  const callbackUrl = new URL("/api/v1/orchestrator/n8n-callback", request.url).toString();
  const triggerResponse = await fetch(n8nTriggerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      event: "manual_agent_trigger",
      org_id: orgId,
      task_id: taskId,
      orchestrator_run_id: orchestratorRunId,
      agent_name: agentName,
      task_type: taskType,
      payload: body.payload ?? {},
      callback_url: callbackUrl,
      api_secret: apiSecret,
      requested_by_user_id: user.id,
      requested_at: now
    })
  });

  if (!triggerResponse.ok) {
    await adminClient
      .from("agent_tasks")
      .update({ status: "failed", failed_at: new Date().toISOString(), error_message: `n8n trigger failed: ${triggerResponse.status}` })
      .eq("id", taskId)
      .eq("org_id", orgId);

    return NextResponse.json(
      { error: `n8n trigger failed with status ${triggerResponse.status}.`, task_id: taskId, agent_name: agentName },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    org_id: orgId,
    agent_name: agentName,
    task_id: taskId,
    orchestrator_run_id: orchestratorRunId,
    task_type: taskType,
    idempotency_key: idempotencyKey
  });
}
