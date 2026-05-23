# CLAUX V1 HYBRID PIVOT FORENSIC MIGRATION REPORT

**Date:** May 23, 2026  
**Audit Type:** Critical Architecture Pivot  
**Target Model:** CLAUX V1 Hybrid AI + Human Execution System  
**Audit Scope:** Full codebase, database, runtime, agents, integrations, UI  
**Readiness Score:** 35/100 (Major Architectural Conflicts)

---

# 1. EXECUTIVE SUMMARY

## Current System State

CLAUX is currently architected as a **partially autonomous AI SEO system** with significant CMS automation capabilities. The system has:

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, Clerk authentication
- **Backend:** Supabase, Postgres 17, RLS multitenancy
- **Orchestration:** Inngest for workflows, n8n for webhook callbacks only
- **Hosting:** Vercel (configured)
- **Agents:** 9 agents defined, but only 4 have implementations
- **Runtime:** Dual runtime systems (deprecated + new canonical)

## Migration Complexity

**CRITICAL:** The current architecture has **FUNDAMENTAL CONFLICTS** with the new V1 Hybrid Model:

1. **CMS Automation Exists** - WordPress, Shopify, Custom API connectors with FULL publishing automation
2. **No Command Centre** - Task system is empty placeholder, no employee dashboard
3. **Missing Agents** - LINX, PRISM, CORE are empty directories
4. **Database Inconsistencies** - Dual runtime systems, tenant_id type mismatches
5. **No Human Task Queues** - No execution queues for human operators

## Readiness Score: 35/100

- **Multitenancy:** 60/100 (RLS exists but type inconsistencies)
- **Agent Completeness:** 30/100 (4/9 agents implemented)
- **Command Centre:** 10/100 (placeholder only)
- **CMS Automation Removal:** 0/100 (full automation exists)
- **Database Consistency:** 40/100 (dual systems, type mismatches)
- **Scalability:** 50/100 (no optimization for 1000 clients)

## Estimated Build Phases

**8 Phases Required:**

1. **Phase 1:** Remove CMS Automation & Dead Systems (2-3 days)
2. **Phase 2:** Database Migration & Consistency (3-4 days)
3. **Phase 3:** Command Centre Core (5-7 days)
4. **Phase 4:** Agent Task Generation Logic (4-5 days)
5. **Phase 5:** Missing Agent Implementations (6-8 days)
6. **Phase 6:** Client Dashboard Migration (3-4 days)
7. **Phase 7:** Scalability Hardening (4-5 days)
8. **Phase 8:** Integration & Testing (5-7 days)

**Total Estimated Time:** 32-43 days

---

# 2. CURRENT ARCHITECTURE MAP

## Runtime Architecture

### Dual Runtime Systems (CRITICAL ISSUE)

**System 1: Deprecated Runtime (Still Active)**
- `agent_runs` table - Tracks agent executions
- `agent_states` table - Tracks agent states
- Uses TEXT for tenant_id
- Uses auth.uid() for RLS (WRONG for Clerk)
- Referenced in legacy API routes

**System 2: Canonical Runtime (New, Isolated)**
- `agent_executions` table - Canonical execution tracking
- `agent_tasks` table - Individual task tracking
- `agent_events` table - Event stream
- `agent_logs` table - Structured logs
- Uses UUID for tenant_id
- Uses auth.jwt() ->> 'sub' for RLS (CORRECT for Clerk)
- Defined in FINAL_DATABASE_PACKAGE.sql

**Status:** Both systems coexist, creating confusion and data inconsistency.

## Agent Architecture

### Implemented Agents (4/9)

1. **ARIA** - Keyword Intelligence
   - Location: `apps/web/lib/agents/aria/`
   - Files: `aria.service.ts`, `aria-tasks.ts`
   - Connector: DataForSEO
   - Status: **IMPLEMENTED**
   - Conflict: None (generates intelligence only)

2. **SCRIBE** - Semantic Content Engine
   - Location: `apps/web/lib/agents/scribe/`
   - Files: `scribe.service.ts`, `scribe-tasks.ts`
   - Connector: OpenAI
   - Status: **IMPLEMENTED**
   - Conflict: None (generates content only)

3. **PUBLISH** - Publishing Package Generator
   - Location: `apps/web/lib/agents/publish/`
   - Files: `publish.service.ts`, `publish-tasks.ts`
   - Connectors: WordPress, Shopify, Custom API
   - Status: **IMPLEMENTED WITH CMS AUTOMATION**
   - **CONFLICT:** Has WordPressPublishTask that actually publishes to CMS (violates V1 model)

4. **PULSE** - Ranking & Visibility Tracking
   - Location: `apps/web/lib/agents/pulse/`
   - Files: `pulse.service.ts`
   - Connector: DataForSEO/SerpAPI
   - Status: **PARTIALLY IMPLEMENTED**
   - Conflict: None (tracks rankings only)

### Missing Agents (5/9)

5. **LOCL** - Local SEO & GMB Intelligence
   - Location: `apps/web/lib/agents/locl/`
   - Files: `locl.service.ts` only
   - Connector: Google Business Profile (exists)
   - Status: **INCOMPLETE** (missing tasks)
   - Conflict: None

6. **REPUTE** - Review Intelligence
   - Location: `apps/web/lib/agents/repute/`
   - Files: `thinking.ts` only
   - Connector: Google Business Profile (exists)
   - Status: **INCOMPLETE** (missing service, tasks)
   - Conflict: None

7. **LINX** - Backlink Intelligence
   - Location: `apps/web/lib/agents/linx/`
   - Files: **EMPTY DIRECTORY**
   - Connector: DataForSEO (exists)
   - Status: **NOT IMPLEMENTED**
   - Conflict: None

8. **PRISM** - Analytics & Forecasting
   - Location: `apps/web/lib/agents/prism/`
   - Files: **EMPTY DIRECTORY**
   - Connector: Google Analytics (exists)
   - Status: **NOT IMPLEMENTED**
   - Conflict: None

9. **CORE** - Technical SEO Intelligence
   - Location: `apps/web/lib/agents/core/`
   - Files: **EMPTY DIRECTORY**
   - Connector: None (Screaming Frog, PageSpeed Insights missing)
   - Status: **NOT IMPLEMENTED**
   - Conflict: None

## Database Architecture

### Production Tables (Active)

**Core Tables:**
- `profiles` - User profiles (Clerk IDs, TEXT)
- `tenants` - Tenant records (UUID)
- `business_profiles` - Business information (UUID tenant_id)
- `workspaces` - Workspace records (UUID tenant_id)

**Agent-Specific Tables (TEXT tenant_id - TYPE MISMATCH):**
- `agent_runs` - Deprecated runtime (TEXT tenant_id)
- `agent_states` - Deprecated runtime (TEXT tenant_id)
- `locl_audits` - LOCL agent outputs (TEXT tenant_id)
- `publish_jobs` - PUBLISH agent jobs (TEXT tenant_id)
- `pulse_rankings` - PULSE agent rankings (TEXT tenant_id)
- `integrations` - Integration credentials (TEXT tenant_id)
- `indexing_status` - Indexing tracking (TEXT tenant_id)

**Onboarding Tables:**
- `gsc_credentials` - Google Search Console (UUID tenant_id)
- `credentials` - Generic credentials (UUID tenant_id)
- `sitemaps` - Sitemap records (UUID tenant_id)
- `pages` - Page records (UUID tenant_id)
- `ranking_seeds` - Ranking seeds (UUID tenant_id)
- `ranking_history` - Ranking history (UUID tenant_id)
- `ranking_movements` - Ranking movements (UUID tenant_id)
- `ranking_volatility` - Ranking volatility (UUID tenant_id)

### New Runtime Tables (Isolated, Not Deployed)

**Canonical Runtime System:**
- `agent_executions` - Canonical executions (UUID tenant_id)
- `agent_tasks` - Individual tasks (execution_id FK)
- `agent_events` - Event stream (UUID tenant_id, execution_id FK)
- `agent_logs` - Structured logs (execution_id FK, task_id FK)

**Status:** Defined in FINAL_DATABASE_PACKAGE.sql but deployment status unclear.

### Deprecated Runtime Tables

**Old Runtime System (RUNTIME_TABLES.sql - DEPRECATED):**
- `runtime_workflows` - Workflow definitions (TEXT tenant_id)
- `runtime_executions` - Execution records (TEXT tenant_id)
- `runtime_tasks` - Task records (TEXT tenant_id)
- `runtime_thinking_logs` - Thinking logs (TEXT tenant_id)
- `runtime_artifacts` - Artifacts (TEXT tenant_id)
- `seo_keywords` - SEO keywords (TEXT tenant_id)
- `seo_clusters` - SEO clusters (TEXT tenant_id)
- `seo_content_briefs` - Content briefs (TEXT tenant_id)
- `seo_drafts` - Content drafts (TEXT tenant_id)
- `seo_reports` - SEO reports (TEXT tenant_id)

**Status:** Marked as DEPRECATED in file header, preserved for rollback only.

## API Architecture

### Connectors (Runtime Layer)

**Implemented Connectors:**
- `base.connector.ts` - Base connector class
- `dataforseo.connector.ts` - DataForSEO API
- `openai.connector.ts` - OpenAI API
- `google-business-profile.connector.ts` - Google Business Profile API
- `google-analytics.connector.ts` - Google Analytics API
- `google-search-console.connector.ts` - Google Search Console API
- `wordpress.connector.ts` - WordPress REST API (CMS automation)
- `custom-api.connector.ts` - Custom API (CMS automation)

**Missing Connectors:**
- SerpAPI connector (mentioned in docs but not found)
- Screaming Frog connector (needed for CORE)
- PageSpeed Insights connector (needed for CORE)

### CMS Connectors (Legacy Layer - CONFLICT)

**Location:** `apps/web/lib/connectors/`
- `wordpress.connector.ts` - Full WordPress publishing automation
- `shopify.connector.ts` - Full Shopify publishing automation
- `custom.connector.ts` - Full custom API publishing automation

**Status:** These implement FULL CMS publishing, violating V1 hybrid model.

## Dashboard Architecture

### Client Dashboard

**Location:** `apps/web/app/dashboard/`

**Pages:**
- `page.tsx` - Main dashboard (MissionControl component)
- `agents/` - Agent status page (AgentsPageClient)
- `tasks/` - Task history page (TasksPageClient - EMPTY PLACEHOLDER)
- `rankings/` - Rankings page
- `reports/` - Reports page
- `settings/` - Settings pages (general, integrations, billing)

**Components:**
- `MissionControl.tsx` - Main dashboard visualization
- `Sidebar.tsx` - Navigation sidebar
- `CompleteProfileCard.tsx` - Profile completion card

**Status:** Dashboard exists but is visualization layer over runtime data. No Command Centre functionality.

### Command Centre

**Status:** **DOES NOT EXIST**

**What's Missing:**
- Employee task dashboard
- Task queue management
- Task prioritization system
- SLA tracking
- Execution queues for humans
- Task assignment system
- Activity feed
- Execution logs
- Audit trails

**Current State:** Tasks page is empty placeholder with hardcoded empty arrays.

## Orchestration Architecture

### Workflow System

