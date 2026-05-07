import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { getAppUrl } from "@/lib/config/app-url";

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

  // Google OAuth configuration
  const clientId = env.GOOGLE_OAUTH_CLIENT_ID;
  const appUrl = getAppUrl();
  const redirectUri = `${appUrl}/api/integrations/google/callback`;

  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  if (!env.GOOGLE_OAUTH_CLIENT_SECRET) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // OAuth scopes
  const scopes = [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
    "https://www.googleapis.com/auth/business.manage"
  ];

  // Generate state parameter for security
  const state = Buffer.from(JSON.stringify({ tenantId, userId })).toString('base64');

  // Build OAuth URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return NextResponse.redirect(authUrl.toString());
}
