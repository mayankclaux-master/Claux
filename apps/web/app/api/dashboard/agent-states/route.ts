import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  // REMOVED: Query from deprecated agent_states table (Phase 2B)
  // Using canonical agent_executions table instead
  const { data: executions, error: executionsError } = await supabase
    .from("agent_executions")
    .select("*")
    .eq("tenant_id", profile.tenant_id);

  console.log("[Agent States] Query result:", {
    tenant_id: profile.tenant_id,
    count: executions?.length || 0,
    error: executionsError
  });

  if (executionsError) {
    console.error("[Agent States] Fetch error:", {
      message: executionsError.message,
      details: executionsError.details,
      hint: executionsError.hint,
      code: executionsError.code
    });
    return Response.json({ error: "Failed to fetch agent executions" }, { status: 500 });
  }

  if (!executions || executions.length === 0) {
    console.warn("[Agent States] No agent executions found for tenant:", profile.tenant_id);
  }

  // Transform executions to match expected agent_states format
  const transformedData = executions?.map((exec: any) => ({
    agent: exec.agent_name,
    status: exec.status,
    progress: exec.progress || 0,
    current_task: exec.workflow_type,
    last_run_at: exec.started_at,
    updated_at: exec.updated_at,
    ...exec
  }));

  return Response.json({
    data: transformedData
  });
}
