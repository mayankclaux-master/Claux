import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/rate-limit";

type CompleteProfileRequest = {
  business_name: string;
  category: string;
  phone: string;
  address: string;
  website_url: string;
};

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting check
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    console.warn("[Profile Complete] Rate limit exceeded", {
      userId,
      resetTime: rateLimit.resetTime,
    });
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CompleteProfileRequest & { retry_count?: number };

  const { business_name, category, phone, address, website_url, retry_count = 0 } = body;

  // Input sanitization
  const sanitizedBusinessName = business_name?.trim() || "";
  const sanitizedCategory = category?.trim() || "";
  const sanitizedPhone = phone?.trim() || "";
  const sanitizedAddress = address?.trim() || "";
  const sanitizedWebsiteUrl = website_url?.trim() || "";

  // Validation
  if (!sanitizedBusinessName || !sanitizedCategory || !sanitizedPhone || !sanitizedAddress || !sanitizedWebsiteUrl) {
    console.error("[Profile Complete] Validation failed - missing fields", {
      userId,
      hasBusinessName: !!sanitizedBusinessName,
      hasCategory: !!sanitizedCategory,
      hasPhone: !!sanitizedPhone,
      hasAddress: !!sanitizedAddress,
      hasWebsiteUrl: !!sanitizedWebsiteUrl,
    });
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!isValidUrl(sanitizedWebsiteUrl)) {
    console.error("[Profile Complete] Validation failed - invalid URL", {
      userId,
      websiteUrl: sanitizedWebsiteUrl,
    });
    return NextResponse.json({ error: "Invalid website URL format" }, { status: 400 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[Profile Complete] Profile query error", {
      userId,
      error: profileError.message,
      details: profileError.details,
      hint: profileError.hint,
      code: profileError.code,
      raw: profileError,
    });
    return NextResponse.json({
      error: profileError.message,
      details: profileError.details,
      code: profileError.code
    }, { status: 500 });
  }

  if (!profile?.tenant_id) {
    console.error("[Profile Complete] Tenant not found", {
      userId,
      hasProfile: !!profile,
      hasTenantId: !!profile?.tenant_id,
    });
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Duplicate protection - check if already completed
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("onboarding_completed")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError) {
    console.error("[Profile Complete] Tenant query error", {
      userId,
      tenant_id: profile.tenant_id,
      error: tenantError.message,
      details: tenantError.details,
      hint: tenantError.hint,
      code: tenantError.code,
      raw: tenantError,
    });
    return NextResponse.json({
      error: tenantError.message,
      details: tenantError.details,
      code: tenantError.code
    }, { status: 500 });
  }

  if (tenant?.onboarding_completed) {
    console.warn("[Profile Complete] Duplicate submission - already completed", {
      userId,
      tenant_id: profile.tenant_id,
      onboarding_completed: tenant.onboarding_completed,
    });
    return NextResponse.json({ success: true, message: "Onboarding already completed" });
  }

  // Log payload snapshot
  console.log("[Profile Complete] Attempting onboarding completion", {
    userId,
    tenant_id: profile.tenant_id,
    retry_count,
    payload: {
      business_name: sanitizedBusinessName,
      category: sanitizedCategory,
      phone: sanitizedPhone,
      address: sanitizedAddress,
      website_url: sanitizedWebsiteUrl,
    },
  });

  // Log retry attempts
  if (retry_count > 0) {
    const logMessage = `[Profile Complete] Onboarding retry attempt ${retry_count} for tenant_id`;
    if (retry_count > 3) {
      console.error(logMessage, {
        userId,
        tenant_id: profile.tenant_id,
        retry_count,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn(logMessage, {
        userId,
        tenant_id: profile.tenant_id,
        retry_count,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Timeout protection with Promise.race
  const rpcPromise = supabase.rpc("complete_onboarding", {
    p_tenant_id: profile.tenant_id,
    p_business_name: sanitizedBusinessName,
    p_category: sanitizedCategory,
    p_phone: sanitizedPhone,
    p_address: sanitizedAddress,
    p_service_areas: [],
    p_website_url: sanitizedWebsiteUrl,
    p_tech_stack: "unknown",
    p_cms_type: "custom",
    p_gbp_location_id: null,
    p_place_id: null,
    p_competitor_urls: []
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("RPC timeout after 10 seconds")), 10000);
  });

  let completionError;
  try {
    const result = await Promise.race([rpcPromise, timeoutPromise]);
    completionError = (result as any)?.error;
  } catch (err) {
    completionError = err instanceof Error ? err : new Error("Unknown error");
  }

  if (completionError) {
    console.error("[Profile Complete] complete_onboarding RPC error", {
      userId,
      tenant_id: profile.tenant_id,
      error: completionError instanceof Error ? completionError.message : String(completionError),
      details: completionError instanceof Error ? completionError.stack : undefined,
      raw: completionError,
    });
    return NextResponse.json({
      error: completionError instanceof Error ? completionError.message : "RPC execution failed",
      details: completionError instanceof Error ? completionError.message : "RPC execution failed",
      code: completionError instanceof Error ? undefined : String(completionError)
    }, { status: 500 });
  }

  const result = await rpcPromise;
  const rpcResult = (result as any)?.data;

  // Check RPC result status
  if (rpcResult?.status === 'error') {
    console.error("[Profile Complete] Agent initialization failed", {
      userId,
      tenant_id: profile.tenant_id,
      message: rpcResult.message,
      agent_count: rpcResult.agent_count
    });
    return NextResponse.json({
      error: "Agent initialization failed",
      details: rpcResult.message,
      agent_count: rpcResult.agent_count
    }, { status: 500 });
  }

  console.log("[Profile Complete] Onboarding completed successfully", {
    userId,
    tenant_id: profile.tenant_id,
  });

  console.log("[Observability] Onboarding completed for tenant_id", {
    userId,
    tenant_id: profile.tenant_id,
    timestamp: new Date().toISOString(),
  });

  // Verify agent initialization
  const { count: agentCount, error: countError } = await supabase
    .from("agent_states")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", profile.tenant_id);

  if (countError) {
    console.error("[Profile Complete] Agent states count error", {
      userId,
      tenant_id: profile.tenant_id,
      error: countError.message,
      details: countError.details,
      hint: countError.hint,
      code: countError.code,
      raw: countError,
    });
    return NextResponse.json({
      error: countError.message,
      details: countError.details,
      code: countError.code
    }, { status: 500 });
  }

  if (agentCount === null || agentCount < 9) {
    console.error("[Profile Complete] Agent initialization failed - insufficient agents", {
      userId,
      tenant_id: profile.tenant_id,
      agentCount,
      expectedCount: 9,
    });

    // Retry agent initialization
    const { error: retryError } = await supabase.rpc("initialize_agent_states", {
      p_tenant_id: profile.tenant_id,
    });

    if (retryError) {
      console.error("[Profile Complete] Agent initialization retry failed", {
        userId,
        tenant_id: profile.tenant_id,
        error: retryError.message,
        details: retryError.details,
        hint: retryError.hint,
        code: retryError.code,
        raw: retryError,
      });
      return NextResponse.json({
        error: retryError.message,
        details: retryError.details,
        code: retryError.code
      }, { status: 500 });
    }

    // Verify retry
    const { count: retryCount, error: retryCountError } = await supabase
      .from("agent_states")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", profile.tenant_id);

    if (retryCountError || retryCount === null || retryCount < 9) {
      console.error("[Profile Complete] Agent initialization retry verification failed", {
        userId,
        tenant_id: profile.tenant_id,
        retryCount,
        retryCountError: retryCountError?.message,
        retryCountDetails: retryCountError?.details,
        retryCountHint: retryCountError?.hint,
        retryCountCode: retryCountError?.code,
        retryCountRaw: retryCountError,
      });
      return NextResponse.json({
        error: "Agent initialization failed after retry",
        details: "Could not initialize all 9 agents",
        code: retryCountError?.code
      }, { status: 500 });
    }

    console.log("[Profile Complete] Agent initialization succeeded after retry", {
      userId,
      tenant_id: profile.tenant_id,
      agentCount: retryCount,
    });

    console.log("[Observability] Agents initialized for tenant_id", {
      userId,
      tenant_id: profile.tenant_id,
      agentCount: retryCount,
      timestamp: new Date().toISOString(),
    });
  }

  console.log("[Profile Complete] All verifications passed - agents initialized", {
    userId,
    tenant_id: profile.tenant_id,
    agentCount,
  });

  console.log("[Observability] Agents initialized for tenant_id", {
    userId,
    tenant_id: profile.tenant_id,
    agentCount,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}
