import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

function createServiceRoleClient() {
  return createClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const admin = createServiceRoleClient();

    // Verify the token and get user
    const { data: { user }, error: userError } = await admin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch profile using service role key (bypasses RLS)
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("tenant_id, provisioning_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    // Fetch tenant if profile exists
    let tenant = null;
    if (profile?.tenant_id) {
      const { data: tenantData, error: tenantError } = await admin
        .from("tenants")
        .select("onboarding_completed")
        .eq("id", profile.tenant_id)
        .maybeSingle();

      if (!tenantError) {
        tenant = tenantData;
      }
    }

    return NextResponse.json({
      profile,
      tenant,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
