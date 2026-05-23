import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { runARIA } from "@/lib/agents/aria/aria.service";

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
    await runARIA({
      tenantId,
      agent: 'ARIA',
      runId,
    });

    return NextResponse.json({
      success: true,
      runId,
      agent: 'ARIA',
      tenantId,
      workspaceId: workspaceId || '',
      status: 'started',
    });
  } catch (error) {
    console.error('ARIA discovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start ARIA discovery' },
      { status: 500 }
    );
  }
}
