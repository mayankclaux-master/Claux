import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

type CompleteOnboardingRequest = {
  tenant_id: string;
  business_name: string;
  category: string;
  phone: string;
  address: string;
  service_areas: string[];
  website_url: string;
  tech_stack: string;
  cms_type: string;
  gbp_location_id: string | null;
  place_id: string | null;
  competitor_urls: string[];
};


export async function POST(request: Request) {
  const body = (await request.json()) as CompleteOnboardingRequest;

  const {
    tenant_id,
    business_name,
    category,
    phone,
    address,
    service_areas,
    website_url,
    tech_stack,
    cms_type,
    gbp_location_id,
    place_id,
    competitor_urls
  } = body;

  if (!tenant_id || !business_name || !category || !phone || !address || !website_url) {
    return NextResponse.json({ error: "Incomplete onboarding payload." }, { status: 400 });
  }

  // Verify Clerk authentication and extract JWT
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  if (!userId || !token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[onboarding-complete] profile lookup failed", {
      userId,
      message: profileError?.message,
      hint: profileError?.hint,
      code: profileError?.code
    });
    return NextResponse.json({ error: "Could not verify user profile." }, { status: 500 });
  }

  if (profile?.tenant_id && profile.tenant_id !== tenant_id) {
    return NextResponse.json({ error: "Forbidden tenant access." }, { status: 403 });
  }

  const { error: completionError } = await supabase.rpc("complete_onboarding", {
    p_tenant_id: tenant_id,
    p_business_name: business_name.trim(),
    p_category: category.trim(),
    p_phone: phone.trim(),
    p_address: address.trim(),
    p_service_areas: service_areas || [],
    p_website_url: website_url.trim(),
    p_tech_stack: tech_stack || "unknown",
    p_cms_type: cms_type || "unknown",
    p_gbp_location_id: gbp_location_id || null,
    p_place_id: place_id || null,
    p_competitor_urls: competitor_urls || []
  });

  if (completionError) {
    console.error("[onboarding-complete] atomic onboarding write failed", {
      tenant_id,
      message: completionError.message,
      hint: completionError.hint,
      code: completionError.code,
      details: completionError.details
    });
    return NextResponse.json({ error: completionError.message || "Failed to complete onboarding." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
