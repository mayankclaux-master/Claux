import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ArtifactRequest = {
  tenant_id: string;
  agent: "ARIA" | "SCRIBE" | "PULSE" | "REPUTE" | "LINX" | "PRISM";
  run_id: string;
  artifacts: unknown[];
};

function normalizeSecret(value: string) {
  return value.trim().toLowerCase();
}

const AGENT_TABLES: Record<string, string> = {
  ARIA: "aria_keywords",
  SCRIBE: "scribe_content",
  PULSE: "pulse_rankings",
  REPUTE: "repute_reviews",
  LINX: "linx_backlinks",
  PRISM: "prism_assets"
};

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();
  const incomingSecret = request.headers.get("x-claux-secret");

  if (!incomingSecret) {
    return NextResponse.json({ error: "Missing X-Claux-Secret header." }, { status: 401 });
  }

  let payload: ArtifactRequest;

  try {
    payload = (await request.json()) as ArtifactRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const { tenant_id, agent, run_id, artifacts } = payload;

  if (!tenant_id || !agent || !run_id || !artifacts) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify tenant's api_secret
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("api_secret")
    .eq("id", tenant_id)
    .maybeSingle();

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  if (!tenant?.api_secret || normalizeSecret(String(tenant.api_secret)) !== normalizeSecret(incomingSecret)) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const tableName = AGENT_TABLES[agent];

  if (!tableName) {
    return NextResponse.json({ error: "Invalid agent name." }, { status: 400 });
  }

  // Add tenant_id and run_id to each artifact
  const artifactsWithMetadata = (artifacts as Record<string, unknown>[]).map(artifact => ({
    ...artifact,
    tenant_id,
    run_id
  }));

  // Bulk upsert into the appropriate table
  const { error: upsertError } = await supabase
    .from(tableName)
    .upsert(artifactsWithMetadata, {
      onConflict: "id"
    });

  if (upsertError) {
    console.error("[artifacts] Bulk upsert failed", {
      tenant_id,
      agent,
      tableName,
      message: upsertError.message,
      hint: upsertError.hint,
      code: upsertError.code,
      details: upsertError.details
    });
    return NextResponse.json({ error: upsertError.message || "Failed to save artifacts." }, { status: 500 });
  }

  return NextResponse.json({ success: true, count: artifacts.length });
}
