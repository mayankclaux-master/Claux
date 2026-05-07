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

  const { data: agentStates, error: agentStatesError } = await supabase
    .from("agent_states")
    .select("*")
    .eq("tenant_id", profile.tenant_id);

  console.log("[Agent States] Query result:", {
    tenant_id: profile.tenant_id,
    count: agentStates?.length || 0,
    error: agentStatesError
  });

  if (agentStatesError) {
    console.error("[Agent States] Fetch error:", {
      message: agentStatesError.message,
      details: agentStatesError.details,
      hint: agentStatesError.hint,
      code: agentStatesError.code
    });
    return Response.json({ error: "Failed to fetch agent states" }, { status: 500 });
  }

  if (!agentStates || agentStates.length === 0) {
    console.warn("[Agent States] No agent states found for tenant:", profile.tenant_id);
  }

  return Response.json({
    data: agentStates
  });
}
