import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CompleteOnboardingRequest = {
  orgId: string;
};

export async function POST(request: Request) {
  const { orgId } = (await request.json()) as CompleteOnboardingRequest;

  if (!orgId) {
    return NextResponse.json({ error: "orgId is required." }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("[onboarding-complete] profile lookup failed", {
      userId: user.id,
      message: profileError?.message,
      hint: profileError?.hint,
      code: profileError?.code
    });
    return NextResponse.json({ error: "Could not verify user profile." }, { status: 403 });
  }

  if (profile.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden org access." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const { error: updateError } = await adminClient
    .from("organizations")
    .update({
      onboarding_status: "completed",
      onboarding_step: 4,
      onboarding_completed: true
    })
    .eq("id", orgId);

  if (updateError) {
    console.error("[onboarding-complete] organization completion update failed", {
      orgId,
      message: updateError.message,
      hint: updateError.hint,
      code: updateError.code,
      details: updateError.details
    });
    return NextResponse.json({ error: updateError.message || "Failed to complete onboarding." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
