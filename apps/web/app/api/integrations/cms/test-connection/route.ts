import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/integrations/utils";

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

    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    const adminSupabase = createSupabaseAdminClient();

    if (type === "wordpress") {
      const { siteUrl, username, appPassword } = credentials;
      
      if (!siteUrl || !username || !appPassword) {
        return NextResponse.json(
          { error: "Missing required credentials" },
          { status: 400 }
        );
      }

      // Test WordPress connection
      const authString = `${username}:${appPassword}`;
      const encodedAuth = Buffer.from(authString).toString('base64');
      const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${encodedAuth}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            { error: `WordPress connection failed: ${response.status} ${response.statusText} - ${errorText}` },
            { status: 400 }
          );
        }

        const data = await response.json();

        if (data && data.id) {
          return NextResponse.json({
            success: true,
            message: "WordPress connection successful",
            user: { id: data.id, name: data.name, email: data.email }
          });
        } else {
          return NextResponse.json(
            { error: "WordPress API response invalid" },
            { status: 400 }
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return NextResponse.json(
              { error: "WordPress connection timed out (10s)" },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: `WordPress connection failed: ${error.message}` },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Unknown error during WordPress connection" },
          { status: 500 }
        );
      }

    } else if (type === "custom") {
      const { apiUrl, apiKey } = credentials;
      
      if (!apiUrl || !apiKey) {
        return NextResponse.json(
          { error: "Missing required credentials" },
          { status: 400 }
        );
      }

      // Test Custom API connection
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString()
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
          } catch {
            errorText = "Unable to read error response body";
          }
          return NextResponse.json(
            { error: `Custom API connection failed: ${response.status} ${response.statusText} - ${errorText}` },
            { status: 400 }
          );
        }

        const data = await response.json();

        // Accept any valid JSON response as success
        return NextResponse.json({
          success: true,
          message: "Custom API connection successful",
          response: data
        });

      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return NextResponse.json(
              { error: "Custom API connection timed out (10s)" },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: `Custom API connection failed: ${error.message}` },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Unknown error during Custom API connection" },
          { status: 500 }
        );
      }

    } else if (type === "shopify") {
      const { storeUrl, accessToken, blogId } = credentials;
      
      if (!storeUrl || !accessToken) {
        return NextResponse.json(
          { error: "Missing required credentials" },
          { status: 400 }
        );
      }

      // Test Shopify connection
      const apiUrl = `${storeUrl.replace(/\/$/, '')}/admin/api/2024-01/shop.json`;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          return NextResponse.json(
            { error: `Shopify connection failed: ${response.status} ${response.statusText} - ${errorText}` },
            { status: 400 }
          );
        }

        const data = await response.json();

        if (data && data.shop) {
          return NextResponse.json({
            success: true,
            message: "Shopify connection successful",
            shop: { id: data.shop.id, name: data.shop.name, domain: data.shop.domain }
          });
        } else {
          return NextResponse.json(
            { error: "Shopify API response invalid" },
            { status: 400 }
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return NextResponse.json(
              { error: "Shopify connection timed out (10s)" },
              { status: 400 }
            );
          }
          return NextResponse.json(
            { error: `Shopify connection failed: ${error.message}` },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: "Unknown error during Shopify connection" },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json({ error: "Invalid CMS type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error testing CMS connection:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test connection" },
      { status: 500 }
    );
  }
}
