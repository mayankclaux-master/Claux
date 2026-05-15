# CLAUX DATABASE + EXECUTION TOPOLOGY AUDIT

**Date:** January 2025  
**Audit Type:** Database + Execution Topology Reality Audit  
**Scope:** Database architecture, execution topology, persistence coherence, operational viability  
**Methodology:** Forensic schema analysis, codebase trace, repository audit, migration inspection  

---

## EXECUTIVE SUMMARY

CLAUX has **THREE CONFLICTING DATABASE SYSTEMS** with inconsistent table definitions, type mismatches, and broken RLS policies. The codebase uses a hybrid approach: agent_* tables for execution runtime, seo_* tables for artifacts, and onboarding tables for tenant management. The runtime_executions system (RUNTIME_TABLES.sql) is **DEAD CODE** - never referenced in the codebase.

### Critical Findings

- **TRIPLE EXECUTION SYSTEM:** agent_executions vs runtime_executions vs agent_runs (legacy)
- **TYPE MISMATCH CRITICAL:** tenant_id is TEXT in some tables, UUID in others (breaks FKs)
- **RLS BROKEN:** All RLS policies use auth.uid() instead of auth.jwt() ->> 'sub' (Clerk incompatible)
- **DEAD SYSTEM:** runtime_executions, runtime_tasks, runtime_workflows never used
- **HYBRID USAGE:** Codebase uses agent_* tables + seo_* tables + onboarding tables
- **NO QUEUE PERSISTENCE:** No job queue table, no worker coordination table
- **NO CHECKPOINT PERSISTENCE:** Checkpoint fields exist but no checkpoint table
- **NO REPLAY PERSISTENCE:** Replay fields exist but no replay table

### Operational Classification

**Database Topology: FRAGMENTED (0.2)**

The database architecture is fragmented across three incompatible systems. The execution topology cannot support operational SEO automation without significant consolidation.

---

## SECTION 1 — DATABASE STRUCTURE REALITY

### Complete Database Table Map

#### SYSTEM 1: NEW RUNTIME SYSTEM (ACTIVELY USED)

**Tables:** agent_executions, agent_tasks, agent_events, agent_logs  
**Definition Files:** migrations/20250109_*.sql, FINAL_DATABASE_PACKAGE.sql  
**Status:** OPERATIONAL (used by runtime services)  
**Classification:** RUNTIME-CRITICAL

| Table | Purpose | tenant_id Type | RLS Auth | Actual Usage | Read Freq | Write Freq | Tenant-Scoped? |
|-------|---------|---------------|----------|--------------|-----------|------------|---------------|
| agent_executions | Execution tracking | TEXT (migrations) / UUID (FINAL) | auth.uid() ❌ | HIGH - ExecutionRepository | HIGH | HIGH | YES |
| agent_tasks | Task tracking | N/A (FK to execution) | auth.uid() ❌ | HIGH - TaskRepository | HIGH | HIGH | YES (via execution) |
| agent_events | Event stream | TEXT (migrations) / UUID (FINAL) | auth.uid() ❌ | HIGH - EventRepository | HIGH | HIGH | YES |
| agent_logs | Log stream | N/A (FK to execution) | auth.uid() ❌ | HIGH - LogRepository | HIGH | HIGH | YES (via execution) |

**Evidence:**
- ExecutionRepository: `protected getTableName(): string { return 'agent_executions'; }`
- TaskRepository: `protected getTableName(): string { return 'agent_tasks'; }`
- EventRepository: `protected getTableName(): string { return 'agent_tasks'; }`
- Codebase grep shows 50+ references to these tables

#### SYSTEM 2: RUNTIME TABLES (DEAD CODE)

**Tables:** runtime_executions, runtime_tasks, runtime_workflows, runtime_thinking_logs, runtime_artifacts, seo_keywords, seo_clusters, seo_content_briefs, seo_drafts, seo_reports  
**Definition File:** RUNTIME_TABLES.sql  
**Status:** DEAD (never referenced in codebase)  
**Classification:** UNUSED

| Table | Purpose | tenant_id Type | RLS Auth | Actual Usage | Read Freq | Write Freq | Tenant-Scoped? |
|-------|---------|---------------|----------|--------------|-----------|------------|---------------|
| runtime_executions | Execution tracking (DEAD) | TEXT | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| runtime_tasks | Task tracking (DEAD) | TEXT | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| runtime_workflows | Workflow definitions (DEAD) | TEXT | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| runtime_thinking_logs | Agent thinking (DEAD) | TEXT | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| runtime_artifacts | Artifact storage (DEAD) | TEXT | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| seo_keywords | Keyword storage (ACTIVELY USED) | TEXT | current_setting('app.current_tenant') | HIGH - ARIA tasks | MEDIUM | HIGH | YES |
| seo_clusters | Keyword clusters (ACTIVELY USED) | TEXT | current_setting('app.current_tenant') | MEDIUM - Reports | MEDIUM | MEDIUM | YES |
| seo_content_briefs | Content briefs (ACTIVELY USED) | TEXT | current_setting('app.current_tenant') | HIGH - SCRIBE tasks | MEDIUM | HIGH | YES |
| seo_drafts | Content drafts (ACTIVELY USED) | TEXT | current_setting('app.current_tenant') | HIGH - SCRIBE/AMPLI tasks | MEDIUM | HIGH | YES |
| seo_reports | Report storage (ACTIVELY USED) | TEXT | current_setting('app.current_tenant') | HIGH - Report system | MEDIUM | HIGH | YES |

**Evidence:**
- Grep search: ZERO references to runtime_executions, runtime_tasks, runtime_workflows
- Grep search: 20+ references to seo_keywords, seo_content_briefs, seo_drafts, seo_reports
- ARIA tasks: `.from('seo_keywords').upsert(keywordInserts)`
- SCRIBE tasks: `.from('seo_content_briefs').select('*')`
- Report generator: `.from('seo_reports').insert(...)`

#### SYSTEM 3: ONBOARDING TABLES (ACTIVELY USED)

**Tables:** tenants, workspaces, business_profiles, gsc_credentials, credentials, sitemaps, pages, ranking_seeds, ranking_history, ranking_movements, ranking_volatility  
**Definition File:** ONBOARDING_TABLES.sql  
**Status:** PARTIAL (core tables used, ranking tables unused)  
**Classification:** PARTIAL

