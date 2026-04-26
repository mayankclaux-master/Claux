# n8n Integration Guide for Claux Execution Bridge

This guide defines exactly how n8n should call:

- `POST /api/v1/orchestrator/n8n-callback`

so the Claux dashboard, execution tables, and agent artifacts update correctly.

---

## 1) Endpoint + Authentication

### Endpoint

Use your deployed web app domain:

- `https://<your-domain>/api/v1/orchestrator/n8n-callback`

### Required Header

Every call must include:

- `x-claux-secret: <ORG_API_SECRET>`
- `Content-Type: application/json`

The `x-claux-secret` must match `organizations.api_secret` for the same `org_id` in the payload.

### n8n HTTP Request Node (minimum)

- Method: `POST`
- URL: `https://<your-domain>/api/v1/orchestrator/n8n-callback`
- Headers:
  - `x-claux-secret` = `{{$json.org_api_secret}}` (or a credential/variable)
  - `Content-Type` = `application/json`
- Body Content Type: `JSON`
- Body: one of the event payloads below.

---

## 2) Contract Rules (Important)

### Required fields for all events

```json
{
  "org_id": "uuid",
  "event": "task_created | agent_started | heartbeat | agent_completed | agent_failed",
  "agent_name": "ARIA | SCRIBE | VISUAL | FORGE | CORE | LINX | LOCL | REPUTE | AMPLI"
}
```

### `task_id` requirements

- Required for:
  - `agent_started`
  - `heartbeat`
  - `agent_completed`
  - `agent_failed`
- Optional for `task_created` (if omitted, DB generates one).

### Progress behavior

- `agent_started` / `heartbeat` update `connections.<agent>_progress`
- `agent_completed` forces progress to `100`
- `agent_failed` sets `<agent>_status` to `failed`

### Status behavior

- `agent_started` and `heartbeat` → `<agent>_status = in_progress`
- `agent_completed` → `<agent>_status = completed`
- `agent_failed` → `<agent>_status = failed`

---

## 3) Event Payload Examples

Use these JSON payloads directly in n8n.

### A) `agent_started` (move progress from 0 → 10)

```json
{
  "org_id": "8df2c9c8-1111-4f5c-9b1a-26f86e0b9012",
  "task_id": "d5fcb2cf-2222-4cb3-994a-8d26f17fd031",
  "run_id": "7b8f7bd1-3333-44e6-bdd9-c7b0b9f613a3",
  "orchestrator_run_id": "n8n-exec-2026-04-26-001",
  "event": "agent_started",
  "agent_name": "ARIA",
  "task_type": "site_intelligence_scan",
  "progress": 10,
  "status_message": "ARIA started crawl and CMS fingerprinting",
  "payload": {
    "target_url": "https://example.com",
    "depth": 2
  }
}
```

### B) `heartbeat` (incremental progress, e.g. 50)

```json
{
  "org_id": "8df2c9c8-1111-4f5c-9b1a-26f86e0b9012",
  "task_id": "d5fcb2cf-2222-4cb3-994a-8d26f17fd031",
  "run_id": "7b8f7bd1-3333-44e6-bdd9-c7b0b9f613a3",
  "orchestrator_run_id": "n8n-exec-2026-04-26-001",
  "event": "heartbeat",
  "agent_name": "ARIA",
  "progress": 50,
  "status_message": "ARIA scanned 58/120 pages and detected WordPress REST API"
}
```

### C1) `agent_completed` (ARIA output, progress → 100)

```json
{
  "org_id": "8df2c9c8-1111-4f5c-9b1a-26f86e0b9012",
  "task_id": "d5fcb2cf-2222-4cb3-994a-8d26f17fd031",
  "run_id": "7b8f7bd1-3333-44e6-bdd9-c7b0b9f613a3",
  "orchestrator_run_id": "n8n-exec-2026-04-26-001",
  "event": "agent_completed",
  "agent_name": "ARIA",
  "progress": 100,
  "status_message": "ARIA completed CMS and endpoint verification",
  "output_summary": "WordPress verified with publish/read capabilities",
  "output_payload": {
    "aria_output": {
      "cms": "wordpress",
      "rest_api": "https://example.com/wp-json/wp/v2",
      "webhook_ready": true,
      "capabilities": {
        "read": true,
        "publish": true,
        "media_upload": true
      }
    }
  }
}
```

### C2) `agent_completed` (SCRIBE content + artifact insert)

```json
{
  "org_id": "8df2c9c8-1111-4f5c-9b1a-26f86e0b9012",
  "task_id": "3f21eab2-4444-4df3-9f55-8f6f6d55a9ca",
  "run_id": "3ca08e87-5555-46a6-91c8-f3e53a890126",
  "orchestrator_run_id": "n8n-exec-2026-04-26-002",
  "event": "agent_completed",
  "agent_name": "SCRIBE",
  "progress": 100,
  "status_message": "SCRIBE finished SEO article draft",
  "output_summary": "1200-word draft generated and humanized",
  "output_payload": {
    "scribe_content": {
      "word_count": 1234,
      "primary_keyword": "autonomous seo execution",
      "readability": "grade_8"
    }
  },
  "scribe_artifact": {
    "title": "Autonomous SEO Execution for Growth Teams",
    "slug": "autonomous-seo-execution-growth-teams",
    "keyword": "autonomous seo execution",
    "language": "en",
    "content_markdown": "# Autonomous SEO Execution\n\nYour article body...",
    "content_html": "<h1>Autonomous SEO Execution</h1><p>Your article body...</p>",
    "seo_meta": {
      "meta_title": "Autonomous SEO Execution for Growth Teams",
      "meta_description": "How autonomous agents execute SEO at scale.",
      "faq_schema": true
    },
    "publish_target": "wordpress",
    "publish_status": "draft",
    "external_url": null
  }
}
```

