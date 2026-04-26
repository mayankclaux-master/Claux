import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type GoogleTarget = "search_console" | "gmb";

const GOOGLE_SCOPES: Record<GoogleTarget, string> = {
  search_console: "https://www.googleapis.com/auth/webmasters",
  gmb: "https://www.googleapis.com/auth/business.manage"
};

function parseTarget(value: string | null): GoogleTarget | null {
  if (value === "search_console" || value === "gmb") {
    return value;
  }
  return null;
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function fromBase64Url<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf-8")) as T;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const encodedState = url.searchParams.get("state");

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/signup", request.url));
  }

  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();

  if (!profile?.org_id) {
    return NextResponse.redirect(new URL("/auth/signup", request.url));
  }

  const orgId = profile.org_id as string;
  const callbackUrl = `${url.origin}/api/integrations/google/connect`;

  if (!code) {
    const target = parseTarget(url.searchParams.get("target"));

    if (!target) {
      return NextResponse.json({ error: "Invalid Google integration target." }, { status: 400 });
    }

    const state = toBase64Url(JSON.stringify({ orgId, target, t: Date.now() }));
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");

    googleAuthUrl.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID ?? "");
    googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "consent");
    googleAuthUrl.searchParams.set("scope", GOOGLE_SCOPES[target]);
    googleAuthUrl.searchParams.set("state", state);

    return NextResponse.redirect(googleAuthUrl);
  }

  if (!encodedState) {
    return NextResponse.redirect(new URL("/onboarding?google=error", request.url));
  }

  let target: GoogleTarget;
  let stateOrgId: string;

  try {
    const parsedState = fromBase64Url<{ target: GoogleTarget; orgId: string }>(encodedState);
    target = parsedState.target;
    stateOrgId = parsedState.orgId;
  } catch {
    return NextResponse.redirect(new URL("/onboarding?google=error", request.url));
  }

  if (stateOrgId !== orgId || !GOOGLE_SCOPES[target]) {
    return NextResponse.redirect(new URL("/onboarding?google=error", request.url));
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/onboarding?google=error", request.url));
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL(`/onboarding?google=error&target=${target}`, request.url));
  }

  const tokenData = await tokenResponse.json();
  const { data: connection } = await supabase
    .from("connections")
    .select("website_url, tech_stack, google_api_links, status")
    .eq("org_id", orgId)
    .maybeSingle();

  const currentLinks = (connection?.google_api_links ?? {}) as Record<string, unknown>;
  const nextLinks = {
    ...currentLinks,
    [target]: {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope,
      token_type: tokenData.token_type,
      connected_at: new Date().toISOString()
    }
  };

  await supabase.from("connections").upsert(
    {
      org_id: orgId,
      website_url: connection?.website_url ?? null,
      tech_stack: connection?.tech_stack ?? "unknown",
      google_api_links: nextLinks,
      status: connection?.status === "error" ? "pending" : "connected",
      updated_at: new Date().toISOString()
    },
    { onConflict: "org_id" }
  );

  return NextResponse.redirect(new URL(`/onboarding?google=connected&target=${target}`, request.url));
}
