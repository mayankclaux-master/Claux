import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceForUser } from "@/lib/auth/ensure-workspace";

const USER_LIST_PAGE_SIZE = 200;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isAlreadyRegisteredError(message: string | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return normalized.includes("already registered") || normalized.includes("already exists");
}

async function findUserIdByEmail(adminClient: ReturnType<typeof createSupabaseAdminClient>, email: string) {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: USER_LIST_PAGE_SIZE
    });

    if (error) {
      return { userId: null, error };
    }

    const user = data.users.find((entry) => entry.email?.toLowerCase() === email);
    if (user?.id) {
      return { userId: user.id, error: null };
    }

    if (data.users.length < USER_LIST_PAGE_SIZE) {
      break;
    }

    page += 1;
  }

  return { userId: null, error: null };
}

export async function POST(request: Request) {
  const { email, password, businessName, fullName } = await request.json();

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: "Email, password, and business name are required." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(String(email));
  const normalizedBusinessName = String(businessName).trim();
  const normalizedFullName = String(fullName ?? "").trim() || null;
  const emailRedirectTo = request.headers.get("origin")
    ? `${request.headers.get("origin")}/auth/callback?next=/dashboard`
    : undefined;

  let userId: string | null = null;
  let requiresEmailVerification = true;

  const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo,
      data: normalizedFullName ? { full_name: normalizedFullName } : undefined
    }
  });

  if (signUpError) {
    const signUpErrorMessage = signUpError.message ?? "";
    const isFetchError = signUpErrorMessage.toLowerCase().includes("fetch");
    console.error("[signup] signUp failed", {
      email: normalizedEmail,
      message: signUpError.message,
      code: signUpError.code,
      status: signUpError.status,
      isFetchError
    });

    if (!isAlreadyRegisteredError(signUpError.message)) {
      return NextResponse.json({ error: signUpError.message ?? "Signup failed." }, { status: 400 });
    }

    const lookup = await findUserIdByEmail(adminClient, normalizedEmail);

    if (lookup.error) {
      console.error("[signup] failed to resolve existing user", {
        email: normalizedEmail,
        message: lookup.error.message
      });
      return NextResponse.json({ error: "Could not look up existing account." }, { status: 500 });
    }

    if (!lookup.userId) {
      return NextResponse.json(
        { error: "Account already exists. Please sign in or reset your password." },
        { status: 409 }
      );
    }

    userId = lookup.userId;
  } else {
    userId = signUpData.user?.id ?? null;
    requiresEmailVerification = !Boolean(signUpData.session);
  }

  if (!userId) {
    return NextResponse.json({ error: "Signup failed. Missing user id." }, { status: 500 });
  }

  const { data: existingProfile, error: profileLookupError } = await adminClient
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (profileLookupError) {
    console.error("[signup] profile lookup failed", {
      userId,
      message: profileLookupError.message,
      details: profileLookupError.details,
      code: profileLookupError.code
    });
    return NextResponse.json({ error: "Could not verify tenant workspace." }, { status: 500 });
  }

  if (!existingProfile) {
    const bootstrapError = await ensureWorkspaceForUser({
      adminClient,
      userId,
      businessName: normalizedBusinessName,
      fullName: normalizedFullName
    });

    if (bootstrapError) {
      console.error("[signup] bootstrap_organization_for_user failed", {
        userId,
        email: normalizedEmail,
        message: bootstrapError.message,
        details: bootstrapError.details,
        hint: bootstrapError.hint,
        code: bootstrapError.code
      });

      return NextResponse.json(
        {
          error: "Could not create tenant workspace.",
          details: process.env.NODE_ENV !== "production" ? bootstrapError.message ?? null : null
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    email: normalizedEmail,
    requiresEmailVerification,
    next: requiresEmailVerification ? "verify_email" : "dashboard"
  });
}
