import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const publicRoutes = ["/", "/login", "/auth/signup", "/auth/reset-password", "/auth/update-password"];

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function clampOnboardingStep(step: unknown) {
  const numericStep = Number(step ?? 1);

  if (!Number.isFinite(numericStep)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(numericStep), 1), 3);
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isSignupPage = pathname.startsWith("/auth/signup");
  const isResetPasswordPage = pathname.startsWith("/auth/reset-password");
  const isUpdatePasswordPage = pathname.startsWith("/auth/update-password");
  const isRecoveryPage = isResetPasswordPage || isUpdatePasswordPage;
  const isLoginPage = pathname.startsWith("/login");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/";
  const isEntryPage = isPublicPage || isLoginPage || isSignupPage;

  if (!user) {
    if (!isPublicRoute(pathname)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return res;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return res;
  }

  if (!profile?.org_id) {
    const onboardingUrl = new URL("/onboarding", req.url);
    onboardingUrl.searchParams.set("step", "1");

    if (pathname !== "/onboarding" || req.nextUrl.searchParams.get("step") !== "1") {
      return NextResponse.redirect(onboardingUrl);
    }

    return res;
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("onboarding_status, onboarding_step, onboarding_completed")
    .eq("id", profile.org_id)
    .maybeSingle();

  if (organizationError || !organization) {
    if (isOnboardingPage || isDashboardPage || isRecoveryPage) {
      return res;
    }

    if (isEntryPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return res;
  }

  const normalizedOnboardingStatus = String(organization.onboarding_status ?? "").trim().toLowerCase();
  const onboardingStep = clampOnboardingStep(organization.onboarding_step);
  const isDone =
    normalizedOnboardingStatus === "completed" ||
    Boolean(organization.onboarding_completed) ||
    Number(organization.onboarding_step ?? 0) >= 4;

  const onboardingUrl = new URL("/onboarding", req.url);
  onboardingUrl.searchParams.set("step", String(onboardingStep));

  if (isDone && !isDashboardPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isDone && !isOnboardingPage && !isRecoveryPage) {
    return NextResponse.redirect(onboardingUrl);
  }

  if (!isDone && isOnboardingPage && req.nextUrl.searchParams.get("step") !== String(onboardingStep)) {
    return NextResponse.redirect(onboardingUrl);
  }

  if (isDone && (isOnboardingPage || isEntryPage)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isDone && isEntryPage) {
    return NextResponse.redirect(onboardingUrl);
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/auth/:path*", "/onboarding/:path*", "/dashboard/:path*"]
};
