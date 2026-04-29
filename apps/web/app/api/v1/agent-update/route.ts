import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AgentUpdateRequest = {
  tenant_id: string;
  agent: string;
  status?: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress?: number;
  current_task?: string | null;
  last_error?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();
  const incomingSecret = request.headers.get("x-claux-secret");

  if (!incomingSecret) {
    return NextResponse.json({ error: "Missing X-Claux-Secret header." }, { status: 401 });
  }

  let payload: AgentUpdateRequest;

  try {
    payload = (await request.json()) as AgentUpdateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { tenant_id, agent, status, progress, current_task, last_error, metadata } = payload;

  if (!tenant_id || !agent) {
    return NextResponse.json({ error: "Missing tenant_id or agent." }, { status: 400 });
  }

  // Call the agent_update RPC - it handles api_secret verification internally
  const { error: updateError } = await supabase.rpc("agent_update", {
    p_tenant_id: tenant_id,
    p_agent: agent,
    p_status: status,
    p_progress: progress,
    p_current_task: current_task,
    p_last_error: last_error,
    p_api_secret: incomingSecret,
    p_metadata: metadata || null
  });

  if (updateError) {
    console.error("[agent-update] RPC call failed", {
      tenant_id,
      agent,
      message: updateError.message,
      hint: updateError.hint,
      code: updateError.code,
      details: updateError.details
    });
    // If RPC fails due to secret verification, return 401
    if (updateError.code === "P0001" || updateError.message?.toLowerCase().includes("unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: updateError.message || "Failed to update agent state." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
