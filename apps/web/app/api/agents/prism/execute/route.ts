import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { PrismAgentRuntime } from "@/lib/agents/prism/runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, workspace_id")
    .eq("id", userId)
    .maybeSingle();

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const body = await request.json();
  const { reportType, dateRange } = body;

  if (!reportType) {
    return NextResponse.json({ error: "reportType required" }, { status: 400 });
  }

  try {
    const prismRuntime = new PrismAgentRuntime(profile.tenant_id);
    const result = await prismRuntime.executeAnalytics({
      tenantId: profile.tenant_id,
      workspaceId: profile.workspace_id,
      reportType,
      dateRange,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Failed to execute PRISM" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: result.data,
      status: 'started',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute PRISM" },
      { status: 500 }
    );
  }
}
