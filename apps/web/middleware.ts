import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

const publicRoutes = [
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

function withTimestamp(url: URL) {
  url.searchParams.set("t", String(Date.now()));
  return url;
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
      return NextResponse.redirect(withTimestamp(new URL("/", req.url)));
    }

    return res;
  }

  if (!user.email_confirmed_at && !isVerifyEmailPage && !isRecoveryPage && !isCallbackPage) {
    const verifyUrl = new URL("/auth/verify-email", req.url);
    verifyUrl.searchParams.set("email", user.email ?? "");
    return NextResponse.redirect(withTimestamp(verifyUrl));
  }

  if (user.email_confirmed_at && isVerifyEmailPage) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(withTimestamp(onboardingUrl));
  }

  if (isProvisioningPage) {
    return res;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id, provisioning_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return res;
  }

  if (!profile?.tenant_id) {
    if (isDashboardPage || isOnboardingPage || isEntryPage) {
      return NextResponse.redirect(new URL("/onboarding/provisioning", req.url));
    }

    return res;
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("status, deleted_at")
    .eq("id", profile.tenant_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (tenantError) {
    return res;
  }

  // Soft-delete check: if tenant is deleted, redirect to login
  if (!tenant || tenant.deleted_at !== null) {
    return NextResponse.redirect(withTimestamp(new URL("/", req.url)));
  }

  const isProvisioningComplete = profile.provisioning_status === "completed";
  const isTenantActive = tenant?.status === "active";
  const isFullySetup = isProvisioningComplete && isTenantActive;

  const onboardingUrl = withTimestamp(new URL("/onboarding", req.url));

  if (isDashboardPage && !isFullySetup) {
    return NextResponse.redirect(onboardingUrl);
  }

  if (isOnboardingPage && isFullySetup) {
    return NextResponse.redirect(withTimestamp(new URL("/dashboard", req.url)));
  }

  if (isEntryPage) {
    return NextResponse.redirect(isFullySetup ? withTimestamp(new URL("/dashboard", req.url)) : onboardingUrl);
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/auth/:path*", "/onboarding/:path*", "/dashboard/:path*"]
};
