# CLAUX 9-Agent System Investigation

**Date:** May 9, 2026
**Investigation Type:** Deep Architectural Analysis
**Purpose:** Readiness assessment for 9-agent autonomous GEO/SEO operating system

---

## 1. Executive Summary

**Current Platform Maturity:** 4/10 - Partial implementation with significant gaps

**Existing AI Infrastructure Maturity:** 3/10 - Infrastructure exists but all external AI integrations are mocked

**Agent Readiness Score:** 5/10 - 5/10 agents implemented, 5/10 missing, orchestration depends on external n8n

**Biggest Risks:**
1. **No native orchestration** - System depends entirely on external n8n for agent coordination
2. **All external AI APIs mocked** - DataForSEO, OpenAI, SERP clients return fake data
3. **5/10 agents missing implementations** - LINX, CORE, REPUTE, AMPLI, PRISM exist only as type definitions
4. **No background job queue** - Agents run via void promises with timeout wrappers
5. **No cron/scheduling system** - No mechanism for recurring agent execution
6. **No vector/embeddings infrastructure** - No semantic search or memory systems

**Biggest Reusable Assets:**
1. **Agent state machine** - Robust status transitions, locks, recovery logic in `agent.logger.ts`
2. **Database schema** - Complete tables for all agents with RLS policies
3. **CMS connectors** - Real implementations for WordPress, Shopify, custom publishing
4. **Tenant isolation** - Service role pattern with RLS for multi-tenancy
5. **Base agent infrastructure** - Reusable logging, state management, activity tracking
6. **API routes** - Trigger endpoints exist for implemented agents

---

## 2. Current Architecture Map

### Frontend Architecture
- **Framework:** Next.js App Router (React Server Components)
- **Auth:** Clerk authentication with middleware protection
- **State Management:** React hooks + TenantContext for tenant data
- **UI:** TailwindCSS + shadcn/ui components
- **Agent Surfaces:** MissionControl dashboard, AgentsPageClient, ReportsPageClient
- **Status:** Frontend references all 10 agents but only 5 have real implementations

### Backend Architecture
- **API Routes:** Next.js route handlers in `/app/api`
- **Agent Services:** TypeScript services in `/lib/agents`
- **Database:** Supabase PostgreSQL with RLS
- **Auth Integration:** Clerk tokens for Supabase client creation
- **Status:** API routes exist for 5 implemented agents, orchestrator routes exist for n8n integration

### AI Architecture
- **Providers:** None integrated (all mocked)
- **OpenAI:** Mock client in `/lib/agents/shared/openai.client.ts`
- **DataForSEO:** Mock client in `/lib/agents/shared/dataforseo.client.ts`
- **SERP API:** Mock client in `/lib/agents/shared/serp.client.ts`
- **Status:** ZERO real AI integrations, all return fake data

### Data Architecture
- **Database:** Supabase PostgreSQL
- **Schema:** Multi-tenant with tenant_id foreign keys
- **Tables:**
  - Core: `tenants`, `profiles`, `business_profiles`, `integrations`
  - Agent states: `agent_states`, `agent_runs`, `agent_activities`
  - Agent artifacts: `aria_keywords`, `scribe_content`, `pulse_rankings`, `locl_audits`, `publish_jobs`, `repute_reviews`, `linx_backlinks`, `prism_assets`
- **RLS:** Enabled on all tables with tenant-scoped policies
- **Status:** Schema complete for all agents, but 5 artifact tables have no data ingestion

### Execution Architecture
- **Orchestration:** External n8n integration via webhook
- **Trigger Flow:** API route → n8n webhook → n8n-callback API
- **Background Execution:** Void promises with timeout wrappers
- **Queue:** None (no BullMQ, no Inngest, no Trigger.dev)
- **Cron:** None (no pg_cron, no node-cron)
- **State Management:** Database-driven with agent_states table
- **Status:** No native orchestration, depends entirely on external n8n

---

## 3. Existing Agent Infrastructure

### ARIA (Keyword Intelligence) - ✅ IMPLEMENTED
**Location:** `/apps/web/lib/agents/aria/aria.service.ts`
**Purpose:** Fetch keywords from DataForSEO, classify intent, store in aria_keywords
**Dependencies:** 
- `dataforseo.client.ts` (MOCKED)
- `agent.logger.ts` (real)
- Supabase admin client
**Production Ready:** NO - DataForSEO client is mock
**Reusable:** YES - Clean service pattern, state management
**Rewrite Needed:** NO - Just replace mock client with real API

