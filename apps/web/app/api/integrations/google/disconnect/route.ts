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
    // Clear Google tokens and properties
    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        google_access_token_encrypted: null,
        google_refresh_token_encrypted: null,
        google_token_expires_at: null,
        google_connected_email: null,
        search_console_property: null,
        ga4_property_id: null,
        ga4_account_id: null,
        gbp_account_id: null,
        gbp_location_id: null,
        google_status: "not_connected",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to disconnect Google:", updateError);
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting Google:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect" },
      { status: 500 }
    );
  }
}
