# CLAUX Master — Senior Consultant Walkthrough

## 1) Executive Summary

`Claux Master` is a Next.js 14 + Supabase multi-tenant SaaS foundation for SEO operations.

The system currently has:
- Auth + email verification flows.
- Tenant model (`auth.users -> public.profiles -> public.organizations`).
- Single-page onboarding (atomic write API) replacing an older multi-step wizard.
- Dashboard + realtime agent telemetry surfaces.
- Execution bridge for 9 agents (ARIA, SCRIBE, VISUAL, FORGE, CORE, LINX, LOCL, REPUTE, AMPLI).
- Orchestrator APIs for triggering agents and receiving n8n callbacks.

Primary production blocker right now:
- New users can be stuck on `/onboarding/provisioning` despite table rows existing, due to intermittent profile/org linkage inconsistency and provisioning flow races.

---

## 2) Repository/Runtime Architecture

## 2.1 Monorepo shape
- `apps/web`: main product app (active app).
- `apps/api`: currently empty.
- `supabase`: SQL schema and migration scripts.
- `agents`: currently empty.
- `lib`: currently empty at repo root.

## 2.2 Web stack (`apps/web`)
- Framework: Next.js 14 App Router.
- UI: React + Tailwind + custom dashboard components.
- Auth/session: Supabase SSR (`@supabase/ssr`) with browser/server/middleware clients.
- Data: Supabase Postgres + RLS + RPC.
- Realtime: Supabase realtime channels on `agent_activities`, `connections`, etc.

## 2.3 Supabase clients
- Browser client: `apps/web/lib/supabase/client.ts`
- Server client: `apps/web/lib/supabase/server.ts`
- Middleware client: `apps/web/lib/supabase/middleware.ts`
- Admin/service-role client: `apps/web/lib/supabase/admin.ts`

Notes:
- Admin client logs normalized URL and key length.
- URL normalization strips `/rest/v1` suffix defensively.

---

## 3) Product Surface (Implemented)

## 3.1 Public/auth routes
- `/` landing (`apps/web/app/page.tsx`)
- `/auth/signup` signup form (`apps/web/app/auth/signup/page.tsx`)
- `/auth/verify-email` verification + resend flow
- `/auth/callback` token exchange/OTP callback and post-auth workspace checks
- `/login` password sign-in + magic link fallback
- `/auth/reset-password`, `/auth/update-password`

## 3.2 Onboarding routes
- `/onboarding` single-page onboarding form (client page).
- `/onboarding/provisioning` holding/provisioning page while workspace graph is missing.

## 3.3 Dashboard routes
- `/dashboard`
- `/dashboard/agents`
- `/dashboard/tasks`
- `/dashboard/rankings`
- `/dashboard/reports`
- `/dashboard/billing`

## 3.4 Backend API routes (web app)
- Auth:
  - `POST /api/auth/signup`
  - `POST /api/auth/resend-verification`
- Onboarding:
  - `POST /api/onboarding/complete` (atomic)
  - `POST /api/onboarding/scan-website`
  - legacy: `update-org`, `update-assets` (still present)
- Integrations:
  - `GET /api/integrations/google/connect`
- Orchestrator:
  - `POST /api/v1/orchestrator/trigger-agent`
  - `POST /api/v1/orchestrator/n8n-callback`
  - `POST /api/v1/orchestrator/sanity-heartbeat`
- Agent ingest:
  - `POST /api/v1/agent-update`

---

## 4) Onboarding/Auth Flow (Current Intent)

## 4.1 Target happy path
1. User submits `/auth/signup`.
2. Supabase auth user created, verification email sent.
3. User verifies via email link -> `/auth/callback`.
4. Callback establishes session, validates user, ensures workspace if profile missing.
5. User lands `/onboarding`.
6. Single submit to `/api/onboarding/complete` invokes `complete_onboarding_atomic` RPC.
7. Org marked completed, connections/competitors initialized, redirect `/dashboard`.

## 4.2 Current signup behavior
`/api/auth/signup` is intentionally side-effect-light:
- Creates auth user.
- Sets metadata (`full_name`, `business_name`).
- Does NOT provision profile/org directly.
- Returns next state (`verify_email` usually).

## 4.3 Workspace provisioning logic
Central helper: `apps/web/lib/auth/ensure-workspace.ts`
- Waits for auth user visibility (`auth.admin.getUserById`).
- Checks profile presence (now with `org_id`).
- If profile exists but org missing/null, attempts repair.
- Tries RPC `bootstrap_organization_for_user` with retry.
- Falls back to direct bootstrap only on specific legacy-schema signatures.

## 4.4 Provisioning page behavior
`/onboarding/provisioning`:
- If no profile/org (or org lookup fails), it tries `ensureWorkspaceForUser` using admin client.
- Re-fetches profile/org and redirects:
  - org onboarding complete -> `/dashboard`
  - org exists but incomplete -> `/onboarding`
  - unresolved -> keep provisioning UI

---

## 5) Middleware/Gating Logic