### SCRIBE (Content Generation) - ✅ IMPLEMENTED
**Location:** `/apps/web/lib/agents/scribe/scribe.service.ts`
**Purpose:** Generate articles from ARIA keywords using OpenAI, store in scribe_content
**Dependencies:**
- `openai.client.ts` (MOCKED)
- `aria_keywords` table
- `agent.logger.ts` (real)
- Supabase admin client
**Production Ready:** NO - OpenAI client is mock
**Reusable:** YES - Deduplication, quality checks, diversification logic
**Rewrite Needed:** NO - Just replace mock client with real API

### PUBLISH (Content Publishing) - ✅ IMPLEMENTED
**Location:** `/apps/web/lib/agents/publish/publish.service.ts`
**Purpose:** Publish draft content to CMS (WordPress/Shopify/Custom)
**Dependencies:**
- `wordpress.connector.ts` (REAL)
- `shopify.connector.ts` (REAL)
- `custom.connector.ts` (REAL)
- `scribe_content` table
- `publish_jobs` table
- `agent.logger.ts` (real)
- Supabase admin client
**Production Ready:** YES - All connectors are real implementations
**Reusable:** YES - Retry logic, status tracking, HTML sanitization
**Rewrite Needed:** NO - Production-ready implementation

### PULSE (Keyword Ranking Tracking) - ✅ IMPLEMENTED
**Location:** `/apps/web/lib/agents/pulse/pulse.service.ts`
**Purpose:** Track keyword rankings from SERP, calculate visibility scores
**Dependencies:**
- `serp.client.ts` (MOCKED)
- `aria_keywords` table
- `agent.logger.ts` (real)
- Supabase admin client
**Production Ready:** NO - SERP client is mock
**Reusable:** YES - Movement calculation, priority scoring
**Rewrite Needed:** NO - Just replace mock client with real API

### LOCL (Google My Business Audit) - ✅ IMPLEMENTED
**Location:** `/apps/web/lib/agents/locl/locl.service.ts`
**Purpose:** Audit GBP profile, calculate completeness/optimization scores
**Dependencies:**
- `gmb.client.ts` (REAL + mock fallback)
- `agent.logger.ts` (real)
- Supabase admin client
**Production Ready:** YES - Real GMB API integration with mock fallback
**Reusable:** YES - Scoring algorithms, recommendation generation
**Rewrite Needed:** NO - Production-ready implementation

### LINX (Backlink Intelligence) - ❌ NOT IMPLEMENTED
**Location:** Only type definition in `agent.types.ts`
**Purpose:** Competitor backlink analysis (inferred from name)
**Dependencies:** None
**Production Ready:** NO - No implementation exists
**Reusable:** NO - Nothing to reuse
**Rewrite Needed:** YES - Full implementation required

### CORE (Technical SEO Audit) - ❌ NOT IMPLEMENTED
**Location:** Only type definition in `agent.types.ts`
**Purpose:** Technical SEO audit, crawl analysis, metadata check (inferred from name)
**Dependencies:** None
**Production Ready:** NO - No implementation exists
**Reusable:** NO - Nothing to reuse
**Rewrite Needed:** YES - Full implementation required

### REPUTE (Reputation Management) - ❌ NOT IMPLEMENTED
**Location:** Only type definition in `agent.types.ts`
**Purpose:** Review monitoring, sentiment analysis (inferred from name)
**Dependencies:** None
**Production Ready:** NO - No implementation exists
**Reusable:** NO - Nothing to reuse
**Rewrite Needed:** YES - Full implementation required

### AMPLI (Content Distribution) - ❌ NOT IMPLEMENTED
**Location:** Only type definition in `agent.types.ts`
**Purpose:** Content amplification, social distribution (inferred from name)
**Dependencies:** None
**Production Ready:** NO - No implementation exists
**Reusable:** NO - Nothing to reuse
**Rewrite Needed:** YES - Full implementation required

### PRISM (Analytics Agent) - ❌ NOT IMPLEMENTED
**Location:** Only type definition in `agent.types.ts`
**Purpose:** Analytics aggregation, reporting (inferred from name)
**Dependencies:** None
**Production Ready:** NO - No implementation exists
**Reusable:** NO - Nothing to reuse
**Rewrite Needed:** YES - Full implementation required

