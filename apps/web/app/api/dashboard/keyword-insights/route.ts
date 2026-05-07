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

  const { data: keywordInsights, error: keywordInsightsError } = await supabase
    .from("keyword_insights")
    .select("keyword, position, volume, agent_name")
    .eq("tenant_id", profile.tenant_id)
    .order("created_at", { ascending: false })
    .limit(60);

  if (keywordInsightsError) {
    return Response.json({ error: "Failed to fetch keyword insights" }, { status: 500 });
  }

  return Response.json({
    data: keywordInsights
  });
}