**Inngest Integration:**
- `apps/web/lib/workflows/inngest-client.ts` - Inngest client setup
- Event names defined for all agents
- Used for workflow orchestration

**n8n Integration:**
- Used for webhook callbacks ONLY (not orchestration)
- Environment variables: N8N_WEBHOOK_URL, N8N_API_KEY
- Script: `test-n8n-callback-heartbeat.sh`

**Status:** Orchestration exists but no integration with Command Centre task system.

---

# 3. CONFLICTS WITH NEW V1 MODEL

## CRITICAL CONFLICT #1: CMS AUTOMATION EXISTS

**Violation:** V1 model prohibits ALL CMS automation.

**Current State:**
- WordPress connector with full publishing automation
- Shopify connector with full publishing automation
- Custom API connector with full publishing automation
- CMS execution system supporting WordPress, Shopify, Webflow, Ghost
- PUBLISH agent has WordPressPublishTask that actually publishes
- CMS credentials stored in integrations table
- publish_jobs table tracks CMS publishing

**Files to Remove/Modify:**
1. `apps/web/lib/connectors/wordpress.connector.ts` - DELETE
2. `apps/web/lib/connectors/shopify.connector.ts` - DELETE
3. `apps/web/lib/connectors/custom.connector.ts` - DELETE
4. `apps/web/lib/runtime/cms/cms-execution.ts` - DELETE
5. `apps/web/lib/runtime/connectors/wordpress.connector.ts` - DELETE
6. `apps/web/lib/agents/publish/publish-tasks.ts` - REMOVE WordPressPublishTask
7. `apps/web/actions/cms.ts` - DELETE or repurpose for task generation
8. `apps/web/app/api/integrations/cms/route.ts` - DELETE
9. `apps/web/app/api/integrations/cms/test-connection/route.ts` - DELETE
10. `apps/web/app/api/integrations/callback/cms/route.ts` - DELETE

**Database Changes:**
- Remove CMS columns from integrations table (wp_site_url, wp_username, wp_app_password_encrypted, shopify_store_url, shopify_access_token_encrypted, shopify_blog_id, custom_api_url, custom_api_key_encrypted)
- Remove CMS status columns (wp_status, shopify_status, custom_status)
- Remove CMS CHECK constraints
- Keep publish_jobs table but repurpose for publishing package tracking (not actual publishing)

**Impact:** HIGH - Core architectural change required.

## CRITICAL CONFLICT #2: NO COMMAND CENTRE

**Violation:** V1 model requires Command Centre as core system for human task execution.

**Current State:**
- Tasks page is empty placeholder
- No task queue system
- No employee dashboard
- No task prioritization
- No SLA logic
- No execution queues
- No task assignment system

**What Must Be Built:**
1. Command Centre database tables
2. Task queue management system
3. Employee dashboard UI
4. Task prioritization logic
5. SLA tracking system
6. Task assignment system
7. Activity feed
8. Execution logs
9. Audit trails

**Impact:** CRITICAL - Entire system must be built from scratch.

## CRITICAL CONFLICT #3: MISSING AGENTS

**Violation:** V1 model requires all 9 agents to be implemented.

**Current State:**
- LINX: Empty directory
- PRISM: Empty directory
- CORE: Empty directory
- LOCL: Incomplete (service only, no tasks)
- REPUTE: Incomplete (thinking.ts only)

**What Must Be Built:**
1. LINX agent implementation (service + tasks)
2. PRISM agent implementation (service + tasks)
3. CORE agent implementation (service + tasks)
4. LOCL agent tasks
5. REPUTE agent service + tasks

**Impact:** HIGH - 5 agents need implementation.

## CRITICAL CONFLICT #4: DUAL RUNTIME SYSTEMS

**Violation:** V1 model requires single canonical runtime.

**Current State:**
- Deprecated runtime (agent_runs, agent_states) still active
- Canonical runtime (agent_executions, agent_tasks, agent_events, agent_logs) isolated
- Both systems referenced in code
- Data inconsistency risk

**What Must Be Done:**
1. Migrate data from deprecated runtime to canonical runtime
2. Remove references to deprecated runtime
3. Delete deprecated tables
4. Update all API routes to use canonical runtime
5. Update dashboard to use canonical runtime

**Impact:** HIGH - Data migration required.

## CRITICAL CONFLICT #5: TENANT_ID TYPE INCONSISTENCY

**Violation:** V1 model requires consistent UUID tenant_id everywhere.

**Current State:**
- Production tables: TEXT tenant_id
- Canonical runtime: UUID tenant_id
- Onboarding tables: UUID tenant_id
- Cannot create FKs between tables due to type mismatch

**What Must Be Done:**
1. Migrate all TEXT tenant_id columns to UUID
2. Update all RLS policies
3. Create FK constraints
4. Update all application code
5. Test thoroughly

**Impact:** HIGH - Database migration required.

## CRITICAL CONFLICT #6: AGENT TASK GENERATION MISSING

**Violation:** V1 model requires agents to generate tasks for Command Centre.

**Current State:**
- Agents generate outputs directly
- No task generation logic
- No integration with Command Centre
- Agents don't create human-executable tasks

**What Must Be Built:**
1. Task generation logic for each agent
2. Task templates for each agent type
3. Task priority scoring
4. Task assignment logic
5. Integration with Command Centre

**Impact:** HIGH - Core agent logic must be rewritten.

---

# 4. REUSABLE SYSTEMS

## Can Remain Unchanged

### Authentication
- Clerk integration - **KEEP**
- User profiles table - **KEEP**
- Tenant isolation via profiles.tenant_id - **KEEP**

### Frontend Framework
- Next.js 15 - **KEEP**
- TypeScript - **KEEP**
- Tailwind CSS - **KEEP**
- Framer Motion - **KEEP**
- Recharts - **KEEP**

### Database Infrastructure
- Supabase - **KEEP**
- Postgres 17 - **KEEP**
- RLS system - **KEEP** (but fix policies)

### Canonical Runtime
- agent_executions table - **KEEP** (fix tenant_id type)
- agent_tasks table - **KEEP**
- agent_events table - **KEEP**
- agent_logs table - **KEEP**
- Runtime connectors architecture - **KEEP**

### Agent Implementations (Partial)
- ARIA agent - **KEEP** (modify to generate tasks)
- SCRIBE agent - **KEEP** (modify to generate tasks)
- PULSE agent - **KEEP** (modify to generate tasks)

### API Connectors
- DataForSEO connector - **KEEP**
- OpenAI connector - **KEEP**
- Google Business Profile connector - **KEEP**
- Google Analytics connector - **KEEP**
- Google Search Console connector - **KEEP**

### Orchestration
- Inngest integration - **KEEP**
- Event system - **KEEP**

### Dashboard UI (Partial)
- Dashboard layout - **KEEP**
- Agent visualization - **KEEP**
- Rankings page - **KEEP**
- Reports page - **KEEP**
- Settings pages - **KEEP**

---

# 5. SYSTEMS TO REMOVE

## CMS Automation Systems (CRITICAL)

### Files to Delete
1. `apps/web/lib/connectors/wordpress.connector.ts`
2. `apps/web/lib/connectors/shopify.connector.ts`
3. `apps/web/lib/connectors/custom.connector.ts`
4. `apps/web/lib/runtime/cms/cms-execution.ts`
5. `apps/web/lib/runtime/connectors/wordpress.connector.ts`
6. `apps/web/actions/cms.ts`
7. `apps/web/app/api/integrations/cms/route.ts`
8. `apps/web/app/api/integrations/cms/test-connection/route.ts`
9. `apps/web/app/api/integrations/callback/cms/route.ts`

### Database Columns to Remove
From `integrations` table:
- wp_site_url
- wp_username
- wp_app_password_encrypted
- shopify_store_url
- shopify_access_token_encrypted
- shopify_blog_id
- custom_api_url
- custom_api_key_encrypted
- wp_status
- shopify_status
- custom_status

### Database Constraints to Remove
- google_status_check
- wp_status_check
- shopify_status_check
- custom_status_check

## Deprecated Runtime Systems

### Tables to Drop
1. `agent_runs` (after migration)
2. `agent_states` (after migration)
3. `runtime_workflows` (deprecated)
4. `runtime_executions` (deprecated)
5. `runtime_tasks` (deprecated)
6. `runtime_thinking_logs` (deprecated)
7. `runtime_artifacts` (deprecated)
8. `seo_keywords` (deprecated)
9. `seo_clusters` (deprecated)
10. `seo_content_briefs` (deprecated)
11. `seo_drafts` (deprecated)
12. `seo_reports` (deprecated)

### Files to Delete
1. `supabase/RUNTIME_TABLES.sql` (deprecated file)

## Legacy API Routes

### Routes to Remove
1. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` (uses deprecated runtime)
2. `apps/web/app/api/v1/agent-update/route.ts` (uses deprecated runtime)
3. `apps/web/app/api/dashboard/agent-states/route.ts` (uses deprecated runtime)

## Agent Task Files to Modify

### Files to Modify
1. `apps/web/lib/agents/publish/publish-tasks.ts` - Remove WordPressPublishTask, ShopifyPublishTask, CustomAPIPublishTask

---

# 6. DATABASE MIGRATION PLAN

## Phase 1: Remove CMS Columns

### Migration Script
```sql
-- Remove CMS columns from integrations table
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS wp_site_url,
  DROP COLUMN IF EXISTS wp_username,
  DROP COLUMN IF EXISTS wp_app_password_encrypted,
  DROP COLUMN IF EXISTS shopify_store_url,
  DROP COLUMN IF EXISTS shopify_access_token_encrypted,
  DROP COLUMN IF EXISTS shopify_blog_id,
  DROP COLUMN IF EXISTS custom_api_url,
  DROP COLUMN IF EXISTS custom_api_key_encrypted,
  DROP COLUMN IF EXISTS wp_status,
  DROP COLUMN IF EXISTS shopify_status,
  DROP COLUMN IF EXISTS custom_status;

-- Remove CMS CHECK constraints
ALTER TABLE integrations 
  DROP CONSTRAINT IF EXISTS wp_status_check,
  DROP CONSTRAINT IF EXISTS shopify_status_check,
  DROP CONSTRAINT IF EXISTS custom_status_check;