### D) `agent_failed` (trigger dashboard error state)

```json
{
  "org_id": "8df2c9c8-1111-4f5c-9b1a-26f86e0b9012",
  "task_id": "a9d60328-6666-4fae-9685-dcdff2f1b4c1",
  "run_id": "df23d2f7-7777-43f7-8713-8af86f6e87d1",
  "orchestrator_run_id": "n8n-exec-2026-04-26-003",
  "event": "agent_failed",
  "agent_name": "VISUAL",
  "progress": 45,
  "status_message": "VISUAL failed while generating featured image",
  "error_message": "Flux API timeout after 30s",
  "output_payload": {
    "provider": "flux",
    "attempt": 2,
    "retryable": true
  }
}
```

---

## 4) Artifact Mapping (Exact)

When `event = agent_completed`, include artifacts to persist output records.

### A) SCRIBE → `agent_artifacts_scribe_content`

Payload key:

- `scribe_artifact`

Minimum useful shape:

```json
{
  "scribe_artifact": {
    "title": "...",
    "content_markdown": "..."
  }
}
```

Recommended full shape:

```json
{
  "scribe_artifact": {
    "title": "Autonomous SEO Execution for Growth Teams",
    "slug": "autonomous-seo-execution-growth-teams",
    "keyword": "autonomous seo execution",
    "language": "en",
    "content_markdown": "# Heading\n\nContent...",
    "content_html": "<h1>Heading</h1><p>Content...</p>",
    "seo_meta": {
      "meta_title": "...",
      "meta_description": "..."
    },
    "publish_target": "wordpress",
    "publish_status": "draft",
    "external_url": null
  }
}
```

Field mapping:

- `scribe_artifact.title` → `agent_artifacts_scribe_content.title`
- `scribe_artifact.content_markdown` → `agent_artifacts_scribe_content.content_markdown`
- `scribe_artifact.content_html` → `agent_artifacts_scribe_content.content_html`
- `scribe_artifact.seo_meta` → `agent_artifacts_scribe_content.seo_meta`
- `task_id` / `run_id` / `org_id` from root payload map into table foreign keys.

> If your workflow currently outputs a generic `content` field, map it into `scribe_artifact.content_markdown`.

---

### B) VISUAL → `agent_artifacts_visual_images`

Payload key:

- `visual_artifact`

Minimum useful shape:

```json
{
  "visual_artifact": {
    "prompt": "A cinematic SEO dashboard hero image",
    "image_url": "https://cdn.example.com/assets/hero.png"
  }
}
```

Recommended full shape:

```json
{
  "visual_artifact": {
    "prompt": "A cinematic SEO dashboard hero image",
    "style": "editorial",
    "generation_model": "flux",
    "image_url": "https://cdn.example.com/assets/hero.png",
    "storage_path": "orgs/8df2.../visual/hero.png",
    "width": 1792,
    "height": 1024,
    "mime_type": "image/png",
    "alt_text": "Futuristic analytics control center",
    "og_image_for_url": "https://example.com/blog/autonomous-seo",
    "status": "generated"
  }
}
```

Field mapping:

- `visual_artifact.image_url` → `agent_artifacts_visual_images.image_url`
- `visual_artifact.prompt` → `agent_artifacts_visual_images.prompt`
- `visual_artifact.generation_model` → `agent_artifacts_visual_images.generation_model`
- `task_id` / `run_id` / `org_id` from root payload map into table foreign keys.

---

## 5) Recommended n8n Flow Order (Per Agent Run)

1. Send `task_created`
2. Send `agent_started` with `progress: 10`
3. Send periodic `heartbeat` (e.g. `25`, `50`, `75`)
4. Send either:
   - `agent_completed` with final output (+ optional artifact), or
   - `agent_failed` with `error_message`

---

## 6) Common Errors + Fixes

- `401 Missing X-Claux-Secret header`
  - Header not set in n8n node.
- `401 Invalid secret`
  - Secret does not match `organizations.api_secret` for `org_id`.
- `400 task_id is required...`
  - You sent `agent_started`, `heartbeat`, `agent_completed`, or `agent_failed` without `task_id`.
- `400 Invalid or missing agent_name`
  - Use one of the 9 allowed names exactly.

---

## 7) Paste-Ready Base JSON Template

```json
{
  "org_id": "<ORG_UUID>",
  "task_id": "<TASK_UUID>",
  "run_id": "<RUN_UUID>",
  "orchestrator_run_id": "<N8N_EXECUTION_ID>",
  "event": "<EVENT_NAME>",
  "agent_name": "<ARIA|SCRIBE|VISUAL|FORGE|CORE|LINX|LOCL|REPUTE|AMPLI>",
  "task_type": "<TASK_TYPE>",
  "progress": 10,
  "status_message": "<HUMAN_READABLE_STATUS>",
  "error_message": null,
  "output_summary": null,
  "output_payload": {}
}
```

This is now aligned with the live bridge route implementation and can be used to produce Mayank’s final n8n JSON blueprints.
