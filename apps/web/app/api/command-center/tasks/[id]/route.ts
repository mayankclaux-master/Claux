import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/command-center/tasks/[id]
 * Update task status, assign user, complete task
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  try {
    const body = await request.json();
    const { status, assigned_to, completed } = body;

    const taskService = new TaskGenerationService();
    let task;

    if (completed) {
      task = await taskService.completeTask(id, tenantId, userId);
    } else if (status) {
      task = await taskService.updateTaskStatus(id, tenantId, status, userId);
    } else if (assigned_to) {
      task = await taskService.assignTask(id, tenantId, assigned_to, userId);
    } else {
      return NextResponse.json({ error: "No valid update provided" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update task' },
      { status: 500 }
    );
  }
}