```

## Phase 2: Create Command Centre Tables

### New Tables Required

#### command_centre_tasks
```sql
CREATE TABLE command_centre_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions JSONB NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'needs_review')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  sla_status TEXT CHECK (sla_status IN ('on_track', 'at_risk', 'breached')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_command_centre_tasks_tenant_id ON command_centre_tasks(tenant_id);
CREATE INDEX idx_command_centre_tasks_agent_name ON command_centre_tasks(agent_name);
CREATE INDEX idx_command_centre_tasks_status ON command_centre_tasks(status);
CREATE INDEX idx_command_centre_tasks_priority ON command_centre_tasks(priority);
CREATE INDEX idx_command_centre_tasks_assigned_to ON command_centre_tasks(assigned_to);
CREATE INDEX idx_command_centre_tasks_due_date ON command_centre_tasks(due_date);
CREATE INDEX idx_command_centre_tasks_tenant_status ON command_centre_tasks(tenant_id, status);
CREATE INDEX idx_command_centre_tasks_tenant_priority ON command_centre_tasks(tenant_id, priority);

-- RLS
ALTER TABLE command_centre_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant tasks"
  ON command_centre_tasks FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert tasks"
  ON command_centre_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tasks"
  ON command_centre_tasks FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Users can update assigned tasks"
  ON command_centre_tasks FOR UPDATE
  USING (assigned_to = auth.jwt() ->> 'sub');
```

#### command_centre_activity_log
```sql
CREATE TABLE command_centre_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_id UUID REFERENCES command_centre_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_command_centre_activity_log_tenant_id ON command_centre_activity_log(tenant_id);
CREATE INDEX idx_command_centre_activity_log_task_id ON command_centre_activity_log(task_id);
CREATE INDEX idx_command_centre_activity_log_user_id ON command_centre_activity_log(user_id);
CREATE INDEX idx_command_centre_activity_log_created_at ON command_centre_activity_log(created_at);

-- RLS
ALTER TABLE command_centre_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant activity"
  ON command_centre_activity_log FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert activity"
  ON command_centre_activity_log FOR INSERT
  WITH CHECK (true);
```

#### command_centre_sla_rules
```sql
CREATE TABLE command_centre_sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL,
  sla_hours DECIMAL(5,2) NOT NULL,
  warning_threshold_hours DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, task_type, priority)
);

-- Indexes
CREATE INDEX idx_command_centre_sla_rules_tenant_id ON command_centre_sla_rules(tenant_id);

-- RLS
ALTER TABLE command_centre_sla_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tenant SLA rules"
  ON command_centre_sla_rules FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert SLA rules"
  ON command_centre_sla_rules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update SLA rules"
  ON command_centre_sla_rules FOR UPDATE
  WITH CHECK (true);
```

## Phase 3: Migrate Tenant_ID Types

### Migration Script
```sql
-- Step 1: Add new UUID columns
ALTER TABLE locl_audits ADD COLUMN tenant_id_uuid UUID;
ALTER TABLE publish_jobs ADD COLUMN tenant_id_uuid UUID;
ALTER TABLE pulse_rankings ADD COLUMN tenant_id_uuid UUID;
ALTER TABLE integrations ADD COLUMN tenant_id_uuid UUID;
ALTER TABLE indexing_status ADD COLUMN tenant_id_uuid UUID;

-- Step 2: Migrate data from TEXT to UUID
UPDATE locl_audits SET tenant_id_uuid = tenant_id::UUID WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
UPDATE publish_jobs SET tenant_id_uuid = tenant_id::UUID WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
UPDATE pulse_rankings SET tenant_id_uuid = tenant_id::UUID WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
UPDATE integrations SET tenant_id_uuid = tenant_id::UUID WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
UPDATE indexing_status SET tenant_id_uuid = tenant_id::UUID WHERE tenant_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Drop old TEXT columns
ALTER TABLE locl_audits DROP COLUMN tenant_id;
ALTER TABLE publish_jobs DROP COLUMN tenant_id;
ALTER TABLE pulse_rankings DROP COLUMN tenant_id;
ALTER TABLE integrations DROP COLUMN tenant_id;
ALTER TABLE indexing_status DROP COLUMN tenant_id;

-- Step 4: Rename UUID columns
ALTER TABLE locl_audits RENAME COLUMN tenant_id_uuid TO tenant_id;
ALTER TABLE publish_jobs RENAME COLUMN tenant_id_uuid TO tenant_id;
ALTER TABLE pulse_rankings RENAME COLUMN tenant_id_uuid TO tenant_id;
ALTER TABLE integrations RENAME COLUMN tenant_id_uuid TO tenant_id;
ALTER TABLE indexing_status RENAME COLUMN tenant_id_uuid TO tenant_id;

-- Step 5: Add NOT NULL constraints
ALTER TABLE locl_audits ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE publish_jobs ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE pulse_rankings ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE integrations ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE indexing_status ALTER COLUMN tenant_id SET NOT NULL;

-- Step 6: Add FK constraints
ALTER TABLE locl_audits ADD CONSTRAINT fk_locl_audits_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE publish_jobs ADD CONSTRAINT fk_publish_jobs_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE pulse_rankings ADD CONSTRAINT fk_pulse_rankings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE integrations ADD CONSTRAINT fk_integrations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE indexing_status ADD CONSTRAINT fk_indexing_status_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Step 7: Update RLS policies to use UUID
-- (Will be done in Phase 4)
```

## Phase 4: Fix RLS Policies

### Update All RLS Policies to Use auth.jwt() ->> 'sub'

**Tables to Update:**
- locl_audits
- publish_jobs
- pulse_rankings
- integrations
- indexing_status

### Example Policy Update
```sql
-- Old policy (WRONG for Clerk)
CREATE POLICY "Users can view their own locl audits"
  ON locl_audits FOR SELECT
  USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- New policy (CORRECT for Clerk)
CREATE POLICY "Users can view their own locl audits"
  ON locl_audits FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));
