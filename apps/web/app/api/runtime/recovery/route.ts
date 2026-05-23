import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";

export const dynamic = "force-dynamic";

export async function POST(
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
    .select("tenant_id, workspace_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = profile.tenant_id;
  const workspaceId = profile.workspace_id;

  // Get executionId and action from request body
  const body = await request.json();
  const executionId = body.executionId;
  const action = body.action; // 'retry' | 'cancel'

  if (!action || !['retry', 'cancel'].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    // Verify tenant isolation
    const { data: execution } = await supabase
      .from("agent_executions")
      .select("*")
      .eq("id", executionId)
      .single();

    if (!execution || execution.tenant_id !== tenantId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // TODO: Refactor to use RuntimeService directly instead of orchestrator
    // Orchestrator is a V1 minimal stub - agents should use direct execution
    return NextResponse.json(
      { error: "Orchestrator usage deprecated - use RuntimeService directly" },
      { status: 501 }
    );

    /*
    // Initialize runtime service
    const runtime = new RuntimeService({
      tenantId,
      logOperations: true,
      enableMetrics: true,
    });

    // Initialize orchestrator
    const orchestrator = new ExecutionOrchestrator(runtime, {
      tenantId,
    });

    if (action === 'retry') {
      // Retry execution using existing runtime recovery semantics
      const result = await orchestrator.retryExecution(executionId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || "Failed to retry execution" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Execution retry initiated",
        execution_id: executionId,
      });
    }

    if (action === 'cancel') {
      // Cancel execution using existing runtime recovery semantics
      const result = await orchestrator.cancelExecution(executionId);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error?.message || "Failed to cancel execution" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Execution cancelled",
        execution_id: executionId,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    */
  } catch (error) {
    console.error("Error in execution recovery:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to perform recovery action" },
      { status: 500 }
    );
  }
}
