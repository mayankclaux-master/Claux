# CLAUX V1 HYBRID MASTER BUILD SOP
# FORENSIC ARCHITECTURE AUDIT REPORT

**Generated:** May 23, 2026  
**Auditor:** Cascade AI  
**Version:** 1.0  
**Status:** LOCKED ARCHITECTURE COMPLIANCE AUDIT

---

# EXECUTIVE SUMMARY

**Readiness Score:** 25/100

**Critical Finding:** Current codebase contains MASSIVE over-engineering that directly violates V1 Hybrid model. The runtime system is designed for distributed microservices architecture (temporal, distributed workers, queues) which is explicitly forbidden in V1 model.

**Major Conflicts:**
1. Full CMS automation exists (violates NO CMS ADAPTERS)
2. No Command Centre infrastructure (core V1 system missing)
3. 3 of 9 agents not implemented (LINX, PRISM, CORE)
4. Massive over-engineered runtime system (temporal, distributed, queues, workers - all forbidden)
5. PUBLISH agent directly publishes to CMS (violates PUBLISH DOES NOT PUBLISH)

**Estimated Timeline:** 35-45 days (7 phases)

---

# 1. EXACT CONFLICTS WITH LOCKED V1 MODEL

## CRITICAL VIOLATIONS

### 1.1 CMS Automation Exists (VIOLATES: NO CMS ADAPTERS)

**V1 Rule:** "NO CMS ADAPTERS" - PUBLISH DOES NOT PUBLISH

**Current State:**
- Full WordPress connector with publishing capability
- Full Shopify connector with publishing capability
- Full Custom API connector with publishing capability
- CMS execution system that autonomously publishes
- WordPressPublishTask class that directly publishes content

**Files Involved:**
- `apps/web/lib/connectors/wordpress.connector.ts` (2,941 bytes)
- `apps/web/lib/connectors/shopify.connector.ts` (2,744 bytes)
- `apps/web/lib/connectors/custom.connector.ts` (2,499 bytes)
- `apps/web/lib/runtime/cms/cms-execution.ts` (CMS automation)
- `apps/web/lib/runtime/connectors/wordpress.connector.ts` (WordPress connector)
- `apps/web/actions/cms.ts` (CMS actions)
- `apps/web/app/api/integrations/cms/route.ts` (CMS API)
- `apps/web/app/api/integrations/cms/test-connection/route.ts` (CMS test)
- `apps/web/app/api/integrations/callback/cms/route.ts` (CMS callback)
- `apps/web/lib/agents/publish/publish-tasks.ts` (WordPressPublishTask class)

**Database Columns:**
- `integrations.wp_site_url`
- `integrations.wp_username`
- `integrations.wp_app_password_encrypted`
- `integrations.shopify_store_url`
- `integrations.shopify_access_token_encrypted`
- `integrations.shopify_blog_id`
- `integrations.custom_api_url`
- `integrations.custom_api_key_encrypted`
- `integrations.wp_status`
- `integrations.shopify_status`
- `integrations.custom_status`

**Impact:** CRITICAL - Direct violation of core V1 principle. PUBLISH agent must NOT publish autonomously.

---

### 1.2 No Command Centre Infrastructure (VIOLATES: MISSING CORE V1 SYSTEM)

**V1 Rule:** "Humans execute final operational tasks through a centralized Command Centre"

**Current State:**
- ZERO Command Centre infrastructure exists
- No task queue system
- No employee assignment system
- No SLA tracking system
- No activity feed system
- No audit trail system

**Database Tables:** NONE

**API Routes:** NONE

**UI Components:** NONE

**Impact:** CRITICAL - Core V1 system completely missing. This is the primary human execution engine.

---

### 1.3 Missing Agent Implementations (VIOLATES: ALL 9 AGENTS REQUIRED)

**V1 Rule:** All 9 agents must be implemented

**Current State:**
- ARIA: IMPLEMENTED ✓
- SCRIBE: IMPLEMENTED ✓
- PUBLISH: IMPLEMENTED (but with CMS automation - needs rewrite) ⚠
- PULSE: PARTIALLY IMPLEMENTED (service only, no tasks) ⚠
- LOCL: PARTIALLY IMPLEMENTED (service only, no tasks) ⚠
- REPUTE: INCOMPLETE (thinking.ts only) ⚠
- LINX: NOT IMPLEMENTED (empty directory) ✗
- PRISM: NOT IMPLEMENTED (empty directory) ✗
- CORE: NOT IMPLEMENTED (empty directory) ✗

**Missing Implementations:**
- LINX: 0 files (empty directory)
- PRISM: 0 files (empty directory)
- CORE: 0 files (empty directory)

**Incomplete Implementations:**
- PULSE: 1 file (pulse.service.ts only)
- LOCL: 1 file (locl.service.ts only)
- REPUTE: 1 file (thinking.ts only)

**Impact:** CRITICAL - 3 agents completely missing, 3 agents incomplete.

---

### 1.4 Massive Over-Engineered Runtime System (VIOLATES: NO QUEUES, NO MICROSERVICES, NO DISTRIBUTED WORKERS)

**V1 Rules:**
- "No queue system in V1"
- "No microservices"
- "No distributed workers"
- "NO OVER-ABSTRACTION - Keep architecture practical and production-safe"

**Current State:**
The runtime system is MASSIVELY over-engineered for a distributed microservices architecture that V1 explicitly forbids.

**Temporal Module (56 files) - FORBIDDEN:**
- Event sourcing system
- Replay system
- Lineage tracking
- Snapshot system
- Audit system
- Temporal runtime

**Distributed Module (43 files) - FORBIDDEN:**
- Distributed workers
- Worker registry
- Worker directory
- Worker leasing
- Worker draining
- Worker heartbeat
- Execution partitioning
- Execution failover
- Execution reassignment
- Cluster coordination
- Load balancing
- Partition balancing

**Queue Module (1 file) - FORBIDDEN:**
- Queue pressure monitoring

**Worker Module (1 file) - FORBIDDEN:**
- Worker health monitoring

**Scenarios Module (20 files) - OVER-ENGINEERED:**
- Chaos recovery
- Distributed worker scenarios
- Replay validation
- Checkpoint restore
- High concurrency
- Failure cascade
- Multi-tenant scenarios

**Verification Module (15 files) - OVER-ENGINEERED:**
- Tenant isolation verification
- DAG consistency
- Deterministic replay
- Governance enforcement
- Recovery correctness
- Scheduling fairness
- Event causality
- Checkpoint integrity
- Temporal consistency
- Distributed ownership

**Fixtures Module (13 files) - TESTING ONLY:**
- Recovery fixtures
- Workflow fixtures
- DAG fixtures
- Failure fixtures
- Replay fixtures
- Worker fixtures
- Checkpoint fixtures
- Telemetry fixtures

**Testing Module (15 files) - TESTING ONLY:**
- Worker crash testing
- Recovery validation
- Checkpoint corruption
- Fault injection
- Chaos contracts
- Replay corruption
- Network partition
- Delayed events

**Impact:** CRITICAL - Massive violation of V1 simplicity rules. This entire over-engineered runtime system must be removed.

---

### 1.5 PUBLISH Agent Directly Publishes (VIOLATES: PUBLISH DOES NOT PUBLISH)

