"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type WizardState = {
  orgId: string;
  businessName: string;
  category: string;
  phoneCountryCode: string;
  businessPhone: string;
  fullPhysicalAddress: string;
  competitorOneUrl: string;
  competitorTwoUrl: string;
  competitorThreeUrl: string;
  gmbUrl: string;
  targetMarketType: "local_city" | "national";
  targetCity: string;
  primaryLanguage: string;
  isServiceAreaBusiness: boolean;
  websiteUrl: string;
  hasSearchConsoleAccess: boolean;
  techStack: string;
  detectedStackLabel: string;
  seoHasSsl: boolean | null;
  seoHasRobotsTxt: boolean | null;
  shopifyStoreUrl: string;
  onboardingStep: number;
  onboardingCompleted: boolean;
};

const initialState: WizardState = {
  orgId: "",
  businessName: "",
  category: "",
  phoneCountryCode: "+91",
  businessPhone: "",
  fullPhysicalAddress: "",
  competitorOneUrl: "",
  competitorTwoUrl: "",
  competitorThreeUrl: "",
  gmbUrl: "",
  targetMarketType: "local_city",
  targetCity: "",
  primaryLanguage: "",
  isServiceAreaBusiness: false,
  websiteUrl: "",
  hasSearchConsoleAccess: false,
  techStack: "unknown",
  detectedStackLabel: "Stack not scanned yet",
  seoHasSsl: null,
  seoHasRobotsTxt: null,
  shopifyStoreUrl: "",
  onboardingStep: 1,
  onboardingCompleted: false
};

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
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

const CATEGORY_OPTIONS = [
  "Dental",
  "E-commerce",
  "Real Estate",
  "SaaS",
  "Legal",
  "Healthcare",
  "Education",
  "Hospitality",
  "Finance",
  "Other"
];

const PHONE_COUNTRY_CODES = ["+91", "+1", "+44", "+61", "+971"];

function splitPhone(phone: string) {
  const trimmed = phone.trim();
  const matchedPrefix = PHONE_COUNTRY_CODES.find((prefix) => trimmed.startsWith(prefix));

  if (!matchedPrefix) {
    return { phoneCountryCode: "+91", businessPhone: trimmed };
  }

  return {
    phoneCountryCode: matchedPrefix,
    businessPhone: trimmed.replace(matchedPrefix, "").trim()
  };
}

