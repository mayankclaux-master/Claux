import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { PulseAgentRuntime } from "@/lib/agents/pulse/runtime";

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

  // Get tenant from profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id, workspace_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = profile.tenant_id;
  const workspaceId = profile.workspace_id;

  // Get execution config from request body
  const body = await request.json();
  const { keywordIds, competitorDomains, enableClustering, enableVolatilityDetection, enableCompetitorAnalysis } = body;

  if (!keywordIds || keywordIds.length === 0) {
    return NextResponse.json({ error: "keywordIds required" }, { status: 400 });
  }

  try {
    const pulseRuntime = new PulseAgentRuntime(tenantId);
    const result = await pulseRuntime.executeRankingAnalysis({
      tenantId,
      workspaceId,
      keywordIds,
      competitorDomains,
      enableClustering: enableClustering ?? true,
      enableVolatilityDetection: enableVolatilityDetection ?? true,
      enableCompetitorAnalysis: enableCompetitorAnalysis ?? false,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Failed to execute PULSE" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: result.data,
      status: 'started',
    });
  } catch (error) {
    console.error("Error executing PULSE:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute PULSE" },
      { status: 500 }
    );
  }
}