**V1 Rule:** "PUBLISH - DOES NOT PUBLISH. Only creates: title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions. Outputs tasks to Command Centre."

**Current State:**
- `WordPressPublishTask` class directly publishes to WordPress
- `ShopifyPublishTask` class directly publishes to Shopify
- `CustomAPIPublishTask` class directly publishes to custom API
- CMS execution system handles autonomous publishing

**File:** `apps/web/lib/agents/publish/publish-tasks.ts`

**Impact:** CRITICAL - Direct violation of core V1 principle. PUBLISH must only generate packages, not publish.

---

# 2. EXACT FILES TO DELETE

## 2.1 CMS Automation Files (9 files)

**DELETE:**
```
apps/web/lib/connectors/wordpress.connector.ts
apps/web/lib/connectors/shopify.connector.ts
apps/web/lib/connectors/custom.connector.ts
apps/web/lib/runtime/cms/cms-execution.ts
apps/web/lib/runtime/connectors/wordpress.connector.ts
apps/web/actions/cms.ts
apps/web/app/api/integrations/cms/route.ts
apps/web/app/api/integrations/cms/test-connection/route.ts
apps/web/app/api/integrations/callback/cms/route.ts
```

**Reason:** Violates "NO CMS ADAPTERS" rule. PUBLISH must NOT publish autonomously.

---

## 2.2 Over-Engineered Runtime Files (164 files)

### Temporal Module (56 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/temporal/ (entire directory - 56 files)
```

**Reason:** Violates "NO OVER-ABSTRACTION" and "No microservices" rules. Temporal is for distributed microservices, not V1 simple architecture.

---

### Distributed Module (43 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/distributed/ (entire directory - 43 files)
```

**Reason:** Violates "No distributed workers" rule. V1 explicitly forbids distributed workers.

---

### Queue Module (1 file)

**DELETE:**
```
apps/web/lib/runtime/queue/queue-pressure.ts
```

**Reason:** Violates "No queue system in V1" rule.

---

### Worker Module (1 file)

**DELETE:**
```
apps/web/lib/runtime/worker/worker-health.ts
```

**Reason:** Violates "No distributed workers" rule.

---

### Scenarios Module (20 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/scenarios/ (entire directory - 20 files)
```

**Reason:** Over-engineered testing scenarios not needed for V1 production.

---

### Verification Module (15 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/verification/ (entire directory - 15 files)
```

**Reason:** Over-engineered verification not needed for V1 simple architecture.

---

### Fixtures Module (13 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/fixtures/ (entire directory - 13 files)
```

**Reason:** Testing fixtures not needed for V1 production.

---

### Testing Module (15 files) - DELETE ENTIRE DIRECTORY

**DELETE:**
```
apps/web/lib/runtime/testing/ (entire directory - 15 files)
```

**Reason:** Over-engineered testing module not needed for V1 production.

---

## 2.3 Deprecated Runtime SQL (1 file)

**DELETE:**
```
supabase/RUNTIME_TABLES.sql
```

**Reason:** Defines deprecated runtime tables (runtime_workflows, runtime_tasks, runtime_executions, runtime_thinking_logs, runtime_artifacts, seo_keywords, seo_clusters, seo_content_briefs, seo_drafts, seo_reports) that conflict with canonical runtime.

---

## 2.4 Deprecated API Routes (3 files)

**DELETE:**
```
apps/web/app/api/v1/orchestrator/trigger-agent/route.ts
apps/web/app/api/v1/agent-update/route.ts
apps/web/app/api/dashboard/agent-states/route.ts
```

**Reason:** Uses deprecated runtime system.

---

**TOTAL FILES TO DELETE: 189 files**

---

# 3. EXACT FILES TO REWRITE

## 3.1 PUBLISH Agent Tasks (1 file)

**REWRITE:**
```
apps/web/lib/agents/publish/publish-tasks.ts
```

**Changes Required:**
- Remove WordPressPublishTask class
- Remove ShopifyPublishTask class
- Remove CustomAPIPublishTask class
- Create PublishingPackageTask (generates package only)
- Create CMSChecklistTask (generates checklist)
- Remove all CMS connector imports
- Remove all CMS execution logic

**New Output:**
- Publishing package (title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions)
- CMS checklist (step-by-step manual publishing instructions)
- Task generation for Command Centre

---

## 3.2 Database Schema (1 file)

**REWRITE:**
```
supabase/FINAL_DATABASE_PACKAGE.sql
```

**Changes Required:**
- Add Command Centre tables (command_centre_tasks, command_centre_activity_log, command_centre_sla_rules)
- Remove CMS columns from integrations table
- Add indexes for 1000-client scale
- Add RLS policies for Command Centre tables

---

# 4. EXACT FILES TO CREATE

## 4.1 Command Centre Core (5 files)

**CREATE:**
```
apps/web/lib/command-centre/task-manager.ts
apps/web/lib/command-centre/priority-scoring.ts
apps/web/lib/command-centre/sla-manager.ts
apps/web/lib/command-centre/assignment-logic.ts
apps/web/lib/command-centre/activity-logger.ts
```

**Purpose:** Core Command Centre logic for task management, priority scoring, SLA tracking, employee assignment, and activity logging.

---

## 4.2 Missing Agent Implementations (9 files)

**CREATE:**
```
apps/web/lib/agents/linx/linx.service.ts
apps/web/lib/agents/linx/linx-tasks.ts
apps/web/lib/agents/prism/prism.service.ts
apps/web/lib/agents/prism/prism-tasks.ts
apps/web/lib/agents/core/core.service.ts
apps/web/lib/agents/core/core-tasks.ts
apps/web/lib/agents/locl/locl-tasks.ts
apps/web/lib/agents/repute/repute.service.ts
apps/web/lib/agents/repute/repute-tasks.ts
```

**Purpose:** Implement missing LINX, PRISM, CORE agents and complete LOCL, REPUTE agents with task generation.

---

## 4.3 Missing Connectors (2 files)

**CREATE:**
```
apps/web/lib/runtime/connectors/screaming-frog.connector.ts
apps/web/lib/runtime/connectors/pagespeed-insights.connector.ts
```

**Purpose:** Connectors for CORE agent (Screaming Frog, PageSpeed Insights).

---

## 4.4 Command Centre API Routes (5 files)

**CREATE:**
```
apps/web/app/api/command-centre/tasks/route.ts
apps/web/app/api/command-centre/assign/route.ts
apps/web/app/api/command-centre/complete/route.ts
apps/web/app/api/command-centre/activity/route.ts
apps/web/app/api/command-centre/sla/route.ts
```

**Purpose:** API routes for Command Centre operations.

---

## 4.5 Dashboard API Routes (5 files)

**CREATE:**
```
apps/web/app/api/dashboard/task-summary/route.ts
apps/web/app/api/dashboard/agent-status/route.ts
apps/web/app/api/dashboard/rankings-summary/route.ts
apps/web/app/api/dashboard/activity-feed/route.ts
apps/web/app/api/dashboard/sla-status/route.ts
```

**Purpose:** API routes for real-time dashboard data.

---

## 4.6 Command Centre UI Components (3 files)

**CREATE:**
```
apps/web/components/command-centre/TaskQueue.tsx
apps/web/components/command-centre/TaskCard.tsx
apps/web/components/command-centre/ActivityFeed.tsx
```

**Purpose:** UI components for Command Centre employee dashboard.

---

**TOTAL FILES TO CREATE: 29 files**

---

# 5. DATABASE MIGRATION REQUIREMENTS

## 5.1 New Tables to Create

### command_centre_tasks

```sql
CREATE TABLE command_centre_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  instructions JSONB DEFAULT '{}'::jsonb,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'needs_review')),
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  sla_status TEXT DEFAULT 'on_track' CHECK (sla_status IN ('on_track', 'at_risk', 'breached')),
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
CREATE INDEX idx_command_centre_tasks_tenant_priority ON command_centre_tasks(tenant_id, priority, status);
CREATE INDEX idx_command_centre_tasks_tenant_due ON command_centre_tasks(tenant_id, due_date, status);

