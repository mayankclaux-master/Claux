import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getExecutionTimeline } from "@/lib/runtime/execution-timeline";

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
    const timeline = await getExecutionTimeline(executionId);

    if (!timeline) {
      return NextResponse.json({ error: "Execution not found" }, { status: 404 });
    }

    // Verify tenant isolation
    const { data: execution } = await supabase
      .from("agent_executions")
      .select("tenant_id")
      .eq("id", executionId)
      .single();

    if (!execution || execution.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Error fetching execution timeline:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch execution timeline" },
      { status: 500 }
    );
  }
}
