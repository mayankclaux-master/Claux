import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { encryptSecret, ensureIntegrationRow, updateIntegrationStatus } from "@/lib/integrations/utils";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/config/app-url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    const appUrl = getAppUrl();
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=missing_params`);
  }

  try {
    // Verify state
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { tenantId, userId } = stateData;

    // Validate OAuth credentials
    if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
      console.error("Google OAuth not configured");
      const appUrl = getAppUrl();
      return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=oauth_not_configured`);
    }

    const appUrl = getAppUrl();

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_OAUTH_CLIENT_ID,
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: `${appUrl}/api/integrations/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    
    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      console.error("User info fetch failed:", await userInfoResponse.text());
      return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=user_info_failed`);
    }

    const userInfo = await userInfoResponse.json();
    const email = userInfo.email;

    // Ensure integration row exists
    await ensureIntegrationRow(tenantId);

    // Store encrypted tokens
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createSupabaseAdminClient();

    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    const { error: updateError } = await supabase
      .from("integrations")
      .update({
        google_access_token_encrypted: encryptSecret(tokenData.access_token),
        google_refresh_token_encrypted: encryptSecret(tokenData.refresh_token),
        google_token_expires_at: expiresAt,
        google_connected_email: email,
        google_status: "connected",
        updated_at: new Date().toISOString()
      })
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to store tokens:", updateError);
      return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=storage_failed`);
    }

    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?success=connected`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    const appUrl = getAppUrl();
    return NextResponse.redirect(`${appUrl}/dashboard/settings/integrations?error=callback_error`);
  }
}