-- Partial indexes
CREATE INDEX idx_command_centre_tasks_pending ON command_centre_tasks(tenant_id) WHERE status = 'pending';
CREATE INDEX idx_command_centre_tasks_overdue ON command_centre_tasks(tenant_id) WHERE due_date < NOW() AND status NOT IN ('completed', 'failed');

-- RLS
ALTER TABLE command_centre_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON command_centre_tasks FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert tasks"
  ON command_centre_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update tasks"
  ON command_centre_tasks FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "System can delete tasks"
  ON command_centre_tasks FOR DELETE
  WITH CHECK (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_command_centre_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_command_centre_tasks_updated_at
  BEFORE UPDATE ON command_centre_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_command_centre_tasks_updated_at();
```

### command_centre_activity_log

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
CREATE INDEX idx_command_centre_activity_log_action ON command_centre_activity_log(action);
CREATE INDEX idx_command_centre_activity_log_created_at ON command_centre_activity_log(created_at);
CREATE INDEX idx_command_centre_activity_log_tenant_created ON command_centre_activity_log(tenant_id, created_at DESC);

-- RLS
ALTER TABLE command_centre_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity"
  ON command_centre_activity_log FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert activity"
  ON command_centre_activity_log FOR INSERT
  WITH CHECK (true);
```

### command_centre_sla_rules

```sql
CREATE TABLE command_centre_sla_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  sla_hours DECIMAL(5,2) NOT NULL,
  warning_threshold_hours DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, task_type, priority)
);

-- Indexes
CREATE INDEX idx_command_centre_sla_rules_tenant_id ON command_centre_sla_rules(tenant_id);
CREATE INDEX idx_command_centre_sla_rules_task_type ON command_centre_sla_rules(task_type);
CREATE INDEX idx_command_centre_sla_rules_priority ON command_centre_sla_rules(priority);
CREATE INDEX idx_command_centre_sla_rules_is_active ON command_centre_sla_rules(is_active);

-- RLS
ALTER TABLE command_centre_sla_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SLA rules"
  ON command_centre_sla_rules FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'));

CREATE POLICY "System can insert SLA rules"
  ON command_centre_sla_rules FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update SLA rules"
  ON command_centre_sla_rules FOR UPDATE
  WITH CHECK (true);

-- Trigger
CREATE OR REPLACE FUNCTION update_command_centre_sla_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_command_centre_sla_rules_updated_at
  BEFORE UPDATE ON command_centre_sla_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_command_centre_sla_rules_updated_at();
```

---

## 5.2 Columns to Remove from integrations Table

```sql
-- Remove CMS-related columns
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_site_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_username;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_app_password_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_store_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_access_token_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_blog_id;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_api_url;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_api_key_encrypted;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_status;
ALTER TABLE integrations DROP COLUMN IF EXISTS google_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS wp_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS shopify_status_check;
ALTER TABLE integrations DROP COLUMN IF EXISTS custom_status_check;

-- Remove CMS CHECK constraints
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS check_cms_type_valid;
```

---

## 5.3 Tables to Drop (Deprecated Runtime)

```sql
-- Drop deprecated runtime tables
DROP TABLE IF EXISTS runtime_workflows CASCADE;
DROP TABLE IF EXISTS runtime_tasks CASCADE;
DROP TABLE IF EXISTS runtime_executions CASCADE;
DROP TABLE IF EXISTS runtime_thinking_logs CASCADE;
DROP TABLE IF EXISTS runtime_artifacts CASCADE;
DROP TABLE IF EXISTS seo_keywords CASCADE;
DROP TABLE IF EXISTS seo_clusters CASCADE;
DROP TABLE IF EXISTS seo_content_briefs CASCADE;
DROP TABLE IF EXISTS seo_drafts CASCADE;
DROP TABLE IF EXISTS seo_reports CASCADE;
```

---

# 6. COMMAND CENTRE ARCHITECTURE REQUIREMENTS

## 6.1 Task Lifecycle

**States:**
- pending → assigned → in_progress → completed
- in_progress → failed → pending (retry)
- in_progress → needs_review → completed

**Transitions:**
- pending → assigned (employee assignment)
- assigned → in_progress (employee starts task)
- in_progress → completed (task finished)
- in_progress → failed (task failed)
- failed → pending (retry)
- in_progress → needs_review (awaiting review)
- needs_review → completed (review approved)

---

## 6.2 Task Categories

**By Agent:**
- ARIA: keyword_review, serp_validation, competitor_analysis
- SCRIBE: content_review, metadata_validation, schema_insertion
- PUBLISH: publishing_package, cms_checklist
- PULSE: ranking_review, movement_analysis
- LOCL: gmb_post, citation_submission, gmb_optimization
- REPUTE: review_reply, sentiment_analysis
- LINX: outreach, backlink_strategy
- PRISM: report_review, forecast_validation
- CORE: technical_fix, schema_validation, cwv_optimization

**By Type:**
- publishing, technical, outreach, optimization, reporting, maintenance

---

## 6.3 Priority Levels

**Levels:**
- critical (SLA: 4 hours)
- high (SLA: 24 hours)
- medium (SLA: 72 hours)
- low (SLA: 168 hours)

**Scoring Logic:**
- Base score from agent
- Urgency based on due date
- Impact on rankings
- Client tier

---

## 6.4 Employee Queues

**Queue Types:**
- Unassigned Queue (all pending tasks)
- My Queue (tasks assigned to current employee)
- Team Queue (tasks assigned to employee's team)
- Urgent Queue (critical and high priority tasks)
- Overdue Queue (tasks past due date)

**Sorting:**
- Default: priority (critical → high → medium → low), then due date
- Employee can sort by: priority, due date, estimated hours, agent, category

---

## 6.5 SLA Logic

**Calculation:**
```typescript
function calculateSLA(task: Task): SLAStatus {
  const slaRule = getSLARule(task.tenantId, task.type, task.priority);
  const dueDate = task.createdAt + slaRule.slaHours;
  const warningDate = dueDate - slaRule.warningThresholdHours;
  
  if (now() > dueDate) return 'breached';
  if (now() > warningDate) return 'at_risk';
  return 'on_track';
}
```

**Breach Handling:**
- Automatic escalation to team lead
- Notification to client (if configured)
- Task priority automatically increased
- SLA breach logged in activity log

---

## 6.6 Client Visibility

**What Clients See:**
- Task count by status
- Task count by priority
- Overdue task count
- Recently completed tasks
- Upcoming tasks
- SLA compliance rate

**What Clients Don't See:**
- Internal task notes
- Employee assignments
- SLA breach details
- Internal activity log
- Task metadata

---

## 6.7 Activity Feed

**Activity Types:**
- task_created, task_assigned, task_started, task_completed, task_failed, task_escalated, sla_breached, priority_changed, due_date_changed, note_added

**Filtering:**
- By tenant, task, employee, activity type, date range

---

## 6.8 Execution Logs

**Log Levels:**
- debug, info, warn, error, fatal

**Storage:**
- Stored in agent_logs table (canonical runtime)
- Linked to execution_id and task_id
- Retention: 90 days (configurable)

---

## 6.9 Audit Trails

**Audit Events:**
- Task creation, assignment, status changes, priority changes, due date changes, employee changes, SLA breaches, data access

**Storage:**
- Stored in command_centre_activity_log table
- Immutable (no updates, only inserts)
- Retention: 365 days (configurable)

---

# 7. DASHBOARD MODIFICATIONS REQUIRED

## 7.1 Real-Time Data Requirements

**Current State:** Mocked data

**Required Changes:**
- Mission Control: Real agent status, real task feed, real ranking movements
- Agents Page: Real execution history, real performance charts, real thinking logs
- Tasks Page: Real task list, real task statistics
- Rankings Page: Real ranking data, real ranking movements

---

## 7.2 API Routes Required

**Create:**
- `/api/dashboard/task-summary` - Task count by status
- `/api/dashboard/agent-status` - Agent execution status
- `/api/dashboard/rankings-summary` - Ranking summary
- `/api/dashboard/activity-feed` - Recent activity
- `/api/dashboard/sla-status` - SLA compliance

---

## 7.3 Data Flow

```
Agent Execution → Task Generation → Command Centre → Client Dashboard
```

**Real-Time Updates:**
- Use Supabase real-time subscriptions
- Update dashboard on task changes
- Update dashboard on agent executions
- Update dashboard on ranking updates

---

## 7.4 Caching Strategy

- Cache task counts (5-minute TTL)
- Cache agent status (1-minute TTL)
- Cache rankings (15-minute TTL)
- No caching for activity feed

---

# 8. AGENT-BY-AGENT REBUILD REQUIREMENTS

## 8.1 ARIA - KEEP (Add Task Generation)

**Current State:** IMPLEMENTED ✓

**Required Changes:**
- Add task generation logic
- Add task templates for keyword research review
- Add task templates for SERP analysis validation
- Add task templates for competitor gap analysis
- Integrate with Command Centre

**Task Generation:**
```typescript
function generateARIATasks(execution: AgentExecution): CommandCentreTask[] {
  return [
    {
      agentName: 'ARIA',
      taskType: 'keyword_review',
      taskCategory: 'research',
      title: 'Review keyword opportunities',
      description: 'Review discovered keyword opportunities and prioritize for content creation',
      instructions: { keywords: execution.output.keywords },
      priority: 'high',
      estimatedHours: 1
    }
  ];
}
```

---

## 8.2 SCRIBE - KEEP (Add Task Generation)

**Current State:** IMPLEMENTED ✓

**Required Changes:**
- Add task generation logic
- Add task templates for content review
- Add task templates for metadata validation
- Add task templates for schema insertion
- Integrate with Command Centre

**Task Generation:**
```typescript
function generateSCRIBETasks(execution: AgentExecution): CommandCentreTask[] {
  return [
    {
      agentName: 'SCRIBE',
      taskType: 'content_review',
      taskCategory: 'publishing',
      title: 'Review generated content',
      description: 'Review generated article for accuracy, tone, and SEO optimization',
      instructions: { content: execution.output.content },
      priority: 'high',
      estimatedHours: 2
    }
  ];
}
```

---

## 8.3 PUBLISH - REWRITE (Remove CMS Automation)

**Current State:** IMPLEMENTED WITH CMS AUTOMATION (CONFLICT) ⚠

**Required Changes:**
- Remove WordPressPublishTask
- Remove ShopifyPublishTask
- Remove CustomAPIPublishTask
- Create PublishingPackageTask (generates package only)
- Create CMSChecklistTask (generates checklist)
- Add task generation logic
- Integrate with Command Centre

**New Output:**
- Publishing package (title, slug, metadata, schema JSON, featured image prompts, categories, internal linking suggestions, publishing instructions)
- CMS checklist (step-by-step manual publishing instructions)

**Task Generation:**
```typescript
function generatePUBLISHTasks(execution: AgentExecution): CommandCentreTask[] {
  return [
    {
      agentName: 'PUBLISH',
      taskType: 'publishing_package',
      taskCategory: 'publishing',
      title: 'Assemble publishing package',
      description: 'Assemble publishing package with content, metadata, schema, and instructions',
      instructions: { content: execution.output.content, metadata: execution.output.metadata },
      priority: 'high',
      estimatedHours: 0.5
    },
    {
      agentName: 'PUBLISH',
      taskType: 'cms_checklist',
      taskCategory: 'publishing',
      title: 'Complete CMS publishing checklist',
      description: 'Follow CMS checklist to publish content manually',
      instructions: { checklist: ['log_into_cms', 'create_new_post', 'paste_content'] },
      priority: 'high',
      estimatedHours: 1
    }
  ];
}
```

---

## 8.4 PULSE - COMPLETE (Add Tasks)

**Current State:** PARTIALLY IMPLEMENTED (service only) ⚠

**Required Changes:**
- Add task implementation
- Add task generation logic
- Add task templates for ranking review
- Add task templates for ranking movement analysis
- Integrate with Command Centre

**Task Generation:**
```typescript
function generatePULSETasks(execution: AgentExecution): CommandCentreTask[] {
  return [
    {
      agentName: 'PULSE',
      taskType: 'ranking_review',
      taskCategory: 'reporting',
      title: 'Review ranking changes',
      description: 'Review ranking movements and identify significant changes',
      instructions: { rankings: execution.output.rankings },
      priority: 'medium',
      estimatedHours: 0.5
    }
  ];
}
```

---

## 8.5 LOCL - COMPLETE (Add Tasks)

**Current State:** PARTIALLY IMPLEMENTED (service only) ⚠

**Required Changes:**
- Add task implementation
- Add task generation logic
- Add task templates for GMB post publication
- Add task templates for citation submission
- Add task templates for GMB optimization
- Integrate with Command Centre

**Task Generation:**
```typescript
function generateLOCLTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks = [];
  
  if (execution.output.recommendations.includes('post_gmb_update')) {
    tasks.push({
      agentName: 'LOCL',
      taskType: 'gmb_post',
      taskCategory: 'local',
      title: 'Publish GMB post',
      description: 'Publish generated GMB post to Google Business Profile',
      instructions: { postContent: execution.output.generatedPost },
      priority: 'medium',
      estimatedHours: 0.5
    });
  }
  
  return tasks;
}
```

---

## 8.6 REPUTE - IMPLEMENT (Service + Tasks)

**Current State:** INCOMPLETE (thinking.ts only) ⚠

**Required Changes:**
- Implement service
- Implement tasks
- Add task generation logic
- Add task templates for review reply
- Add task templates for sentiment analysis
- Integrate with Command Centre

**Task Generation:**
```typescript
function generateREPUTETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks = [];
  
  for (const review of execution.output.newReviews) {
    if (review.needsReply) {
      tasks.push({
        agentName: 'REPUTE',
        taskType: 'review_reply',
        taskCategory: 'reputation',
        title: `Reply to review: ${review.rating} stars`,
        description: 'Post suggested reply to Google review',
        instructions: { reviewId: review.id, suggestedReply: review.suggestedReply },
        priority: review.sentiment === 'negative' ? 'high' : 'medium',
        estimatedHours: 0.25
      });
    }
  }
  
  return tasks;
}
```

---

## 8.7 LINX - IMPLEMENT (Service + Tasks)

**Current State:** NOT IMPLEMENTED (empty directory) ✗

**Required Changes:**
- Implement service
- Implement tasks
- Add task generation logic
- Add task templates for outreach
- Add task templates for backlink strategy
- Integrate with Command Centre

**API:** DataForSEO only

**Task Generation:**
```typescript
function generateLINXTasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks = [];
  
  for (const opportunity of execution.output.outreachTargets) {
    tasks.push({
      agentName: 'LINX',
      taskType: 'outreach',
      taskCategory: 'outreach',
      title: `Outreach to ${opportunity.domain}`,
      description: 'Send outreach email for backlink opportunity',
      instructions: { domain: opportunity.domain, emailTemplate: execution.output.emailTemplate },
      priority: 'medium',
      estimatedHours: 0.5
    });
  }
  
  return tasks;
}
```

---

## 8.8 PRISM - IMPLEMENT (Service + Tasks)

**Current State:** NOT IMPLEMENTED (empty directory) ✗

**Required Changes:**
- Implement service
- Implement tasks
- Add task generation logic
- Add task templates for report review
- Add task templates for forecast validation
- Integrate with Command Centre

**API:** Google Analytics (already integrated)

**Task Generation:**
```typescript
function generatePRISMTasks(execution: AgentExecution): CommandCentreTask[] {
  return [
    {
      agentName: 'PRISM',
      taskType: 'report_review',
      taskCategory: 'reporting',
      title: 'Review analytics report',
      description: 'Review analytics report and identify insights',
      instructions: { report: execution.output.report },
      priority: 'medium',
      estimatedHours: 1
    }
  ];
}
```

---

## 8.9 CORE - IMPLEMENT (Service + Tasks + Connectors)

**Current State:** NOT IMPLEMENTED (empty directory) ✗

**Required Changes:**
- Implement service
- Implement tasks
- Add task generation logic
- Add task templates for technical fixes
- Add task templates for schema validation
- Add task templates for CWV optimization
- Create Screaming Frog connector
- Create PageSpeed Insights connector
- Integrate with Command Centre

**Connectors Required:**
- Screaming Frog (NOT IMPLEMENTED)
- PageSpeed Insights (NOT IMPLEMENTED)

**Task Generation:**
```typescript
function generateCORETasks(execution: AgentExecution): CommandCentreTask[] {
  const tasks = [];
  
  for (const issue of execution.output.issues) {
    tasks.push({
      agentName: 'CORE',
      taskType: 'technical_fix',
      taskCategory: 'technical',
      title: `Fix: ${issue.title}`,
      description: 'Implement technical SEO fix',
      instructions: { issue: issue, fixInstructions: issue.fixInstructions },
      priority: issue.severity,
      estimatedHours: issue.estimatedHours
    });
  }
  
  return tasks;
}
```

---

# 9. SCALABILITY RISKS FOR 1000-CLIENT ARCHITECTURE

## 9.1 Database Bottlenecks

### RLS Policy Overhead
**Issue:** Every query checks tenant_id via subquery

**Current Pattern:**
```sql
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'))
```

**Impact:** At 1000 clients with 10 concurrent queries each = 10,000 subqueries/sec

**Mitigation:**
- Use security definer functions with cached tenant_id
- Implement connection-level tenant context
- Use materialized views for common queries

---

### No Connection Pooling
**Issue:** Default Supabase connection pool may not handle 1000 concurrent clients

**Impact:** Connection exhaustion under load

**Mitigation:**
- Enable Supabase connection pooler
- Configure transaction mode (not session mode)
- Set appropriate pool size (20-50 connections)

---

### No Partitioning
**Issue:** Single table for all tenant data

**Impact:** Query performance degrades as data grows

**Mitigation:**
- Partition large tables by tenant_id (agent_executions, agent_tasks, command_centre_tasks)
- Use PostgreSQL declarative partitioning

---

### No Caching Strategy
**Issue:** Every query hits database

**Impact:** High database load, slow response times

**Mitigation:**
- Implement Redis caching for frequent queries
- Cache task counts (5-minute TTL)
- Cache agent status (1-minute TTL)
- Cache rankings (15-minute TTL)

---

## 9.2 Query Risks

### N+1 Query Pattern
**Issue:** Dashboard fetches data per agent

**Impact:** At 9 agents = 9 queries per dashboard load

**Mitigation:**
- Use aggregate queries
- Use materialized views
- Implement batch fetching

---

### No Query Timeouts
**Issue:** Long-running queries can block

**Impact:** Database lockup under load

**Mitigation:**
- Set statement_timeout (e.g., 30 seconds)
- Implement query timeouts in application
- Use read replicas for long-running analytics queries

---

### Inefficient Indexes
**Issue:** Missing composite indexes

**Impact:** Slow queries for common patterns

**Mitigation:**
- Add composite indexes for (tenant_id, status), (tenant_id, priority)
- Add partial indexes for filtering (WHERE status = 'pending')
- Add covering indexes for frequent queries

---

## 9.3 Runtime Risks

### Vercel Function Timeout
**Issue:** Vercel functions have 10-60 second timeouts

**Impact:** Failed executions, incomplete data

**Mitigation:**
- Use background jobs for long-running tasks
- Implement streaming responses
- Use Vercel Cron for scheduled tasks

---

### No Rate Limiting
**Issue:** API can be overwhelmed

**Impact:** API exhaustion, cost overruns

**Mitigation:**
- Implement per-tenant rate limiting
- Use Vercel Edge Config for rate limits
- Implement API key throttling

---

### No Circuit Breakers
**Issue:** External API failures can cascade

**Impact:** System-wide failures when external APIs fail

**Mitigation:**
- Implement circuit breakers for external APIs
- Implement retry with exponential backoff
- Implement fallback mechanisms

---

## 9.4 Required Indexes

```sql
-- Agent executions
CREATE INDEX idx_agent_executions_tenant_agent_status ON agent_executions(tenant_id, agent_name, status);
CREATE INDEX idx_agent_executions_tenant_created ON agent_executions(tenant_id, created_at DESC);

-- Agent tasks
CREATE INDEX idx_agent_tasks_execution_status_step ON agent_tasks(execution_id, status, step_order);

-- Command centre tasks
CREATE INDEX idx_command_centre_tasks_tenant_priority_status ON command_centre_tasks(tenant_id, priority, status);
CREATE INDEX idx_command_centre_tasks_tenant_due_status ON command_centre_tasks(tenant_id, due_date, status);

-- Partial indexes
CREATE INDEX idx_agent_executions_active ON agent_executions(tenant_id, agent_name) WHERE status IN ('running', 'pending');
CREATE INDEX idx_command_centre_tasks_pending ON command_centre_tasks(tenant_id) WHERE status = 'pending';
CREATE INDEX idx_command_centre_tasks_overdue ON command_centre_tasks(tenant_id) WHERE due_date < NOW() AND status NOT IN ('completed', 'failed');
```

---

# 10. RUNTIME RISKS

## 10.1 Over-Engineered Runtime Complexity

**Issue:** Current runtime has 164 files of over-engineered distributed systems

**Impact:**
- Maintenance nightmare
- Violates V1 simplicity rules
- Unnecessary complexity for V1 model

**Mitigation:**
- Delete entire temporal module (56 files)
- Delete entire distributed module (43 files)
- Delete entire scenarios module (20 files)
- Delete entire verification module (15 files)
- Delete entire fixtures module (13 files)
- Delete entire testing module (15 files)
- Delete queue and worker modules (2 files)

---

## 10.2 Dual Runtime Systems

**Issue:** Deprecated runtime (RUNTIME_TABLES.sql) vs canonical runtime (FINAL_DATABASE_PACKAGE.sql)

**Impact:**
- Confusion about which system to use
- Data inconsistency
- Maintenance overhead

**Mitigation:**
- Drop deprecated runtime tables
- Use canonical runtime only
- Migrate any data from deprecated to canonical

---

## 10.3 No Task Generation

**Issue:** Agents don't generate tasks for Command Centre

**Impact:**
- Command Centre has no tasks
- Human execution engine non-functional
- Core V1 model broken

**Mitigation:**
- Implement task generation for all agents
- Integrate agents with Command Centre
- Test task generation end-to-end

---

# 11. TENANT ISOLATION RISKS

## 11.1 RLS Policy Inconsistency

**Issue:** Some tables use auth.uid() (wrong for Clerk), some use auth.jwt() ->> 'sub' (correct)

**Impact:**
- Authorization bypass possible
- Data leakage risk
- Inconsistent security

**Current State:**
- Canonical runtime tables: auth.jwt() ->> 'sub' (CORRECT)
- Production tables: auth.uid() (INCORRECT)

**Mitigation:**
- Update all RLS policies to use auth.jwt() ->> 'sub'
- Test thoroughly after migration
- Implement regular RLS policy audits

---

## 11.2 tenant_id Type Inconsistency

**Issue:** Some tables use TEXT, some use UUID

**Impact:**
- Cannot create FK constraints
- Data inconsistency
- Query complexity

**Current State:**
- Canonical runtime tables: UUID (CORRECT)
- Production agent-specific tables: TEXT (INCORRECT)

**Mitigation:**
- Migrate all tenant_id columns to UUID
- Add FK constraints
- Test data integrity after migration

---

## 11.3 No FK Constraints

**Issue:** Production tables have no FK constraints due to type mismatch

**Impact:**
- No referential integrity
- Orphaned data possible
- Data inconsistency

**Mitigation:**
- Migrate tenant_id to UUID
- Add FK constraints
- Test referential integrity

---

# 12. DEAD CODE IDENTIFICATION

## 12.1 Over-Engineered Runtime Modules (164 files)

**DELETE:**
- temporal/ (56 files) - Event sourcing, replay, lineage, snapshots, audit
- distributed/ (43 files) - Workers, coordination, balancing, clustering
- scenarios/ (20 files) - Chaos recovery, distributed worker scenarios
- verification/ (15 files) - Over-engineered verification
- fixtures/ (13 files) - Testing fixtures
- testing/ (15 files) - Testing module
- queue/ (1 file) - Queue pressure
- worker/ (1 file) - Worker health

**Reason:** Violates V1 simplicity rules. Not needed for V1 model.

---

## 12.2 Deprecated Runtime SQL (1 file)

**DELETE:**
- supabase/RUNTIME_TABLES.sql

**Reason:** Defines deprecated runtime tables that conflict with canonical runtime.

---

## 12.3 CMS Automation Files (9 files)

**DELETE:**
- All CMS connectors and execution files (listed in Section 2.1)

**Reason:** Violates "NO CMS ADAPTERS" rule.

---

## 12.4 Deprecated API Routes (3 files)

**DELETE:**
- apps/web/app/api/v1/orchestrator/trigger-agent/route.ts
- apps/web/app/api/v1/agent-update/route.ts
- apps/web/app/api/dashboard/agent-states/route.ts

**Reason:** Uses deprecated runtime system.

---

# 13. DUPLICATE SYSTEM IDENTIFICATION

## 13.1 Dual Runtime Systems

**System 1: Deprecated Runtime**
- Tables: runtime_workflows, runtime_tasks, runtime_executions, runtime_thinking_logs, runtime_artifacts
- File: supabase/RUNTIME_TABLES.sql
- Status: DEPRECATED

**System 2: Canonical Runtime**
- Tables: agent_executions, agent_tasks, agent_events, agent_logs
- File: supabase/FINAL_DATABASE_PACKAGE.sql
- Status: CANONICAL

**Action:** Drop deprecated runtime tables, use canonical only.

---

## 13.2 Dual CMS Connectors

**System 1: lib/connectors/**
- wordpress.connector.ts
- shopify.connector.ts
- custom.connector.ts

**System 2: lib/runtime/connectors/**
- wordpress.connector.ts

**Action:** Delete all CMS connectors (violates V1 model).

---

## 13.3 Dual Task Systems

**System 1: Runtime Tasks**
- Table: runtime_tasks
- Purpose: Distributed worker tasks

**System 2: Agent Tasks**
- Table: agent_tasks
- Purpose: Canonical agent execution tasks

**System 3: Command Centre Tasks**
- Table: command_centre_tasks (TO BE CREATED)
- Purpose: Human execution tasks

**Action:** Keep agent_tasks (canonical), create command_centre_tasks (V1), drop runtime_tasks (deprecated).

---

# 14. FINAL RECOMMENDED PHASED EXECUTION ORDER

## Phase 1: Remove Over-Engineered Runtime & CMS Automation (3-4 days)

**Tasks:**
1. Delete temporal module (56 files)
2. Delete distributed module (43 files)
3. Delete scenarios module (20 files)
4. Delete verification module (15 files)
5. Delete fixtures module (13 files)
6. Delete testing module (15 files)
7. Delete queue and worker modules (2 files)
8. Delete CMS automation files (9 files)
9. Delete deprecated runtime SQL (1 file)
10. Delete deprecated API routes (3 files)
11. Test that system still functions

**Deliverables:**
- Clean codebase without over-engineered runtime
- Clean codebase without CMS automation
- Test report confirming system still functions

**Dependencies:**
- None (can start immediately)

**Git Commit:**
```bash
git add .
git commit -m "Phase 1: Remove over-engineered runtime and CMS automation"
git push origin runtime-restoration-phase1
```

---

## Phase 2: Database Migration (3-4 days)

**Tasks:**
1. Create Command Centre tables (command_centre_tasks, command_centre_activity_log, command_centre_sla_rules)
2. Remove CMS columns from integrations table
3. Drop deprecated runtime tables
4. Add required indexes for 1000-client scale
5. Test Command Centre tables
6. Test database integrity

**Deliverables:**
- Command Centre tables created
- CMS columns removed
- Deprecated tables dropped
- Indexes created
- Migration report
- Test report confirming data integrity

**Dependencies:**
- Phase 1 (over-engineered runtime must be removed)

**Git Commit:**
```bash
git add .
git commit -m "Phase 2: Database migration - Command Centre tables and cleanup"
git push origin runtime-restoration-phase1
```

---

## Phase 3: Command Centre Core (5-6 days)

**Tasks:**
1. Create Command Centre core logic (task-manager, priority-scoring, sla-manager, assignment-logic, activity-logger)
2. Create Command Centre API routes
3. Create Command Centre UI components
4. Implement task queue management
5. Implement priority scoring logic
6. Implement SLA calculation logic
7. Implement task assignment logic
8. Implement activity feed
9. Implement execution logs
10. Implement audit trails
11. Test Command Centre functionality

**Deliverables:**
- Command Centre core logic
- Command Centre API routes
- Command Centre UI components
- Task queue management
- Priority scoring
- SLA tracking
- Task assignment
- Activity feed
- Execution logs
- Audit trails
- Test report confirming Command Centre functionality

**Dependencies:**
- Phase 2 (database must be migrated)

**Git Commit:**
```bash
git add .
git commit -m "Phase 3: Command Centre core implementation"
git push origin runtime-restoration-phase1
```

---

## Phase 4: Rewrite PUBLISH Agent (2-3 days)

**Tasks:**
1. Remove WordPressPublishTask
2. Remove ShopifyPublishTask
3. Remove CustomAPIPublishTask
4. Create PublishingPackageTask
5. Create CMSChecklistTask
6. Add task generation logic
7. Integrate with Command Centre
8. Test PUBLISH agent

**Deliverables:**
- Rewritten PUBLISH agent (no CMS automation)
- Publishing package generation
- CMS checklist generation
- Task generation for Command Centre
- Test report confirming PUBLISH agent works

**Dependencies:**
- Phase 3 (Command Centre must be built)

**Git Commit:**
```bash
git add .
git commit -m "Phase 4: Rewrite PUBLISH agent - remove CMS automation"
git push origin runtime-restoration-phase1
```

---

## Phase 5: Complete PULSE and LOCL Agents (3-4 days)

**Tasks:**
1. Implement PULSE tasks
2. Add PULSE task generation logic
3. Integrate PULSE with Command Centre
4. Implement LOCL tasks
5. Add LOCL task generation logic
6. Integrate LOCL with Command Centre
7. Test PULSE agent
8. Test LOCL agent

**Deliverables:**
- Completed PULSE agent (service + tasks)
- Completed LOCL agent (service + tasks)
- Task generation for both agents
- Integration with Command Centre
- Test report confirming both agents work

**Dependencies:**
- Phase 4 (PUBLISH rewrite must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 5: Complete PULSE and LOCL agents"
git push origin runtime-restoration-phase1
```

---

## Phase 6: Implement REPUTE Agent (3-4 days)

**Tasks:**
1. Implement REPUTE service
2. Implement REPUTE tasks
3. Add task generation logic
4. Integrate with Command Centre
5. Test REPUTE agent

**Deliverables:**
- REPUTE agent implementation
- Task generation for REPUTE
- Integration with Command Centre
- Test report confirming REPUTE works

**Dependencies:**
- Phase 5 (PULSE and LOCL must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 6: Implement REPUTE agent"
git push origin runtime-restoration-phase1
```

---

## Phase 7: Implement LINX Agent (4-5 days)

**Tasks:**
1. Implement LINX service
2. Implement LINX tasks
3. Add task generation logic
4. Integrate with Command Centre
5. Test LINX agent

**Deliverables:**
- LINX agent implementation
- Task generation for LINX
- Integration with Command Centre
- Test report confirming LINX works

**Dependencies:**
- Phase 6 (REPUTE must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 7: Implement LINX agent"
git push origin runtime-restoration-phase1
```

---

## Phase 8: Implement PRISM Agent (4-5 days)

**Tasks:**
1. Implement PRISM service
2. Implement PRISM tasks
3. Add task generation logic
4. Integrate with Command Centre
5. Test PRISM agent

**Deliverables:**
- PRISM agent implementation
- Task generation for PRISM
- Integration with Command Centre
- Test report confirming PRISM works

**Dependencies:**
- Phase 7 (LINX must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 8: Implement PRISM agent"
git push origin runtime-restoration-phase1
```

---

## Phase 9: Implement CORE Agent (5-6 days)

**Tasks:**
1. Create Screaming Frog connector
2. Create PageSpeed Insights connector
3. Implement CORE service
4. Implement CORE tasks
5. Add task generation logic
6. Integrate with Command Centre
7. Test CORE agent

**Deliverables:**
- Screaming Frog connector
- PageSpeed Insights connector
- CORE agent implementation
- Task generation for CORE
- Integration with Command Centre
- Test report confirming CORE works

**Dependencies:**
- Phase 8 (PRISM must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 9: Implement CORE agent with Screaming Frog and PageSpeed Insights connectors"
git push origin runtime-restoration-phase1
```

---

## Phase 10: Add Task Generation to ARIA and SCRIBE (2-3 days)

**Tasks:**
1. Add task generation logic to ARIA
2. Add task templates to ARIA
3. Integrate ARIA with Command Centre
4. Add task generation logic to SCRIBE
5. Add task templates to SCRIBE
6. Integrate SCRIBE with Command Centre
7. Test ARIA task generation
8. Test SCRIBE task generation

**Deliverables:**
- ARIA task generation
- SCRIBE task generation
- Integration with Command Centre
- Test report confirming task generation works

**Dependencies:**
- Phase 9 (CORE must be complete)

**Git Commit:**
```bash
git add .
git commit -m "Phase 10: Add task generation to ARIA and SCRIBE"
git push origin runtime-restoration-phase1
```

---

## Phase 11: Dashboard Real-Time Updates (3-4 days)

**Tasks:**
1. Create dashboard API routes
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

**Deliverables:**
- Dashboard API routes
- Real-time dashboard updates
- Updated dashboard pages
- Test report confirming dashboard functionality

**Dependencies:**
- Phase 10 (all agents must have task generation)

**Git Commit:**
```bash
git add .
git commit -m "Phase 11: Dashboard real-time updates"
git push origin runtime-restoration-phase1
```

---

## Phase 12: Scalability Hardening (3-4 days)

**Tasks:**
1. Enable Supabase connection pooler
2. Implement Redis caching
3. Implement rate limiting
4. Implement circuit breakers for external APIs
5. Optimize database queries
6. Implement materialized views
7. Implement query timeouts
8. Implement monitoring and alerting
9. Load test with 1000 concurrent clients
10. Optimize based on load test results
11. Document scaling configuration

**Deliverables:**
- Connection pooler enabled
- Redis caching implemented
- Rate limiting implemented
- Circuit breakers implemented
- Optimized queries
- Monitoring and alerting
- Load test report
- Scaling documentation

**Dependencies:**
- Phase 11 (dashboard must be migrated)

**Git Commit:**
```bash
git add .
git commit -m "Phase 12: Scalability hardening for 1000 clients"
git push origin runtime-restoration-phase1
```

---

## Phase 13: Integration & Testing (4-5 days)

**Tasks:**
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

**Deliverables:**
- End-to-end test report
- Security test report
- Performance test report
- User acceptance test report
- Bug fix report
- Documentation
- Deployment checklist
- Production deployment
- Post-deployment monitoring report

**Dependencies:**
- Phase 12 (scalability must be hardened)

**Git Commit:**
```bash
git add .
git commit -m "Phase 13: Integration, testing, and production deployment"
git push origin runtime-restoration-phase1
```

---

# 15. CRITICAL PATH SUMMARY

## Must Complete Before Launch

1. **Phase 1:** Remove over-engineered runtime and CMS automation (CRITICAL - violates V1 model)
2. **Phase 2:** Database migration (CRITICAL - Command Centre tables needed)
3. **Phase 3:** Command Centre core (CRITICAL - core V1 system)
4. **Phase 4:** Rewrite PUBLISH agent (CRITICAL - violates V1 model)
5. **Phase 5:** Complete PULSE and LOCL agents (CRITICAL - all agents required)
6. **Phase 6:** Implement REPUTE agent (CRITICAL - all agents required)
7. **Phase 7:** Implement LINX agent (CRITICAL - all agents required)
8. **Phase 8:** Implement PRISM agent (CRITICAL - all agents required)
9. **Phase 9:** Implement CORE agent (CRITICAL - all agents required)
10. **Phase 10:** Add task generation to ARIA and SCRIBE (CRITICAL - agents must generate tasks)

## Can Defer (Post-Launch)

1. **Phase 11:** Dashboard real-time updates (can launch with mocked data)
2. **Phase 12:** Advanced scaling (can launch with basic scaling)
3. **Phase 13:** Full testing suite (can launch with minimal testing)

---

# 16. ESTIMATED TIMELINE

## Conservative Estimate

- Phase 1: 4 days
- Phase 2: 4 days
- Phase 3: 6 days
- Phase 4: 3 days
- Phase 5: 4 days
- Phase 6: 4 days
- Phase 7: 5 days
- Phase 8: 5 days
- Phase 9: 6 days
- Phase 10: 3 days
- Phase 11: 4 days
- Phase 12: 4 days
- Phase 13: 5 days
- **Total: 57 days**

## Aggressive Estimate

- Phase 1: 3 days
- Phase 2: 3 days
- Phase 3: 5 days
- Phase 4: 2 days
- Phase 5: 3 days
- Phase 6: 3 days
- Phase 7: 4 days
- Phase 8: 4 days
- Phase 9: 5 days
- Phase 10: 2 days
- Phase 11: 3 days
- Phase 12: 3 days
- Phase 13: 4 days
- **Total: 44 days**

## Recommended Timeline

- **Conservative estimate recommended** due to complexity and risk
- Add 20% buffer for unexpected issues
- **Final estimate: 68 days (57 + 20% buffer)**

---

# 17. RESOURCE REQUIREMENTS

## Development

- 1 Senior Full-Stack Developer (lead)
- 1 Backend Developer (database, API)
- 1 Frontend Developer (dashboard, UI)
- 1 DevOps Engineer (deployment, scaling)

## Testing

- 1 QA Engineer (testing coordination)
- 1 Security Engineer (security audit)

## Management

- 1 Project Manager (coordination)
- 1 Product Owner (requirements, decisions)

---

# 18. NEXT STEPS

## Immediate Actions

1. Review and approve this MASTER BUILD SOP
2. Allocate resources
3. Set up staging environment
4. Create project timeline
5. Begin Phase 1 (Remove over-engineered runtime and CMS automation)

## Week 1

- Complete Phase 1 (Remove over-engineered runtime and CMS automation)
- Begin Phase 2 (Database migration)

## Week 2-3

- Complete Phase 2 (Database migration)
- Begin Phase 3 (Command Centre core)

## Week 4-5

- Complete Phase 3 (Command Centre core)
- Begin Phase 4 (Rewrite PUBLISH agent)

## Week 6

- Complete Phase 4 (Rewrite PUBLISH agent)
- Begin Phase 5 (Complete PULSE and LOCL agents)

## Week 7

- Complete Phase 5 (Complete PULSE and LOCL agents)
- Begin Phase 6 (Implement REPUTE agent)

## Week 8

- Complete Phase 6 (Implement REPUTE agent)
- Begin Phase 7 (Implement LINX agent)

## Week 9

- Complete Phase 7 (Implement LINX agent)
- Begin Phase 8 (Implement PRISM agent)

## Week 10

- Complete Phase 8 (Implement PRISM agent)
- Begin Phase 9 (Implement CORE agent)

## Week 11-12

- Complete Phase 9 (Implement CORE agent)
- Begin Phase 10 (Add task generation to ARIA and SCRIBE)

## Week 13

- Complete Phase 10 (Add task generation to ARIA and SCRIBE)
- Begin Phase 11 (Dashboard real-time updates)

## Week 14

- Complete Phase 11 (Dashboard real-time updates)
- Begin Phase 12 (Scalability hardening)

## Week 15

- Complete Phase 12 (Scalability hardening)
- Begin Phase 13 (Integration & testing)

## Week 16-17

- Complete Phase 13 (Integration & testing)
- Deploy to production
- Monitor and optimize

---

# 19. FINAL RECOMMENDATIONS

## Proceed with Migration

**Recommendation:** Proceed with migration using conservative timeline (68 days).

**Rationale:**
- The complexity and risk of this migration warrant a careful, phased approach
- Massive over-engineered runtime system must be removed
- Core V1 systems (Command Centre) must be built from scratch
- All agents must be implemented with task generation
- Thorough testing at each stage is critical

## Success Criteria

### Must Have (Launch Blocking)

1. All over-engineered runtime removed
2. All CMS automation removed
3. Command Centre operational
4. All 9 agents implemented
5. Agents generate tasks for Command Centre
6. PUBLISH agent does NOT publish autonomously
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

---

# 20. CONCLUSION

This MASTER BUILD SOP provides a comprehensive forensic audit of the current CLAUX architecture against the locked V1 Hybrid model. The audit reveals MASSIVE over-engineering that directly violates V1 simplicity rules.

## Key Findings

1. **Over-Engineered Runtime Exists** - 164 files of temporal, distributed, queue, worker systems that violate V1 rules
2. **CMS Automation Exists** - Full CMS publishing automation violates "NO CMS ADAPTERS" rule
3. **No Command Centre** - Core human execution system completely missing
4. **Missing Agents** - 3 of 9 agents not implemented (LINX, PRISM, CORE)
5. **PUBLISH Violation** - PUBLISH agent directly publishes to CMS (violates "PUBLISH DOES NOT PUBLISH")

## Critical Path

The migration requires 13 phases over approximately 57-68 days. The critical path includes:

1. Remove over-engineered runtime (Phase 1)
2. Database migration (Phase 2)
3. Build Command Centre (Phase 3)
4. Rewrite PUBLISH agent (Phase 4)
5. Complete PULSE and LOCL agents (Phase 5)
6. Implement REPUTE agent (Phase 6)
7. Implement LINX agent (Phase 7)
8. Implement PRISM agent (Phase 8)
9. Implement CORE agent (Phase 9)
10. Add task generation to ARIA and SCRIBE (Phase 10)

## Recommendation

**Proceed with migration using conservative timeline (68 days).** The complexity and risk of this migration warrant a careful, phased approach with thorough testing at each stage.

---

**MASTER BUILD SOP END**

**Generated:** May 23, 2026  
**Auditor:** Cascade AI  
**Version:** 1.0  
**Status:** LOCKED ARCHITECTURE COMPLIANCE AUDIT
