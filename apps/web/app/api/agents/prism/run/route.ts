import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { runPRISM } from "@/lib/agents/prism/prism.service";

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

  try {
    // Generate a run ID for this execution
    const runId = crypto.randomUUID();

    // Trigger real agent execution via RuntimeService
    await runPRISM({
      tenantId,
      agent: 'PRISM',
      runId,
    });

    return NextResponse.json({
      success: true,
      runId,
      agent: 'PRISM',
      tenantId,
      workspaceId: workspaceId || '',
      status: 'started',
    });
  } catch (error) {
    console.error('PRISM run error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start PRISM execution' },
      { status: 500 }
    );
  }
}
