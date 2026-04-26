import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createSupabaseMiddlewareClient(req, res);

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;
  const isSignupPage = pathname.startsWith("/auth/signup");
  const isLoginPage = pathname.startsWith("/login");
  const isOnboardingPage = pathname.startsWith("/onboarding");
  const isDashboardPage = pathname.startsWith("/dashboard");
  const isPublicPage = pathname === "/";

  if (!user && (isOnboardingPage || isDashboardPage)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!user) {
    return res;
  }

  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();

  if (!profile) {
    if (!isSignupPage) {
      return NextResponse.redirect(new URL("/auth/signup", req.url));
    }
    return res;
  }

  const { data: organization } = await supabase
    .from("organizations")
    .select("onboarding_status, onboarding_step")
    .eq("id", profile.org_id)
    .maybeSingle();

  const isDone = organization?.onboarding_status === "completed" || Number(organization?.onboarding_step ?? 0) === 4;

  if (isDone && !isDashboardPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isDone && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  if (isDone && (isOnboardingPage || isSignupPage || isLoginPage || isPublicPage)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/auth/:path*", "/onboarding/:path*", "/dashboard/:path*"]
};
