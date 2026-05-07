import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/integrations/utils";

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

  // Get Google access token
  const accessToken = await getGoogleAccessToken(tenantId);

  if (!accessToken) {
    return NextResponse.json({ error: "Google not connected" }, { status: 400 });
  }

  try {
    // Fetch Search Console properties
    const scResponse = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let scProperties: Array<{ siteUrl: string; permissionLevel: string }> = [];
    if (scResponse.ok) {
      const scData = await scResponse.json();
      scProperties = scData.siteEntry || [];
    }

    // Fetch GA4 properties
    const ga4Response = await fetch("https://analyticsadmin.googleapis.com/v1beta/accounts", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let ga4Accounts: Array<{ name: string; displayName: string }> = [];
    if (ga4Response.ok) {
      const ga4Data = await ga4Response.json();
      ga4Accounts = ga4Data.accounts || [];
    }

    // Fetch GBP accounts/locations
    const gbpResponse = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    let gbpAccounts: Array<{ name: string; accountName: string; type: string }> = [];
    if (gbpResponse.ok) {
      const gbpData = await gbpResponse.json();
      gbpAccounts = gbpData.accounts || [];
    }

    return NextResponse.json({
      searchConsole: scProperties,
      ga4: ga4Accounts,
      gbp: gbpAccounts
    });
  } catch (error) {
    console.error("Error fetching Google properties:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