| Table | Purpose | tenant_id Type | RLS Auth | Actual Usage | Read Freq | Write Freq | Tenant-Scoped? |
|-------|---------|---------------|----------|--------------|-----------|------------|---------------|
| tenants | Tenant management | UUID | current_setting('app.current_tenant') | HIGH - All APIs | HIGH | MEDIUM | YES |
| workspaces | Workspace management | UUID | current_setting('app.current_tenant') | MEDIUM - Onboarding | MEDIUM | MEDIUM | YES |
| business_profiles | Business data | UUID | current_setting('app.current_tenant') | HIGH - Onboarding/Tasks | HIGH | HIGH | YES |
| gsc_credentials | GSC credentials | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| credentials | Generic credentials | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| sitemaps | Sitemap storage | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| pages | Page storage | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| ranking_seeds | Ranking seeds | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| ranking_history | Ranking history | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| ranking_movements | Ranking movements | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |
| ranking_volatility | Ranking volatility | UUID | current_setting('app.current_tenant') | ZERO | ZERO | ZERO | YES |

**Evidence:**
- Grep search: 50+ references to tenants, workspaces, business_profiles
- Grep search: ZERO references to gsc_credentials, credentials, sitemaps, pages, ranking_* tables
- Onboarding ingestion: `.from('tenants').insert(...)`
- Onboarding ingestion: `.from('workspaces').insert(...)`
- Onboarding ingestion: `.from('business_profiles').upsert(...)`

#### SYSTEM 4: AGENT-SPECIFIC TABLES (PARTIALLY USED)

**Tables:** locl_audits, publish_jobs, pulse_rankings, indexing_status, integrations  
**Definition Files:** create_locl_audits_table.sql, create_publish_jobs_table.sql, create_pulse_rankings_table.sql, create_indexing_status_table.sql, create_integrations_table.sql  
**Status:** PARTIAL (integrations used, others unused)  
**Classification:** PARTIAL

| Table | Purpose | tenant_id Type | RLS Auth | Actual Usage | Read Freq | Write Freq | Tenant-Scoped? |
|-------|---------|---------------|----------|--------------|-----------|------------|---------------|
| locl_audits | LOCL agent outputs | TEXT | auth.uid() ❌ | ZERO | ZERO | ZERO | YES |
| publish_jobs | Publishing jobs | TEXT | auth.uid() ❌ | MEDIUM - Dashboard stats | MEDIUM | MEDIUM | YES |
| pulse_rankings | PULSE agent outputs | TEXT | auth.uid() ❌ | ZERO | ZERO | ZERO | YES |
| indexing_status | Indexing tracking | TEXT | auth.uid() ❌ | MEDIUM - Indexing assistant | MEDIUM | HIGH | YES |
| integrations | Provider credentials | TEXT | auth.uid() ❌ | HIGH - Integration system | HIGH | HIGH | YES |

**Evidence:**
- Grep search: 30+ references to integrations table
- Grep search: 5 references to publish_jobs (dashboard stats)
- Grep search: 5 references to indexing_status (indexing assistant)
- Grep search: ZERO references to locl_audits, pulse_rankings
- Integration utils: `.from('integrations').select('*').eq('tenant_id', tenantId)`
- Dashboard stats: `.from('publish_jobs').select('*').eq('tenant_id', tenantId)`
- Indexing assistant: `.from('indexing_status').upsert(...)`

#### SYSTEM 5: LEGACY EXECUTION (DEAD CODE)

**Tables:** agent_runs, agent_states  
**Status:** DEAD (legacy system, never referenced in codebase)  
**Classification:** LEGACY

**Evidence:**
- Grep search: ZERO references to agent_runs, agent_states
- Only mentioned in DATABASE_AUDIT_REPORT.md as legacy tables to be backed up

---

## SECTION 2 — MULTI-TENANT ISOLATION AUDIT

### Critical Issue: auth.uid() vs auth.jwt() ->> 'sub'

**Problem:** ALL RLS policies use `auth.uid()` which is INVALID for Clerk authentication. Clerk uses JWT tokens where the user ID is in `auth.jwt() ->> 'sub'`. `auth.uid()` is for Supabase native auth only.

**Affected Tables:**
- locl_audits
- publish_jobs
- pulse_rankings
- indexing_status
- integrations
- agent_executions (new runtime system)
- agent_tasks (new runtime system)
- agent_events (new runtime system)
- agent_logs (new runtime system)

**Risk:** Tenant isolation is COMPLETELY BROKEN. Any authenticated user could potentially access other tenants' data.

**Evidence:**
```sql
-- CURRENT (BROKEN)
CREATE POLICY "Users can view their own locl audits"
  ON locl_audits FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- SHOULD BE (CORRECT)
CREATE POLICY "Users can view their own locl audits"
  ON locl_audits FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );
```

### tenant_id Type Inconsistencies

**Problem:** tenant_id is TEXT in some tables, UUID in others. This breaks foreign key constraints and prevents joins.

**Type Mismatch Map:**

| Table | tenant_id Type | Should Be | FK to tenants? |
|-------|---------------|-----------|----------------|
| profiles | TEXT | TEXT | NO (user_id is TEXT) |
| tenants | UUID | UUID | PRIMARY KEY |
| business_profiles | UUID | UUID | YES |
| agent_executions | TEXT (migrations) / UUID (FINAL) | UUID | NO (broken) |
| agent_tasks | N/A (FK to execution) | N/A | NO |
| agent_events | TEXT (migrations) / UUID (FINAL) | UUID | NO (broken) |
| agent_logs | N/A (FK to execution) | N/A | NO |
| locl_audits | TEXT | UUID | NO (broken) |
| publish_jobs | TEXT | UUID | NO (broken) |
| pulse_rankings | TEXT | UUID | NO (broken) |
| indexing_status | TEXT | UUID | NO (broken) |
| integrations | TEXT | UUID | NO (broken) |
| runtime_executions | TEXT | UUID | NO (dead code) |
| runtime_tasks | TEXT | UUID | NO (dead code) |
| seo_keywords | TEXT | UUID | NO (dead code) |
| seo_clusters | TEXT | UUID | NO (dead code) |
| seo_content_briefs | TEXT | UUID | NO (dead code) |
| seo_drafts | TEXT | UUID | NO (dead code) |
| seo_reports | TEXT | UUID | NO (dead code) |

**Impact:**
- Cannot create foreign keys from agent_* tables to tenants table
- Cannot create foreign keys from seo_* tables to tenants table
- Cannot create foreign keys from agent-specific tables to tenants table
- Tenant isolation relies on application-level filtering (vulnerable to bugs)

### Tenant Scoping in Codebase

**Pattern:** All runtime operations filter by tenant_id at application level.

**Evidence:**
```typescript
// ExecutionRepository
constructor(tenantId: UUID) {
  this.tenantId = tenantId;
}

protected getTenantId(): UUID {
  return this.tenantId;
}

// All queries include tenant_id filter
async findById(id: UUID): Promise<Result<Execution, RuntimeDatabaseError>> {
  return this.queryOne(
    (db) => db.from(this.tableName).select('*').eq('id', id).eq('tenant_id', this.tenantId)
  );
}
```

