import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { encryptSecret, ensureIntegrationRow } from "@/lib/integrations/utils";

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
    const { type, ...credentials } = body;

    // Ensure integration row exists
    await ensureIntegrationRow(tenantId);

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createSupabaseAdminClient();

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (type === "wordpress") {
      const { siteUrl, username, appPassword } = credentials;
      
      updateData.wp_site_url = siteUrl;
      updateData.wp_username = username;
      updateData.wp_app_password_encrypted = encryptSecret(appPassword);
      updateData.wp_status = "connected";
    } else if (type === "shopify") {
      const { storeUrl, accessToken, blogId } = credentials;
      
      updateData.shopify_store_url = storeUrl;
      updateData.shopify_access_token_encrypted = encryptSecret(accessToken);
      updateData.shopify_blog_id = blogId;
      updateData.shopify_status = "connected";
    } else if (type === "custom") {
      const { apiUrl, apiKey } = credentials;
      
      updateData.custom_api_url = apiUrl;
      updateData.custom_api_key_encrypted = encryptSecret(apiKey);
      updateData.custom_status = "connected";
    } else {
      return NextResponse.json({ error: "Invalid CMS type" }, { status: 400 });
    }

    const { error: updateError } = await adminSupabase
      .from("integrations")
      .update(updateData)
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to save CMS credentials:", updateError);
      return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving CMS credentials:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save credentials" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createSupabaseAdminClient();

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (type === "wordpress") {
      updateData.wp_site_url = null;
      updateData.wp_username = null;
      updateData.wp_app_password_encrypted = null;
      updateData.wp_status = "not_connected";
    } else if (type === "shopify") {
      updateData.shopify_store_url = null;
      updateData.shopify_access_token_encrypted = null;
      updateData.shopify_blog_id = null;
      updateData.shopify_status = "not_connected";
    } else if (type === "custom") {
      updateData.custom_api_url = null;
      updateData.custom_api_key_encrypted = null;
      updateData.custom_status = "not_connected";
    } else {
      return NextResponse.json({ error: "Invalid CMS type" }, { status: 400 });
    }

    const { error: updateError } = await adminSupabase
      .from("integrations")
      .update(updateData)
      .eq("tenant_id", tenantId);

    if (updateError) {
      console.error("Failed to disconnect CMS:", updateError);
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error disconnecting CMS:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect" },
      { status: 500 }
    );
  }
}
