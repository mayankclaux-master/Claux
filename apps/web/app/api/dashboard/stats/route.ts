import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import {
  getARIAStats,
  getSCRIBEStats,
  getPUBLISHStats,
  getPULSEStats,
  getLOCLStats
} from "@/lib/dashboard";

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
    const [ariaStats, scribeStats, publishStats, pulseStats, loclStats] = await Promise.all([
      getARIAStats(tenantId),
      getSCRIBEStats(tenantId),
      getPUBLISHStats(tenantId),
      getPULSEStats(tenantId),
      getLOCLStats(tenantId)
    ]);

    return NextResponse.json({
      aria: ariaStats,
      scribe: scribeStats,
      publish: publishStats,
      pulse: pulseStats,
      locl: loclStats
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