```

## Phase 5: Migrate Deprecated Runtime

### Data Migration Script
```sql
-- Migrate agent_runs to agent_executions
INSERT INTO agent_executions (
  id,
  tenant_id,
  agent_name,
  workflow_type,
  status,
  started_at,
  completed_at,
  failed_at,
  retry_count,
  max_retries,
  execution_source,
  initiated_by,
  metadata,
  total_cost,
  total_tokens,
  inngest_run_id,
  error_message,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  tenant_id::UUID,
  agent_name,
  'legacy_migration',
  CASE 
    WHEN status = 'completed' THEN 'completed'
    WHEN status = 'failed' THEN 'failed'
    WHEN status = 'running' THEN 'cancelled'
    ELSE 'pending'
  END,
  started_at,
  completed_at,
  failed_at,
  retry_count,
  max_retries,
  'manual',
  initiated_by,
  metadata,
  0,
  0,
  NULL,
  error_message,
  created_at,
  updated_at
FROM agent_runs;

-- Migrate agent_states to agent_tasks
INSERT INTO agent_tasks (
  id,
  execution_id,
  task_name,
  task_type,
  status,
  started_at,
  completed_at,
  failed_at,
  retry_count,
  max_retries,
  input_payload,
  output_payload,
  error_payload,
  step_order,
  duration_ms,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM agent_executions WHERE agent_name = agent_states.agent_name ORDER BY created_at DESC LIMIT 1),
  'state_check',
  'state_validation',
  CASE 
    WHEN status = 'active' THEN 'completed'
    WHEN status = 'error' THEN 'failed'
    ELSE 'pending'
  END,
  updated_at,
  updated_at,
  NULL,
  0,
  3,
  '{}'::jsonb,
  state_data::jsonb,
  NULL::jsonb,
  1,
  0,
  created_at,
  updated_at
FROM agent_states;

-- Drop deprecated tables
DROP TABLE IF EXISTS agent_runs CASCADE;
DROP TABLE IF EXISTS agent_states CASCADE;
```

## Required Indexes for 1000 Client Scale

### Additional Indexes
```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_agent_executions_tenant_agent_status ON agent_executions(tenant_id, agent_name, status);
CREATE INDEX idx_agent_executions_tenant_created ON agent_executions(tenant_id, created_at DESC);
CREATE INDEX idx_agent_tasks_execution_status_step ON agent_tasks(execution_id, status, step_order);
CREATE INDEX idx_command_centre_tasks_tenant_priority_status ON command_centre_tasks(tenant_id, priority, status);
CREATE INDEX idx_command_centre_tasks_tenant_due_status ON command_centre_tasks(tenant_id, due_date, status);

-- Partial indexes for filtering
CREATE INDEX idx_agent_executions_active ON agent_executions(tenant_id, agent_name) WHERE status IN ('running', 'pending');
CREATE INDEX idx_command_centre_tasks_pending ON command_centre_tasks(tenant_id) WHERE status = 'pending';
CREATE INDEX idx_command_centre_tasks_overdue ON command_centre_tasks(tenant_id) WHERE due_date < NOW() AND status NOT IN ('completed', 'failed');
```

## Scaling Risks

### Database Bottlenecks
1. **RLS Policy Overhead** - Every query checks tenant_id via subquery
   - **Mitigation:** Use security definer functions, materialized views for common queries
   
2. **No Connection Pooling** - Default Supabase pooling may not handle 1000 concurrent clients
   - **Mitigation:** Enable Supabase connection pooler, configure transaction mode
   
3. **No Partitioning** - Single table for all tenant data
   - **Mitigation:** Consider partitioning by tenant_id for large tables (agent_executions, agent_tasks, command_centre_tasks)
   
4. **No Caching Strategy** - Every query hits database
   - **Mitigation:** Implement Redis caching for frequent queries (agent states, task counts)

### Query Risks
1. **N+1 Query Pattern** - Dashboard fetches data per agent
   - **Mitigation:** Use aggregate queries, materialized views
   
2. **Large JSONB Payloads** - agent_tasks.output_payload can be large
   - **Mitigation:** Store large payloads in separate table, use TOAST compression
   
3. **No Query Timeouts** - Long-running queries can block
   - **Mitigation:** Set statement_timeout, use read replicas for analytics

### Runtime Risks
1. **Vercel Function Timeout** - 10-60 second limits
   - **Mitigation:** Use background jobs for long-running tasks, implement streaming
   
2. **No Rate Limiting** - API can be overwhelmed
   - **Mitigation:** Implement per-tenant rate limiting, use Vercel Edge Config
   
3. **No Circuit Breakers** - External API failures can cascade
   - **Mitigation:** Implement circuit breakers for DataForSEO, OpenAI calls

### Multitenancy Validation

### Current Issues
1. **Type Inconsistency** - TEXT vs UUID tenant_id
   - **Status:** Will be fixed in Phase 3 migration
   
2. **RLS Policy Inconsistency** - auth.uid() vs auth.jwt() ->> 'sub'
   - **Status:** Will be fixed in Phase 4 migration
   
3. **No FK Constraints** - Cannot enforce referential integrity
   - **Status:** Will be fixed in Phase 3 migration

### Validation Required
1. **Tenant Isolation Tests** - Verify no cross-tenant data leakage
2. **RLS Policy Tests** - Verify policies work correctly
3. **FK Constraint Tests** - Verify referential integrity
4. **Performance Tests** - Verify queries perform at scale

---

# 7. COMMAND CENTRE ARCHITECTURE

## Task Lifecycle

### Task States
1. **pending** - Generated by agent, not yet assigned
2. **assigned** - Assigned to employee, not yet started
3. **in_progress** - Employee actively working on task
4. **completed** - Task finished successfully
5. **failed** - Task failed, needs retry or manual intervention
6. **needs_review** - Task completed, awaiting review

### Task Transitions
```
pending → assigned → in_progress → completed
                    ↓
                  failed → pending (retry)
                    ↓
                  needs_review → completed
```

## Task Categories

### By Agent
1. **ARIA Tasks**
   - Keyword research review
   - SERP analysis validation
   - Competitor gap analysis review
   - Keyword opportunity prioritization

2. **SCRIBE Tasks**
   - Content review and editing
   - Metadata validation
   - Schema insertion
   - Internal linking implementation
   - Featured image selection

3. **PUBLISH Tasks**
   - Publishing package assembly
   - Slug generation
   - CMS checklist validation
   - Indexing request

4. **PULSE Tasks**
   - Ranking report review
   - Ranking movement analysis
   - Keyword tracking adjustment

5. **LOCL Tasks**
   - GMB post publication
   - Citation submission
   - GMB optimization implementation
   - Local competitor analysis review

6. **REPUTE Tasks**
   - Review reply posting
   - Review sentiment analysis review
   - Reputation alert response

7. **LINX Tasks**
   - Outreach target review
   - Backlink strategy implementation
   - Outreach email sending
   - Domain recommendation review

8. **PRISM Tasks**
   - Analytics report review
   - Traffic forecast validation
   - Growth report generation

9. **CORE Tasks**
   - Technical fix implementation
   - Schema validation
   - CWV optimization
   - Crawl issue resolution

### By Type
1. **Publishing** - Content publishing tasks
2. **Technical** - Technical SEO fixes
3. **Outreach** - Backlink outreach
4. **Optimization** - On-page optimization
5. **Reporting** - Report generation/review
6. **Maintenance** - Regular maintenance tasks

## Task Priorities

### Priority Levels
1. **critical** - Immediate action required (SLA: 4 hours)
2. **high** - Urgent (SLA: 24 hours)
3. **medium** - Normal (SLA: 72 hours)
4. **low** - Backlog (SLA: 168 hours)

### Priority Scoring Logic
```typescript
function calculateTaskPriority(task: Task): Priority {
  let score = 0;
  
  // Base score from agent
  score += task.agentPriority;
  
  // Urgency based on due date
  if (task.dueDate && task.dueDate < now() + 24h) score += 30;
  if (task.dueDate && task.dueDate < now() + 4h) score += 50;
  
  // Impact on rankings
  if (task.impact === 'high') score += 20;
  if (task.impact === 'critical') score += 40;
  
  // Client tier
  if (task.clientTier === 'enterprise') score += 10;
  
  // Convert score to priority
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
```

## Employee Queues

### Queue Types
1. **Unassigned Queue** - All pending tasks not assigned
2. **My Queue** - Tasks assigned to current employee
3. **Team Queue** - Tasks assigned to employee's team
4. **Urgent Queue** - Critical and high priority tasks
5. **Overdue Queue** - Tasks past due date

### Queue Sorting
- Default: Priority (critical → high → medium → low), then due date
- Employee can sort by: priority, due date, estimated hours, agent, category

### Task Assignment Logic
```typescript
function assignTask(task: Task, employee: Employee): boolean {
  // Check employee capacity
  if (employee.activeTasks >= employee.maxTasks) return false;
  
  // Check employee skills match task requirements
  if (!hasRequiredSkills(employee, task.requiredSkills)) return false;
  
  // Assign task
  task.assignedTo = employee.id;
  task.status = 'assigned';
  task.assignedAt = now();
  
  // Log assignment
  logActivity(task.id, employee.id, 'assigned', { previousState: task.previousState });
  
  return true;
}
```

## SLA Logic

### SLA Calculation
```typescript
function calculateSLA(task: Task): SLAStatus {
  const slaRule = getSLARule(task.tenantId, task.type, task.priority);
  if (!slaRule) return 'on_track';
  
  const dueDate = task.createdAt + slaRule.slaHours;
  const warningDate = dueDate - slaRule.warningThresholdHours;
  
  if (now() > dueDate) return 'breached';
  if (now() > warningDate) return 'at_risk';
  return 'on_track';
}
```

### SLA Breach Handling
- Automatic escalation to team lead
- Notification to client (if configured)
- Task priority automatically increased
- SLA breach logged in activity log

## Client Visibility

### What Clients See
- Task count by status
- Task count by priority
- Overdue task count
- Recently completed tasks
- Upcoming tasks
- SLA compliance rate

### What Clients Don't See
- Internal task notes
- Employee assignments
- SLA breach details
- Internal activity log
- Task metadata

### Client Dashboard Updates
- Real-time task counts
- Task completion notifications
- SLA status indicators
- Task history export

## Activity Feed

### Activity Types
1. **task_created** - Task generated by agent
2. **task_assigned** - Task assigned to employee
3. **task_started** - Employee started task
4. **task_completed** - Task completed
5. **task_failed** - Task failed
6. **task_escalated** - Task escalated
7. **sla_breached** - SLA breached
8. **priority_changed** - Priority changed
9. **due_date_changed** - Due date changed
10. **note_added** - Note added to task

### Feed Filtering
- By tenant
- By task
- By employee
- By activity type
- By date range

## Execution Logs

### Log Levels
1. **debug** - Detailed execution information
2. **info** - General execution information
3. **warn** - Warning messages
4. **error** - Error messages
5. **fatal** - Critical errors

### Log Storage
- Stored in agent_logs table (canonical runtime)
- Linked to execution_id and task_id
- Retention: 90 days (configurable)

### Log Access
- Employees can view logs for tasks they're assigned
- Admins can view all logs
- Clients cannot view logs

## Audit Trails

### Audit Events
1. Task creation
2. Task assignment
3. Task status changes
4. Priority changes
5. Due date changes
6. Employee changes
7. SLA breaches
8. Data access

### Audit Storage
- Stored in command_centre_activity_log table
- Immutable (no updates, only inserts)
- Retention: 365 days (configurable)

### Audit Access
- Admins only
- Exportable for compliance
- Searchable by tenant, user, date range

---

# 8. CLIENT DASHBOARD MIGRATION

## What Must Change

### Real-Time Updates
- Task counts must be real-time (currently mocked)
- Agent status must be real-time (currently mocked)
- Rankings must be real-time (currently mocked)
- Activity feed must be real-time (currently empty)

### Data Sources
- **Current:** Hardcoded arrays, mocked data
- **New:** Real-time queries to Supabase via API routes

### API Routes Required
1. `/api/dashboard/task-summary` - Task count by status
2. `/api/dashboard/agent-status` - Agent execution status
3. `/api/dashboard/rankings-summary` - Ranking summary
4. `/api/dashboard/activity-feed` - Recent activity
5. `/api/dashboard/sla-status` - SLA compliance

## What Becomes Real-Time

### Mission Control Dashboard
- Agent status cards (currently mocked)
- Task feed (currently empty)
- Ranking movements (currently mocked)
- Statistics (currently mocked)

### Agents Page
- Agent execution history (currently mocked)
- Agent performance charts (currently mocked)
- Thinking logs (currently mocked)
- Task history (currently mocked)

### Tasks Page
- Task list (currently empty)
- Task statistics (currently mocked)
- Task export (currently functional but empty)

### Rankings Page
- Ranking data (currently mocked)
- Ranking movements (currently mocked)
- Ranking history (currently mocked)

### Reports Page
- Report generation (currently functional)
- Report data (currently functional)

## What Remains Mocked

### Until Agents Generate Tasks
- Task assignment
- Task prioritization
- SLA tracking
- Employee queues

### Until Command Centre Built
- Task execution
- Task completion
- Activity feed
- Audit trails

## Feeds from Command Centre

### Data Flow
```
Agent Execution → Task Generation → Command Centre → Client Dashboard
```

### Real-Time Updates
- Use Supabase real-time subscriptions
- Update dashboard on task changes
- Update dashboard on agent executions
- Update dashboard on ranking updates

### Caching Strategy
- Cache task counts (5-minute TTL)
- Cache agent status (1-minute TTL)
- Cache rankings (15-minute TTL)
- No caching for activity feed

---

# 9. AGENT-BY-AGENT REBUILD PLAN

## ARIA - Keyword Intelligence

### Current State
- **Status:** IMPLEMENTED
- **Files:** aria.service.ts, aria-tasks.ts
- **Connector:** DataForSEO
- **Outputs:** Keyword data, SERP analysis
- **Task Generation:** NONE

### Missing Systems
1. Task generation logic
2. Task templates for keyword research review
3. Task templates for SERP analysis validation
4. Task templates for competitor gap analysis
5. Integration with Command Centre

### DB Requirements
- aria_keywords table (exists, check schema)
- aria_serp_analysis table (may need to create)
- FK to command_centre_tasks

### APIs Needed
- DataForSEO (already integrated)
- SerpAPI (mentioned but not integrated)

### Outputs
- **Current:** Raw keyword data, SERP data
- **New:** Raw data + tasks for human review

### Task Generation Logic
```typescript
function generateARIATasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate keyword review task
  tasks.push({
    agentName: 'ARIA',
    taskType: 'keyword_review',
    taskCategory: 'research',
    title: 'Review keyword opportunities',
    description: 'Review discovered keyword opportunities and prioritize for content creation',
    instructions: {
      keywords: execution.output.keywords,
      criteria: ['search_volume', 'difficulty', 'opportunity_score'],
      action: 'select_top_10_keywords'
    },
    priority: calculatePriority(execution.output.keywords),
    estimatedHours: 1
  });
  
  // Generate SERP analysis task
  tasks.push({
    agentName: 'ARIA',
    taskType: 'serp_validation',
    taskCategory: 'analysis',
    title: 'Validate SERP analysis',
    description: 'Review SERP analysis results and identify content gaps',
    instructions: {
      serpData: execution.output.serpData,
      action: 'identify_content_gaps'
    },
    priority: 'medium',
    estimatedHours: 0.5
  });
  
  return tasks;
}
```

## SCRIBE - Semantic Content Engine

### Current State
- **Status:** IMPLEMENTED
- **Files:** scribe.service.ts, scribe-tasks.ts
- **Connector:** OpenAI
- **Outputs:** Generated content, metadata
- **Task Generation:** NONE

### Missing Systems
1. Task generation logic
2. Task templates for content review
3. Task templates for metadata validation
4. Task templates for schema insertion
5. Integration with Command Centre

### DB Requirements
- scribe_content table (exists, check schema)
- scribe_drafts table (exists, check schema)
- FK to command_centre_tasks

### APIs Needed
- OpenAI (already integrated)

### Outputs
- **Current:** Generated articles, metadata
- **New:** Generated content + tasks for review, publishing

### Task Generation Logic
```typescript
function generateSCRIBETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate content review task
  tasks.push({
    agentName: 'SCRIBE',
    taskType: 'content_review',
    taskCategory: 'publishing',
    title: 'Review generated content',
    description: 'Review generated article for accuracy, tone, and SEO optimization',
    instructions: {
      content: execution.output.content,
      metadata: execution.output.metadata,
      checklist: ['accuracy', 'tone', 'seo', 'readability']
    },
    priority: 'high',
    estimatedHours: 2
  });
  
  // Generate schema insertion task
  tasks.push({
    agentName: 'SCRIBE',
    taskType: 'schema_insertion',
    taskCategory: 'technical',
    title: 'Insert schema markup',
    description: 'Insert generated schema markup into the published content',
    instructions: {
      schema: execution.output.schema,
      url: execution.output.targetUrl
    },
    priority: 'medium',
    estimatedHours: 0.5
  });
  
  return tasks;
}
```

## PUBLISH - Publishing Package Generator

### Current State
- **Status:** IMPLEMENTED WITH CMS AUTOMATION (CONFLICT)
- **Files:** publish.service.ts, publish-tasks.ts
- **Connectors:** WordPress, Shopify, Custom API (CONFLICT)
- **Outputs:** Published content (CONFLICT)
- **Task Generation:** NONE

### Missing Systems
1. Remove CMS automation tasks
2. Task generation logic for publishing packages
3. Task templates for publishing package assembly
4. Task templates for CMS checklist validation
5. Integration with Command Centre

### DB Requirements
- publish_jobs table (exists, repurpose for package tracking)
- FK to command_centre_tasks

### APIs Needed
- NONE (no CMS APIs per V1 model)

### Outputs
- **Current:** Published content via CMS (CONFLICT)
- **New:** Publishing packages + tasks for human publishing

### Required Changes
1. Remove WordPressPublishTask
2. Remove ShopifyPublishTask
3. Remove CustomAPIPublishTask
4. Create PublishingPackageTask (generates package only)
5. Create CMSChecklistTask (generates checklist)

### Task Generation Logic
```typescript
function generatePUBLISHTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate publishing package task
  tasks.push({
    agentName: 'PUBLISH',
    taskType: 'publishing_package',
    taskCategory: 'publishing',
    title: 'Assemble publishing package',
    description: 'Assemble publishing package with content, metadata, schema, and instructions',
    instructions: {
      content: execution.output.content,
      metadata: execution.output.metadata,
      schema: execution.output.schema,
      internalLinks: execution.output.internalLinks,
      featuredImagePrompt: execution.output.featuredImagePrompt
    },
    priority: 'high',
    estimatedHours: 0.5
  });
  
  // Generate CMS checklist task
  tasks.push({
    agentName: 'PUBLISH',
    taskType: 'cms_checklist',
    taskCategory: 'publishing',
    title: 'Complete CMS publishing checklist',
    description: 'Follow CMS checklist to publish content manually',
    instructions: {
      checklist: [
        'log_into_cms',
        'create_new_post',
        'paste_content',
        'add_metadata',
        'insert_schema',
        'set_featured_image',
        'add_internal_links',
        'schedule_publish',
        'request_indexing'
      ]
    },
    priority: 'high',
    estimatedHours: 1
  });
  
  return tasks;
}
```

## PULSE - Ranking & Visibility Tracking

### Current State
- **Status:** PARTIALLY IMPLEMENTED
- **Files:** pulse.service.ts only
- **Connector:** DataForSEO/SerpAPI
- **Outputs:** Ranking data
- **Task Generation:** NONE

### Missing Systems
1. Task implementation
2. Task generation logic
3. Task templates for ranking review
4. Task templates for ranking movement analysis
5. Integration with Command Centre

### DB Requirements
- pulse_rankings table (exists, check schema)
- FK to command_centre_tasks

### APIs Needed
- DataForSEO (already integrated)
- SerpAPI (mentioned but not integrated)

### Outputs
- **Current:** Ranking data
- **New:** Ranking data + tasks for review

### Task Generation Logic
```typescript
function generatePULSETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate ranking review task
  tasks.push({
    agentName: 'PULSE',
    taskType: 'ranking_review',
    taskCategory: 'reporting',
    title: 'Review ranking changes',
    description: 'Review ranking movements and identify significant changes',
    instructions: {
      rankings: execution.output.rankings,
      movements: execution.output.movements,
      threshold: 5 // Alert on movements > 5 positions
    },
    priority: calculatePriority(execution.output.movements),
    estimatedHours: 0.5
  });
  
  return tasks;
}
```

## LOCL - Local SEO & GMB Intelligence

### Current State
- **Status:** INCOMPLETE
- **Files:** locl.service.ts only
- **Connector:** Google Business Profile (exists)
- **Outputs:** GMB audit data
- **Task Generation:** NONE

### Missing Systems
1. Task implementation
2. Task generation logic
3. Task templates for GMB post publication
4. Task templates for citation submission
5. Task templates for GMB optimization
6. Integration with Command Centre

### DB Requirements
- locl_audits table (exists, check schema)
- FK to command_centre_tasks

### APIs Needed
- Google Business Profile (already integrated)

### Outputs
- **Current:** GMB audit data
- **New:** GMB audit data + tasks for optimization

### Task Generation Logic
```typescript
function generateLOCLTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate GMB post task
  if (execution.output.recommendations.includes('post_gmb_update')) {
    tasks.push({
      agentName: 'LOCL',
      taskType: 'gmb_post',
      taskCategory: 'local',
      title: 'Publish GMB post',
      description: 'Publish generated GMB post to Google Business Profile',
      instructions: {
        postContent: execution.output.generatedPost,
        postType: 'update',
        callToAction: execution.output.callToAction
      },
      priority: 'medium',
      estimatedHours: 0.5
    });
  }
  
  // Generate citation submission task
  if (execution.output.missingCitations.length > 0) {
    tasks.push({
      agentName: 'LOCL',
      taskType: 'citation_submission',
      taskCategory: 'local',
      title: 'Submit to citation sites',
      description: 'Submit business information to missing citation sites',
      instructions: {
        citations: execution.output.missingCitations,
        businessInfo: execution.output.businessInfo
      },
      priority: 'medium',
      estimatedHours: execution.output.missingCitations.length * 0.5
    });
  }
  
  return tasks;
}
```

## REPUTE - Review Intelligence

### Current State
- **Status:** INCOMPLETE
- **Files:** thinking.ts only
- **Connector:** Google Business Profile (exists)
- **Outputs:** None
- **Task Generation:** NONE

### Missing Systems
1. Service implementation
2. Task implementation
3. Task generation logic
4. Task templates for review reply
5. Task templates for sentiment analysis
6. Integration with Command Centre

### DB Requirements
- repute_reviews table (may need to create)
- FK to command_centre_tasks

### APIs Needed
- Google Business Profile (already integrated)

### Outputs
- **Current:** None
- **New:** Review data + tasks for reply posting

### Task Generation Logic
```typescript
function generateREPUTETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate review reply tasks
  for (const review of execution.output.newReviews) {
    if (review.needsReply) {
      tasks.push({
        agentName: 'REPUTE',
        taskType: 'review_reply',
        taskCategory: 'reputation',
        title: `Reply to review: ${review.rating} stars`,
        description: 'Post suggested reply to Google review',
        instructions: {
          reviewId: review.id,
          reviewText: review.text,
          suggestedReply: review.suggestedReply,
          tone: review.sentiment === 'negative' ? 'empathetic' : 'professional'
        },
        priority: review.sentiment === 'negative' ? 'high' : 'medium',
        estimatedHours: 0.25
      });
    }
  }
  
  return tasks;
}
```

## LINX - Backlink Intelligence

### Current State
- **Status:** NOT IMPLEMENTED
- **Files:** EMPTY DIRECTORY
- **Connector:** DataForSEO (exists)
- **Outputs:** None
- **Task Generation:** NONE

### Missing Systems
1. Service implementation
2. Task implementation
3. Task generation logic
4. Task templates for outreach
5. Task templates for backlink strategy
6. Integration with Command Centre

### DB Requirements
- linx_backlinks table (may need to create)
- FK to command_centre_tasks

### APIs Needed
- DataForSEO (already integrated)

### Outputs
- **Current:** None
- **New:** Backlink data + tasks for outreach

### Task Generation Logic
```typescript
function generateLINXTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate outreach tasks
  for (const opportunity of execution.output.outreachTargets) {
    tasks.push({
      agentName: 'LINX',
      taskType: 'outreach',
      taskCategory: 'outreach',
      title: `Outreach to ${opportunity.domain}`,
      description: 'Send outreach email for backlink opportunity',
      instructions: {
        domain: opportunity.domain,
        contactEmail: opportunity.contactEmail,
        emailTemplate: execution.output.emailTemplate,
        valueProposition: opportunity.valueProposition
      },
      priority: calculatePriority(opportunity),
      estimatedHours: 0.5
    });
  }
  
  return tasks;
}
```

## PRISM - Analytics & Forecasting

### Current State
- **Status:** NOT IMPLEMENTED
- **Files:** EMPTY DIRECTORY
- **Connector:** Google Analytics (exists)
- **Outputs:** None
- **Task Generation:** NONE

### Missing Systems
1. Service implementation
2. Task implementation
3. Task generation logic
4. Task templates for report review
5. Task templates for forecast validation
6. Integration with Command Centre

### DB Requirements
- prism_reports table (may need to create)
- FK to command_centre_tasks

### APIs Needed
- Google Analytics (already integrated)

### Outputs
- **Current:** None
- **New:** Analytics data + tasks for report review

### Task Generation Logic
```typescript
function generatePRISMTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate report review task
  tasks.push({
    agentName: 'PRISM',
    taskType: 'report_review',
    taskCategory: 'reporting',
    title: 'Review analytics report',
    description: 'Review analytics report and identify insights',
    instructions: {
      report: execution.output.report,
      keyMetrics: execution.output.keyMetrics,
      actionItems: execution.output.actionItems
    },
    priority: 'medium',
    estimatedHours: 1
  });
  
  return tasks;
}
```

## CORE - Technical SEO Intelligence

### Current State
- **Status:** NOT IMPLEMENTED
- **Files:** EMPTY DIRECTORY
- **Connector:** None (Screaming Frog, PageSpeed Insights missing)
- **Outputs:** None
- **Task Generation:** NONE

### Missing Systems
1. Service implementation
2. Task implementation
3. Task generation logic
4. Task templates for technical fixes
5. Task templates for schema validation
6. Task templates for CWV optimization
7. Integration with Command Centre
8. Screaming Frog connector
9. PageSpeed Insights connector

### DB Requirements
- core_issues table (may need to create)
- FK to command_centre_tasks

### APIs Needed
- Screaming Frog (NOT IMPLEMENTED)
- PageSpeed Insights (NOT IMPLEMENTED)

### Outputs
- **Current:** None
- **New:** Technical issue data + tasks for fixes

### Task Generation Logic
```typescript
function generateCORETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks: CommandCentreTask[] = [];
  
  // Generate technical fix tasks
  for (const issue of execution.output.issues) {
    tasks.push({
      agentName: 'CORE',
      taskType: 'technical_fix',
      taskCategory: 'technical',
      title: `Fix: ${issue.title}`,
      description: 'Implement technical SEO fix',
      instructions: {
        issue: issue,
        fixInstructions: issue.fixInstructions,
        priority: issue.severity
      },
      priority: issue.severity,
      estimatedHours: issue.estimatedHours
    });
  }
  
  return tasks;
}
```

---

# 10. SCALE AUDIT FOR 1000 CLIENTS

## Database Bottlenecks

### 1. RLS Policy Overhead
**Issue:** Every query checks tenant_id via subquery, adding overhead.

**Current Pattern:**
```sql
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'))
```

**Impact:** At 1000 clients with 10 concurrent queries each = 10,000 subqueries/sec.

**Mitigation:**
- Use security definer functions with cached tenant_id
- Implement connection-level tenant context
- Use materialized views for common queries
- Consider row-level security bypass for system operations

### 2. No Connection Pooling
**Issue:** Default Supabase connection pool may not handle 1000 concurrent clients.

**Current Config:**
```toml
[db.pooler]
enabled = false
```

**Impact:** Connection exhaustion under load.

**Mitigation:**
- Enable Supabase connection pooler
- Configure transaction mode (not session mode)
- Set appropriate pool size (20-50 connections)
- Implement connection timeout

### 3. No Partitioning
**Issue:** Single table for all tenant data, queries scan entire table.

**Current State:** All tables are unpartitioned.

**Impact:** Query performance degrades as data grows.

**Mitigation:**
- Partition large tables by tenant_id (agent_executions, agent_tasks, command_centre_tasks)
- Use PostgreSQL declarative partitioning
- Implement partition pruning
- Consider time-based partitioning for time-series data (agent_events, agent_logs)

### 4. No Caching Strategy
**Issue:** Every query hits database, no caching layer.

**Current State:** No caching implemented.

**Impact:** High database load, slow response times.

**Mitigation:**
- Implement Redis caching for frequent queries
- Cache task counts (5-minute TTL)
- Cache agent status (1-minute TTL)
- Cache rankings (15-minute TTL)
- Use Supabase Edge Functions for caching

### 5. Large JSONB Payloads
**Issue:** agent_tasks.output_payload can be large, stored in TOAST.

**Current State:** Large payloads stored in main table.

**Impact:** Slow queries, bloated tables.

**Mitigation:**
- Store large payloads in separate table (task_payloads)
- Use TOAST compression
- Implement payload compression
- Consider external storage (S3) for very large payloads

## Query Risks

### 1. N+1 Query Pattern
**Issue:** Dashboard fetches data per agent, causing N+1 queries.

**Current Pattern:**
```typescript
for (const agent of agents) {
  const data = await fetchAgentData(agent.id); // N queries
}
```

**Impact:** At 9 agents = 9 queries per dashboard load.

**Mitigation:**
- Use aggregate queries
- Use materialized views
- Implement batch fetching
- Use GraphQL for efficient data fetching

### 2. No Query Timeouts
**Issue:** Long-running queries can block and exhaust connections.

**Current State:** No query timeout configured.

**Impact:** Database lockup under load.

**Mitigation:**
- Set statement_timeout (e.g., 30 seconds)
- Implement query timeouts in application
- Use read replicas for long-running analytics queries
- Implement query cancellation

### 3. Inefficient Indexes
**Issue:** Missing composite indexes for common query patterns.

**Current State:** Only single-column indexes.

**Impact:** Slow queries for common patterns.

**Mitigation:**
- Add composite indexes for (tenant_id, status), (tenant_id, priority), etc.
- Add partial indexes for filtering (WHERE status = 'pending')
- Add covering indexes for frequent queries
- Regularly analyze and optimize indexes

## Runtime Risks

### 1. Vercel Function Timeout
**Issue:** Vercel functions have 10-60 second timeouts.

**Current State:** Some agent executions may exceed timeout.

**Impact:** Failed executions, incomplete data.

**Mitigation:**
- Use background jobs for long-running tasks
- Implement streaming responses
- Use Vercel Cron for scheduled tasks
- Implement execution timeout handling

### 2. No Rate Limiting
**Issue:** API can be overwhelmed by requests.

**Current State:** No rate limiting implemented.

**Impact:** API exhaustion, cost overruns.

**Mitigation:**
- Implement per-tenant rate limiting
- Use Vercel Edge Config for rate limits
- Implement API key throttling
- Use queue for burst traffic

### 3. No Circuit Breakers
**Issue:** External API failures can cascade through system.

**Current State:** No circuit breakers for DataForSEO, OpenAI.

**Impact:** System-wide failures when external APIs fail.

**Mitigation:**
- Implement circuit breakers for external APIs
- Implement retry with exponential backoff
- Implement fallback mechanisms
- Monitor external API health

### 4. No Request Queuing
**Issue:** Concurrent requests can overwhelm system.

**Current State:** No request queue implemented.

**Impact:** System overload under burst traffic.

**Mitigation:**
- Implement request queue (e.g., BullMQ)
- Use queue for agent execution requests
- Implement queue priority
- Monitor queue depth

## Vercel Limitations

### 1. Function Execution Time
**Limit:** 10 seconds for Hobby, 60 seconds for Pro

**Impact:** Long-running agent executions will fail.

**Mitigation:**
- Use background jobs
- Implement streaming
- Use Vercel Cron for scheduled tasks

### 2. Concurrent Executions
**Limit:** 1000 concurrent executions for Pro

**Impact:** At 1000 clients, may hit limit during peak.

**Mitigation:**
- Implement request queuing
- Use load balancing
- Monitor concurrent executions

### 3. Bandwidth
**Limit:** 1TB bandwidth for Pro

**Impact:** High bandwidth usage for large payloads.

**Mitigation:**
- Implement payload compression
- Use CDN for static assets
- Optimize image sizes

### 4. Edge Function Size
**Limit:** 50MB for Edge Functions

**Impact:** Large dependencies may exceed limit.

**Mitigation:**
- Minimize dependencies
- Use serverless functions for heavy lifting
- Implement code splitting

## Caching Needs

### 1. Application-Level Caching
**Required:**
- Task counts (5-minute TTL)
- Agent status (1-minute TTL)
- Rankings (15-minute TTL)
- User sessions (24-hour TTL)

**Implementation:**
- Redis (via Upstash or Redis Cloud)
- Supabase Edge Functions
- Vercel Edge Config

### 2. Database-Level Caching
**Required:**
- Query result caching
- Materialized views
- Prepared statements

**Implementation:**
- PostgreSQL query cache
- Materialized views for common queries
- Connection pooling

### 3. CDN Caching
**Required:**
- Static assets
- API responses (where appropriate)
- Images

**Implementation:**
- Vercel CDN
- Image optimization
- Cache headers

## Indexing Strategy

### Required Indexes

**Performance Critical:**
```sql
-- Agent executions
CREATE INDEX idx_agent_executions_tenant_agent_status ON agent_executions(tenant_id, agent_name, status);
CREATE INDEX idx_agent_executions_tenant_created ON agent_executions(tenant_id, created_at DESC);

