import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  console.log("=== ENSURE TENANT START ===");

  try {
    const { userId } = await auth();

    console.log("STEP 1: Auth check");
    console.log("userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("=== HEADER INSPECTION ===");
    console.log("REQUEST HEADERS:", Object.fromEntries(request.headers.entries()));

    // Rate limiting check
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      console.warn("[ensure-tenant] Rate limit exceeded", {
        userId,
        resetTime: rateLimit.resetTime,
      });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    console.log("STEP 2: Check ENV");
    console.log("SUPABASE URL:", env.NEXT_PUBLIC_SUPABASE_URL);
    console.log("SERVICE ROLE EXISTS:", !!env.SUPABASE_SERVICE_ROLE_KEY);

    console.log("CLIENT CONFIG CHECK:", {
      hasServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      keyPrefix: env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10)
    });

    // Use service role client to bypass RLS
    const admin = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log("STEP 3: Check current role");

    try {
      const roleCheck = await admin.rpc("get_current_role");
      console.log("ROLE CHECK RESULT:", roleCheck);
    } catch (roleErr) {
      console.log("ROLE CHECK RPC FAILED (function may not exist):", roleErr);
    }

    // Fallback role test
    try {
      const roleTest = await admin.from("profiles").select("*").limit(1);
      console.log("ROLE TEST RESPONSE:", roleTest);
    } catch (roleTestErr) {
      console.log("ROLE TEST FAILED:", roleTestErr);
    }

    // Check client headers for contamination
    const headersCheck = (admin as any)?.rest?.headers || null;
    console.log("CLIENT HEADERS:", headersCheck);

    // Direct fetch test (bypass client)
    try {
      const directTest = await fetch(
        env.NEXT_PUBLIC_SUPABASE_URL + "/rest/v1/profiles?select=id&limit=1",
        {
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
          }
        }
      );
      const directData = await directTest.json();
      console.log("DIRECT FETCH RESULT:", directData);
    } catch (directErr) {
      console.log("DIRECT FETCH FAILED:", directErr);
    }

    console.log("=== ABOUT TO QUERY PROFILES TABLE ===");
    console.log("STEP 4: Query profile");

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("tenant_id")
      .eq("id", userId)
      .maybeSingle();

    console.log("PROFILE RESULT:", profile);
    console.log("PROFILE ERROR:", profileError);

    if (profileError) {
      console.error("[ensure-tenant] Profile query error:", profileError);
      return NextResponse.json({ error: "Failed to query profile" }, { status: 500 });
    }

    if (profile?.tenant_id) {
      console.log("[Observability] Tenant exists for userId", {
        userId,
        tenant_id: profile.tenant_id,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({
        tenant_id: profile.tenant_id,
        recovered: false
      });
    }

    console.log("STEP 4: No tenant → calling bootstrap");

    try {
      console.log("BOOTSTRAP INPUT:", {
        userId,
        tenant_name: "Test Business",
      });

      const { data: rpcData, error: rpcError } = await admin.rpc("bootstrap_tenant_for_user", {
        p_user_id: userId,
        p_tenant_name: "My Business",
        p_full_name: "User",
      });

      console.log("BOOTSTRAP RESPONSE:", rpcData);
      console.log("BOOTSTRAP ERROR:", rpcError);

      if (rpcError) {
        console.error("[ensure-tenant] bootstrap_tenant_for_user RPC error:", rpcError);
        return NextResponse.json({ error: "Failed to bootstrap tenant" }, { status: 500 });
      }

      const result = rpcData as { status: string; tenant_id: string };

      console.log("[Observability] Recovered tenant for userId", {
        userId,
        tenant_id: result.tenant_id,
        timestamp: new Date().toISOString(),
      });

      console.log("STEP 5: Returning success");

      return NextResponse.json({
        tenant_id: result.tenant_id,
        recovered: true
      });
    } catch (err) {
      console.error("[ensure-tenant] Exception during tenant bootstrap:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  } catch (err) {
    console.error("=== ENSURE TENANT CRASH ===");
    const error = err as Error;
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR STACK:", error.stack);

    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
