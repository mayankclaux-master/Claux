import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UpdateAssetsRequest = {
  orgId: string;
  websiteUrl: string;
  techStack: string;
  detectedStackLabel: string;
  seoHealth: {
    hasSsl: boolean | null;
    hasRobotsTxt: boolean | null;
  };
  hasSearchConsoleAccess: boolean;
  shopifyStoreUrl: string;
  isServiceAreaBusiness: boolean;
  onboardingStatus?: string;
  onboardingStep?: number;
};

export async function POST(request: Request) {
  const {
    orgId,
    websiteUrl,
    techStack,
    detectedStackLabel,
    seoHealth,
    hasSearchConsoleAccess,
    shopifyStoreUrl,
    isServiceAreaBusiness,
    onboardingStatus,
    onboardingStep
  } = (await request.json()) as UpdateAssetsRequest;

  if (!orgId || !websiteUrl) {
    return NextResponse.json({ error: "orgId and websiteUrl are required." }, { status: 400 });
  }

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

  if (profileError || !profile) {
    console.error("[onboarding-assets] profile lookup failed", {
      userId: user.id,
      message: profileError?.message,
      hint: profileError?.hint
    });
    return NextResponse.json({ error: "Could not verify user profile." }, { status: 403 });
  }

  if (profile.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden org access." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();

  const { data: existingConnection } = await adminClient
    .from("connections")
    .select("google_api_links")
    .eq("org_id", orgId)
    .maybeSingle();

  const currentLinks = (existingConnection?.google_api_links ?? {}) as Record<string, unknown>;
  const websiteScan = {
    detected_label: detectedStackLabel,
    seo_health: {
      has_ssl: seoHealth?.hasSsl ?? null,
      has_robots_txt: seoHealth?.hasRobotsTxt ?? null
    }
  };

  let connectionSaveWarning: string | null = null;

  try {
    const { error: connectionError } = await adminClient.from("connections").upsert(
      {
        org_id: orgId,
        website_url: websiteUrl,
        tech_stack: techStack || "unknown",
        seo_has_ssl: seoHealth?.hasSsl ?? null,
        seo_has_robots_txt: seoHealth?.hasRobotsTxt ?? null,
        google_api_links: {
          ...currentLinks,
          website_scan: websiteScan,
          has_search_console_access: hasSearchConsoleAccess,
          shopify_store_url: shopifyStoreUrl || null
        },
        status: "pending",
        updated_at: new Date().toISOString()
      },
      { onConflict: "org_id" }
    );

    if (connectionError) {
      console.error("[onboarding-assets] connection upsert failed", {
        orgId,
        message: connectionError.message,
        hint: connectionError.hint,
        code: connectionError.code,
        details: connectionError.details
      });
      connectionSaveWarning = "Technical details could not be saved.";
    }
  } catch (connectionException) {
    console.error("[onboarding-assets] unexpected connection save failure", {
      orgId,
      error: connectionException
    });
    connectionSaveWarning = "Technical details could not be saved.";
  }

  let onboardingStepWarning: string | null = null;

  try {
    const organizationUpdatePayload: Record<string, unknown> = {
      onboarding_step: Number.isFinite(onboardingStep) ? onboardingStep : 3,
      is_service_area_business: isServiceAreaBusiness
    };

    if (typeof onboardingStatus === "string" && onboardingStatus.trim().length > 0) {
      organizationUpdatePayload.onboarding_status = onboardingStatus.trim();
      if (onboardingStatus.trim() === "completed") {
        organizationUpdatePayload.onboarding_completed = true;
      }
    }

    const { error: onboardingStepError } = await adminClient
      .from("organizations")
      .update(organizationUpdatePayload)
      .eq("id", orgId);

    if (onboardingStepError) {
      console.error("[onboarding-assets] organization advance failed", {
        orgId,
        message: onboardingStepError.message,
        hint: onboardingStepError.hint,
        code: onboardingStepError.code,
        details: onboardingStepError.details
      });
      onboardingStepWarning = "Onboarding step could not be updated.";
    }
  } catch (onboardingStepException) {
    console.error("[onboarding-assets] unexpected onboarding step update failure", {
      orgId,
      error: onboardingStepException
    });
    onboardingStepWarning = "Onboarding step could not be updated.";
  }

  return NextResponse.json({ success: true, connectionSaveWarning, onboardingStepWarning });
}
