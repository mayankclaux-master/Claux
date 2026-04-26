import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AgentName = "ARIA" | "SCRIBE" | "VISUAL" | "FORGE" | "CORE" | "LINX" | "LOCL" | "REPUTE" | "AMPLI";
type CallbackEvent = "task_created" | "agent_started" | "heartbeat" | "agent_completed" | "agent_failed";

type ScribeArtifactInput = {
  title: string;
  slug?: string;
  keyword?: string;
  language?: string;
  content_markdown?: string;
  content_html?: string;
  seo_meta?: Record<string, unknown>;
  publish_target?: string;
  publish_status?: "draft" | "queued" | "published" | "failed";
  external_url?: string;
};

type VisualArtifactInput = {
  prompt: string;
  style?: string;
  generation_model?: string;
  image_url?: string;
  storage_path?: string;
  width?: number;
  height?: number;
  mime_type?: string;
  alt_text?: string;
  og_image_for_url?: string;
  status?: "queued" | "generated" | "failed";
};

type ReputeArtifactInput = {
  source_platform: "google" | "facebook" | "whatsapp" | "website" | "other";
  source_review_id?: string;
  reviewer_name?: string;
  rating: number;
  review_text?: string;
  sentiment?: "negative" | "neutral" | "positive";
  routing_action: "private_vault" | "public_publish" | "manual_review";
  is_public?: boolean;
  responded?: boolean;
  response_text?: string;
  reviewed_at?: string;
};

type N8nCallbackPayload = {
  org_id?: string;
  task_id?: string;
  run_id?: string;
  orchestrator_run_id?: string;
  event?: CallbackEvent;
  agent_name?: AgentName;
  task_type?: string;
  status_message?: string;
  error_message?: string;
  progress?: number;
  payload?: Record<string, unknown>;
  output_summary?: string;
  output_payload?: Record<string, unknown>;
  scribe_artifact?: ScribeArtifactInput;
  visual_artifact?: VisualArtifactInput;
  repute_artifact?: ReputeArtifactInput;
};

const VALID_EVENTS = new Set<CallbackEvent>([
  "task_created",
  "agent_started",
  "heartbeat",
  "agent_completed",
  "agent_failed"
]);

const VALID_AGENTS = new Set<AgentName>([
  "ARIA",
  "SCRIBE",
  "VISUAL",
  "FORGE",
  "CORE",
  "LINX",
  "LOCL",
  "REPUTE",
  "AMPLI"
]);

function normalizeSecret(value: string) {
  return value.trim().toLowerCase();
}

function normalizeProgress(value: number | undefined) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getConnectionStatusColumns(agentName: AgentName) {
  const lower = agentName.toLowerCase();
  return {
    statusColumn: `${lower}_status`,
    progressColumn: `${lower}_progress`
  };
}

