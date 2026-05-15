import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { RuntimeService } from "@/lib/runtime/services";
import { ARIA_WORKFLOW } from "@/lib/runtime/workflows/aria.workflow";

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
    // Initialize runtime service
    const runtime = new RuntimeService({
      tenantId,
      logOperations: true,
      enableMetrics: true,
    });

    // Initialize orchestrator
    const orchestrator = new ExecutionOrchestrator(runtime, {
      tenantId,
      enableAutoEvents: true,
      enableAutoLogging: true,
      stallDetectionTimeoutMs: 3600000,
    });

    // Create execution from ARIA workflow
    const executionResult = await orchestrator.createExecution({
      agentName: 'ARIA',
      workflowType: 'keyword_discovery',
      tasks: ARIA_WORKFLOW.tasks.map((task, index) => ({
        task_id: task.task_id,
        taskName: task.task_name,
        taskType: task.task_type,
        stepOrder: index,
        dependencies: task.dependencies,
        retryPolicy: {
          maxRetries: task.retry_policy.max_attempts,
          backoffMs: task.retry_policy.backoff_ms,
          strategy: 'exponential' as const,
        },
        timeoutMs: task.timeout_ms,
      })),
      inputPayload: {
        tenant_id: tenantId,
        workspace_id: workspaceId,
        trigger: 'manual',
      },
      metadata: {
        initiated_by: userId,
      },
    });

    if (!executionResult.success) {
      return NextResponse.json(
        { error: executionResult.error?.message || 'Failed to create execution' },
        { status: 500 }
      );
    }

    const executionId = executionResult.data;

    if (!executionId) {
      return NextResponse.json(
        { error: 'Failed to create execution - no ID returned' },
        { status: 500 }
      );
    }

    // Start execution
    const startResult = await orchestrator.startExecution(executionId);

    if (!startResult.success) {
      return NextResponse.json(
        { error: startResult.error?.message || 'Failed to start execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      executionId: executionId || '',
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