File: `apps/web/middleware.ts`

Key responsibilities:
- Public route allowlist.
- Redirect unauthenticated users away from protected pages.
- Enforce email confirmation before onboarding/dashboard.
- Resolve user profile/org context.
- Route missing profile/org to `/onboarding/provisioning`.
- Route incomplete onboarding to `/onboarding`.
- Route completed onboarding to `/dashboard`.

This middleware is a major control plane for all auth/onboarding transitions.

---

## 6) Database Architecture (All Supabase SQL Files)

The project uses layered SQL scripts. `schema.sql` is the core baseline; other scripts evolve/align/harden environments.

## 6.1 `supabase/schema.sql` (Core app schema)

### Core tenant tables
1. `public.organizations`
- Workspace root tenant record.
- Includes business and onboarding columns.
- `created_by` references `auth.users(id)`.
- Lifecycle flags: `onboarding_status`, `onboarding_step`, `onboarding_completed`.

2. `public.profiles`
- One user profile per auth user.
- `id` FK to `auth.users`.
- `org_id` FK to `organizations`.
- Role model: `owner|admin|member`.

3. `public.connections`
- Per-org integration/connection state.
- Unique per org (`idx_connections_org_unique`).
- Holds `website_url`, `tech_stack`, `google_api_links`, and high-level status.
- Extended with per-agent status/progress columns used by dashboard/orchestrator.

4. `public.organization_competitors`
- Up to 3 competitor URLs per org (ranked).

### Security model
- RLS enabled on core tables.
- Tenant scoping policies based on `profiles` org membership.
- Policies made idempotent with `drop policy if exists ... create policy ...`.

### Core functions
1. `bootstrap_organization_for_user(p_user_id, p_business_name, p_full_name)`
- Creates organization + profile bootstrap chain.
- Supports older schema without `created_by` via runtime column detection.
- Granted to `service_role`.

2. `complete_onboarding_atomic(...)`
- Single transaction write for onboarding completion.
- Self-heals missing profile for `auth.uid()` if needed.
- Enforces org ownership consistency.
- Updates organizations fields.
- Replaces competitors list.
- Upserts connections with all 9 agent statuses/progress defaults.
- Marks onboarding completed.
- Granted to `authenticated` and `service_role`.

## 6.2 `supabase/master_alignment.sql` (Environment alignment)

Purpose:
- Bring existing DBs up to baseline without full reset.

Contains:
- Column alignment for organizations and connections.
- RLS alignment for connections.
- Re-definition/grants for `complete_onboarding_atomic`.
- Transaction wrapped (`begin/commit`).

## 6.3 `supabase/phase1_database_hardening.sql` (Telemetry hardening)

Adds:
- `organizations.api_secret` (UUID secret used by orchestrator callbacks/agent update auth).
- `public.agent_activities` table (live feed telemetry).
- `public.keyword_insights` table (rank/keyword telemetry).
- RLS + indexes + realtime publication config for `agent_activities`.

## 6.4 `supabase/phase2_execution_bridge.sql` (Execution-plane schema)

Adds execution architecture:

### Integration/secret tables
- `public.cms_connections`
- `public.agent_credentials`

### Execution tables
- `public.agent_tasks`
- `public.agent_runs`

### Artifact tables
- `public.agent_artifacts_scribe_content`
- `public.agent_artifacts_visual_images`
- `public.agent_artifacts_repute_reviews`

### Connection extensions
- Adds status/progress columns for each of 9 agents:
  - `aria`, `scribe`, `visual`, `forge`, `core`, `linx`, `locl`, `repute`, `ampli`

### Security
- RLS enabled and org-scoped policies for all new tables.
- `agent_credentials` restricted to owner/admin role.

### Realtime
- Adds `agent_tasks`, `agent_runs`, `connections` to `supabase_realtime` publication.

---

## 7) Data Relationships (Critical)

Canonical chain:
- `auth.users.id` -> `profiles.id`
- `profiles.org_id` -> `organizations.id`
- `connections.org_id`, `organization_competitors.org_id`, `agent_*` tables -> `organizations.id`

Implication:
- Any break in this chain causes onboarding/dashboard routing loops.
- Most user-facing failures came from broken/partial chain materialization during signup/verification races.

---

## 8) What Is Built vs Remaining

## 8.1 Built and functioning (broadly)
- Auth pages (signup/login/verify/reset/update).
- Callback-based session exchange.
- Middleware gating for auth/onboarding/dashboard.
- Single-page onboarding UI + atomic completion API.
- Core tenant schema with RLS.
- Execution bridge schema for 9 agents.
- Orchestrator trigger/callback/sanity APIs.
- Dashboard pages and realtime subscriptions for feed/progress.

## 8.2 Partially built / mixed maturity
- Legacy onboarding APIs (`update-org`, `update-assets`) still exist alongside atomic route.
- `apps/api` and `agents` directories are empty; orchestration is currently embedded in web app APIs.
- Some dashboard pages are placeholder-oriented (init-state heavy) vs production analytics-grade.

