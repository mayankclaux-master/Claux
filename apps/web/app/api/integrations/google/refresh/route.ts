import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleRefreshToken, encryptSecret, updateIntegrationStatus } from "@/lib/integrations/utils";

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
    // Get refresh token
    const refreshToken = await getGoogleRefreshToken(tenantId);

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token available" }, { status: 400 });
    }

    // Exchange refresh token for new access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        grant_type: "refresh_token",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token refresh failed:", await tokenResponse.text());
      await updateIntegrationStatus(tenantId, "google", "expired");
      return NextResponse.json({ error: "Token refresh failed" }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();
    
    // Store new access token
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createSupabaseAdminClient();

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    const { error: updateError } = await adminSupabase
      .from("integrations")
      .update({
        google_access_token_encrypted: encryptSecret(tokenData.access_token),
        google_token_expires_at: expiresAt,
        google_status: "connected",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to store refreshed token:", updateError);
      return NextResponse.json({ error: "Failed to store refreshed token" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to refresh token" },
      { status: 500 }
    );
  }
}
