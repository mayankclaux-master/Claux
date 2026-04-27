import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceForUser } from "@/lib/auth/ensure-workspace";

function isSafeNextPath(value: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

function toEmailOtpType(value: string | null): EmailOtpType | null {
  const normalized = String(value ?? "").trim();
  const supportedTypes: EmailOtpType[] = ["signup", "magiclink", "invite", "recovery", "email_change", "email"];

  return supportedTypes.includes(normalized as EmailOtpType) ? (normalized as EmailOtpType) : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = toEmailOtpType(url.searchParams.get("type"));
  const nextParam = url.searchParams.get("next");

  const nextPath = isSafeNextPath(nextParam) ? nextParam! : "/onboarding";
  const redirectUrl = new URL(nextPath, url.origin);
  redirectUrl.searchParams.set("t", String(Date.now()));

  const req = request as NextRequest;
  const response = NextResponse.redirect(redirectUrl);
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN?.trim() || undefined;
  const isSecure = url.protocol === "https:";

  function withCookieDefaults(options: Record<string, unknown>) {
    return {
      path: "/",
      sameSite: "lax" as const,
      httpOnly: true,
      secure: isSecure,
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      ...options
    };
  }

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        const normalizedOptions = withCookieDefaults(options);
        req.cookies.set({ name, value, ...normalizedOptions });
        response.cookies.set({ name, value, ...normalizedOptions });
      },
      remove(name: string, options: Record<string, unknown>) {
        const normalizedOptions = withCookieDefaults(options);
        req.cookies.set({ name, value: "", ...normalizedOptions });
        response.cookies.set({ name, value: "", ...normalizedOptions });
      }
    }
  });

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const errorUrl = new URL("/auth/verify-email", url.origin);
      errorUrl.searchParams.set("error", "invalid_or_expired_link");
      return NextResponse.redirect(errorUrl);
    }
  } else if (tokenHash && otpType) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType
    });

    if (otpError) {
      const errorUrl = new URL("/auth/verify-email", url.origin);
      errorUrl.searchParams.set("error", "invalid_or_expired_link");
      return NextResponse.redirect(errorUrl);
    }
  } else {
    const errorUrl = new URL("/auth/verify-email", url.origin);
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  let activeSession: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    activeSession = session;

    if (session) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 100));
  }

  if (!activeSession) {
    const {
      data: { session: refreshedSession }
    } = await supabase.auth.refreshSession();

    activeSession = refreshedSession;
  }

  if (!activeSession) {
    const errorUrl = new URL("/login", url.origin);
    errorUrl.searchParams.set("error", "auth_session_missing");
    errorUrl.searchParams.set("t", String(Date.now()));
    return NextResponse.redirect(errorUrl);
  }

  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const {
      data: { user: attemptUser }
    } = await supabase.auth.getUser();
    user = attemptUser;

    if (user) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 100));
  }

  if (!user) {
    const errorUrl = new URL("/login", url.origin);
    errorUrl.searchParams.set("error", "auth_session_not_found");
    return NextResponse.redirect(errorUrl);
  }

  const adminClient = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    const errorUrl = new URL("/auth/verify-email", url.origin);
    errorUrl.searchParams.set("email", user.email ?? "");
    errorUrl.searchParams.set("error", "workspace_check_failed");
    return NextResponse.redirect(errorUrl);
  }

  if (!profile) {
    const fullName = String(user.user_metadata?.full_name ?? "").trim() || null;
    const businessName =
      String(user.user_metadata?.business_name ?? "").trim() ||
      String(user.email ?? "").split("@")[0] ||
      "My Workspace";

    const workspaceError = await ensureWorkspaceForUser({
      adminClient,
      userId: user.id,
      businessName,
      fullName
    });

    if (workspaceError) {
      const errorUrl = new URL("/auth/verify-email", url.origin);
      errorUrl.searchParams.set("email", user.email ?? "");
      errorUrl.searchParams.set("error", "workspace_provisioning_failed");
      return NextResponse.redirect(errorUrl);
    }
  }

  return response;
}
