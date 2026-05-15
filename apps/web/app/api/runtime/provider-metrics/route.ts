import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getProviderMetrics } from "@/lib/runtime/provider-observability";

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

  // Parse query parameters
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || undefined;

  try {
    const metrics = await getProviderMetrics(tenantId, provider);

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error fetching provider metrics:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch provider metrics" },
      { status: 500 }
    );
  }
}
