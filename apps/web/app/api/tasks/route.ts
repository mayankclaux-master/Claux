import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

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

  const { searchParams } = new URL(request.url);
  const executionId = searchParams.get('execution_id');
  const status = searchParams.get('status');

  try {
    // Updated to use canonical agent_tasks table (Phase 2A.3)
    let query = supabase
      .from('agent_tasks')
      .select('*')
      .eq('tenant_id', tenantId);

    if (executionId) {
      query = query.eq('execution_id', executionId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tasks: data,
      total: data?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}