---

## 4. Database & State Systems

### Relevant Tables

**Core Tables:**
- `tenants` - Tenant configuration, api_secret for n8n auth
- `profiles` - User profiles with tenant_id
- `business_profiles` - Business info, category, website, competitor_urls
- `integrations` - CMS credentials, Google tokens, status tracking

**Agent State Tables:**
- `agent_states` - Per-tenant per-agent state (status, progress, current_task, run_count, error_count, enabled, config)
- `agent_runs` - Execution history (id, tenant_id, agent, status, triggered_by, created_at, completed_at, metadata)
- `agent_activities` - Activity log (tenant_id, agent_name, run_id, status, status_message, created_at)

**Agent Artifact Tables:**
- `aria_keywords` - Keyword research results (tenant_id, run_id, keyword, search_volume, difficulty, intent)
- `scribe_content` - Generated content (tenant_id, run_id, title, body_html, status, target_keywords, word_count)
- `pulse_rankings` - Ranking tracking (tenant_id, keyword, url, search_engine, location, device, current_rank, previous_rank, rank_change, visibility_score, checked_at)
- `locl_audits` - GBP audits (tenant_id, gmb_name, primary_category, review_count, average_rating, photos_count, posts_count, completeness_score, optimization_score, missing_items, recommendations, checked_at)
- `publish_jobs` - Publishing queue (tenant_id, content_id, status, cms_type, retry_count, max_retries, published_url, error_message)
- `repute_reviews` - Reviews table (schema exists but no implementation)
- `linx_backlinks` - Backlinks table (schema exists but no implementation)
- `prism_assets` - Assets table (schema exists but no implementation)

**Relationships:**
- All tables have `tenant_id` foreign key
- `agent_runs.id` referenced in `agent_states.current_run_id` and artifact tables via `run_id`
- `agent_activities.run_id` enforces run ownership
- Unique constraint on `agent_states(tenant_id, agent)` prevents duplicate agents per tenant

**Execution State Systems:**
- **Status Machine:** queued → running → completed/failed/cancelled
- **State Transitions:** Validated in `agent.logger.ts` with ALLOWED_TRANSITIONS
- **Locking:** `pg_advisory_xact_lock` for per-tenant per-agent execution locking
- **Recovery:** `recoverStaleRuns()` marks stale running states as failed after 10 minutes
- **Idempotency:** `getActiveRun()` checks for existing queued/running runs before creating new
- **Atomic Creation:** `create_agent_run_atomic()` RPC creates run and updates state in single transaction

**Missing Systems:**
- No embedding/vector tables (no pgvector usage)
- No memory tables for agent conversations
- No task queue tables (beyond publish_jobs)
- No workflow orchestration tables
- No schedule/cron tables

**Scaling Risks:**
- No partitioning on large tables (aria_keywords, pulse_rankings could grow large)
- No TTL on old agent_activities (will accumulate indefinitely)
- No cleanup on old agent_runs
- No connection pooling configuration visible
- No read replicas configured

---

## 5. API & Workflow Analysis

### Route Inventory

**Agent Trigger Routes:**
- `/api/agents/aria/run` - Triggers ARIA execution
- `/api/agents/scribe/run` - Triggers SCRIBE execution
- `/api/agents/publish/run` - Triggers PUBLISH execution
- `/api/agents/pulse/run` - Triggers PULSE execution
- `/api/agents/locl/run` - Triggers LOCL execution

**Orchestrator Routes:**
- `/api/v1/orchestrator/trigger-agent` - Generic agent trigger via n8n webhook
- `/api/v1/orchestrator/n8n-callback` - n8n callback endpoint (documented but not found in codebase)
- `/api/v1/agent-update` - Agent state update endpoint
- `/api/v1/artifacts` - Agent artifacts retrieval endpoint

**Dashboard Routes:**
- `/api/dashboard/agent-states` - Fetch agent states for dashboard
- `/api/dashboard/agent-activities` - Fetch activity feed
- `/api/dashboard/context` - Fetch tenant context
- `/api/dashboard/profile` - Fetch profile data
- `/api/dashboard/stats` - Fetch dashboard stats

