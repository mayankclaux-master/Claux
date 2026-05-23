import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskFilters } from "@/lib/command-center/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/command-center/tasks
 * Fetch tenant tasks with filtering and pagination
 */
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
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const agent_name = searchParams.get('agent_name');
  const task_type = searchParams.get('task_type');
  const assigned_to = searchParams.get('assigned_to');
  const client_id = searchParams.get('client_id');
  const page = parseInt(searchParams.get('page') || '1');
  const page_size = parseInt(searchParams.get('page_size') || '50');

  try {
    const filters: TaskFilters = {};
    if (status) filters.status = status as any;
    if (priority) filters.priority = priority as any;
    if (agent_name) filters.agent_name = agent_name;
    if (task_type) filters.task_type = task_type as any;
    if (assigned_to) filters.assigned_to = assigned_to;
    if (client_id) filters.client_id = client_id;

    const taskService = new TaskGenerationService();
    const result = await taskService.getTenantTasks(tenantId, filters, page, page_size);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/command-center/tasks
 * Manual task creation
 */
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
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = profile.tenant_id;

  try {
    const body = await request.json();

    const taskService = new TaskGenerationService();
    const task = await taskService.createTask({
      tenant_id: tenantId,
      ...body,
    });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
