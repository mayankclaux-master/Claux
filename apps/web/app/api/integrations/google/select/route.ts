import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

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
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const tenantId = profile.tenant_id;

  try {
    const body = await request.json();
    const { searchConsoleProperty, ga4PropertyId, ga4AccountId, gbpAccountId, gbpLocationId } = body;

    // Update selected properties
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        search_console_property: searchConsoleProperty || null,
        ga4_property_id: ga4PropertyId || null,
        ga4_account_id: ga4AccountId || null,
        gbp_account_id: gbpAccountId || null,
        gbp_location_id: gbpLocationId || null,
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to update properties:", updateError);
      return NextResponse.json({ error: "Failed to update properties" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error selecting properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to select properties" },
      { status: 500 }
    );
  }
}