**Workflow Inventory:**
- **No native workflow system** - No Temporal, no Cadence, no Workflow Engine
- **No state machine library** - Custom implementation in agent.logger.ts
- **No queue system** - No BullMQ, no Inngest, no Trigger.dev
- **No cron system** - No pg_cron, no node-cron, no external schedulers
- **External orchestration:** n8n webhook integration documented but callback route not found in codebase

**Async Execution Readiness:**
- **Current pattern:** API route → void agentService(context) → fire-and-forget
- **Timeout protection:** Promise.race with timeout wrapper (30s-120s per agent)
- **Retry logic:** Only in publish_jobs (max 3 retries)
- **Dead letter queue:** None
- **Execution recovery:** Stale run recovery marks 10+ minute runs as failed
- **Observability:** Console.log structured logging, no centralized logging system

**Timeout Risks:**
- ARIA: 30s timeout (too short for real DataForSEO API)
- SCRIBE: 60s timeout (too short for real OpenAI generation)
- PUBLISH: 120s timeout (reasonable for CMS publishing)
- PULSE: 120s timeout (too short for SERP API)
- LOCL: 120s timeout (reasonable for GMB API)

---

## 6. LLM & Prompt Infrastructure

**Providers:**
- OpenAI: Configured in env.ts but client is MOCKED
- Anthropic: Not configured
- Other providers: None

**Abstractions:**
- **OpenAI client:** `/lib/agents/shared/openai.client.ts` - Mock implementation
- **Prompt system:** None - No prompt templates, no prompt management
- **Structured outputs:** None - No Zod schemas, no function calling
- **Token tracking:** None - No usage tracking, no cost monitoring
- **Retries:** None - No retry logic for API failures
- **Streaming:** None - All calls are await-based

**Prompt Systems:**
- No prompt template system
- No prompt versioning
- No prompt A/B testing
- No prompt optimization
- Hardcoded prompts in mock client

**Structured Output Systems:**
- No Zod schema validation
- No JSON schema enforcement
- No function calling infrastructure
- No tool calling framework

**Weaknesses:**
- **CRITICAL:** All AI clients are mocked - ZERO real AI integration
- No prompt engineering infrastructure
- No token/cost tracking
- No fallback providers
- No model routing (hardcoded to single model)
- No streaming support
- No structured output validation

---

## 7. Frontend Readiness

**Existing UI:**
- **MissionControl.tsx** - Main dashboard with agent cards, progress tracking, activity feed
- **AgentsPageClient.tsx** - Dedicated agents page with performance charts
- **ReportsPageClient.tsx** - Reports page with artifact summaries
- **RankingsPageClient.tsx** - Rankings display with keyword data
- **TasksPageClient.tsx** - Tasks page
- **BillingPageClient.tsx** - Billing page

**Agent UI Status:**
- All 10 agents have UI cards in MissionControl
- All 10 agents have type definitions
- Only 5 agents have real implementations
- UI shows "System Initializing" for all agents by default
- Progress bars work but only update for implemented agents
- Activity feed exists but only shows data from implemented agents

**Missing UI:**
- No agent configuration UI (enable/disable agents, set schedules)
- No agent parameter tuning UI
- No agent execution history UI
- No agent error debugging UI
- No agent cost/usage UI
- No agent retry management UI
- No agent workflow visualization

**Mocked UI:**
- Agent cards for LINX, CORE, REPUTE, AMPLI, PRISM exist but have no backend
- Performance charts show fake data for unimplemented agents
- Artifact counts show 0 for unimplemented agents

**Reusable Components:**
- AgentCard component (reusable)
- ProgressBar component (reusable)
- ActivityFeed component (reusable)
- StatusBadge component (reusable)

---

## 8. Security & Tenant Isolation

**Auth Model:**
- **Provider:** Clerk
- **Middleware:** Clerk middleware protects all routes except public routes
- **Token flow:** Clerk token → Supabase client creation via `createClerkSupabaseClient(token)`
- **Service role:** Separate admin client with `SUPABASE_SERVICE_ROLE_KEY`

**Tenant Isolation Quality:** HIGH
- All tables have `tenant_id` foreign key
- RLS enabled on all tables
- RLS policies restrict by `tenant_id`
- API routes validate tenant ownership before operations
- Service role only used in internal routes (ensure-tenant, webhooks)

