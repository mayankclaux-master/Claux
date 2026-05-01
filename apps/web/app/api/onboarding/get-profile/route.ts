import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

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
    // Verify Clerk authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createServiceRoleClient();

    // Fetch profile using service role key (bypasses RLS)
    // Retry up to 3 times with exponential backoff for transient delays
    let profile = null;
    let profileError = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await admin
        .from("profiles")
        .select("tenant_id, provisioning_status")
        .eq("id", userId)
        .maybeSingle();

      profile = result.data;
      profileError = result.error;

      if (!profileError && profile) break;

      // Wait before retrying (200ms, 400ms, 600ms)
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    }

    if (profileError) {
      console.error("Profile fetch error after retries:", profileError);
      return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
    }

    // Fetch tenant if profile exists
    let tenant = null;
    if (profile?.tenant_id) {
      let tenantData = null;
      let tenantError = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await admin
          .from("tenants")
          .select("onboarding_completed")
          .eq("id", profile.tenant_id)
          .maybeSingle();

        tenantData = result.data;
        tenantError = result.error;

        if (!tenantError && tenantData) break;

        // Wait before retrying (200ms, 400ms, 600ms)
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
        }
      }

      if (!tenantError) {
        tenant = tenantData;
      } else {
        console.error("Tenant fetch error after retries:", tenantError);
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
