import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { RuntimeService } from "@/lib/runtime/services";
import { runSCRIBE } from "@/lib/agents/scribe/scribe.service";

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

    // Create execution - agent service will handle task creation
    const executionResult = await orchestrator.createExecution({
      agentName: 'SCRIBE',
      workflowType: 'content_generation',
      tasks: [],
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

    // Trigger real agent execution
    await runSCRIBE({
      tenantId,
      agent: 'SCRIBE',
      runId: executionId,
    });

    return NextResponse.json({
      success: true,
      executionId: executionId || '',
      agent: 'SCRIBE',
      tenantId,
      workspaceId: workspaceId || '',
      status: 'started',
    });
  } catch (error) {
    console.error('SCRIBE draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start SCRIBE draft' },
      { status: 500 }
    );
  }
}