async function writeArtifactRows(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  payload: N8nCallbackPayload,
  orgId: string
) {
  const taskId = payload.task_id ?? null;
  const runId = payload.run_id ?? null;

  if (payload.scribe_artifact && payload.agent_name === "SCRIBE") {
    const artifact = payload.scribe_artifact;
    const { error } = await supabase.from("agent_artifacts_scribe_content").insert({
      org_id: orgId,
      task_id: taskId,
      run_id: runId,
      title: artifact.title,
      slug: artifact.slug ?? null,
      keyword: artifact.keyword ?? null,
      language: artifact.language ?? null,
      content_markdown: artifact.content_markdown ?? null,
      content_html: artifact.content_html ?? null,
      seo_meta: artifact.seo_meta ?? {},
      publish_target: artifact.publish_target ?? null,
      publish_status: artifact.publish_status ?? "draft",
      external_url: artifact.external_url ?? null,
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(`Failed to insert SCRIBE artifact: ${error.message}`);
    }
  }

  if (payload.visual_artifact && payload.agent_name === "VISUAL") {
    const artifact = payload.visual_artifact;
    const { error } = await supabase.from("agent_artifacts_visual_images").insert({
      org_id: orgId,
      task_id: taskId,
      run_id: runId,
      prompt: artifact.prompt,
      style: artifact.style ?? null,
      generation_model: artifact.generation_model ?? null,
      image_url: artifact.image_url ?? null,
      storage_path: artifact.storage_path ?? null,
      width: artifact.width ?? null,
      height: artifact.height ?? null,
      mime_type: artifact.mime_type ?? null,
      alt_text: artifact.alt_text ?? null,
      og_image_for_url: artifact.og_image_for_url ?? null,
      status: artifact.status ?? "generated",
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(`Failed to insert VISUAL artifact: ${error.message}`);
    }
  }

  if (payload.repute_artifact && payload.agent_name === "REPUTE") {
    const artifact = payload.repute_artifact;
    const { error } = await supabase.from("agent_artifacts_repute_reviews").insert({
      org_id: orgId,
      task_id: taskId,
      run_id: runId,
      source_platform: artifact.source_platform,
      source_review_id: artifact.source_review_id ?? null,
      reviewer_name: artifact.reviewer_name ?? null,
      rating: artifact.rating,
      review_text: artifact.review_text ?? null,
      sentiment: artifact.sentiment ?? "neutral",
      routing_action: artifact.routing_action,
      is_public: Boolean(artifact.is_public),
      responded: Boolean(artifact.responded),
      response_text: artifact.response_text ?? null,
      reviewed_at: artifact.reviewed_at ?? null,
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(`Failed to insert REPUTE artifact: ${error.message}`);
    }
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseAdminClient();
  const incomingSecret = request.headers.get("x-claux-secret");

  if (!incomingSecret) {
    return NextResponse.json({ error: "Missing X-Claux-Secret header." }, { status: 401 });
  }

  let callback: N8nCallbackPayload;

  try {
    callback = (await request.json()) as N8nCallbackPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const orgId = callback.org_id;

  if (!orgId) {
    return NextResponse.json({ error: "Missing org_id." }, { status: 400 });
  }

  if (!callback.event || !VALID_EVENTS.has(callback.event)) {
    return NextResponse.json({ error: "Invalid or missing event." }, { status: 400 });
  }

  if (!callback.agent_name || !VALID_AGENTS.has(callback.agent_name)) {
    return NextResponse.json({ error: "Invalid or missing agent_name." }, { status: 400 });
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

  const now = new Date().toISOString();
  const progress = normalizeProgress(callback.progress);
  const { statusColumn, progressColumn } = getConnectionStatusColumns(callback.agent_name);

  const connectionPatch: Record<string, string | number> = {
    [statusColumn]: callback.event === "agent_failed" ? "failed" : callback.event === "agent_completed" ? "completed" : "in_progress",
    [progressColumn]: callback.event === "agent_completed" ? 100 : progress,
    updated_at: now
  };

  const { error: connectionError } = await supabase.from("connections").update(connectionPatch).eq("org_id", orgId);
  if (connectionError) {
    return NextResponse.json({ error: connectionError.message }, { status: 500 });
  }

  if (callback.event === "task_created") {
    const { error } = await supabase.from("agent_tasks").insert({
      ...(callback.task_id ? { id: callback.task_id } : {}),
      org_id: orgId,
      orchestrator_run_id: callback.orchestrator_run_id ?? null,
      agent_name: callback.agent_name,
      task_type: callback.task_type ?? "unspecified",
      status: "queued",
      payload: callback.payload ?? {},
      requested_by: "n8n",
      scheduled_at: now,
      updated_at: now
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (callback.event === "agent_started" || callback.event === "heartbeat") {
    if (!callback.task_id) {
      return NextResponse.json({ error: "task_id is required for agent_started and heartbeat." }, { status: 400 });
    }

    const { error } = await supabase
      .from("agent_tasks")
      .update({
        status: "in_progress",
        started_at: callback.event === "agent_started" ? now : undefined,
        last_heartbeat_at: now,
        updated_at: now
      })
      .eq("id", callback.task_id)
      .eq("org_id", orgId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  if (callback.event === "agent_completed" || callback.event === "agent_failed") {
    if (!callback.task_id) {
      return NextResponse.json({ error: "task_id is required for completion/failure events." }, { status: 400 });
    }

    const taskStatus = callback.event === "agent_completed" ? "completed" : "failed";
    const taskPatch: Record<string, string | null> = {
      status: taskStatus,
      updated_at: now,
      error_message: callback.error_message ?? null
    };

    if (callback.event === "agent_completed") {
      taskPatch.completed_at = now;
    } else {
      taskPatch.failed_at = now;
    }

    const { error: taskError } = await supabase
      .from("agent_tasks")
      .update(taskPatch)
      .eq("id", callback.task_id)
      .eq("org_id", orgId);

    if (taskError) {
      return NextResponse.json({ error: taskError.message }, { status: 500 });
    }

    const runStatus = callback.event === "agent_completed" ? "completed" : "failed";

    if (callback.run_id) {
      const { error: runError } = await supabase.from("agent_runs").upsert(
        {
          id: callback.run_id,
          org_id: orgId,
          task_id: callback.task_id,
          agent_name: callback.agent_name,
          status: runStatus,
          output_summary: callback.output_summary ?? null,
          output_payload: callback.output_payload ?? {},
          error_message: callback.error_message ?? null,
          completed_at: now
        },
        { onConflict: "id" }
      );

      if (runError) {
        return NextResponse.json({ error: runError.message }, { status: 500 });
      }
    } else {
      const { error: runError } = await supabase.from("agent_runs").insert({
        org_id: orgId,
        task_id: callback.task_id,
        agent_name: callback.agent_name,
        status: runStatus,
        output_summary: callback.output_summary ?? null,
        output_payload: callback.output_payload ?? {},
        error_message: callback.error_message ?? null,
        completed_at: now
      });

      if (runError) {
        return NextResponse.json({ error: runError.message }, { status: 500 });
      }
    }

    try {
      await writeArtifactRows(supabase, callback, orgId);
    } catch (artifactError) {
      return NextResponse.json(
        {
          error: artifactError instanceof Error ? artifactError.message : "Failed to write artifact rows."
        },
        { status: 500 }
      );
    }
  }

  const { error: activityError } = await supabase.from("agent_activities").insert({
    org_id: orgId,
    agent_name: callback.agent_name,
    status_message: callback.status_message ?? `${callback.agent_name} ${callback.event}`,
    status: callback.event === "agent_failed" ? "failed" : callback.event === "agent_completed" ? "completed" : "pending",
    created_at: now
  });

  if (activityError) {
    return NextResponse.json({ error: activityError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: callback.event, agent_name: callback.agent_name });
}
