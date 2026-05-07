import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const AGENTS = [
  "ARIA",
  "SCRIBE",
  "LOCL",
  "LINX",
  "CORE",
  "REPUTE",
  "AMPLI",
  "PRISM",
  "PULSE"
] as const;

type AgentName = typeof AGENTS[number];

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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const agentName: AgentName = body.agentName || AGENTS[Math.floor(Math.random() * AGENTS.length)];

  const progress = Math.floor(Math.random() * 60) + 10;

  const { error: updateError1 } = await supabase
    .from("agent_states")
    .update({
      status: "running",
      progress,
      current_task: "Processing..."
    })
    .eq("tenant_id", profile.tenant_id)
    .eq("agent_name", agentName);

  if (updateError1) {
    return NextResponse.json({ error: "Failed to update agent state" }, { status: 500 });
  }

  const { error: insertError1 } = await supabase
    .from("agent_activities")
    .insert({
      tenant_id: profile.tenant_id,
      agent_name: agentName,
      status: "running",
      status_message: "Processing task..."
    });

  if (insertError1) {
    return NextResponse.json({ error: "Failed to insert agent activity" }, { status: 500 });
  }

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { error: updateError2 } = await supabase
    .from("agent_states")
    .update({
      status: "completed",
      progress: 100,
      current_task: "Completed"
    })
    .eq("tenant_id", profile.tenant_id)
    .eq("agent_name", agentName);

  if (updateError2) {
    return NextResponse.json({ error: "Failed to update agent state" }, { status: 500 });
  }

  const { error: insertError2 } = await supabase
    .from("agent_activities")
    .insert({
      tenant_id: profile.tenant_id,
      agent_name: agentName,
      status: "completed",
      status_message: "Task completed"
    });

  if (insertError2) {
    return NextResponse.json({ error: "Failed to insert agent activity" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
