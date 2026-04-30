"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type OnboardingState = {
  tenantId: string;
  businessName: string;
  category: string;
  phoneCountryCode: string;
  businessPhone: string;
  fullPhysicalAddress: string;
  gmbUrl: string;
  targetMarketType: "local_city" | "national";
  targetCity: string;
  primaryLanguage: string;
  competitorOneUrl: string;
  competitorTwoUrl: string;
  competitorThreeUrl: string;
  websiteUrl: string;
  hasSearchConsoleAccess: boolean;
  isServiceAreaBusiness: boolean;
  techStack: string;
  detectedStackLabel: string;
  seoHasSsl: boolean | null;
  seoHasRobotsTxt: boolean | null;
  shopifyStoreUrl: string;
};

const initialState: OnboardingState = {
  tenantId: "",
  businessName: "",
  category: "",
  phoneCountryCode: "+91",
  businessPhone: "",
  fullPhysicalAddress: "",
  gmbUrl: "",
  targetMarketType: "local_city",
  targetCity: "",
  primaryLanguage: "",
  competitorOneUrl: "",
  competitorTwoUrl: "",
  competitorThreeUrl: "",
  websiteUrl: "",
  hasSearchConsoleAccess: false,
  isServiceAreaBusiness: false,
  techStack: "unknown",
  detectedStackLabel: "Stack not scanned yet",
  seoHasSsl: null,
  seoHasRobotsTxt: null,
  shopifyStoreUrl: ""
};

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

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

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

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [state, setState] = useState<OnboardingState>(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detectingStack, setDetectingStack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ensureSessionHeartbeat() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    const {
      data: { session: refreshedSession },
      error: refreshError
    } = await supabase.auth.refreshSession();

    if (refreshError || !refreshedSession) {
      setLoading(false);
      router.replace(`/login?error=auth_session_missing&t=${Date.now()}`);
      router.refresh();
      return false;
    }

    return true;
  }

  async function postOnboardingJson(path: string, payload: Record<string, unknown>) {
    const hasSession = await ensureSessionHeartbeat();

    if (!hasSession) {
      return null;
    }

    let response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 401) {
      const recovered = await ensureSessionHeartbeat();

      if (!recovered) {
        return null;
      }

      response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }

    return response;
  }

  useEffect(() => {
    async function loadState() {
      const hasSession = await ensureSessionHeartbeat();

      if (!hasSession) {
        setLoading(false);
        return;
      }

      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("tenant_id, provisioning_status").eq("id", user.id).maybeSingle();

      if (!profile?.tenant_id) {
        router.replace("/onboarding/provisioning");
        return;
      }

      // Check if onboarding is actually completed by checking tenant.onboarding_completed
      const { data: tenant } = await supabase.from("tenants").select("onboarding_completed").eq("id", profile.tenant_id).maybeSingle();

      if (tenant?.onboarding_completed) {
        setLoading(false);
        router.replace(`/dashboard?t=${Date.now()}`);
        router.refresh();
        return;
      }

      setState({
        tenantId: profile.tenant_id,
        businessName: "",
        category: "",
        phoneCountryCode: "+91",
        businessPhone: "",
        fullPhysicalAddress: "",
        gmbUrl: "",
        targetMarketType: "local_city",
        targetCity: "",
        primaryLanguage: "",
        competitorOneUrl: "",
        competitorTwoUrl: "",
        competitorThreeUrl: "",
        websiteUrl: "",
        hasSearchConsoleAccess: false,
        isServiceAreaBusiness: false,
        techStack: "unknown",
        detectedStackLabel: "Stack not scanned yet",
        seoHasSsl: null,
        seoHasRobotsTxt: null,
        shopifyStoreUrl: ""
      });

      setLoading(false);
    }

    loadState();
  }, [router, supabase]);

  useEffect(() => {
    const normalizedWebsiteUrl = resolveValidWebsiteUrl(state.websiteUrl);

    if (!normalizedWebsiteUrl) {
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
          body: JSON.stringify({ websiteUrl: normalizedWebsiteUrl })
        });

        const body = (await response.json()) as {
          techStack?: string;
          detectedLabel?: string;
          seoHealth?: { hasSsl: boolean; hasRobotsTxt: boolean };
        };

        if (isCancelled) {
          return;
        }

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            techStack: body.techStack ?? detectTechStackFromUrl(normalizedWebsiteUrl),
            detectedStackLabel: body.detectedLabel ?? "Custom Stack Detected",
            seoHasSsl: body.seoHealth?.hasSsl ?? null,
            seoHasRobotsTxt: body.seoHealth?.hasRobotsTxt ?? null
          }));
        } else {
          setState((prev) => ({
            ...prev,
            techStack: detectTechStackFromUrl(normalizedWebsiteUrl),
            detectedStackLabel: "Custom Stack Detected",
            seoHasSsl: normalizedWebsiteUrl.startsWith("https://"),
            seoHasRobotsTxt: null
          }));
        }
      } catch {
        if (!isCancelled) {
          setState((prev) => ({
            ...prev,
            techStack: detectTechStackFromUrl(normalizedWebsiteUrl),
            detectedStackLabel: "Custom Stack Detected",
            seoHasSsl: normalizedWebsiteUrl.startsWith("https://"),
            seoHasRobotsTxt: null
          }));
        }
      } finally {
        if (!isCancelled) {
          setDetectingStack(false);
        }
      }
    }, 900);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [state.websiteUrl]);

  async function handleSubmit() {
    if (!state.tenantId) {
      setError("Workspace is still initializing. Please wait a moment and retry.");
      return;
    }

    const normalizedWebsiteUrl = resolveValidWebsiteUrl(state.websiteUrl);
    const normalizedGmbUrl = state.gmbUrl ? resolveValidWebsiteUrl(state.gmbUrl) : null;
    const normalizedPhone = `${state.phoneCountryCode} ${state.businessPhone}`.trim();

    const competitorCandidates = [state.competitorOneUrl, state.competitorTwoUrl, state.competitorThreeUrl]
      .map((value) => resolveValidWebsiteUrl(value) ?? value.trim())
      .filter(Boolean);

    if (
      !state.businessName.trim() ||
      !state.category.trim() ||
      !state.businessPhone.trim() ||
      !state.fullPhysicalAddress.trim() ||
      !state.primaryLanguage.trim() ||
      !normalizedWebsiteUrl
    ) {
      setError("Please complete all required fields before activation.");
      return;
    }

    if (state.targetMarketType === "local_city" && !state.targetCity.trim()) {
      setError("Target city is required when market focus is Local City.");
      return;
    }

    if (state.gmbUrl && !normalizedGmbUrl) {
      setError("Google Business Profile URL is invalid.");
      return;
    }

    const invalidCompetitor = competitorCandidates.find((entry) => !isValidUrl(entry));
    if (invalidCompetitor) {
      setError("Each competitor URL must be valid.");
      return;
    }

    const resolvedTechStack =
      state.techStack === "unknown" ? detectTechStackFromUrl(normalizedWebsiteUrl) : state.techStack;

    setSaving(true);
    setError(null);

    const response = await postOnboardingJson("/api/onboarding/complete", {
      tenantId: state.tenantId,
      businessIdentity: {
        businessName: state.businessName.trim(),
        category: state.category.trim(),
        businessPhone: normalizedPhone,
        fullPhysicalAddress: state.fullPhysicalAddress.trim(),
        gmbUrl: normalizedGmbUrl,
        primaryLanguage: state.primaryLanguage.trim(),
        isServiceAreaBusiness: state.isServiceAreaBusiness
      },
      digitalAssets: {
        websiteUrl: normalizedWebsiteUrl,
        techStack: resolvedTechStack,
        detectedStackLabel: state.detectedStackLabel,
        seoHealth: {
          hasSsl: state.seoHasSsl,
          hasRobotsTxt: state.seoHasRobotsTxt
        },
        hasSearchConsoleAccess: state.hasSearchConsoleAccess,
        shopifyStoreUrl: state.shopifyStoreUrl.trim() || null
      },
      searchStrategy: {
        targetMarketType: state.targetMarketType,
        targetCity: state.targetMarketType === "local_city" ? state.targetCity.trim() : null,
        competitors: competitorCandidates
      }
    });

    if (!response) {
      setSaving(false);
      return;
    }

    const body = (await response.json()) as { error?: string };

    if (!response.ok || body.error) {
      setSaving(false);
      setError(body.error ?? "Could not complete onboarding. Please retry.");
      return;
    }

    setSaving(false);
    
    // Save CMS credentials if tech stack is shopify
    if (resolvedTechStack === "shopify" && state.shopifyStoreUrl.trim()) {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
          
          if (profile?.tenant_id) {
            await supabase.from("cms_credentials").upsert({
              tenant_id: profile.tenant_id,
              cms_type: "shopify",
              site_url: state.shopifyStoreUrl.trim(),
              encrypted_credentials: {},
              updated_at: new Date().toISOString()
            }, {
              onConflict: "tenant_id,cms_type"
            });
          }
        }
      } catch (cmsError) {
        console.warn("Failed to save CMS credentials:", cmsError);
      }
    }
    
    router.replace(`/dashboard?t=${Date.now()}`);
    router.refresh();
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <p className="w-full text-center text-sm text-muted-foreground">Loading onboarding...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Single-Page Onboarding</p>
          <CardTitle>Launch your Claux workspace</CardTitle>
          <CardDescription>One form, one save, one redirect to your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-base font-semibold">Business Identity</h2>
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
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold">Digital Assets</h2>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Primary Website URL</Label>
              <Input
                id="websiteUrl"
                placeholder="https://yourbusiness.com"
                value={state.websiteUrl}
                onChange={(e) => setState((prev) => ({ ...prev, websiteUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gmbUrl">Google Business Profile URL</Label>
              <Input
                id="gmbUrl"
                placeholder="https://business.google.com/..."
                value={state.gmbUrl}
                onChange={(e) => setState((prev) => ({ ...prev, gmbUrl: e.target.value }))}
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
            <div className="rounded-lg border border-border/70 bg-muted/30 p-4 text-sm">
              <p className="font-medium">Detected Stack</p>
              <p className="mt-1 text-muted-foreground">
                {detectingStack ? "Scanning..." : state.techStack === "unknown" ? "Custom Stack Detected" : state.detectedStackLabel}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                SSL: {state.seoHasSsl === null ? "Unknown" : state.seoHasSsl ? "Enabled" : "Missing"} · Robots.txt: {" "}
                {state.seoHasRobotsTxt === null ? "Unknown" : state.seoHasRobotsTxt ? "Found" : "Not Found"}
              </p>
            </div>
            {state.techStack === "shopify" ? (
              <div className="space-y-2">
                <Label htmlFor="shopifyStoreUrl">Shopify Store URL</Label>
                <Input
                  id="shopifyStoreUrl"
                  placeholder="https://yourstore.myshopify.com"
                  value={state.shopifyStoreUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, shopifyStoreUrl: e.target.value }))}
                />
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold">Search Strategy</h2>
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
            {state.targetMarketType === "local_city" ? (
              <div className="space-y-2">
                <Label htmlFor="targetCity">Target City</Label>
                <Input
                  id="targetCity"
                  placeholder="Mumbai"
                  value={state.targetCity}
                  onChange={(e) => setState((prev) => ({ ...prev, targetCity: e.target.value }))}
                />
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="primaryLanguage">Primary Language</Label>
              <Input
                id="primaryLanguage"
                placeholder="English"
                value={state.primaryLanguage}
                onChange={(e) => setState((prev) => ({ ...prev, primaryLanguage: e.target.value }))}
              />
            </div>
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
          </section>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          ) : null}

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? "Activating..." : "Activate Claux SEO"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