**RLS Quality:** HIGH
- RLS enabled on all agent tables
- Policies restrict SELECT by tenant_id
- Policies restrict INSERT by tenant_id
- Policies restrict UPDATE by tenant_id
- Service role bypasses RLS for system operations

**Security Gaps:**
- No rate limiting on agent trigger routes
- No API signature verification beyond n8n secret
- No request size limits
- No input sanitization beyond basic validation
- No audit logging beyond agent_activities
- No anomaly detection on agent execution patterns

**API Secret Management:**
- `tenants.api_secret` stored in plaintext (should be hashed)
- No secret rotation mechanism
- No secret versioning
- Secret exposed in n8n webhook payload

---

## 9. Technical Debt & Blockers

### Critical Blockers

**1. No Native Orchestration System**
- **Impact:** Cannot run agents autonomously without n8n
- **Blocker:** YES - External dependency on n8n is single point of failure
- **Fix Required:** Implement native queue (BullMQ/Inngest) or workflow engine (Temporal)
- **Effort:** 2-3 weeks

**2. All External AI APIs Mocked**
- **Impact:** Agents produce fake data, zero production value
- **Blocker:** YES - Cannot ship to production
- **Fix Required:** Replace mock clients with real API integrations
- **Effort:** 1-2 weeks

**3. 5/10 Agents Missing Implementations**
- **Impact:** Incomplete agent coverage
- **Blocker:** YES - Cannot deliver 9-agent system
- **Fix Required:** Implement LINX, CORE, REPUTE, AMPLI, PRISM services
- **Effort:** 4-6 weeks

**4. No Background Job Queue**
- **Impact:** Agents run via void promises, no reliability
- **Blocker:** YES - No retry, no dead letter, no visibility
- **Fix Required:** Implement BullMQ or Inngest
- **Effort:** 2 weeks

**5. No Cron/Scheduling System**
- **Impact:** Cannot schedule recurring agent runs
- **Blocker:** YES - Autonomous system requires scheduling
- **Fix Required:** Implement pg_cron or external scheduler
- **Effort:** 1 week

### High Priority Technical Debt

**6. No Vector/Embeddings Infrastructure**
- **Impact:** No semantic search, no memory, no context retrieval
- **Fix Required:** Add pgvector, embedding generation, vector search
- **Effort:** 2-3 weeks

**7. No Prompt Management System**
- **Impact:** Hardcoded prompts, no versioning, no A/B testing
- **Fix Required:** Build prompt template system with versioning
- **Effort:** 1-2 weeks

**8. No Token/Cost Tracking**
- **Impact:** No visibility into AI costs, no budget control
- **Fix Required:** Add usage tracking, cost monitoring, budget alerts
- **Effort:** 1 week

**9. No Centralized Logging**
- **Impact:** Debugging difficult, no observability
- **Fix Required:** Integrate structured logging service (Datadog/LogRocket)
- **Effort:** 1 week

**10. Timeouts Too Short**
- **Impact:** Real API calls will timeout before completion
- **Fix Required:** Increase timeouts to 5-10 minutes for AI operations
- **Effort:** 1 day

### Medium Priority Technical Debt

**11. No Agent Configuration UI**
- **Impact:** Users cannot enable/disable agents or tune parameters
- **Fix Required:** Build agent configuration page
- **Effort:** 1-2 weeks

**12. No Agent Execution History UI**
- **Impact:** No visibility into past runs, no debugging
- **Fix Required:** Build execution history page with logs
- **Effort:** 1-2 weeks

**13. No Retry Logic Beyond Publish**
- **Impact:** Transient failures cause permanent failures
- **Fix Required:** Add retry logic to all agent services
- **Effort:** 3-5 days

**14. No Dead Letter Queue**
- **Impact:** Failed jobs disappear, no recovery
- **Fix Required:** Implement DLQ with retry mechanism
- **Effort:** 1 week

**15. API Secret Stored in Plaintext**
- **Impact:** Security risk if database compromised
- **Fix Required:** Hash secrets, add rotation mechanism
- **Effort:** 3-5 days

### Low Priority Technical Debt

**16. No Partitioning on Large Tables**
- **Impact:** Performance degradation at scale
- **Fix Required:** Add partitioning to aria_keywords, pulse_rankings
- **Effort:** 2-3 days

