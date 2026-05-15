import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getExecutionThinkingLogs, groupThinkingLogsByPhase, getThinkingLogsWithArtifacts } from "@/lib/runtime/thinking-integration";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request
) {
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

  // Get executionId from URL query parameters
  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('executionId');

  if (!executionId) {
    return NextResponse.json({ error: "executionId is required" }, { status: 400 });
  }

  try {
    const logs = await getExecutionThinkingLogs(executionId);

    // Verify tenant isolation
    const { data: execution } = await supabase
      .from("agent_executions")
      .select("tenant_id")
      .eq("id", executionId)
      .single();

    if (!execution || execution.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const grouped = groupThinkingLogsByPhase(logs);
    const artifacts = getThinkingLogsWithArtifacts(logs);

    return NextResponse.json({
      logs,
      grouped,
      artifacts: Object.fromEntries(artifacts),
    });
  } catch (error) {
    console.error("Error fetching thinking logs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch thinking logs" },
      { status: 500 }
    );
  }
}
