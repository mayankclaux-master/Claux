import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getExecutionList } from "@/lib/runtime/execution-timeline";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
  const agentName = searchParams.get('agentName') || undefined;
  const status = searchParams.get('status') || undefined;

  try {
    const result = await getExecutionList(tenantId, {
      limit,
      offset,
      agentName,
      status,
    });

    if (!result) {
      return NextResponse.json({ error: "Failed to fetch executions" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching execution list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch execution list" },
      { status: 500 }
    );
  }
}