function clampStep(step: unknown) {
  const numericStep = Number(step ?? 1);

  if (!Number.isFinite(numericStep)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(numericStep), 1), 3);
}

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [state, setState] = useState<WizardState>(initialState);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingStack, setDetectingStack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null);
  const [isHandshakeComplete, setIsHandshakeComplete] = useState(false);

  useEffect(() => {
    async function loadState() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.replace("/");
        return;
      }

      let profile: { org_id: string } | null = null;
      let profileError: { message?: string; hint?: string } | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const response = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
        profile = response.data as { org_id: string } | null;
        profileError = response.error;

        if (profile?.org_id) {
          break;
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
        }
      }

      if (profileError || !profile?.org_id) {
        router.replace("/onboarding/provisioning");
        return;
      }

      setState((prev) => ({ ...prev, orgId: profile.org_id }));

      let organization: Record<string, unknown> | null = null;
      let organizationError: { message?: string; hint?: string } | null = null;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const response = await supabase.from("organizations").select("*").eq("id", profile.org_id).maybeSingle();
        organization = response.data;
        organizationError = response.error;

        if (organization) {
          break;
        }

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 200));
        }
      }

      if (organizationError || !organization) {
        console.error("[onboarding] organization load failed", {
          orgId: profile.org_id,
          message: organizationError?.message,
          hint: organizationError?.hint
        });
        setError("Workspace is still provisioning. Please retry in a moment.");
        setLoading(false);
        return;
      }

      const { data: connection } = await supabase
        .from("connections")
        .select("website_url, tech_stack, google_api_links")
        .eq("org_id", profile.org_id)
        .maybeSingle();

      const { data: competitors } = await supabase
        .from("organization_competitors")
        .select("competitor_url, rank")
        .eq("org_id", profile.org_id)
        .order("rank", { ascending: true });

      const hasSearchConsoleAccess = Boolean(connection?.google_api_links?.has_search_console_access);
      const shopifyStoreUrl = String(connection?.google_api_links?.shopify_store_url ?? "");
      const existingScan = (connection?.google_api_links?.website_scan ?? {}) as Record<string, unknown>;
      const competitorUrls =
        competitors && competitors.length > 0
          ? competitors.map((entry) => entry.competitor_url)
          : Array.isArray(organization.top_competitors)
            ? (organization.top_competitors as string[])
            : [];
      const parsedPhone = splitPhone(String(organization.business_phone ?? ""));
      const targetMarketType =
        String(organization.target_market_type ?? "") === "national"
          ? "national"
          : String(organization.target_market_type ?? "") === "local_city"
            ? "local_city"
            : organization.target_city
              ? "local_city"
              : "national";

      const nextState: WizardState = {
        orgId: String(organization.id ?? profile.org_id),
        businessName: String(organization.name ?? ""),
        category: String(organization.category ?? ""),
        phoneCountryCode: parsedPhone.phoneCountryCode,
        businessPhone: parsedPhone.businessPhone,
        fullPhysicalAddress: String(organization.full_physical_address ?? ""),
        competitorOneUrl: competitorUrls[0] ?? "",
        competitorTwoUrl: competitorUrls[1] ?? "",
        competitorThreeUrl: competitorUrls[2] ?? "",
        gmbUrl: String(organization.gmb_url ?? ""),
        targetMarketType,
        targetCity: String(organization.target_city ?? ""),
        primaryLanguage: String(organization.primary_language ?? ""),
        isServiceAreaBusiness: Boolean(organization.is_service_area_business ?? false),
        websiteUrl: connection?.website_url ?? "",
        hasSearchConsoleAccess,
        techStack: connection?.tech_stack ?? "unknown",
        detectedStackLabel: String(existingScan.detected_label ?? "Stack not scanned yet"),
        seoHasSsl:
          typeof existingScan.seo_health === "object" && existingScan.seo_health !== null
            ? Boolean((existingScan.seo_health as Record<string, unknown>).has_ssl)
            : null,
        seoHasRobotsTxt:
          typeof existingScan.seo_health === "object" && existingScan.seo_health !== null
            ? Boolean((existingScan.seo_health as Record<string, unknown>).has_robots_txt)
            : null,
        shopifyStoreUrl,
        onboardingStep: Number(organization.onboarding_step ?? 1),
        onboardingCompleted: Boolean(organization.onboarding_completed ?? false)
      };

      const orgOnboardingCompleted =
        nextState.onboardingCompleted ||
        String(organization.onboarding_status ?? "") === "completed" ||
        Number(organization.onboarding_step ?? 0) >= 4;

      if (orgOnboardingCompleted) {
        router.replace("/dashboard");
        return;
      }

      const requestedStep = searchParams.get("step");
      const resolvedStep = requestedStep ? clampStep(requestedStep) : clampStep(nextState.onboardingStep);

      setState(nextState);
      setStep(resolvedStep);
      setLoading(false);
    }

    loadState();
  }, [router, searchParams, supabase]);

  useEffect(() => {
    const google = searchParams.get("google");
    const target = searchParams.get("target");

    if (google === "connected") {
      const label = target === "gmb" ? "Google Business Profile" : "Google Search Console";
      setIntegrationMessage(`${label} connected successfully.`);
    }

    if (google === "error") {
      setIntegrationMessage("Google connection failed. Please retry.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (step !== 2 || !isValidUrl(state.websiteUrl)) {
      setDetectingStack(false);
      return;
    }

    let isCancelled = false;
    setDetectingStack(true);

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/onboarding/scan-website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl: state.websiteUrl })
        });

        const body = (await response.json()) as {
          techStack?: string;
          detectedLabel?: string;
          seoHealth?: { hasSsl: boolean; hasRobotsTxt: boolean };
        };

        if (!isCancelled && response.ok) {
          setState((prev) => ({
            ...prev,
            techStack: body.techStack ?? detectTechStackFromUrl(prev.websiteUrl),
            detectedStackLabel: body.detectedLabel ?? "Custom Stack Detected",
            seoHasSsl: body.seoHealth?.hasSsl ?? null,
            seoHasRobotsTxt: body.seoHealth?.hasRobotsTxt ?? null
          }));
        }

        if (!isCancelled && !response.ok) {
          setState((prev) => ({
            ...prev,
            techStack: detectTechStackFromUrl(prev.websiteUrl),
            detectedStackLabel: "Custom Stack Detected",
            seoHasSsl: prev.websiteUrl.startsWith("https://"),
            seoHasRobotsTxt: null
          }));
        }
      } catch {
        if (!isCancelled) {
          setState((prev) => ({
            ...prev,
            techStack: detectTechStackFromUrl(prev.websiteUrl),
            detectedStackLabel: "Custom Stack Detected",
            seoHasSsl: prev.websiteUrl.startsWith("https://"),
            seoHasRobotsTxt: null
          }));
        }
      } finally {
        if (!isCancelled) {
          setDetectingStack(false);
        }
      }
    }, 1500);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [state.websiteUrl, step]);

  async function saveBrandProfile() {
    if (!state.orgId) {
      console.error("[DEBUG] Saving to Org ID:", state.orgId);
      window.alert("Organization ID is missing. Please refresh and try again.");
      setError("Workspace is still initializing. Please wait a moment and retry.");
      return;
    }

    const normalizedPhone = `${state.phoneCountryCode} ${state.businessPhone}`.trim();
    const topCompetitors = [state.competitorOneUrl, state.competitorTwoUrl, state.competitorThreeUrl]
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 3);

    if (
      !state.businessName ||
      !state.category ||
      !state.businessPhone ||
      !state.fullPhysicalAddress ||
      !state.primaryLanguage
    ) {
      setError("Please complete all identity fields before continuing.");
      return;
    }

    if (state.targetMarketType === "local_city" && !state.targetCity.trim()) {
      setError("Target city is required for local city focus.");
      return;
    }

    if (state.gmbUrl && !isValidUrl(state.gmbUrl)) {
      setError("Please enter a valid Google Business Profile URL including https://");
      return;
    }

    const invalidCompetitor = topCompetitors.find((entry) => !isValidUrl(entry));
    if (invalidCompetitor) {
      setError("Each competitor must be a valid URL including https://");
      return;
    }

    const competitorRows = topCompetitors.map((competitorUrl, index) => ({
      org_id: state.orgId,
      competitor_url: competitorUrl,
      rank: index + 1,
      updated_at: new Date().toISOString()
    }));

    setSaving(true);
    setError(null);

    const orgId = state.orgId;
    console.log("[DEBUG] Saving to Org ID:", orgId);

    const organizationPayload = {
      id: orgId,
      name: state.businessName,
      category: state.category,
      business_phone: normalizedPhone,
      gmb_url: state.gmbUrl || null,
      target_market_type: state.targetMarketType,
      full_physical_address: state.fullPhysicalAddress,
      top_competitors: topCompetitors,
      target_city: state.targetMarketType === "local_city" ? state.targetCity : null,
      primary_language: state.primaryLanguage,
      onboarding_step: 2
    };

    const response = await fetch("/api/onboarding/update-org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, organizationPayload, competitorRows })
    });

    let body: Record<string, unknown> | null = null;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      body = null;
    }

    console.log("[onboarding] server-side save response", {
      status: response.status,
      body
    });

    if (!response.ok) {
      setSaving(false);
      setError(String(body?.error ?? "Failed to save brand profile."));
      return;
    }

    setSaving(false);

    setStep(2);
  }

  async function saveAssetConnection() {
    if (!isValidUrl(state.websiteUrl)) {
      setError("Please enter a valid primary website URL including https://");
      return;
    }

    const resolvedTechStack = state.techStack === "unknown" ? detectTechStackFromUrl(state.websiteUrl) : state.techStack;

    setSaving(true);
    setError(null);

    const response = await fetch("/api/onboarding/update-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: state.orgId,
        websiteUrl: state.websiteUrl,
        techStack: resolvedTechStack,
        detectedStackLabel: state.detectedStackLabel,
        seoHealth: {
          hasSsl: state.seoHasSsl,
          hasRobotsTxt: state.seoHasRobotsTxt
        },
        hasSearchConsoleAccess: state.hasSearchConsoleAccess,
        shopifyStoreUrl: state.shopifyStoreUrl,
        isServiceAreaBusiness: state.isServiceAreaBusiness
      })
    });

    const body = (await response.json()) as { error?: string; hint?: string | null; code?: string | null; details?: string | null };

    if (!response.ok) {
      console.error("[onboarding] update-assets failed", {
        status: response.status,
        body
      });
      setSaving(false);
      setError(body.error ?? body.details ?? "Failed to save website connection.");
      return;
    }

    setSaving(false);

    // Always move forward in UI after a successful API response.
    setState((prev) => ({ ...prev, techStack: resolvedTechStack }));
    setStep(3);
  }

  function connectGoogle(target: "search_console" | "gmb") {
    window.location.href = `/api/integrations/google/connect?target=${target}`;
  }

  function showMetaIntegrationMessage() {
    window.alert("Integration pending API approval. Proceeding to Dashboard...");
  }

  async function completeIntelligenceSync() {
    try {
      await fetch("/api/onboarding/update-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: state.orgId,
          websiteUrl: state.websiteUrl,
          techStack: state.techStack === "unknown" ? detectTechStackFromUrl(state.websiteUrl) : state.techStack,
          detectedStackLabel: state.detectedStackLabel,
          seoHealth: {
            hasSsl: state.seoHasSsl,
            hasRobotsTxt: state.seoHasRobotsTxt
          },
          hasSearchConsoleAccess: state.hasSearchConsoleAccess,
          shopifyStoreUrl: state.shopifyStoreUrl,
          isServiceAreaBusiness: state.isServiceAreaBusiness,
          onboardingStatus: "completed",
          onboardingStep: 4
        })
      });
    } catch (completionError) {
      console.error("[onboarding] completion request failed; redirecting anyway", completionError);
    }

    setIsHandshakeComplete(true);
    window.location.href = "/dashboard";
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading workspace...</p>;
  }

  if (!state.orgId) {
    return <p className="text-sm text-muted-foreground">Initializing workspace...</p>;
  }

  if (isHandshakeComplete) {
    return (
      <Card className="border-border/70 bg-card/95 backdrop-blur">
        <CardContent className="space-y-4 p-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">Final Handshake</p>
          <h2 className="text-2xl font-semibold">Universal SEO Bridge Established.</h2>
          <p className="text-sm text-muted-foreground">Your 9 Agents are initializing...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/70 bg-card/95 backdrop-blur">
      <CardHeader>
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Step {step} of 3</p>
        <CardTitle>Organization setup wizard</CardTitle>
        <CardDescription>Securely configure your tenant workspace and data connections.</CardDescription>
        <Progress value={(step / 3) * 100} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Help CLAUX understand your identity and market so our AI agents can localize strategy from day one.
            </p>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={state.businessName}
                onChange={(e) => setState((prev) => ({ ...prev, businessName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Business Category</Label>
              <Input
                id="category"
                list="business-category-options"
                placeholder="Search category"
                value={state.category}
                onChange={(e) => setState((prev) => ({ ...prev, category: e.target.value }))}
              />
              <datalist id="business-category-options">
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">Business Phone</Label>
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <select
                  value={state.phoneCountryCode}
                  onChange={(e) => setState((prev) => ({ ...prev, phoneCountryCode: e.target.value }))}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {PHONE_COUNTRY_CODES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <Input
                  id="businessPhone"
                  placeholder="98XXXXXX10"
                  value={state.businessPhone}
                  onChange={(e) => setState((prev) => ({ ...prev, businessPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullPhysicalAddress">Full Physical Address</Label>
              <Input
                id="fullPhysicalAddress"
                placeholder="221B Baker Street, London"
                value={state.fullPhysicalAddress}
                onChange={(e) => setState((prev) => ({ ...prev, fullPhysicalAddress: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmbUrl">Google Business Profile (GMB) URL</Label>
              <Input
                id="gmbUrl"
                placeholder="https://business.google.com/..."
                value={state.gmbUrl}
                onChange={(e) => setState((prev) => ({ ...prev, gmbUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Market Focus</Label>
              <div className="inline-flex rounded-lg border border-border/70 bg-muted/20 p-1">
                <button
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    state.targetMarketType === "local_city" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setState((prev) => ({ ...prev, targetMarketType: "local_city" }))}
                >
                  Local City
                </button>
                <button
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    state.targetMarketType === "national" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setState((prev) => ({ ...prev, targetMarketType: "national", targetCity: "" }))}
                >
                  National / Entire Country
                </button>
              </div>
            </div>
            {state.targetMarketType === "local_city" && (
              <div className="space-y-2">
                <Label htmlFor="targetCity">Target City</Label>
                <Input
                  id="targetCity"
                  placeholder="Mumbai"
                  value={state.targetCity}
                  onChange={(e) => setState((prev) => ({ ...prev, targetCity: e.target.value }))}
                />
              </div>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="competitorOneUrl">Competitor 1</Label>
                <Input
                  id="competitorOneUrl"
                  placeholder="https://competitor1.com"
                  value={state.competitorOneUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, competitorOneUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitorTwoUrl">Competitor 2</Label>
                <Input
                  id="competitorTwoUrl"
                  placeholder="https://competitor2.com"
                  value={state.competitorTwoUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, competitorTwoUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competitorThreeUrl">Competitor 3</Label>
                <Input
                  id="competitorThreeUrl"
                  placeholder="https://competitor3.com"
                  value={state.competitorThreeUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, competitorThreeUrl: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryLanguage">Primary Language</Label>
              <Input
                id="primaryLanguage"
                placeholder="English"
                value={state.primaryLanguage}
                onChange={(e) => setState((prev) => ({ ...prev, primaryLanguage: e.target.value }))}
              />
            </div>
            <Button className="w-full sm:w-auto" disabled={saving} onClick={saveBrandProfile}>
              {saving ? "Saving..." : "Save and continue"}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your digital assets. CLAUX identifies your website technology in the background.
            </p>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Primary Website URL</Label>
              <Input
                id="websiteUrl"
                placeholder="https://yourbusiness.com"
                value={state.websiteUrl}
                onChange={(e) => setState((prev) => ({ ...prev, websiteUrl: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={state.hasSearchConsoleAccess}
                onChange={(e) => setState((prev) => ({ ...prev, hasSearchConsoleAccess: e.target.checked }))}
              />
              I have Google Search Console access
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={state.isServiceAreaBusiness}
                onChange={(e) => setState((prev) => ({ ...prev, isServiceAreaBusiness: e.target.checked }))}
              />
              I am a service-area business (no physical shop)
            </label>
            {integrationMessage ? <p className="text-sm text-primary">{integrationMessage}</p> : null}
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4">
              <p className="text-sm font-medium">Identified Tech Stack</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {detectingStack ? (
                  <span className="animate-pulse">Searching for tech stack...</span>
                ) : state.techStack === "unknown" ? (
                  "Custom Stack Detected"
                ) : (
                  `${state.detectedStackLabel}`
                )}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>SSL: {state.seoHasSsl === null ? "Unknown" : state.seoHasSsl ? "Enabled" : "Missing"}</p>
                <p>
                  Robots.txt: {state.seoHasRobotsTxt === null ? "Unknown" : state.seoHasRobotsTxt ? "Found" : "Not Found"}
                </p>
              </div>

              {state.techStack === "shopify" && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="shopifyStoreUrl">Shopify Store URL</Label>
                  <Input
                    id="shopifyStoreUrl"
                    placeholder="https://yourstore.myshopify.com"
                    value={state.shopifyStoreUrl}
                    onChange={(e) => setState((prev) => ({ ...prev, shopifyStoreUrl: e.target.value }))}
                  />
                </div>
              )}

              {state.techStack === "wordpress" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  WordPress detected. Plugin-based connection will be available in a future update.
                </p>
              )}

              {state.techStack === "laravel" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Laravel detected. CLAUX will map routes and content structure during sync.
                </p>
              )}

              {state.techStack === "react" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  React stack detected. CLAUX will adapt crawling and rendering strategy automatically.
                </p>
              )}

              {state.techStack === "custom_php" && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Custom PHP detected. CLAUX will use adaptive crawling and content parsing.
                </p>
              )}
            </div>
            <Button className="w-full sm:w-auto" disabled={saving} onClick={saveAssetConnection}>
              {saving ? "Saving..." : "Save assets and continue"}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">Intelligence Sync: Google + Meta</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Connect Google Search Console, Google Analytics, and Meta assets to unlock ranking and demand
                intelligence.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Our AI Agents adapt to your specific website technology automatically.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" type="button" onClick={() => connectGoogle("search_console")}>
                  Connect Google Search Console
                </Button>
                <Button variant="secondary" type="button" onClick={() => connectGoogle("gmb")}>
                  Connect Google Business Profile
                </Button>
                <Button variant="secondary" type="button" onClick={showMetaIntegrationMessage}>
                  Connect Meta Business (placeholder)
                </Button>
              </div>
            </div>
            <Button className="w-full sm:w-auto" onClick={completeIntelligenceSync}>
              Finish onboarding
            </Button>
          </div>
        )}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-300">{error}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => router.refresh()}>
                Retry
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => router.push("/")}>
                Back to home
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
