import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const adminClient = createSupabaseAdminClient();

  const emailRedirectTo = request.headers.get("origin")
    ? `${request.headers.get("origin")}/auth/callback?next=/dashboard`
    : undefined;

  const { error } = await adminClient.auth.resend({
    type: "signup",
    email: normalizedEmail,
    options: {
      emailRedirectTo
    }
  });

  if (error) {
    return NextResponse.json({ error: error.message ?? "Could not resend verification email." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
