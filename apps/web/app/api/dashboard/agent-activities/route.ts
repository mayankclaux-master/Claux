import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  // REMOVED: Query from deprecated agent_activities table (Phase 2B)
  // Using canonical agent_events table instead
  const { data: agentEvents, error: agentEventsError } = await supabase
    .from("agent_events")
    .select("event_name, event_source, payload, created_at")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (agentEventsError) {
    return Response.json({ error: "Failed to fetch agent events" }, { status: 500 });
  }

  // Transform events to match expected response format
  const transformedData = agentEvents?.map((event: any) => ({
    agent_name: event.event_source,
    status_message: event.event_name,
    status: "event",
    created_at: event.created_at
  }));

  return Response.json({
    data: transformedData
  });
}
