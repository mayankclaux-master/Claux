import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getOrCreateOrganizationApiSecret } from "@/lib/organization-secret";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AgentName = "ARIA" | "SCRIBE" | "VISUAL" | "FORGE" | "CORE" | "LINX" | "LOCL" | "REPUTE" | "AMPLI";

type SanityHeartbeatRequest = {
  org_id?: string;
  agent_name?: AgentName;
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

function normalizeSecret(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  let body: SanityHeartbeatRequest;

  try {
    body = (await request.json()) as SanityHeartbeatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orgId = String(body.org_id ?? "").trim();
  const agentName = (String(body.agent_name ?? "ARIA").trim().toUpperCase() || "ARIA") as AgentName;

  if (!orgId) {
    return NextResponse.json({ error: "org_id is required." }, { status: 400 });
  }

  if (!VALID_AGENTS.has(agentName)) {
    return NextResponse.json({ error: "Invalid agent_name." }, { status: 400 });
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
    return NextResponse.json({ error: "Only owner/admin users can run sanity checks." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const taskId = randomUUID();

  const { apiSecret } = await getOrCreateOrganizationApiSecret(adminClient, orgId);

  const { error: taskError } = await adminClient.from("agent_tasks").insert({
    id: taskId,
    org_id: orgId,
    agent_name: agentName,
    task_type: "manual_sanity_heartbeat",
    status: "in_progress",
    payload: { source: "agents_page_sanity" },
    requested_by: "manual_sanity",
    scheduled_at: now,
    started_at: now,
    last_heartbeat_at: now,
    updated_at: now
  });

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  const callbackUrl = new URL("/api/v1/orchestrator/n8n-callback", request.url).toString();
  const callbackResponse = await fetch(callbackUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-claux-secret": normalizeSecret(apiSecret)
    },
    body: JSON.stringify({
      org_id: orgId,
      task_id: taskId,
      event: "heartbeat",
      agent_name: agentName,
      progress: 42,
      status_message: "Manual heartbeat sanity check",
      payload: {
        source: "admin_control_surface"
      }
    })
  });

  if (!callbackResponse.ok) {
    const bodyText = await callbackResponse.text();
    return NextResponse.json(
      {
        error: `Callback heartbeat failed (${callbackResponse.status}).`,
        details: bodyText
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    org_id: orgId,
    agent_name: agentName,
    task_id: taskId
  });
}
