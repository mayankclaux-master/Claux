import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type IncomingPayload = {
  org_id?: string;
  type?: "activity" | "keywords" | "connection_update";
  data?: unknown;
};

type ActivityInput = {
  id?: string;
  agent_name?: string;
  status_message?: string;
  status?: "pending" | "completed" | "failed";
  created_at?: string;
};

type KeywordInput = {
  id?: string;
  keyword?: string;
  volume?: number | null;
  difficulty?: number | null;
  position?: number | null;
  agent_name?: string;
  created_at?: string;
};

type ConnectionUpdateInput = {
  tech_stack?: string;
  status?: string;
};

const VALID_ACTIVITY_STATUS = new Set(["pending", "completed", "failed"]);

function normalizeSecret(value: string) {
  return value.trim().toLowerCase();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();
  const incomingSecret = request.headers.get("x-claux-secret");

  if (!incomingSecret) {
    return NextResponse.json({ error: "Missing X-Claux-Secret header." }, { status: 401 });
  }

  let payload: IncomingPayload;

  try {
    payload = (await request.json()) as IncomingPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orgId = payload.org_id;

  if (!orgId) {
    return NextResponse.json({ error: "Missing org_id." }, { status: 400 });
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("api_secret")
    .eq("id", orgId)
    .maybeSingle();

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  if (!org?.api_secret || normalizeSecret(String(org.api_secret)) !== normalizeSecret(incomingSecret)) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  if (!payload.type) {
    return NextResponse.json({ error: "Missing payload type." }, { status: 400 });
  }

  if (payload.type === "activity") {
    const rows = asArray(payload.data as ActivityInput | ActivityInput[]).map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      org_id: orgId,
      agent_name: String(item.agent_name ?? ""),
      status_message: String(item.status_message ?? ""),
      status: item.status,
      ...(item.created_at ? { created_at: item.created_at } : {})
    }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "No activity rows provided." }, { status: 400 });
    }

    const invalid = rows.find(
      (row) => !row.agent_name || !row.status_message || !row.status || !VALID_ACTIVITY_STATUS.has(row.status)
    );

    if (invalid) {
      return NextResponse.json({ error: "Invalid activity row: agent_name, status_message, and valid status are required." }, { status: 400 });
    }

    const { error } = await supabase.from("agent_activities").insert(rows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, type: "activity", inserted: rows.length });
  }

  if (payload.type === "keywords") {
    const rows = asArray(payload.data as KeywordInput | KeywordInput[]).map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      org_id: orgId,
      keyword: String(item.keyword ?? ""),
      volume: item.volume ?? null,
      difficulty: item.difficulty ?? null,
      position: item.position ?? null,
      agent_name: String(item.agent_name ?? ""),
      ...(item.created_at ? { created_at: item.created_at } : {})
    }));

    if (rows.length === 0) {
      return NextResponse.json({ error: "No keyword rows provided." }, { status: 400 });
    }

    const invalid = rows.find((row) => !row.keyword || !row.agent_name);

    if (invalid) {
      return NextResponse.json({ error: "Invalid keyword row: keyword and agent_name are required." }, { status: 400 });
    }

    const { error } = await supabase.from("keyword_insights").upsert(rows, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, type: "keywords", upserted: rows.length });
  }

  if (payload.type === "connection_update") {
    if (!isRecord(payload.data)) {
      return NextResponse.json({ error: "connection_update data must be an object." }, { status: 400 });
    }

    const data = payload.data as ConnectionUpdateInput;
    const patch: Record<string, string> = {};

    if (typeof data.tech_stack === "string" && data.tech_stack.trim()) {
      patch.tech_stack = data.tech_stack.trim();
    }

    if (typeof data.status === "string" && data.status.trim()) {
      patch.status = data.status.trim();
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "Provide tech_stack or status to update." }, { status: 400 });
    }

    const { error } = await supabase.from("connections").update(patch).eq("org_id", orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, type: "connection_update", updated: true });
  }

  return NextResponse.json({ error: "Unsupported payload type." }, { status: 400 });
}