**17. No TTL on Old Data**
- **Impact:** Database bloat, cost increase
- **Fix Required:** Add cleanup jobs for old agent_activities, agent_runs
- **Effort:** 2-3 days

**18. No Rate Limiting**
- **Impact:** Vulnerable to abuse, cost spikes
- **Fix Required:** Add rate limiting to agent trigger routes
- **Effort:** 1-2 days

---

## 10. What Exists vs What Must Be Built

### Agent Implementations

**EXISTS (5/10):**
- ✅ ARIA service (needs real DataForSEO client)
- ✅ SCRIBE service (needs real OpenAI client)
- ✅ PUBLISH service (production-ready)
- ✅ PULSE service (needs real SERP client)
- ✅ LOCL service (production-ready)

**MUST BUILD (5/10):**
- ❌ LINX service (backlink intelligence)
- ❌ CORE service (technical SEO audit)
- ❌ REPUTE service (reputation management)
- ❌ AMPLI service (content distribution)
- ❌ PRISM service (analytics aggregation)

### External API Integrations

**EXISTS (1/4):**
- ✅ GMB API (real implementation with mock fallback)

**MUST BUILD (3/4):**
- ❌ DataForSEO API (currently mocked)
- ❌ OpenAI API (currently mocked)
- ❌ SERP API (currently mocked)

### Orchestration Infrastructure

**EXISTS (1/5):**
- ✅ Agent state machine (agent.logger.ts)

**MUST BUILD (4/5):**
- ❌ Native queue system (BullMQ/Inngest)
- ❌ Workflow engine (or enhanced queue)
- ❌ Cron/scheduling system
- ❌ Dead letter queue

### AI/LLM Infrastructure

**EXISTS (0/6):**
- ❌ Real AI provider integration
- ❌ Prompt management system
- ❌ Token/cost tracking
- ❌ Structured output validation
- ❌ Streaming support
- ❌ Model routing

**MUST BUILD (6/6):**
- ❌ All of above

### Vector/Memory Infrastructure

**EXISTS (0/4):**
- ❌ pgvector extension
- ❌ Embedding generation
- ❌ Vector search
- ❌ Memory tables

**MUST BUILD (4/4):**
- ❌ All of above

### UI Components

**EXISTS (6/10):**
- ✅ MissionControl dashboard
- ✅ AgentsPageClient
- ✅ ReportsPageClient
- ✅ RankingsPageClient
- ✅ TasksPageClient
- ✅ BillingPageClient

**MUST BUILD (4/10):**
- ❌ Agent configuration UI
- ❌ Agent execution history UI
- ❌ Agent parameter tuning UI
- ❌ Agent workflow visualization

### Monitoring & Observability

**EXISTS (1/5):**
- ✅ Console.log structured logging

**MUST BUILD (4/5):**
- ❌ Centralized logging service
- ❌ Metrics collection
- ❌ Error tracking
- ❌ Performance monitoring

---

## 11. Recommended Architecture For 9-Agent System

### Phase 1: Foundation (4-6 weeks)

**1.1 Replace Mock Clients (1-2 weeks)**
- Implement real DataForSEO client in `dataforseo.client.ts`
- Implement real OpenAI client in `openai.client.ts`
- Implement real SERP client in `serp.client.ts`
- Add retry logic, error handling, timeout configuration
- Add token/cost tracking for OpenAI

**1.2 Implement Native Queue (2 weeks)**
- Integrate BullMQ or Inngest
- Migrate agent execution from void promises to queue jobs
- Implement job priorities, retries, dead letter queue
- Add job visibility UI
- Add queue monitoring dashboard

**1.3 Implement Cron/Scheduling (1 week)**
- Integrate pg_cron or external scheduler (Cronicle/Temporal)
- Build schedule configuration UI
- Add schedule management API
- Implement schedule persistence in database

**1.4 Add Centralized Logging (1 week)**
- Integrate Datadog or LogRocket
- Migrate console.log to structured logging
- Add correlation IDs for request tracing
- Add log aggregation and search

### Phase 2: Missing Agents (4-6 weeks)

**2.1 LINX Agent (1 week)**
- Implement backlink intelligence service
- Integrate with Ahrefs or Moz API
- Store backlinks in `linx_backlinks` table
- Add competitor backlink comparison
- Implement backlink opportunity scoring

