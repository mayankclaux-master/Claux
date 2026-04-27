import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceForUser } from "@/lib/auth/ensure-workspace";

function isSafeNextPath(value: string | null) {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");

  const nextPath = isSafeNextPath(nextParam) ? nextParam! : "/dashboard";
  const redirectUrl = new URL(nextPath, url.origin);

  if (!code) {
    redirectUrl.pathname = "/auth/verify-email";
    redirectUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = createSupabaseServerClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const errorUrl = new URL("/auth/verify-email", url.origin);
    errorUrl.searchParams.set("error", "invalid_or_expired_link");
    return NextResponse.redirect(errorUrl);
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

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

  return NextResponse.redirect(redirectUrl);
}
