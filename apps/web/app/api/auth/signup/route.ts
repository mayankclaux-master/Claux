import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

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
  console.info("[signup] route version: no-workspace-bootstrap");

  if (!email || !password || !businessName) {
    return NextResponse.json({ error: "Email, password, and business name are required." }, { status: 400 });
  }

  const adminClient = createSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(String(email));
  const normalizedBusinessName = String(businessName).trim();
  const normalizedFullName = String(fullName ?? "").trim() || null;
  
  const appUrl = env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_SITE_URL || 'https://claux-xi.vercel.app';
  const emailRedirectTo = `${appUrl}/auth/callback`;

  let userId: string | null = null;
  let requiresEmailVerification = true;

  const { data: signUpData, error: signUpError } = await adminClient.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo,
      data: {
        ...(normalizedFullName ? { full_name: normalizedFullName } : {}),
        business_name: normalizedBusinessName
      }
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
    console.error("[signup] missing user id after signup flow", { email: normalizedEmail });
    return NextResponse.json({ error: "Signup failed. Missing user id." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    email: normalizedEmail,
    requiresEmailVerification,
    next: requiresEmailVerification ? "verify_email" : "onboarding"
  });
}
