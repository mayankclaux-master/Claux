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

  try {
    // Fetch integration execution state from agent_events
    const { data: outboundRequests } = await supabase
      .from("agent_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "outbound_request")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: integrationCallbacks } = await supabase
      .from("agent_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "integration_callback")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: executionContinuations } = await supabase
      .from("agent_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "execution_continuation")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: providerFailures } = await supabase
      .from("agent_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "provider_failure")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: providerCooldowns } = await supabase
      .from("agent_events")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("event_type", "provider_cooldown")
      .order("created_at", { ascending: false })
      .limit(50);

    // Fetch integration latency from agent_logs
    const { data: integrationLatencyLogs } = await supabase
      .from("agent_logs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("log_type", "integration_latency")
      .order("created_at", { ascending: false })
      .limit(100);

    // Calculate execution state counts
    const queued = outboundRequests?.filter((e: any) => e.metadata?.state === 'queued')?.length || 0;
    const dispatching = outboundRequests?.filter((e: any) => e.metadata?.state === 'dispatching')?.length || 0;
    const providerExecuting = outboundRequests?.filter((e: any) => e.metadata?.state === 'processing')?.length || 0;
    const callbackReceived = integrationCallbacks?.length || 0;
    const resumed = executionContinuations?.length || 0;
    const completed = outboundRequests?.filter((e: any) => e.metadata?.state === 'completed')?.length || 0;
    const failed = providerFailures?.length || 0;
    const retrying = outboundRequests?.filter((e: any) => e.metadata?.state === 'retrying')?.length || 0;
    const cooldown = providerCooldowns?.length || 0;

    // Calculate provider latency metrics
    const latencyValues = integrationLatencyLogs
      ?.map((log: any) => log.metadata?.latency)
      .filter((latency: any) => latency !== undefined && latency !== null) || [];
    
    const averageLatency = latencyValues.length > 0 
      ? latencyValues.reduce((sum: number, val: number) => sum + val, 0) / latencyValues.length 
      : 0;
    
    const p95Latency = latencyValues.length > 0
      ? latencyValues.sort((a: number, b: number) => a - b)[Math.floor(latencyValues.length * 0.95)]
      : 0;

    return NextResponse.json({
      executionState: {
        queued,
        dispatching,
        providerExecuting,
        callbackReceived,
        resumed,
        completed,
        failed,
        retrying,
        cooldown,
      },
      providerLatency: {
        average: averageLatency,
        p95: p95Latency,
        samples: latencyValues.length,
      },
      recentOutboundRequests: outboundRequests || [],
      recentCallbacks: integrationCallbacks || [],
      recentContinuations: executionContinuations || [],
      recentFailures: providerFailures || [],
      recentCooldowns: providerCooldowns || [],
    });
  } catch (error) {
    console.error("Error fetching integration execution state:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch integration execution state" },
      { status: 500 }
    );
  }
}
