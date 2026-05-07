import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
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
    return Response.json({
      data: {
        profile,
        tenant: null,
        businessProfile: null
      }
    });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError) {
    return Response.json({
      step: "tenant_fetch",
      error: tenantError.message,
      details: tenantError
    }, { status: 500 });
  }

  const { data: businessProfile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("tenant_id", profile.tenant_id)
    .maybeSingle();

  return Response.json({
    data: {
      profile,
      tenant,
      businessProfile
    }
  });
}
