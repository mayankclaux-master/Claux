import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  console.log("[Dashboard Profile] Request received", {
    userId,
    timestamp: new Date().toISOString()
  });

  if (!userId) {
    console.error("[Dashboard Profile] Unauthorized: No userId");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    console.error("[Dashboard Profile] Unauthorized: No token");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  let profile = null;
  let profileError = null;

  const { data: initialProfile, error: initialProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (initialProfileError) {
    return Response.json({
      step: "profile_fetch",
      error: initialProfileError.message,
      details: initialProfileError
    }, { status: 500 });
  }

  if (!initialProfile) {
    const { error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        tenant_id: null,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      return Response.json({
        step: "profile_insert",
        error: insertError.message,
        details: insertError
      }, { status: 500 });
    }

    const { data: refetchedProfile, error: refetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (refetchError) {
      return Response.json({
        step: "profile_refetch",
        error: refetchError.message,
        details: refetchError
      }, { status: 500 });
    }

    profile = refetchedProfile;
  } else {
    profile = initialProfile;
  }

  if (!profile.tenant_id) {
    console.warn("[Dashboard Profile] Profile has null tenant_id", {
      userId,
      profile_id: profile.id,
      timestamp: new Date().toISOString()
    });
    return Response.json({
      data: {
        profile,
        tenant: null,
        businessProfile: null
      }
    });
  }

  console.log("[Dashboard Profile] Fetching tenant data", {
    userId,
    tenant_id: profile.tenant_id,
    timestamp: new Date().toISOString()
  });

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError) {
    console.error("[Dashboard Profile] Tenant fetch error:", tenantError);
    return Response.json({
      step: "tenant_fetch",
      error: tenantError.message,
      details: tenantError
    }, { status: 500 });
  }

  console.log("[Dashboard Profile] Fetching business profile", {
    userId,
    tenant_id: profile.tenant_id,
    timestamp: new Date().toISOString()
  });

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  console.log("[Dashboard Profile] Response summary", {
    userId,
    tenant_id: profile.tenant_id,
    has_tenant: !!tenant,
    has_business_profile: !!businessProfile,
    business_name: businessProfile?.business_name,
    timestamp: new Date().toISOString()
  });

  return Response.json({
    data: {
      profile,
      tenant,
      businessProfile
    }
  });
}