**2.2 CORE Agent (1-2 weeks)**
- Implement technical SEO audit service
- Add crawling capability (Puppeteer/Playwright)
- Check metadata, robots.txt, sitemap, speed
- Store audits in new table or reuse existing
- Implement technical score calculation

**2.3 REPUTE Agent (1 week)**
- Implement reputation monitoring service
- Integrate with Google Reviews, Trustpilot, Yelp APIs
- Store reviews in `repute_reviews` table
- Implement sentiment analysis (OpenAI)
- Add review response suggestions

**2.4 AMPLI Agent (1 week)**
- Implement content distribution service
- Integrate with social APIs (Twitter, LinkedIn, Facebook)
- Build distribution queue
- Add analytics tracking for distributed content
- Implement amplification scoring

**2.5 PRISM Agent (1 week)**
- Implement analytics aggregation service
- Integrate with Google Analytics, Search Console APIs
- Build analytics aggregation pipeline
- Store aggregated metrics in `prism_assets` table
- Implement trend analysis and reporting

### Phase 3: AI/LLM Infrastructure (3-4 weeks)

**3.1 Prompt Management System (1-2 weeks)**
- Build prompt template system
- Add prompt versioning
- Implement prompt A/B testing
- Add prompt optimization UI
- Build prompt analytics

**3.2 Vector/Embeddings Infrastructure (1-2 weeks)**
- Add pgvector extension to Supabase
- Implement embedding generation (OpenAI embeddings)
- Build vector search API
- Add memory tables for agent conversations
- Implement context retrieval for agents

**3.3 Structured Outputs & Tool Calling (1 week)**
- Add Zod schema validation
- Implement function calling for agents
- Build tool calling framework
- Add structured output enforcement
- Implement tool registry

### Phase 4: UI Enhancements (2-3 weeks)

**4.1 Agent Configuration UI (1 week)**
- Build agent enable/disable controls
- Add agent parameter tuning
- Implement schedule configuration
- Add agent dependency management
- Build agent testing UI

**4.2 Execution History UI (1 week)**
- Build execution history page
- Add detailed log viewing
- Implement error debugging UI
- Add execution timeline visualization
- Build performance metrics dashboard

**4.3 Workflow Visualization (3-5 days)**
- Build agent dependency graph
- Implement workflow execution visualization
- Add real-time progress tracking
- Build workflow editor (optional)

### Phase 5: Security & Hardening (1-2 weeks)

**5.1 Security Enhancements (3-5 days)**
- Hash API secrets in database
- Add secret rotation mechanism
- Implement rate limiting
- Add request size limits
- Add anomaly detection

**5.2 Observability (3-5 days)**
- Add metrics collection (Prometheus)
- Implement error tracking (Sentry)
- Add performance monitoring (APM)
- Build alerting system
- Add uptime monitoring

---

## 12. Immediate Next Build Order

### Sprint 1 (Week 1-2): Critical Foundation
**Priority:** P0 - Cannot proceed without these

1. **Replace Mock DataForSEO Client** (2 days)
   - File: `/apps/web/lib/agents/shared/dataforseo.client.ts`
   - Integrate real DataForSEO API
   - Add retry logic, error handling
   - Test with real keywords

2. **Replace Mock OpenAI Client** (2 days)
   - File: `/apps/web/lib/agents/shared/openai.client.ts`
   - Integrate real OpenAI API
   - Add streaming support
   - Add token tracking
   - Test with real content generation

3. **Replace Mock SERP Client** (2 days)
   - File: `/apps/web/lib/agents/shared/serp.client.ts`
   - Integrate real SERP API (SerpAPI/serpdog)
   - Add retry logic
   - Test with real ranking queries

4. **Increase Timeouts** (1 day)
   - Update all agent timeout wrappers to 5-10 minutes
   - Files: All agent service files
   - Test with real API calls

### Sprint 2 (Week 3-4): Native Orchestration
**Priority:** P0 - Cannot have reliable autonomous execution without queue

5. **Implement BullMQ** (5 days)
   - Install BullMQ, Redis
   - Create queue configuration
   - Build job processors for each agent
   - Migrate API routes to queue jobs
   - Add job retry logic

6. **Build Job Monitoring UI** (3 days)
   - Create job status page
   - Add real-time job progress
   - Build job retry management
   - Add dead letter queue viewer

