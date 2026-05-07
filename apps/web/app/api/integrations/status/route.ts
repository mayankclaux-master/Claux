import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { getTenantIntegrations } from "@/lib/integrations/utils";

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
    const integrations = await getTenantIntegrations(tenantId);

    if (!integrations) {
      return NextResponse.json({
        google_status: "not_connected",
        google_connected_email: null,
        search_console_property: null,
        ga4_property_id: null,
        ga4_account_id: null,
        gbp_account_id: null,
        gbp_location_id: null,
        wp_status: "not_connected",
        wp_site_url: null,
        wp_username: null,
        shopify_status: "not_connected",
        shopify_store_url: null,
        shopify_blog_id: null,
        custom_status: "not_connected",
        custom_api_url: null
      });
    }

    return NextResponse.json({
      google_status: integrations.google_status,
      google_connected_email: integrations.google_connected_email,
      search_console_property: integrations.search_console_property,
      ga4_property_id: integrations.ga4_property_id,
      ga4_account_id: integrations.ga4_account_id,
      gbp_account_id: integrations.gbp_account_id,
      gbp_location_id: integrations.gbp_location_id,
      wp_status: integrations.wp_status,
      wp_site_url: integrations.wp_site_url,
      wp_username: integrations.wp_username,
      shopify_status: integrations.shopify_status,
      shopify_store_url: integrations.shopify_store_url,
      shopify_blog_id: integrations.shopify_blog_id,
      custom_status: integrations.custom_status,
      custom_api_url: integrations.custom_api_url
    });
  } catch (error) {
    console.error("Error fetching integration status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch integration status" },
      { status: 500 }
    );
  }
}
