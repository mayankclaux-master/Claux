import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const publicRoutes = [
  "/",
  "/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/callback",
  "/auth/reset-password",
  "/auth/update-password",
  "/onboarding/provisioning"
];

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
  const isVerifyEmailPage = pathname.startsWith("/auth/verify-email");
  const isCallbackPage = pathname.startsWith("/auth/callback");
  const isRecoveryPage = isResetPasswordPage || isUpdatePasswordPage;
  const isLoginPage = pathname.startsWith("/login");
  const isProvisioningPage = pathname.startsWith("/onboarding/provisioning");
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

  if (!user.email_confirmed_at && !isVerifyEmailPage && !isRecoveryPage && !isCallbackPage) {
    const verifyUrl = new URL("/auth/verify-email", req.url);
    verifyUrl.searchParams.set("email", user.email ?? "");
    return NextResponse.redirect(verifyUrl);
  }

  if (user.email_confirmed_at && isVerifyEmailPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
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
    if (isOnboardingPage || isProvisioningPage) {
      return res;
    }

    return NextResponse.redirect(new URL("/onboarding/provisioning", req.url));
  }

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("onboarding_status, onboarding_step, onboarding_completed")
    .eq("id", profile.org_id)
    .maybeSingle();

  if (organizationError || !organization) {
    if (isRecoveryPage) {
      return res;
    }

    if (!isProvisioningPage) {
      return NextResponse.redirect(new URL("/onboarding/provisioning", req.url));
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

  if (!isDone && !isOnboardingPage && !isRecoveryPage && !isProvisioningPage) {
    return NextResponse.redirect(onboardingUrl);
  }

  if (!isDone && isOnboardingPage && req.nextUrl.searchParams.get("step") !== String(onboardingStep)) {
    return NextResponse.redirect(onboardingUrl);
  }

  if (isDone && (isOnboardingPage || isEntryPage || isProvisioningPage)) {
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