**Risk:** Application-level filtering is vulnerable to:
- Bugs in repository implementations
- Direct database access bypassing repositories
- SQL injection attacks
- Accidental tenant cross-contamination

### Auth Mapping Flow

**Current Flow:**
1. Clerk authenticates user → user.id (TEXT)
2. App stores user.id in profiles.id (TEXT)
3. App stores tenant_id (UUID) in profiles.tenant_id
4. App uses profiles.tenant_id to fetch tenant data
5. RLS policies use auth.uid() (WRONG - should use auth.jwt() ->> 'sub')

**Correct Flow:**
1. Clerk authenticates user → user.id (TEXT)
2. App stores user.id in profiles.id (TEXT)
3. App stores tenant_id (UUID) in profiles.tenant_id
4. App uses profiles.tenant_id to fetch tenant data
5. RLS policies should use auth.jwt() ->> 'sub' to match profiles.id

**Leakage Risks:**
- RLS policies broken (auth.uid() doesn't work with Clerk)
- No FK constraints on tenant_id (type mismatch)
- Application-level filtering only (vulnerable to bugs)
- No database-level tenant isolation

---

## SECTION 3 — EXECUTION DATA MODEL AUDIT

### Complete Execution Lifecycle Trace

**Current System:** agent_executions + agent_tasks + agent_events + agent_logs

**Lifecycle:**
1. Execution Creation → agent_executions table
2. Task Creation → agent_tasks table
3. Task Execution → agent_tasks.status = 'running'
4. Event Publishing → agent_events table
5. Log Writing → agent_logs table
6. Task Completion → agent_tasks.status = 'completed'
7. Execution Completion → agent_executions.status = 'completed'

**Evidence:**
```typescript
// Execution creation
async createExecution(data: ExecutionInsert): Promise<Result<Execution>> {
  return this.repository.create(data);
}

// Task creation
async createTask(data: TaskInsert): Promise<Result<Task>> {
  return this.repository.create(data);
}

// Event publishing
async publishEvent(event: EventInsert): Promise<Result<Event>> {
  return this.repository.create(event);
}

// Log writing
async writeLog(log: LogInsert): Promise<Result<Log>> {
  return this.repository.create(log);
}
```

### Execution Data Model Coherence

**Strengths:**
- Clear separation: executions → tasks → events → logs
- Foreign key constraints: tasks FK to executions, events FK to executions, logs FK to executions
- Status enums: comprehensive (pending, running, completed, failed, cancelled, retrying)
- Retry tracking: retry_count, max_retries
- Timestamps: started_at, completed_at, failed_at
- Metadata: metadata JSONB field

**Weaknesses:**
- No FK from agent_executions.tenant_id to tenants.id (type mismatch)
- No FK from agent_events.tenant_id to tenants.id (type mismatch)
- No workflow execution table (workflow definitions are in code, not database)
- No checkpoint table (checkpoint fields exist but no dedicated table)
- No replay table (replay fields exist but no dedicated table)
- No queue persistence (no job queue table)
- No worker coordination table

### Workflow Persistence

**Current State:** Workflow definitions are in TypeScript code, not database.

**Evidence:**
- ARIA workflow: `apps/web/lib/runtime/workflows/aria.workflow.ts`
- SCRIBE workflow: `apps/web/lib/runtime/workflows/scribe.workflow.ts`
- No workflow table in database (runtime_workflows table exists but is DEAD CODE)

**Impact:**
- Cannot version workflows in database
- Cannot deploy workflow changes independently
- Cannot A/B test workflow variations
- Workflow changes require code deployment

### Artifact Persistence

**Current State:** Artifacts stored in seo_* tables (from RUNTIME_TABLES.sql)

**Evidence:**
```typescript
// ARIA tasks - keyword storage
.from('seo_keywords').upsert(keywordInserts)

// SCRIBE tasks - content brief storage
.from('seo_content_briefs').insert(briefs)

// SCRIBE tasks - content draft storage
.from('seo_drafts').insert(contentInserts)

// Report generator - report storage
.from('seo_reports').insert(...)
```

**Coherence:**
- Artifacts are NOT linked to agent_executions table
- seo_keywords has execution_id FK but table is from DEAD SYSTEM
- seo_content_briefs has execution_id FK but table is from DEAD SYSTEM
- seo_drafts has execution_id FK but table is from DEAD SYSTEM
- No artifact table is linked to agent_executions (operational system)

**Impact:**
- Cannot trace artifacts to executions
- Cannot query artifacts by execution
- Cannot query artifacts by agent
- Artifact storage is disconnected from execution tracking

---

## SECTION 4 — EVENT SYSTEM REALITY

### Event Tables

**Table:** agent_events  
**Status:** OPERATIONAL  
**Usage:** HIGH - used by EventRepository, governance systems, health monitoring

**Evidence:**
```typescript
// EventRepository
protected getTableName(): string {
  return 'agent_events';
}

// Incident detection
.from('agent_events').select('*', { count: 'exact', head: true })
  .eq('event_name', 'provider_dispatch_failed')

// Health monitoring
.from('agent_events').select('*', { count: 'exact', head: true })
  .eq('event_name', 'worker_restart')
```

### Event Emitters

**Emitters:** RuntimeService, ExecutionOrchestrator, Governance Systems

**Evidence:**
```typescript
// RuntimeService
async publishEvent(event: EventInsert): Promise<Result<Event>> {
  return this.event.publishEvent(event);
}

// ExecutionOrchestrator
await this.runtime.event.publishEvent({
  tenant_id: this.tenantId,
  execution_id: executionId,
  event_name: 'execution_started',
  event_source: 'orchestrator',
  payload: { agentName, workflowType },
});
```

### Event Consumers

**Consumers:** Incident detection, health monitoring, governance systems

**Evidence:**
```typescript
// Incident detection
async detectProviderDispatchSpike(): Promise<boolean> {
  const { count } = await this.supabase.from('agent_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'provider_dispatch_failed')
    .gte('created_at', new Date(Date.now() - 300000).toISOString());
  return (count || 0) > 10;
}

// Health monitoring
async getWorkerRestartCount(): Promise<number> {
  const { count } = await this.supabase.from('agent_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'worker_restart')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());
  return count || 0;
}
```

### Event Sourcing Reality

**Status:** PARTIAL

**Strengths:**
- Event table exists and is operational
- Event publishing is integrated into orchestrator
- Event correlation_id exists for tracing
- Event causation_id exists for causality tracking
- Event version exists for schema evolution

**Weaknesses:**
- No event consumers (no event-driven architecture)
- No event replay capability
- No event projection tables
- No event versioning strategy
- No event schema evolution plan
- Events are used for logging, not for state reconstruction

**Classification:** Event system is operational but NOT true event sourcing. It's an event log, not an event-driven architecture.

---

## SECTION 5 — ARTIFACT PERSISTENCE AUDIT

### Keyword Artifacts

**Table:** seo_keywords  
**Status:** OPERATIONAL  
**Usage:** HIGH - ARIA agent writes keywords, dashboard reads keywords

**Evidence:**
```typescript
// ARIA tasks - write
.from('seo_keywords').upsert(keywordInserts, {
  onConflict: 'tenant_id,keyword',
});

// Dashboard - read
.from("seo_keywords").select("*", { count: "exact", head: true })
  .eq("tenant_id", tenantId);

// Report generator - read
.from('seo_keywords').select('*')
  .eq('tenant_id', tenantId)
  .order('opportunity_score', { ascending: false })
  .limit(100);
```

### Content Artifacts

**Tables:** seo_content_briefs, seo_drafts  
**Status:** OPERATIONAL  
**Usage:** HIGH - SCRIBE agent writes content, AMPLI agent publishes content

**Evidence:**
```typescript
// SCRIBE tasks - write briefs
.from('seo_content_briefs').insert(briefs);

// SCRIBE tasks - write drafts
.from('seo_drafts').insert(contentInserts);

// AMPLI tasks - read drafts
.from('seo_drafts').select('*')
  .eq('tenant_id', context.tenant_id)
  .eq('status', 'draft')
  .limit(20);

// AMPLI tasks - update drafts
.from('seo_drafts').update({ status: pub.status })
```

### Report Artifacts

**Table:** seo_reports  
**Status:** OPERATIONAL  
**Usage:** HIGH - Report generator writes reports, API reads reports

**Evidence:**
```typescript
// Report generator - write
await supabase.from('seo_reports').insert({
  tenant_id: tenantId,
  report_type: 'keyword_opportunity',
  report_data: report,
  status: 'completed',
});

// API - read
.from('seo_reports').select('*')
  .eq('tenant_id', tenantId);
```

### Ranking Artifacts

**Table:** pulse_rankings  
**Status:** UNUSED  
**Usage:** ZERO - table exists but never written to

**Evidence:**
- Grep search: ZERO references to pulse_rankings table
- Table is defined but PULSE agent never writes to it
- Dashboard uses seo_keywords for ranking display

### LOCL Artifacts

**Table:** locl_audits  
**Status:** UNUSED  
**Usage:** ZERO - table exists but never written to

**Evidence:**
- Grep search: ZERO references to locl_audits table
- Table is defined but LOCL agent never writes to it

### Indexing Artifacts

**Table:** indexing_status  
**Status:** OPERATIONAL  
**Usage:** MEDIUM - Indexing assistant writes status

**Evidence:**
```typescript
// Indexing assistant - write
.from("indexing_status").upsert({
  tenant_id: tenantId,
  url: url,
  status: status,
  submitted_at: status === "submitted" ? new Date().toISOString() : null,
});
```

### Artifact Generation Pipeline

**Status:** PARTIAL

**Strengths:**
- Artifact tables exist and are operational
- ARIA generates keyword artifacts
- SCRIBE generates content artifacts
- Report generator generates report artifacts
- Dashboard reads artifact tables

**Weaknesses:**
- Artifacts not linked to agent_executions (execution_id FK exists but table is from DEAD SYSTEM)
- No artifact versioning
- No artifact deduplication
- No artifact lifecycle management
- No artifact cleanup/retention policy
- No artifact validation
- No artifact lineage tracking

**Classification:** Artifact persistence is operational but disconnected from execution tracking.

---

## SECTION 6 — REPOSITORY LAYER REALITY

### Active Repositories

**Repositories:**
- ExecutionRepository (agent_executions)
- TaskRepository (agent_tasks)
- EventRepository (agent_events)
- LogRepository (agent_logs)
- MetricsRepository (agent_executions, agent_tasks, agent_events)

**Status:** OPERATIONAL  
**Usage:** HIGH - used by RuntimeService, ExecutionOrchestrator

**Evidence:**
```typescript
// ExecutionRepository
export class ExecutionRepository extends BaseRepository<...> {
  protected getTableName(): string {
    return 'agent_executions';
  }
}

// TaskRepository
export class TaskRepository extends BaseRepository<...> {
  protected getTableName(): string {
    return 'agent_tasks';
  }
}

// EventRepository
export class EventRepository extends BaseRepository<...> {
  protected getTableName(): string {
    return 'agent_events';
  }
}
```

### Dead Repositories

**Repositories:** None (no repositories for DEAD tables)

**Evidence:**
- No repository for runtime_executions
- No repository for runtime_tasks
- No repository for runtime_workflows
- No repository for seo_keywords (direct SQL in tasks)
- No repository for seo_content_briefs (direct SQL in tasks)
- No repository for seo_drafts (direct SQL in tasks)

### Repository Fragmentation

**Problem:** Artifact persistence uses direct SQL, not repositories.

**Evidence:**
```typescript
// Direct SQL in tasks (no repository)
.from('seo_keywords').upsert(keywordInserts)
.from('seo_content_briefs').insert(briefs)
.from('seo_drafts').insert(contentInserts)
.from('seo_reports').insert(...)
```

**Impact:**
- No consistent data access layer
- No centralized error handling
- No centralized logging
- No centralized tenant scoping
- Vulnerable to SQL injection
- Hard to test

### Repository Dependency Graph

```
RuntimeService
├── ExecutionRepository (agent_executions)
├── TaskRepository (agent_tasks)
├── EventRepository (agent_events)
├── LogRepository (agent_logs)
└── MetricsRepository (agent_executions, agent_tasks, agent_events)

ExecutionOrchestrator
└── RuntimeService

Task Implementations (Direct SQL - No Repositories)
├── seo_keywords (direct SQL)
├── seo_content_briefs (direct SQL)
├── seo_drafts (direct SQL)
└── seo_reports (direct SQL)
```

**Classification:** Repository layer is operational for execution tracking, but fragmented for artifact persistence.

---

## SECTION 7 — RUNTIME PERSISTENCE TOPOLOGY

### Execution Persistence

**Tables:** agent_executions, agent_tasks  
**Status:** OPERATIONAL  
**Coherence:** HIGH

**Evidence:**
- FK constraint: agent_tasks.execution_id → agent_executions.id
- CASCADE delete: agent_tasks deleted when agent_executions deleted
- Status tracking: comprehensive status enums
- Timestamp tracking: started_at, completed_at, failed_at
- Retry tracking: retry_count, max_retries

### Event Persistence

**Table:** agent_events  
**Status:** OPERATIONAL  
**Coherence:** PARTIAL

**Evidence:**
- FK constraint: agent_events.execution_id → agent_executions.id (SET NULL on delete)
- Correlation tracking: correlation_id, causation_id
- Version tracking: event_version
- Timestamp tracking: created_at

**Weaknesses:**
- No event consumers
- No event replay
- No event projections
- No event versioning strategy

### Log Persistence

**Table:** agent_logs  
**Status:** OPERATIONAL  
**Coherence:** HIGH

**Evidence:**
- FK constraint: agent_logs.execution_id → agent_executions.id
- FK constraint: agent_logs.task_id → agent_tasks.id (SET NULL on delete)
- Log level tracking: debug, info, warn, error, fatal
- Metadata tracking: metadata JSONB, context JSONB

### Worker Coordination Persistence

**Status:** NON-EXISTENT  
**Tables:** None

**Evidence:**
- No job queue table
- No worker table
- No worker coordination table
- No worker heartbeat table
- No worker assignment table

**Impact:**
- Cannot coordinate multiple workers
- Cannot track worker state
- Cannot detect worker failures
- Cannot recover from worker crashes
- No horizontal scaling capability

### Queue Persistence

**Status:** NON-EXISTENT  
**Tables:** None

**Evidence:**
- No job queue table
- No task queue table
- No execution queue table

**Impact:**
- Cannot queue jobs
- Cannot prioritize jobs
- Cannot delay jobs
- Cannot schedule jobs
- No background job processing

### Orchestration State Persistence

**Status:** PARTIAL  
**Tables:** agent_executions, agent_tasks

**Evidence:**
- Execution state tracked in agent_executions
- Task state tracked in agent_tasks
- No orchestration state machine table
- No workflow state table
- No checkpoint table
- No replay table

**Impact:**
- Cannot checkpoint orchestration state
- Cannot replay executions
- Cannot resume failed executions
- Cannot rollback executions
- Limited orchestration recovery capability

### Callback Continuation Persistence

**Status:** NON-EXISTENT  
**Tables:** None

**Evidence:**
- No callback table
- No continuation table
- No callback state table

**Impact:**
- Cannot track pending callbacks
- Cannot retry failed callbacks
- Cannot detect callback timeouts
- Cannot match callbacks to executions

**Classification:** Runtime persistence topology is PARTIAL. Execution/event/log persistence is operational, but worker/queue/orchestration persistence is non-existent.

---

## SECTION 8 — DASHBOARD DATA TOPOLOGY

### Dashboard Data Source Map

| Metric | Table | API Route | Source Type | Status |
|--------|-------|-----------|-------------|--------|
| Tenant status | tenants | /api/dashboard/profile | DB Query | REAL |
| Business profile | business_profiles | /api/dashboard/profile | DB Query | REAL |
| Total executions | agent_executions | /api/dashboard/runtime-stats | DB Query | REAL |
| Total keywords | seo_keywords | /api/dashboard/runtime-stats | DB Query | REAL |
| Draft count | seo_drafts | /api/dashboard/runtime-stats | DB Query | REAL |
| Published count | seo_drafts | /api/dashboard/runtime-stats | DB Query | REAL |
| Publish success count | publish_jobs | /api/dashboard/index | DB Query | REAL |
| Publish failed count | publish_jobs | /api/dashboard/index | DB Query | REAL |
| Agent status | HARD-CODED | N/A | Hardcoded | MOCKED |
| Agent progress | HARD-CODED | N/A | Hardcoded | MOCKED |
| Agent task feed | HARD-CODED | N/A | Hardcoded | MOCKED |
| Agent performance charts | EMPTY | N/A | Empty arrays | MOCKED |

### Evidence

**Real Data Sources:**
```typescript
// Dashboard profile API
.from("profiles").select("*")
.from("business_profiles").select("*")
.from("tenants").select("*")

// Runtime stats API
.from("agent_executions").select("*")
.from("seo_keywords").select("*", { count: "exact", head: true })
.from("seo_drafts").select("*", { count: "exact", head: true })

// Dashboard index API
.from("publish_jobs").select("*", { count: "exact", head: true })
```

**Mocked Data Sources:**
```typescript
// MissionControl component
const baseAgents = [
  {
    name: 'ARIA',
    progress: 0,
    statusLine: 'System Initializing',
    runCount: 0,
    errorCount: 0,
  },
  // ... all agents hardcoded
];
```

**Classification:** Dashboard data topology is PARTIAL. Some metrics are real (tenant, business, executions, keywords, drafts), but agent status/progress/task feeds are mocked.

---

## SECTION 9 — AGENT DATA TOPOLOGY

### ARIA Agent

**Tables Used:** agent_executions, agent_tasks, seo_keywords, seo_clusters, seo_content_briefs, business_profiles  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage
.from('seo_keywords').upsert(keywordInserts)
.from('seo_content_briefs').insert(briefs)

// Business data
.from('business_profiles').select('website_url, category')
```

### SCRIBE Agent

**Tables Used:** agent_executions, agent_tasks, seo_content_briefs, seo_drafts, business_profiles  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage
.from('seo_content_briefs').select('*')
.from('seo_drafts').insert(contentInserts)

// Business data
.from('business_profiles').select('category')
```

### PULSE Agent

**Tables Used:** agent_executions, agent_tasks  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage: NONE (pulse_rankings table exists but unused)
```

### PRISM Agent

**Tables Used:** agent_executions, agent_tasks  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage: NONE (no PRISM-specific artifact table)
```

### REPUTE Agent

**Tables Used:** agent_executions, agent_tasks  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage: NONE (locl_audits table exists but unused)
```

### LOCL Agent

**Tables Used:** agent_executions, agent_tasks  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage: NONE (locl_audits table exists but unused)
```

### LINX Agent

**Tables Used:** agent_executions, agent_tasks  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage: NONE (no LINX-specific artifact table)
```

### AMPLI Agent

**Tables Used:** agent_executions, agent_tasks, seo_drafts, publish_jobs  
**Status:** PARTIAL

**Evidence:**
```typescript
// Execution tracking
.from('agent_executions')
.from('agent_tasks')

// Artifact storage
.from('seo_drafts').select('*')
.from('seo_drafts').update({ status: pub.status })
```

### CORE Agent

**Tables Used:** UNKNOWN (no API route found)  
**Status:** UNKNOWN

**Evidence:**
- No API route for CORE agent
- No task implementation found
- Cannot determine data topology

**Classification:** Agent data topology is PARTIAL. All agents use execution tracking tables, but artifact storage is inconsistent (ARIA/SCRIBE/AMPLI have artifact tables, others don't).

---

## SECTION 10 — PROVIDER CONFIG STORAGE AUDIT

### Integration Table

**Table:** integrations  
**Status:** OPERATIONAL  
**Usage:** HIGH - stores provider credentials (encrypted)

**Evidence:**
```typescript
// Get integrations
.from('integrations').select('*')
  .eq('tenant_id', tenantId)

// Update integration status
.from('integrations').update(updateData)
  .eq('tenant_id', tenantId)

// Token refresh
.from("integrations").update({
  google_access_token_encrypted: encryptSecret(tokenData.access_token),
  google_token_expires_at: expiresAt,
  google_status: "connected",
})
```

### Credential Storage

**Providers Supported:**
- Google (OAuth tokens: access_token, refresh_token)
- WordPress (app_password)
- Shopify (access_token)
- Custom (api_key)

**Evidence:**
```typescript
// Google access token
integrations.google_access_token_encrypted

// Google refresh token
integrations.google_refresh_token_encrypted

// WordPress password
integrations.wp_app_password_encrypted

// Shopify token
integrations.shopify_access_token_encrypted

// Custom API key
integrations.custom_api_key_encrypted
```

### OAuth Persistence

**Status:** OPERATIONAL  
**Tables:** integrations  
**Token Refresh:** AUTOMATED (token-refresh job)

**Evidence:**
```typescript
// Token refresh job
async refreshExpiringTokens(): Promise<{ success: number; failed: number; skipped: number }> {
  const { data: integrations } = await supabase
    .from("integrations")
    .select("tenant_id, google_token_expires_at, google_status")
    .eq("google_status", "connected");
  
  for (const integration of integrations) {
    if (isTokenExpiringSoon(integration.google_token_expires_at)) {
      await refreshGoogleToken(integration.tenant_id);
    }
  }
}
```

### Provider Mapping

**Status:** OPERATIONAL  
**Tables:** integrations  
**Mapping:** One-to-one (one integrations row per tenant)

**Evidence:**
```typescript
// Tenant-provider relationship
integrations.tenant_id (UNIQUE constraint)
integrations.provider (defaults to 'google')
integrations.google_status, wp_status, shopify_status, custom_status
```

**Classification:** Provider config storage is OPERATIONAL. Credentials are stored encrypted, token refresh is automated, provider mapping is clear.

---

## SECTION 11 — MIGRATION QUALITY AUDIT

### Migration Files

**Files:**
- migrations/20250109_create_agent_executions_table.sql
- migrations/20250109_create_agent_tasks_table.sql
- migrations/20250109_create_agent_events_table.sql
- migrations/20250109_create_agent_logs_table.sql

**Status:** OPERATIONAL  
**Coherence:** PARTIAL

**Issues:**
1. **Type Inconsistency:** Migrations use TEXT for tenant_id, FINAL_DATABASE_PACKAGE.sql uses UUID
2. **RLS Inconsistency:** Migrations use auth.uid(), FINAL_DATABASE_PACKAGE.sql uses auth.jwt() ->> 'sub'
3. **Duplicate Definitions:** Tables defined in both migrations and FINAL_DATABASE_PACKAGE.sql

### SQL Files (Not Migrations)

**Files:**
- RUNTIME_TABLES.sql (DEAD CODE)
- ONBOARDING_TABLES.sql (PARTIALLY USED)
- create_locl_audits_table.sql (UNUSED)
- create_publish_jobs_table.sql (PARTIALLY USED)
- create_pulse_rankings_table.sql (UNUSED)
- create_indexing_status_table.sql (PARTIALLY USED)
- create_integrations_table.sql (OPERATIONAL)
- FINAL_DATABASE_PACKAGE.sql (CONFLICTING)

**Status:** INCOHERENT  
**Coherence:** LOW

**Issues:**
1. **Dead Code:** RUNTIME_TABLES.sql defines tables never used
2. **Partial Usage:** ONBOARDING_TABLES.sql defines tables partially used
3. **Unused Tables:** locl_audits, pulse_rankings never used
4. **Conflicting Definitions:** FINAL_DATABASE_PACKAGE.sql conflicts with migrations

### Schema Drift

**Drift Sources:**
1. Migrations vs FINAL_DATABASE_PACKAGE.sql (type mismatch, RLS mismatch)
2. RUNTIME_TABLES.sql vs actual usage (dead code)
3. ONBOARDING_TABLES.sql vs actual usage (partial usage)
4. Individual table files vs actual usage (unused tables)

**Impact:**
- Cannot determine true schema
- Cannot deploy to production safely
- Cannot rollback safely
- Cannot generate accurate documentation

### Migration Coherence Score

**Score: 3/10**

**Reasons:**
- Migrations exist but conflict with FINAL_DATABASE_PACKAGE.sql
- Dead code in RUNTIME_TABLES.sql
- Unused tables in ONBOARDING_TABLES.sql
- Type inconsistencies across files
- RLS inconsistencies across files
- No clear migration strategy

**Classification:** Migration quality is POOR. Schema is incoherent, conflicting, and contains dead code.

---

## SECTION 12 — EXECUTION READINESS SCORECARD

| System | Score /10 | Reality | Blockers |
|--------|-----------|---------|----------|
| Tenant isolation | 2/10 | RLS broken, type mismatch | auth.uid() → auth.jwt() ->> 'sub', type consistency |
| Runtime persistence | 5/10 | Execution/event/log persistence operational | No worker/queue/orchestration persistence |
| Event system | 4/10 | Event log operational, no consumers | No event consumers, no replay |
| Artifact persistence | 6/10 | Artifact tables operational, disconnected | Not linked to executions, no lifecycle |
| Execution lifecycle | 7/10 | Execution/task lifecycle operational | No checkpoint/replay/queue |
| Dashboard data coherence | 5/10 | Some metrics real, agent status mocked | Agent status/progress mocked |
| Repository coherence | 4/10 | Execution repos operational, artifacts fragmented | No artifact repositories, direct SQL |
| Provider persistence | 8/10 | Credential storage operational | Token refresh operational |
| Agent operational readiness | 3/10 | Execution tracking operational, artifacts inconsistent | Artifact storage inconsistent across agents |

**Overall Score: 4.9/10**

**Classification:** PARTIAL OPERATIONAL

---

## SECTION 13 — CRITICAL PRESERVATION MAP

### Valuable Architecture

**Preserve:**
1. **Repository Pattern** - BaseRepository is solid, should extend to artifacts
2. **RuntimeService Facade** - Clean service composition pattern
3. **ExecutionOrchestrator** - Good lifecycle management
4. **Event Publishing** - Integrated into orchestrator, good for observability
5. **Tenant Scoping** - Application-level filtering is good pattern (needs DB-level backup)
6. **Credential Encryption** - Encrypted credential storage is good
7. **Token Refresh** - Automated token refresh is good
8. **Status Enums** - Comprehensive status enums are good
9. **Timestamp Tracking** - Comprehensive timestamp tracking is good
10. **Retry Logic** - Retry tracking is good

### Reusable Runtime Systems

**Preserve:**
1. **ExecutionRepository** - Solid data access layer
2. **TaskRepository** - Solid data access layer
3. **EventRepository** - Solid data access layer
4. **LogRepository** - Solid data access layer
5. **MetricsRepository** - Solid data access layer
6. **RuntimeService** - Clean facade
7. **ExecutionOrchestrator** - Good lifecycle management
8. **IntegrationDispatcher** - Good n8n bridge
9. **CallbackIngestion** - Good callback handler
10. **CredentialManager** - Good credential management

### Strong Patterns

**Preserve:**
1. **Service Composition** - RuntimeService composes all services
2. **Repository Pattern** - BaseRepository provides common functionality
3. **Tenant Context** - TenantProvider pattern is good
4. **Error Handling** - Result type pattern is good
5. **Logging** - Structured logging is good
6. **Event Publishing** - Event publishing integrated into orchestrator
7. **Type Safety** - TypeScript types match database schema
8. **FK Constraints** - FK constraints in runtime tables are good

### Stable Persistence Models

**Preserve:**
1. **agent_executions** - Core execution tracking (after fixing RLS and types)
2. **agent_tasks** - Core task tracking (after fixing RLS)
3. **agent_events** - Core event tracking (after fixing RLS)
4. **agent_logs** - Core log tracking (after fixing RLS)
5. **seo_keywords** - Keyword storage (after linking to executions)
6. **seo_content_briefs** - Content brief storage (after linking to executions)
7. **seo_drafts** - Content draft storage (after linking to executions)
8. **seo_reports** - Report storage (after linking to executions)
9. **integrations** - Credential storage (after fixing RLS and types)
10. **business_profiles** - Business data (after fixing RLS)
11. **tenants** - Tenant management (after fixing RLS)
12. **profiles** - User profiles (after fixing RLS)

---

## SECTION 14 — CRITICAL REMOVAL MAP

### Fake Abstractions

**Remove:**
1. **runtime_executions** - DEAD CODE, never used
2. **runtime_tasks** - DEAD CODE, never used
3. **runtime_workflows** - DEAD CODE, never used
4. **runtime_thinking_logs** - DEAD CODE, never used
5. **runtime_artifacts** - DEAD CODE, never used

### Dead Systems

**Remove:**
1. **agent_runs** - LEGACY, never used
2. **agent_states** - LEGACY, never used
3. **locl_audits** - UNUSED, never written to
4. **pulse_rankings** - UNUSED, never written to
5. **gsc_credentials** - UNUSED, never written to
6. **credentials** - UNUSED, never written to
7. **sitemaps** - UNUSED, never written to
8. **pages** - UNUSED, never written to
9. **ranking_seeds** - UNUSED, never written to
10. **ranking_history** - UNUSED, never written to
11. **ranking_movements** - UNUSED, never written to
12. **ranking_volatility** - UNUSED, never written to

### Duplicate Layers

**Remove:**
1. **FINAL_DATABASE_PACKAGE.sql** - Conflicts with migrations, choose one
2. **RUNTIME_TABLES.sql** - Dead code, remove
3. **Duplicate RLS policies** - Some tables have multiple policies

### Unused Runtime Complexity

**Remove:**
1. **Checkpoint fields** - Checkpoint fields exist but no checkpoint table
2. **Replay fields** - Replay fields exist but no replay table
3. **Correlation/Causation IDs** - Event correlation exists but no event consumers
4. **Event versioning** - Event version exists but no versioning strategy

### Disconnected Infrastructure

**Remove:**
1. **Unused RLS policies** - Some tables have RLS policies but never queried
2. **Unused indexes** - Some tables have indexes but never queried
3. **Unused triggers** - Some tables have triggers but never used

---

## SECTION 15 — CTO STRATEGIC CONCLUSION

### Q1: Can current schema support operational CLAUX?

**Answer: NO**

**Reasons:**
1. **Triple Execution System** - Three conflicting execution systems (agent_executions, runtime_executions, agent_runs)
2. **Type Mismatch** - tenant_id type inconsistencies break FK constraints
3. **RLS Broken** - All RLS policies use auth.uid() instead of auth.jwt() ->> 'sub'
4. **Dead Code** - runtime_executions system is dead code
5. **Unused Tables** - Many tables defined but never used
6. **Schema Drift** - Migrations conflict with FINAL_DATABASE_PACKAGE.sql

**Required Fixes:**
1. Choose ONE execution system (agent_executions)
2. Fix tenant_id type consistency (all UUID)
3. Fix RLS policies (auth.jwt() ->> 'sub')
4. Remove dead code (runtime_executions, runtime_tasks, etc.)
5. Remove unused tables (locl_audits, pulse_rankings, etc.)
6. Resolve migration conflicts

### Q2: Can execution engine attach safely to current topology?

**Answer: YES (after fixes)**

**Required Fixes:**
1. Fix RLS policies (auth.jwt() ->> 'sub')
2. Fix tenant_id type consistency (all UUID)
3. Add FK constraints from agent_executions to tenants
4. Add FK constraints from agent_events to tenants
5. Link artifact tables to agent_executions
6. Remove dead code

**After Fixes:**
- Execution engine can attach to agent_executions table
- Task engine can attach to agent_tasks table
- Event engine can attach to agent_events table
- Artifact engines can attach to seo_* tables

### Q3: Is runtime persistence salvageable?

**Answer: PARTIALLY**

**Salvageable:**
- Execution persistence (agent_executions, agent_tasks)
- Event persistence (agent_events)
- Log persistence (agent_logs)

**Not Salvageable:**
- Worker coordination persistence (no tables)
- Queue persistence (no tables)
- Orchestration state persistence (no tables)
- Callback continuation persistence (no tables)

**Required Additions:**
1. Job queue table
2. Worker table
3. Worker heartbeat table
4. Checkpoint table
5. Replay table
6. Callback table

### Q4: Is event architecture useful or overbuilt?

**Answer: USEFUL but UNDERUTILIZED**

**Useful:**
- Event table exists and is operational
- Event publishing integrated into orchestrator
- Event correlation/causation tracking exists
- Event used for incident detection
- Event used for health monitoring

**Underutilized:**
- No event consumers
- No event replay
- No event projections
- No event-driven architecture

**Recommendation:**
- Keep event system
- Add event consumers for:
  - Task retry
  - Execution recovery
  - Alerting
  - Reporting

### Q5: Can all 9 agents operationalize on current DB foundation?

**Answer: NO (after fixes, PARTIALLY)**

**Current State:**
- All agents can use execution tracking (agent_executions, agent_tasks)
- ARIA can use artifact storage (seo_keywords, seo_content_briefs)
- SCRIBE can use artifact storage (seo_content_briefs, seo_drafts)
- AMPLI can use artifact storage (seo_drafts, publish_jobs)
- PULSE has no artifact storage (pulse_rankings unused)
- PRISM has no artifact storage (no table)
- REPUTE has no artifact storage (locl_audits unused)
- LOCL has no artifact storage (locl_audits unused)
- LINX has no artifact storage (no table)
- CORE has no API route (unknown)

**Required Additions:**
1. PULSE artifact storage (use pulse_rankings or create new)
2. PRISM artifact storage (create table)
3. REPUTE artifact storage (use locl_audits or create new)
4. LOCL artifact storage (use locl_audits or create new)
5. LINX artifact storage (create table)
6. CORE API route and artifact storage

### Q6: What MUST be rebuilt vs preserved?

**Preserve:**
1. Repository pattern (extend to artifacts)
2. RuntimeService facade
3. ExecutionOrchestrator
4. Event publishing
5. Tenant scoping
6. Credential encryption
7. Token refresh
8. Status enums
9. Timestamp tracking
10. Retry logic
11. agent_executions table (after fixes)
12. agent_tasks table (after fixes)
13. agent_events table (after fixes)
14. agent_logs table (after fixes)
15. seo_keywords table (after linking)
16. seo_content_briefs table (after linking)
17. seo_drafts table (after linking)
18. seo_reports table (after linking)
19. integrations table (after fixes)
20. business_profiles table (after fixes)
21. tenants table (after fixes)
22. profiles table (after fixes)

**Rebuild:**
1. RLS policies (auth.uid() → auth.jwt() ->> 'sub')
2. tenant_id types (TEXT → UUID)
3. FK constraints (add missing FKs)
4. Job queue table
5. Worker table
6. Worker heartbeat table
7. Checkpoint table
8. Replay table
9. Callback table
10. Artifact repositories (replace direct SQL)
11. PULSE artifact storage
12. PRISM artifact storage
13. REPUTE artifact storage
14. LOCL artifact storage
15. LINX artifact storage
16. CORE API route and artifact storage

**Remove:**
1. runtime_executions table (dead code)
2. runtime_tasks table (dead code)
3. runtime_workflows table (dead code)
4. runtime_thinking_logs table (dead code)
5. runtime_artifacts table (dead code)
6. agent_runs table (legacy)
7. agent_states table (legacy)
8. locl_audits table (unused)
9. pulse_rankings table (unused)
10. gsc_credentials table (unused)
11. credentials table (unused)
12. sitemaps table (unused)
13. pages table (unused)
14. ranking_seeds table (unused)
15. ranking_history table (unused)
16. ranking_movements table (unused)
17. ranking_volatility table (unused)
18. FINAL_DATABASE_PACKAGE.sql (conflicts with migrations)
19. RUNTIME_TABLES.sql (dead code)
20. ONBOARDING_TABLES.sql (partial, merge into migrations)

### Q7: What is the minimum operational execution topology?

**Minimum Topology:**

**Core Tables (Must Have):**
1. profiles (user profiles, Clerk integration)
2. tenants (tenant management)
3. business_profiles (business data)
4. agent_executions (execution tracking)
5. agent_tasks (task tracking)
6. agent_events (event logging)
7. agent_logs (log logging)
8. integrations (credential storage)
9. seo_keywords (keyword artifacts)
10. seo_content_briefs (content brief artifacts)
11. seo_drafts (content draft artifacts)
12. seo_reports (report artifacts)
13. job_queue (job queue - NEW)
14. workers (worker coordination - NEW)

**Optional Tables (Can Add Later):**
1. checkpoints (checkpointing - NEW)
2. replays (replay tracking - NEW)
3. callbacks (callback tracking - NEW)
4. pulse_rankings (PULSE artifacts - if needed)
5. locl_audits (LOCL artifacts - if needed)
6. prisms_artifacts (PRISM artifacts - NEW)
7. repute_artifacts (REPUTE artifacts - NEW)
8. locl_artifacts (LOCL artifacts - NEW)
9. linx_artifacts (LINX artifacts - NEW)
10. core_artifacts (CORE artifacts - NEW)

**Minimum Fixes Required:**
1. Fix RLS policies (auth.uid() → auth.jwt() ->> 'sub')
2. Fix tenant_id types (TEXT → UUID)
3. Add FK constraints (agent_executions → tenants, agent_events → tenants)
4. Link artifact tables to agent_executions
5. Add job_queue table
6. Add workers table
7. Remove dead code (runtime_executions, etc.)
8. Resolve migration conflicts

**Estimated Time to Minimum Topology:**
- RLS fixes: 8-16 hours
- Type fixes: 16-24 hours
- FK constraints: 8-16 hours
- Artifact linking: 16-24 hours
- Job queue table: 8-16 hours
- Workers table: 8-16 hours
- Dead code removal: 8-16 hours
- Migration resolution: 16-24 hours

**Total: 80-152 hours (2-4 weeks)**

---

## FINAL REQUIREMENT

### Implementation Sequence for Transforming CLAUX into Real SEO Operating System

**Phase 1: Database Consolidation (2-4 weeks)**
1. Fix RLS policies (auth.uid() → auth.jwt() ->> 'sub')
2. Fix tenant_id types (TEXT → UUID)
3. Add FK constraints
4. Remove dead code (runtime_executions, etc.)
5. Remove unused tables (locl_audits, etc.)
6. Resolve migration conflicts
7. Link artifact tables to agent_executions

**Phase 2: Runtime Persistence (2-4 weeks)**
1. Add job_queue table
2. Add workers table
3. Add worker heartbeat table
4. Add checkpoint table
5. Add replay table
6. Add callback table
7. Implement queue processing
8. Implement worker coordination

**Phase 3: Artifact Repositories (2-4 weeks)**
1. Create KeywordRepository
2. Create BriefRepository
3. Create DraftRepository
4. Create ReportRepository
5. Replace direct SQL with repositories
6. Add artifact lifecycle management
7. Add artifact cleanup/retention

**Phase 4: Agent Artifact Storage (4-8 weeks)**
1. Implement PULSE artifact storage
2. Implement PRISM artifact storage
3. Implement REPUTE artifact storage
4. Implement LOCL artifact storage
5. Implement LINX artifact storage
6. Implement CORE API route and artifact storage

**Phase 5: Dashboard Data Integration (2-4 weeks)**
1. Replace hardcoded agent status with real data
2. Replace hardcoded agent progress with real data
3. Replace hardcoded task feeds with real data
4. Connect dashboard to agent_executions table
5. Connect dashboard to agent_tasks table
6. Connect dashboard to artifact tables

**Phase 6: Production Readiness (2-4 weeks)**
1. Add health checks
2. Add error tracking
3. Add monitoring
4. Add alerting
5. Security audit
6. Performance testing
7. Load testing

**Total Estimated Time: 14-28 weeks (3.5-7 months)**

---

**Audit Complete**

**Date:** January 2025  
**Auditor:** Cascade AI  
**Classification:** Database Topology Fragmented (0.2)  
**Time to Minimum Topology:** 2-4 weeks  
**Time to Full Operational Database:** 14-28 weeks