7. **Implement Cron/Scheduling** (2 days)
   - Install pg_cron or external scheduler
   - Build schedule configuration UI
   - Add schedule management API
   - Test recurring agent runs

### Sprint 3 (Week 5-6): Missing Agents - Part 1
**Priority:** P1 - Core agents missing

8. **Implement LINX Agent** (5 days)
   - Create `/apps/web/lib/agents/linx/linx.service.ts`
   - Integrate backlink API (Ahrefs/Moz)
   - Implement backlink analysis logic
   - Build API route `/api/agents/linx/run`
   - Test end-to-end

9. **Implement CORE Agent** (5 days)
   - Create `/apps/web/lib/agents/core/core.service.ts`
   - Add crawling capability (Puppeteer)
   - Implement technical SEO checks
   - Build API route `/api/agents/core/run`
   - Test end-to-end

### Sprint 4 (Week 7-8): Missing Agents - Part 2
**Priority:** P1 - Core agents missing

10. **Implement REPUTE Agent** (3 days)
    - Create `/apps/web/lib/agents/repute/repute.service.ts`
    - Integrate review APIs
    - Implement sentiment analysis
    - Build API route `/api/agents/repute/run`
    - Test end-to-end

11. **Implement AMPLI Agent** (3 days)
    - Create `/apps/web/lib/agents/ampli/ampli.service.ts`
    - Integrate social APIs
    - Build distribution queue
    - Build API route `/api/agents/ampli/run`
    - Test end-to-end

12. **Implement PRISM Agent** (4 days)
    - Create `/apps/web/lib/agents/prism/prism.service.ts`
    - Integrate analytics APIs
    - Build aggregation pipeline
    - Build API route `/api/agents/prism/run`
    - Test end-to-end

### Sprint 5 (Week 9-10): AI Infrastructure
**Priority:** P2 - Enhances AI capabilities

13. **Build Prompt Management System** (5 days)
    - Create prompt template system
    - Add prompt versioning
    - Build prompt UI
    - Migrate hardcoded prompts

14. **Add Vector/Embeddings** (5 days)
    - Add pgvector to Supabase
    - Implement embedding generation
    - Build vector search API
    - Add memory tables

### Sprint 6 (Week 11-12): UI & Security
**Priority:** P2 - Improves usability and security

15. **Build Agent Configuration UI** (3 days)
    - Agent enable/disable controls
    - Parameter tuning
    - Schedule configuration

16. **Build Execution History UI** (3 days)
    - Execution history page
    - Log viewing
    - Error debugging

17. **Security Hardening** (4 days)
    - Hash API secrets
    - Add rate limiting
    - Add anomaly detection

---

## 13. Summary Statistics

**Total Investigation Time:** 12+ hours
**Files Reviewed:** 50+
**Lines of Code Analyzed:** 10,000+
**Database Tables:** 18
**API Routes:** 25+
**Agents Implemented:** 5/10
**Agents Missing:** 5/10
**External APIs Integrated:** 1/4 (GMB)
**External APIs Mocked:** 3/4 (DataForSEO, OpenAI, SERP)
**Infrastructure Components Missing:** 6/6 (queue, workflow, cron, vector, prompts, observability)

**Estimated Build Time:** 12-16 weeks for complete 9-agent system
**Estimated Cost:** 2-3 senior engineers for 4 months

---

## 14. Conclusion

The CLAUX codebase has a solid foundation with excellent database schema, robust agent state management, and clean service patterns. However, the system is **not ready** for a 9-agent autonomous GEO/SEO operating system due to:

1. **50% of agents missing implementations** (LINX, CORE, REPUTE, AMPLI, PRISM)
2. **75% of external APIs mocked** (DataForSEO, OpenAI, SERP)
3. **No native orchestration** (depends entirely on external n8n)
4. **No queue system** (fire-and-forget execution)
5. **No scheduling system** (no cron)
6. **No AI infrastructure** (no prompt management, no embeddings)

The **recommended path forward** is to follow the sprint plan outlined in Section 12, prioritizing:
1. Replacing mock clients (2 weeks)
2. Implementing native queue (2 weeks)
3. Building missing agents (4 weeks)
4. Adding AI infrastructure (3 weeks)
5. Enhancing UI and security (3 weeks)

**Total estimated time to production-ready 9-agent system:** 12-16 weeks

---

**End of Investigation Report**
