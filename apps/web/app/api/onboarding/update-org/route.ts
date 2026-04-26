import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UpdateOrgRequest = {
  orgId: string;
  organizationPayload: Record<string, unknown>;
  competitorRows: Array<Record<string, unknown>>;
};

export async function POST(request: Request) {
  const { orgId, organizationPayload, competitorRows } = (await request.json()) as UpdateOrgRequest;

  console.log("[onboarding-api] received orgId", { orgId });

  if (!orgId) {
    return NextResponse.json({ error: "Missing orgId." }, { status: 400 });
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
    console.error("[onboarding-api] profile lookup failed", {
      userId: user.id,
      message: profileError?.message,
      hint: profileError?.hint
    });
    return NextResponse.json({ error: "Could not verify user profile." }, { status: 403 });
  }

  if (profile.org_id !== orgId) {
    return NextResponse.json({ error: "Forbidden org access." }, { status: 403 });
  }

  const adminClient = createSupabaseAdminClient();
  const sanitizedOrgPayload = {
    ...organizationPayload,
    id: orgId
  };

  const { error: orgError } = await adminClient
    .from("organizations")
    .upsert(sanitizedOrgPayload, { onConflict: "id" });

  if (orgError) {
    console.error("[onboarding-api] organization upsert failed", {
      orgId,
      message: orgError.message,
      hint: orgError.hint,
      code: orgError.code
    });
    return NextResponse.json({ error: "Failed to save organization.", hint: orgError.hint }, { status: 500 });
  }

  let competitorSaveWarning: string | null = null;

  try {
    const { error: deleteCompetitorsError } = await adminClient
      .from("organization_competitors")
      .delete()
      .eq("org_id", orgId);

    if (deleteCompetitorsError) {
      console.error("[onboarding-api] competitor delete failed", {
        orgId,
        error: {
          code: deleteCompetitorsError.code,
          message: deleteCompetitorsError.message,
          hint: deleteCompetitorsError.hint,
          details: deleteCompetitorsError.details
        }
      });
      competitorSaveWarning = "Competitors could not be updated.";
    } else if (Array.isArray(competitorRows) && competitorRows.length > 0) {
      const sanitizedCompetitorRows = competitorRows
        .map((row) => ({
          org_id: orgId,
          competitor_url: String(row.competitor_url ?? "").trim(),
          rank: Number(row.rank)
        }))
        .filter((row) => row.competitor_url.length > 0 && Number.isFinite(row.rank));

      if (sanitizedCompetitorRows.length > 0) {
        const { error: insertCompetitorsError } = await adminClient
          .from("organization_competitors")
          .insert(sanitizedCompetitorRows);

        if (insertCompetitorsError) {
          console.error("[onboarding-api] competitor insert failed", {
            orgId,
            error: {
              code: insertCompetitorsError.code,
              message: insertCompetitorsError.message,
              hint: insertCompetitorsError.hint,
              details: insertCompetitorsError.details
            },
            payload: sanitizedCompetitorRows
          });
          competitorSaveWarning = "Competitors could not be updated.";
        }
      }
    }
  } catch (competitorError) {
    console.error("[onboarding-api] unexpected competitor save failure", {
      orgId,
      error: competitorError
    });
    competitorSaveWarning = "Competitors could not be updated.";
  }

  return NextResponse.json({ success: true, competitorSaveWarning });
}
