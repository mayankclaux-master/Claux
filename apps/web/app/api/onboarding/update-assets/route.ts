import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOrCreateOrganizationApiSecret } from "@/lib/organization-secret";

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
  const completedRequested = typeof onboardingStatus === "string" && onboardingStatus.trim() === "completed";

  const { data: existingOrganizationData, error: existingOrganizationError } = await adminClient
    .from("organizations")
    .select("onboarding_status, onboarding_completed")
    .eq("id", orgId)
    .maybeSingle();

  const existingOrganization = existingOrganizationData as
    | { onboarding_status: string | null; onboarding_completed: boolean | null }
    | null;

  if (existingOrganizationError) {
    return NextResponse.json({ error: existingOrganizationError.message }, { status: 500 });
  }

  const wasAlreadyCompleted =
    Boolean(existingOrganization?.onboarding_completed) ||
    String(existingOrganization?.onboarding_status ?? "").trim().toLowerCase() === "completed";

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
  const now = new Date().toISOString();

  try {
    const connectionPayload = {
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
      updated_at: now
    };

    const connectionWrite = existingConnection
      ? adminClient.from("connections").update(connectionPayload).eq("org_id", orgId)
      : adminClient.from("connections").insert({
          ...connectionPayload,
          aria_status: "pending",
          aria_progress: 0,
          scribe_status: "pending",
          scribe_progress: 0,
          visual_status: "pending",
          visual_progress: 0,
          forge_status: "pending",
          forge_progress: 0,
          core_status: "pending",
          core_progress: 0,
          linx_status: "pending",
          linx_progress: 0,
          locl_status: "pending",
          locl_progress: 0,
          repute_status: "pending",
          repute_progress: 0,
          ampli_status: "pending",
          ampli_progress: 0
        });

    const { error: connectionError } = await connectionWrite;

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
      website_url: websiteUrl,
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

  let kickoffWarning: string | null = null;
  let kickoffTriggered = false;

  if (completedRequested && !wasAlreadyCompleted) {
    const webhookUrlFromEnv =
      process.env.N8N_ONBOARDING_WEBHOOK_URL ??
      (process.env.N8N_HOST ? `${process.env.N8N_HOST.replace(/\/$/, "")}/webhook/onboarding-complete` : "");

    if (!webhookUrlFromEnv) {
      kickoffWarning = "N8N onboarding webhook URL is not configured.";
    } else {
      try {
        const { apiSecret } = await getOrCreateOrganizationApiSecret(adminClient, orgId);

        const kickoffResponse = await fetch(webhookUrlFromEnv, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": `onboarding-complete-${orgId}`
          },
          body: JSON.stringify({
            event: "onboarding_completed",
            org_id: orgId,
            website_url: websiteUrl,
            api_secret: apiSecret,
            triggered_at: new Date().toISOString()
          })
        });

        if (!kickoffResponse.ok) {
          kickoffWarning = `Failed to trigger n8n kickoff (status ${kickoffResponse.status}).`;
        } else {
          kickoffTriggered = true;
        }
      } catch (kickoffError) {
        kickoffWarning = kickoffError instanceof Error ? kickoffError.message : "Failed to trigger n8n kickoff.";
      }
    }
  }

  return NextResponse.json({
    success: true,
    connectionSaveWarning,
    onboardingStepWarning,
    kickoffTriggered,
    kickoffWarning,
    kickoffSkippedAsDuplicate: completedRequested && wasAlreadyCompleted
  });
}
