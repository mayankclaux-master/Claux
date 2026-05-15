import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { LinxAgentRuntime } from "@/lib/agents/linx/runtime";

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
  const { domain, competitorDomains, enableCompetitorAnalysis, enableInternalLinkAnalysis } = body;

  if (!domain) {
    return NextResponse.json({ error: "domain required" }, { status: 400 });
  }

  try {
    const linxRuntime = new LinxAgentRuntime(tenantId);
    const result = await linxRuntime.executeBacklinkAnalysis({
      tenantId,
      workspaceId,
      domain,
      competitorDomains,
      enableCompetitorAnalysis: enableCompetitorAnalysis ?? false,
      enableInternalLinkAnalysis: enableInternalLinkAnalysis ?? true,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || "Failed to execute LINX" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: result.data,
      status: 'started',
    });
  } catch (error) {
    console.error("Error executing LINX:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute LINX" },
      { status: 500 }
    );
  }
}
