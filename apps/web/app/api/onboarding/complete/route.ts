import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompleteOnboardingRequest = {
  orgId: string;
  businessIdentity: {
    businessName: string;
    category: string;
    businessPhone: string;
    fullPhysicalAddress: string;
    gmbUrl: string | null;
    primaryLanguage: string;
    isServiceAreaBusiness: boolean;
  };
  digitalAssets: {
    websiteUrl: string;
    techStack: string;
    detectedStackLabel: string;
    seoHealth: {
      hasSsl: boolean | null;
      hasRobotsTxt: boolean | null;
    };
    hasSearchConsoleAccess: boolean;
    shopifyStoreUrl: string | null;
  };
  searchStrategy: {
    targetMarketType: "local_city" | "national";
    targetCity: string | null;
    competitors: string[];
  };
};

function normalizeWebsiteUrlInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveValidWebsiteUrl(value: string) {
  const normalized = normalizeWebsiteUrlInput(value);

  if (!normalized || !isValidUrl(normalized)) {
    return null;
  }

  return normalized;
}

function detectTechStackFromUrl(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("myshopify.com") || normalized.includes("shopify")) {
    return "shopify";
  }
  if (normalized.includes("wp-") || normalized.includes("wordpress")) {
    return "wordpress";
  }
  if (normalized.includes("laravel")) {
    return "laravel";
  }
  if (normalized.includes("react") || normalized.includes("vercel.app") || normalized.includes("netlify.app")) {
    return "react";
  }
  if (normalized.includes("php")) {
    return "custom_php";
  }

  return "unknown";
}

export async function POST(request: Request) {
  const { orgId, businessIdentity, digitalAssets, searchStrategy } = (await request.json()) as CompleteOnboardingRequest;

  if (!orgId || !businessIdentity || !digitalAssets || !searchStrategy) {
    return NextResponse.json({ error: "Incomplete onboarding payload." }, { status: 400 });
  }

  const normalizedWebsiteUrl = resolveValidWebsiteUrl(digitalAssets.websiteUrl);
  const normalizedGmbUrl = businessIdentity.gmbUrl ? resolveValidWebsiteUrl(businessIdentity.gmbUrl) : null;

  if (!normalizedWebsiteUrl) {
    return NextResponse.json({ error: "A valid website URL is required." }, { status: 400 });
  }

  if (businessIdentity.gmbUrl && !normalizedGmbUrl) {
    return NextResponse.json({ error: "Google Business Profile URL is invalid." }, { status: 400 });
  }

  const normalizedCompetitors = (Array.isArray(searchStrategy.competitors) ? searchStrategy.competitors : [])
    .map((value) => resolveValidWebsiteUrl(String(value ?? "")) ?? String(value ?? "").trim())
    .filter((value) => value.length > 0)
    .slice(0, 3);

  if (normalizedCompetitors.some((value) => !isValidUrl(value))) {
    return NextResponse.json({ error: "Each competitor URL must be valid." }, { status: 400 });
  }

  const resolvedTechStack =
    String(digitalAssets.techStack ?? "").trim() || detectTechStackFromUrl(normalizedWebsiteUrl);

  const googleApiLinks = {
    website_scan: {
      detected_label: String(digitalAssets.detectedStackLabel ?? "Custom Stack Detected"),
      seo_health: {
        has_ssl: digitalAssets.seoHealth?.hasSsl ?? null,
        has_robots_txt: digitalAssets.seoHealth?.hasRobotsTxt ?? null
      }
    },
    has_search_console_access: Boolean(digitalAssets.hasSearchConsoleAccess),
    shopify_store_url: digitalAssets.shopifyStoreUrl ?? null
  };

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[onboarding-complete] profile lookup failed", {
      userId: user.id,
      message: profileError?.message,
      hint: profileError?.hint,
      code: profileError?.code
    });
    return NextResponse.json({ error: "Could not verify user profile." }, { status: 500 });
  }

  if (profile?.org_id && profile.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden org access." }, { status: 403 });
  }

  const { error: completionError } = await supabase.rpc("complete_onboarding_atomic", {
    p_org_id: orgId,
    p_business_name: businessIdentity.businessName.trim(),
    p_category: businessIdentity.category.trim(),
    p_business_phone: businessIdentity.businessPhone.trim(),
    p_full_physical_address: businessIdentity.fullPhysicalAddress.trim(),
    p_gmb_url: normalizedGmbUrl,
    p_target_market_type: searchStrategy.targetMarketType,
    p_target_city: searchStrategy.targetMarketType === "local_city" ? (searchStrategy.targetCity ?? "").trim() : null,
    p_primary_language: businessIdentity.primaryLanguage.trim(),
    p_is_service_area_business: Boolean(businessIdentity.isServiceAreaBusiness),
    p_website_url: normalizedWebsiteUrl,
    p_tech_stack: resolvedTechStack,
    p_google_api_links: googleApiLinks,
    p_competitors: normalizedCompetitors
  });

  if (completionError) {
    console.error("[onboarding-complete] atomic onboarding write failed", {
      orgId,
      message: completionError.message,
      hint: completionError.hint,
      code: completionError.code,
      details: completionError.details
    });
    return NextResponse.json({ error: completionError.message || "Failed to complete onboarding." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