## 8.3 Remaining work (high priority)
1. Eliminate onboarding/provisioning loop definitively by making profile/org creation strictly atomic and idempotent with invariant checks.
2. Add robust observability around auth callback/provisioning decision points.
3. Add reconciliation job/admin script for orphaned profile-org mismatches.
4. Consolidate onboarding code paths and remove deprecated endpoints/components.
5. Add integration tests for auth->profile->org provisioning and middleware redirects.

---

## 9) Onboarding Incident Timeline / Known Errors

Below are the key failure modes seen in production testing.

## 9.1 Historical partial write
Observed:
- `organizations` row created, but no `profiles` row.
- User stuck with “Profile synchronization in progress... please wait.”

Root symptom:
- Non-atomic create sequence allowed org insertion before profile linkage completion.

## 9.2 Foreign key race to auth.users
Observed Vercel error:
- `insert or update on table "profiles" violates foreign key constraint "profiles_id_fkey"`
- `Key (id)=... is not present in table "users"` (code `23503`)

Interpretation:
- Provisioning attempted before auth user visibility fully propagated.

Mitigations applied:
- Added auth-user sync wait in `ensureWorkspaceForUser`.
- Narrowed fallback triggers to avoid misclassification.

## 9.3 Auth user sync timeout
Observed:
- `AUTH_USER_SYNC_TIMEOUT` from workspace ensure flow.

Interpretation:
- Consistency window still exceeded retry budget in some runs.

## 9.4 Current loop state
Observed by user:
- Provisioning screen persists.
- Both `organizations` and `profiles` have entries but can point to different org instances.

Interpretation:
- Profile/org mismatch causes routing uncertainty:
  - profile exists -> middleware thinks user has org
  - org lookup mismatch/missing/inconsistent -> provisioning/onboarding loops

Recent local hardening (not committed/pushed per user request):
- `ensure-workspace.ts` checks profile `org_id` and validates referenced organization existence.
- `onboarding/provisioning/page.tsx` attempts repair when profile exists but org is missing.

---

## 10) High-Risk Technical Debt for Consultant Review

1. **Dual provisioning paths**
- RPC bootstrap + direct bootstrap fallback both exist.
- Direct fallback can still create consistency risk if not strictly transactional.

2. **Cross-layer race handling split**
- Race mitigation is spread across signup route, callback route, provisioning page, middleware, and SQL function.
- System lacks one authoritative provisioning state machine.

3. **Redirect logic complexity**
- Middleware + client-side redirects + provisioning page redirects can create loops under partial states.

4. **Legacy code coexistence**
- Deprecated multi-step onboarding artifacts still in codebase (`onboarding-wizard.tsx`, legacy onboarding endpoints).

5. **Missing automated invariants**
- No enforced app-level reconciliation to heal `profiles.org_id` pointing to non-existent org.

---

## 11) Recommended Consultant Workplan

## 11.1 Immediate stabilization (P0)
- Define a strict invariant: every authenticated user must have exactly one valid profile->org mapping.
- Replace fallback writes with a single authoritative SQL transaction path.
- Add explicit retry budget + structured logs across callback/provisioning.
- Add one emergency reconciliation endpoint/script to fix mismatches.

## 11.2 Structural cleanup (P1)
- Remove old onboarding APIs/components from production path.
- Move workspace provisioning into one service module with deterministic state transitions.
- Introduce onboarding_state table (or equivalent) to avoid inferring state from scattered columns.

## 11.3 Hardening and QA (P1/P2)
- Add integration tests:
  - signup + verify + callback
  - delayed auth visibility
  - orphan profile/org recovery
  - middleware route expectations
- Add runbooks for support/debugging with log signatures.

---

## 12) Suggested Questions for Consultant

1. Should provisioning be fully DB-driven (single RPC + advisory lock) instead of route-level retries?
2. Should we introduce an idempotency key for user provisioning attempts?
3. Should we enforce a unique org-per-owner model explicitly, or allow many orgs per user?
4. Should middleware become fail-open for onboarding routes under partial states, with dedicated resolver route?
5. What observability baseline (structured logs + tracing spans + event IDs) should be mandatory for auth/onboarding?

---

## 13) Current Files Most Relevant to the Incident

- `apps/web/app/api/auth/signup/route.ts`
- `apps/web/app/auth/callback/route.ts`
- `apps/web/lib/auth/ensure-workspace.ts`
- `apps/web/app/onboarding/provisioning/page.tsx`
- `apps/web/app/onboarding/page.tsx`
- `apps/web/middleware.ts`
- `apps/web/app/api/onboarding/complete/route.ts`
- `supabase/schema.sql`
- `supabase/master_alignment.sql`
- `supabase/phase1_database_hardening.sql`
- `supabase/phase2_execution_bridge.sql`

---

## 14) Consultant Handoff Note

This project is close to having a strong onboarding foundation, but production reliability currently depends on race-condition handling across multiple layers. The critical recommendation is to converge provisioning into one atomic, idempotent control path with explicit invariants and telemetry.