-- Agent tasks
CREATE INDEX idx_agent_tasks_execution_status_step ON agent_tasks(execution_id, status, step_order);

-- Command centre tasks
CREATE INDEX idx_command_centre_tasks_tenant_priority_status ON command_centre_tasks(tenant_id, priority, status);
CREATE INDEX idx_command_centre_tasks_tenant_due_status ON command_centre_tasks(tenant_id, due_date, status);

-- Partial indexes for filtering
CREATE INDEX idx_agent_executions_active ON agent_executions(tenant_id, agent_name) WHERE status IN ('running', 'pending');
CREATE INDEX idx_command_centre_tasks_pending ON command_centre_tasks(tenant_id) WHERE status = 'pending';
CREATE INDEX idx_command_centre_tasks_overdue ON command_centre_tasks(tenant_id) WHERE due_date < NOW() AND status NOT IN ('completed', 'failed');
```

---

# 11. SECURITY AUDIT

## Current Security Posture

### Authentication
- **Provider:** Clerk
- **Status:** IMPLEMENTED
- **Risk:** LOW - Clerk is secure, properly integrated

### Authorization
- **Provider:** Supabase RLS
- **Status:** PARTIALLY IMPLEMENTED
- **Risk:** HIGH - RLS policies use wrong auth method (auth.uid() vs auth.jwt() ->> 'sub')

### Data Encryption
- **At Rest:** Supabase (PostgreSQL encryption)
- **In Transit:** TLS/SSL
- **Status:** IMPLEMENTED
- **Risk:** LOW - Default Supabase encryption

### API Security
- **Rate Limiting:** NOT IMPLEMENTED
- **API Key Management:** NOT IMPLEMENTED
- **Request Validation:** PARTIALLY IMPLEMENTED
- **Risk:** HIGH - No rate limiting, vulnerable to abuse

### Credential Storage
- **Encryption:** PARTIALLY IMPLEMENTED
- **Key Management:** NOT IMPLEMENTED
- **Risk:** MEDIUM - Some credentials encrypted, no key rotation

## Security Risks

### 1. RLS Policy Vulnerability
**Issue:** RLS policies use auth.uid() which is incorrect for Clerk.

**Current Pattern:**
```sql
USING (tenant_id::text IN (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
```

**Risk:** HIGH - Authorization bypass possible.

**Mitigation:**
- Update all RLS policies to use auth.jwt() ->> 'sub'
- Test thoroughly after migration
- Implement regular RLS policy audits

### 2. No Rate Limiting
**Issue:** API has no rate limiting, vulnerable to abuse.

**Risk:** HIGH - API exhaustion, cost overruns, DoS attacks.

**Mitigation:**
- Implement per-tenant rate limiting
- Use Vercel Edge Config for distributed rate limiting
- Implement API key throttling
- Monitor for abuse patterns

### 3. No Input Validation
**Issue:** API routes lack comprehensive input validation.

**Risk:** MEDIUM - Injection attacks, data corruption.

**Mitigation:**
- Implement Zod validation for all API inputs
- Sanitize all user inputs
- Implement request size limits
- Use parameterized queries

### 4. Credential Exposure Risk
**Issue:** CMS credentials stored in integrations table (even though CMS automation being removed).

**Risk:** MEDIUM - Credentials could be exposed if database compromised.

**Mitigation:**
- Use Supabase Vault for credential storage
- Implement encryption at rest
- Implement key rotation
- Audit credential access

### 5. No Audit Logging
**Issue:** No comprehensive audit logging for sensitive operations.

**Risk:** MEDIUM - Cannot detect unauthorized access.

**Mitigation:**
- Implement audit logging for all sensitive operations
- Log all data access
- Log all credential access
- Implement log retention and rotation

### 6. No API Key Management
**Issue:** External API keys stored in environment variables, no rotation.

**Risk:** MEDIUM - Key compromise affects all tenants.

**Mitigation:**
- Implement per-tenant API keys where possible
- Implement key rotation
- Use secret management service (e.g., Supabase Vault)
- Monitor API key usage

## Security Recommendations

### Immediate (Phase 1)
1. Fix RLS policies to use auth.jwt() ->> 'sub'
2. Implement rate limiting for all API routes
3. Remove CMS credentials from database
4. Implement input validation for all API routes

### Short Term (Phase 2-4)
1. Implement comprehensive audit logging
2. Implement credential encryption with Supabase Vault
3. Implement API key rotation
4. Implement security monitoring and alerting

### Long Term (Phase 5-8)
1. Implement per-tenant API keys
2. Implement security incident response plan
3. Implement regular security audits
4. Implement penetration testing

---

# 12. DEAD CODE IDENTIFICATION

## Deprecated Runtime System

### Files to Delete
1. `supabase/RUNTIME_TABLES.sql` - Deprecated runtime definitions
2. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` - Uses deprecated runtime
3. `apps/web/app/api/v1/agent-update/route.ts` - Uses deprecated runtime
4. `apps/web/app/api/dashboard/agent-states/route.ts` - Uses deprecated runtime

### Tables to Drop (After Migration)
1. `agent_runs` - Deprecated execution tracking
2. `agent_states` - Deprecated state tracking
3. `runtime_workflows` - Deprecated workflow definitions
4. `runtime_executions` - Deprecated execution records
5. `runtime_tasks` - Deprecated task records
6. `runtime_thinking_logs` - Deprecated thinking logs
7. `runtime_artifacts` - Deprecated artifacts
8. `seo_keywords` - Deprecated keyword storage
9. `seo_clusters` - Deprecated cluster storage
10. `seo_content_briefs` - Deprecated content briefs
11. `seo_drafts` - Deprecated content drafts
12. `seo_reports` - Deprecated reports

## CMS Automation System

### Files to Delete
1. `apps/web/lib/connectors/wordpress.connector.ts` - WordPress automation
2. `apps/web/lib/connectors/shopify.connector.ts` - Shopify automation
3. `apps/web/lib/connectors/custom.connector.ts` - Custom API automation
4. `apps/web/lib/runtime/cms/cms-execution.ts` - CMS execution
5. `apps/web/lib/runtime/connectors/wordpress.connector.ts` - WordPress connector
6. `apps/web/actions/cms.ts` - CMS actions
7. `apps/web/app/api/integrations/cms/route.ts` - CMS API
8. `apps/web/app/api/integrations/cms/test-connection/route.ts` - CMS test
9. `apps/web/app/api/integrations/callback/cms/route.ts` - CMS callback

### Database Columns to Remove
From `integrations` table:
- wp_site_url
- wp_username
- wp_app_password_encrypted
- shopify_store_url
- shopify_access_token_encrypted
- shopify_blog_id
- custom_api_url
- custom_api_key_encrypted
- wp_status
- shopify_status
- custom_status

## Unused Runtime Modules

### Files to Review for Deletion
1. `apps/web/lib/runtime/temporal/` - Entire temporal module (overengineered, not needed for V1)
2. `apps/web/lib/runtime/scenarios/` - Scenario testing module (not needed for production)
3. `apps/web/lib/runtime/verification/` - Verification module (overengineered)
4. `apps/web/lib/runtime/fixtures/` - Fixture module (not needed for production)
5. `apps/web/lib/runtime/deployment/` - Deployment guard (may be useful, review)

### Recommendation
- Delete temporal module (overengineered for V1 model)
- Delete scenarios module (testing only)
- Delete verification module (overengineered)
- Delete fixtures module (testing only)
- Keep deployment guard (useful for production)

## Unused Connectors

### Files to Review
1. `apps/web/lib/runtime/connectors/google-analytics.connector.ts` - Used by PRISM (not implemented yet)
2. `apps/web/lib/runtime/connectors/google-search-console.connector.ts` - Used for indexing (keep)

### Recommendation
- Keep all connectors (needed for agent implementations)

## Legacy API Routes

### Files to Delete
1. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts` - Deprecated
2. `apps/web/app/api/v1/agent-update/route.ts` - Deprecated
3. `apps/web/app/api/dashboard/agent-states/route.ts` - Deprecated

## Migration Files

### Files to Review
1. `supabase/migrations/` - Review all migrations, delete incorrect ones
2. `supabase/archived_migrations/` - Archive old migrations

### Recommendation
- Keep migrations directory
- Archive old migrations to archived_migrations
- Delete incorrect migrations after validation

---

# 13. PHASED BUILD EXECUTION PLAN

## Phase 1: Remove CMS Automation & Dead Systems (2-3 days)

### Tasks
1. Delete CMS connector files (wordpress, shopify, custom)
2. Delete CMS execution system
3. Remove CMS columns from integrations table
4. Remove CMS CHECK constraints
5. Delete deprecated runtime files
6. Delete legacy API routes
7. Delete unused runtime modules (temporal, scenarios, verification, fixtures)
8. Update PUBLISH agent to remove CMS automation tasks
9. Test that system still functions without CMS automation

### Deliverables
- Clean codebase without CMS automation
- Database without CMS columns
- Updated PUBLISH agent (package generation only)
- Test report confirming no CMS automation remains

### Dependencies
- None (can start immediately)

---

## Phase 2: Database Migration & Consistency (3-4 days)

### Tasks
1. Create Command Centre tables (command_centre_tasks, command_centre_activity_log, command_centre_sla_rules)
2. Migrate tenant_id from TEXT to UUID for all tables
3. Add FK constraints for all tenant_id columns
4. Update all RLS policies to use auth.jwt() ->> 'sub'
5. Create required indexes for 1000 client scale
6. Migrate data from deprecated runtime to canonical runtime
7. Drop deprecated runtime tables
8. Test multitenancy isolation
9. Test RLS policies
10. Test FK constraints

### Deliverables
- Consistent UUID tenant_id across all tables
- Command Centre tables created
- RLS policies fixed
- Indexes created
- Migration report
- Test report confirming data integrity

### Dependencies
- Phase 1 (CMS removal must be complete)

---

## Phase 3: Command Centre Core (5-7 days)

### Tasks
1. Create Command Centre API routes
2. Implement task queue management system
3. Implement task prioritization logic
4. Implement SLA calculation logic
5. Implement task assignment logic
6. Create employee dashboard UI
7. Implement activity feed
8. Implement execution logs
9. Implement audit trails
10. Test Command Centre functionality

### Deliverables
- Command Centre API routes
- Task queue management system
- Employee dashboard UI
- Activity feed
- Execution logs
- Audit trails
- Test report confirming Command Centre functionality

### Dependencies
- Phase 2 (database must be migrated)

---

## Phase 4: Agent Task Generation Logic (4-5 days)

### Tasks
1. Implement task generation logic for ARIA
2. Implement task generation logic for SCRIBE
3. Implement task generation logic for PUBLISH
4. Implement task generation logic for PULSE
5. Implement task generation logic for LOCL
6. Implement task templates for each agent
7. Implement priority scoring logic
8. Integrate agents with Command Centre
9. Test task generation
10. Test task assignment

### Deliverables
- Task generation logic for all implemented agents
- Task templates
- Priority scoring logic
- Integration with Command Centre
- Test report confirming task generation

### Dependencies
- Phase 3 (Command Centre must be built)

---

## Phase 5: Missing Agent Implementations (6-8 days)

### Tasks
1. Implement LINX agent (service + tasks)
2. Implement PRISM agent (service + tasks)
3. Implement CORE agent (service + tasks)
4. Implement LOCL agent tasks
5. Implement REPUTE agent (service + tasks)
6. Create Screaming Frog connector for CORE
7. Create PageSpeed Insights connector for CORE
8. Implement task generation for LINX
9. Implement task generation for PRISM
10. Implement task generation for CORE
11. Implement task generation for LOCL
12. Implement task generation for REPUTE
13. Test all agents
14. Test task generation for all agents

### Deliverables
- LINX agent implementation
- PRISM agent implementation
- CORE agent implementation
- LOCL agent tasks
- REPUTE agent implementation
- Screaming Frog connector
- PageSpeed Insights connector
- Task generation for all agents
- Test report confirming all agents work

### Dependencies
- Phase 4 (task generation logic must be implemented)

---

## Phase 6: Client Dashboard Migration (3-4 days)

### Tasks
1. Create API routes for dashboard data
2. Implement real-time task counts
3. Implement real-time agent status
4. Implement real-time rankings
5. Implement real-time activity feed
6. Update Mission Control dashboard
7. Update Agents page
8. Update Tasks page
9. Update Rankings page
10. Implement Supabase real-time subscriptions
11. Test dashboard real-time updates
12. Test dashboard performance

### Deliverables
- Dashboard API routes
- Real-time dashboard updates
- Updated dashboard pages
- Test report confirming dashboard functionality

### Dependencies
- Phase 5 (all agents must be implemented)

---

## Phase 7: Scalability Hardening (4-5 days)

### Tasks
1. Enable Supabase connection pooler
2. Implement Redis caching
3. Implement rate limiting
4. Implement circuit breakers for external APIs
5. Implement request queuing
6. Optimize database queries
7. Implement materialized views
8. Implement query timeouts
9. Implement monitoring and alerting
10. Load test with 1000 concurrent clients
11. Optimize based on load test results
12. Document scaling configuration

### Deliverables
- Connection pooler enabled
- Redis caching implemented
- Rate limiting implemented
- Circuit breakers implemented
- Request queuing implemented
- Optimized queries
- Monitoring and alerting
- Load test report
- Scaling documentation

### Dependencies
- Phase 6 (dashboard must be migrated)

---

## Phase 8: Integration & Testing (5-7 days)

### Tasks
1. End-to-end testing of entire system
2. Multitenancy isolation testing
3. Security testing
4. Performance testing
5. User acceptance testing
6. Bug fixes
7. Documentation
8. Deployment preparation
9. Production deployment
10. Post-deployment monitoring

### Deliverables
- End-to-end test report
- Security test report
- Performance test report
- User acceptance test report
- Bug fix report
- Documentation
- Deployment checklist
- Production deployment
- Post-deployment monitoring report

### Dependencies
- Phase 7 (scalability must be hardened)

---

# 14. FINAL RECOMMENDATIONS

## Critical Path

### Must Complete Before Launch
1. **Phase 1:** Remove CMS automation (CRITICAL - violates V1 model)
2. **Phase 2:** Database migration (CRITICAL - data consistency)
3. **Phase 3:** Command Centre (CRITICAL - core V1 system)
4. **Phase 4:** Task generation (CRITICAL - agents must generate tasks)
5. **Phase 5:** Missing agents (CRITICAL - all 9 agents required)

### Can Defer (Post-Launch)
1. **Phase 6:** Dashboard real-time updates (can launch with mocked data)
2. **Phase 7:** Advanced scaling (can launch with basic scaling)
3. **Phase 8:** Full testing suite (can launch with minimal testing)

## Risk Assessment

### High Risk
1. **Database Migration** - Data loss risk
   - **Mitigation:** Full backup before migration, test migration on staging

2. **RLS Policy Changes** - Authorization bypass risk
   - **Mitigation:** Comprehensive testing, gradual rollout

3. **Agent Task Generation** - Logic errors risk
   - **Mitigation:** Extensive testing, manual review of generated tasks

### Medium Risk
1. **Command Centre Build** - Complex system, many edge cases
   - **Mitigation:** Incremental build, continuous testing

2. **Missing Agent Implementations** - Integration risk
   - **Mitigation:** Implement one agent at a time, test thoroughly

3. **Scalability Hardening** - Performance risk
   - **Mitigation:** Load testing, gradual rollout

### Low Risk
1. **Dashboard Migration** - UI changes only
   - **Mitigation:** A/B testing, gradual rollout

2. **CMS Removal** - Well-defined scope
   - **Mitigation:** Code review, testing

## Success Criteria

### Must Have (Launch Blocking)
1. All CMS automation removed
2. Database migrated to UUID tenant_id
3. RLS policies fixed
4. Command Centre operational
5. All 9 agents implemented
6. Agents generate tasks for Command Centre
7. Multitenancy isolation verified
8. Basic security measures in place

### Should Have (Launch Desirable)
1. Real-time dashboard updates
2. Rate limiting implemented
3. Caching implemented
4. Monitoring and alerting
5. Comprehensive testing

### Nice to Have (Post-Launch)
1. Advanced scaling features
2. Full test suite
3. Advanced security features
4. Performance optimization

## Estimated Timeline

### Conservative Estimate
- Phase 1: 3 days
- Phase 2: 4 days
- Phase 3: 7 days
- Phase 4: 5 days
- Phase 5: 8 days
- Phase 6: 4 days
- Phase 7: 5 days
- Phase 8: 7 days
- **Total: 43 days**

### Aggressive Estimate
- Phase 1: 2 days
- Phase 2: 3 days
- Phase 3: 5 days
- Phase 4: 4 days
- Phase 5: 6 days
- Phase 6: 3 days
- Phase 7: 4 days
- Phase 8: 5 days
- **Total: 32 days**

### Recommended Timeline
- **Conservative estimate recommended** due to complexity and risk
- Add 20% buffer for unexpected issues
- **Final estimate: 52 days (43 + 20% buffer)**

## Resource Requirements

### Development
- 1 Senior Full-Stack Developer (lead)
- 1 Backend Developer (database, API)
- 1 Frontend Developer (dashboard, UI)
- 1 DevOps Engineer (deployment, scaling)

### Testing
- 1 QA Engineer (testing coordination)
- 1 Security Engineer (security audit)

### Management
- 1 Project Manager (coordination)
- 1 Product Owner (requirements, decisions)

## Next Steps

### Immediate Actions
1. Review and approve this migration report
2. Allocate resources
3. Set up staging environment
4. Create project timeline
5. Begin Phase 1 (CMS removal)

### Week 1
- Complete Phase 1 (CMS removal)
- Begin Phase 2 (database migration)

### Week 2-3
- Complete Phase 2 (database migration)
- Begin Phase 3 (Command Centre)

### Week 4-5
- Complete Phase 3 (Command Centre)
- Begin Phase 4 (task generation)

### Week 6-7
- Complete Phase 4 (task generation)
- Begin Phase 5 (missing agents)

### Week 8-10
- Complete Phase 5 (missing agents)
- Begin Phase 6 (dashboard migration)

### Week 11
- Complete Phase 6 (dashboard migration)
- Begin Phase 7 (scalability)

### Week 12
- Complete Phase 7 (scalability)
- Begin Phase 8 (integration & testing)

### Week 13-14
- Complete Phase 8 (integration & testing)
- Deploy to production
- Monitor and optimize

---

# APPENDIX A: FILE INVENTORY

## Files to Delete

### CMS Automation (9 files)
1. `apps/web/lib/connectors/wordpress.connector.ts`
2. `apps/web/lib/connectors/shopify.connector.ts`
3. `apps/web/lib/connectors/custom.connector.ts`
4. `apps/web/lib/runtime/cms/cms-execution.ts`
5. `apps/web/lib/runtime/connectors/wordpress.connector.ts`
6. `apps/web/actions/cms.ts`
7. `apps/web/app/api/integrations/cms/route.ts`
8. `apps/web/app/api/integrations/cms/test-connection/route.ts`
9. `apps/web/app/api/integrations/callback/cms/route.ts`

### Deprecated Runtime (4 files)
1. `supabase/RUNTIME_TABLES.sql`
2. `apps/web/app/api/v1/orchestrator/trigger-agent/route.ts`
3. `apps/web/app/api/v1/agent-update/route.ts`
4. `apps/web/app/api/dashboard/agent-states/route.ts`

### Unused Runtime Modules (4 directories)
1. `apps/web/lib/runtime/temporal/`
2. `apps/web/lib/runtime/scenarios/`
3. `apps/web/lib/runtime/verification/`
4. `apps/web/lib/runtime/fixtures/`

## Files to Modify

### Agent Task Files (1 file)
1. `apps/web/lib/agents/publish/publish-tasks.ts` - Remove CMS automation tasks

### Database Files (1 file)
1. `supabase/FINAL_DATABASE_PACKAGE.sql` - Add Command Centre tables

## Files to Create

### Command Centre (5 files)
1. `apps/web/lib/command-centre/task-manager.ts`
2. `apps/web/lib/command-centre/priority-scoring.ts`
3. `apps/web/lib/command-centre/sla-manager.ts`
4. `apps/web/lib/command-centre/assignment-logic.ts`
5. `apps/web/lib/command-centre/activity-logger.ts`

### Agent Implementations (5 agents)
1. `apps/web/lib/agents/linx/linx.service.ts`
2. `apps/web/lib/agents/linx/linx-tasks.ts`
3. `apps/web/lib/agents/prism/prism.service.ts`
4. `apps/web/lib/agents/prism/prism-tasks.ts`
5. `apps/web/lib/agents/core/core.service.ts`
6. `apps/web/lib/agents/core/core-tasks.ts`
7. `apps/web/lib/agents/locl/locl-tasks.ts`
8. `apps/web/lib/agents/repute/repute.service.ts`
9. `apps/web/lib/agents/repute/repute-tasks.ts`

### Connectors (2 files)
1. `apps/web/lib/runtime/connectors/screaming-frog.connector.ts`
2. `apps/web/lib/runtime/connectors/pagespeed-insights.connector.ts`

### API Routes (5 files)
1. `apps/web/app/api/command-centre/tasks/route.ts`
2. `apps/web/app/api/command-centre/assign/route.ts`
3. `apps/web/app/api/command-centre/complete/route.ts`
4. `apps/web/app/api/dashboard/task-summary/route.ts`
5. `apps/web/app/api/dashboard/activity-feed/route.ts`

### UI Components (3 files)
1. `apps/web/components/command-centre/TaskQueue.tsx`
2. `apps/web/components/command-centre/TaskCard.tsx`
3. `apps/web/components/command-centre/ActivityFeed.tsx`

---

# APPENDIX B: DATABASE SCHEMA CHANGES

## New Tables

### command_centre_tasks
- id (UUID, PK)
- tenant_id (UUID, FK to tenants)
- agent_name (TEXT)
- task_type (TEXT)
- task_category (TEXT)
- title (TEXT)
- description (TEXT)
- instructions (JSONB)
- priority (TEXT: critical, high, medium, low)
- status (TEXT: pending, assigned, in_progress, completed, failed, needs_review)
- assigned_to (UUID, FK to profiles)
- due_date (TIMESTAMPTZ)
- estimated_hours (DECIMAL)
- actual_hours (DECIMAL)
- sla_status (TEXT: on_track, at_risk, breached)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ)

### command_centre_activity_log
- id (UUID, PK)
- tenant_id (UUID, FK to tenants)
- task_id (UUID, FK to command_centre_tasks)
- user_id (UUID, FK to profiles)
- action (TEXT)
- previous_state (JSONB)
- new_state (JSONB)
- notes (TEXT)
- created_at (TIMESTAMPTZ)

### command_centre_sla_rules
- id (UUID, PK)
- tenant_id (UUID, FK to tenants)
- task_type (TEXT)
- priority (TEXT)
- sla_hours (DECIMAL)
- warning_threshold_hours (DECIMAL)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- UNIQUE(tenant_id, task_type, priority)

## Modified Tables

### integrations
- Remove: wp_site_url, wp_username, wp_app_password_encrypted
- Remove: shopify_store_url, shopify_access_token_encrypted, shopify_blog_id
- Remove: custom_api_url, custom_api_key_encrypted
- Remove: wp_status, shopify_status, custom_status
- Remove: google_status_check, wp_status_check, shopify_status_check, custom_status_check
- Change: tenant_id from TEXT to UUID

### locl_audits
- Change: tenant_id from TEXT to UUID

### publish_jobs
- Change: tenant_id from TEXT to UUID

### pulse_rankings
- Change: tenant_id from TEXT to UUID

### indexing_status
- Change: tenant_id from TEXT to UUID

## Dropped Tables

### Deprecated Runtime
- agent_runs
- agent_states
- runtime_workflows
- runtime_executions
- runtime_tasks
- runtime_thinking_logs
- runtime_artifacts
- seo_keywords
- seo_clusters
- seo_content_briefs
- seo_drafts
- seo_reports

---

# APPENDIX C: API CONTRACT CHANGES

## New API Routes

### Command Centre
- POST `/api/command-centre/tasks` - Create task
- GET `/api/command-centre/tasks` - List tasks
- GET `/api/command-centre/tasks/:id` - Get task
- PUT `/api/command-centre/tasks/:id` - Update task
- POST `/api/command-centre/tasks/:id/assign` - Assign task
- POST `/api/command-centre/tasks/:id/complete` - Complete task
- GET `/api/command-centre/activity` - Get activity feed
- GET `/api/command-centre/sla` - Get SLA status

### Dashboard
- GET `/api/dashboard/task-summary` - Get task summary
- GET `/api/dashboard/agent-status` - Get agent status
- GET `/api/dashboard/rankings-summary` - Get rankings summary
- GET `/api/dashboard/activity-feed` - Get activity feed
- GET `/api/dashboard/sla-status` - Get SLA status

## Deprecated API Routes

### Remove
- POST `/api/v1/orchestrator/trigger-agent` - Uses deprecated runtime
- PUT `/api/v1/agent-update` - Uses deprecated runtime
- GET `/api/dashboard/agent-states` - Uses deprecated runtime

---

# APPENDIX D: ENVIRONMENT VARIABLES

## New Variables

### Redis (Optional but Recommended)
- `REDIS_URL` - Redis connection URL
- `REDIS_TOKEN` - Redis authentication token

### Rate Limiting
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds

## Modified Variables

### Remove
- `N8N_WEBHOOK_URL` - No longer needed (n8n only for callbacks)
- `N8N_API_KEY` - No longer needed (n8n only for callbacks)

## Existing Variables (Keep)

### Application
- `NEXT_PUBLIC_APP_URL` - Application URL
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

### Authentication
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Clerk webhook secret

### Encryption
- `INTEGRATION_ENCRYPTION_KEY` - Integration encryption key

### Google
- `GOOGLE_OAUTH_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_OAUTH_CLIENT_SECRET` - Google OAuth client secret

### APIs
- `OPENAI_API_KEY` - OpenAI API key
- `DATAFORSEO_API_KEY` - DataForSEO API key
- `SERP_API_KEY` - SerpAPI key

---

# CONCLUSION

This forensic migration report provides a comprehensive analysis of the current CLAUX architecture against the new V1 Hybrid Execution Model. The audit reveals significant architectural conflicts that must be resolved before the system can operate according to the new model.

## Key Findings

1. **CMS Automation Exists** - Full CMS publishing automation violates V1 model
2. **No Command Centre** - Core human execution system missing
3. **Missing Agents** - 5 of 9 agents not implemented
4. **Database Inconsistencies** - Dual runtime systems, type mismatches
5. **No Task Generation** - Agents don't generate human-executable tasks

## Critical Path

The migration requires 8 phases over approximately 43-52 days. The critical path includes:

1. Remove CMS automation (Phase 1)
2. Database migration (Phase 2)
3. Build Command Centre (Phase 3)
4. Implement task generation (Phase 4)
5. Implement missing agents (Phase 5)

## Recommendation

**Proceed with migration using conservative timeline (52 days).** The complexity and risk of this migration warrant a careful, phased approach with thorough testing at each stage.

## Next Steps

1. Review and approve this report
2. Allocate resources
3. Set up staging environment
4. Begin Phase 1 (CMS removal)

---

**Report End**

**Generated:** May 23, 2026  
**Auditor:** Cascade AI  
**Version:** 1.0
