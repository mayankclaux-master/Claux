import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getTaskIntrospection } from "@/lib/runtime/task-introspection";

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

  // Get taskId from URL query parameters
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  try {
    const introspection = await getTaskIntrospection(taskId);

    if (!introspection) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Verify tenant isolation
    const { data: task } = await supabase
      .from("agent_tasks")
      .select("execution_id")
      .eq("id", taskId)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const { data: execution } = await supabase
      .from("agent_executions")
      .select("tenant_id")
      .eq("id", task.execution_id)
      .single();

    if (!execution || execution.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(introspection);
  } catch (error) {
    console.error("Error fetching task introspection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch task introspection" },
      { status: 500 }
    );
  }
}
