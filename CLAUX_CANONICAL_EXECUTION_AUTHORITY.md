# CLAUX CANONICAL EXECUTION AUTHORITY

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 1A - Architectural Authority Purification
**Status:** Canonical Authority Established

---

## EXECUTIVE SUMMARY

This document establishes the SINGLE CANONICAL EXECUTION AUTHORITY for CLAUX as defined by the FINAL BOARD-APPROVED ARCHITECTURE. All execution, all orchestration, all credential injection, and all provider access MUST flow through this canonical authority.

**CANONICAL RUNTIME:** RuntimeService + ExecutionOrchestrator (✅ LOCKED)
**CANONICAL EXECUTION FLOW:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → Provider
**CANONICAL CREDENTIAL SYSTEM:** integrations table + runtime credential injection (✅ LOCKED)
**CANONICAL EVENT SYSTEM:** EventService (✅ LOCKED)
**CANONICAL LOGGING SYSTEM:** LogService (✅ LOCKED)

---

## CANONICAL RUNTIME AUTHORITY

### Authority Statement

**CLAUX Runtime is the ONLY orchestration authority.**

**CANONICAL COMPONENTS:**
1. **RuntimeService** (apps/web/lib/runtime/services/runtime.service.ts)
   - Single entry point for all runtime operations
   - Facade that composes all runtime services
   - Tenant-scoped execution context

2. **ExecutionOrchestrator** (apps/web/lib/runtime/orchestrator/execution-orchestrator.ts)
   - Coordinates execution lifecycle
   - Automatic event publishing
   - Automatic logging
   - Stall detection

3. **ExecutionService** (apps/web/lib/runtime/services/execution.service.ts)
   - Manages execution state in database
   - Table: agent_executions

4. **TaskService** (apps/web/lib/runtime/services/task.service.ts)
   - Manages task state in database
   - Table: agent_tasks

5. **EventService** (apps/web/lib/runtime/services/event.service.ts)
   - Publishes execution events
   - Table: agent_events

6. **LogService** (apps/web/lib/runtime/services/log.service.ts)
   - Publishes execution logs
   - Table: agent_logs

7. **MetricsService** (apps/web/lib/runtime/services/metrics.service.ts)
   - Collects runtime metrics
   - Table: agent_metrics

---

## CANONICAL EXECUTION FLOW

### Execution Flow Diagram

```
USER ACTION
  ↓
API ROUTE (Next.js)
  ↓
RuntimeService (tenant-scoped context)
  ↓
ExecutionOrchestrator (execution lifecycle)
  ↓
Runtime Task (task definition)
  ↓
Runtime Connector (provider abstraction)
  ↓
Provider API (external provider)
  ↓
Runtime Connector (response handling)
  ↓
ExecutionOrchestrator (completion)
  ↓
EventService (event publishing)
  ↓
LogService (log publishing)
  ↓
Database Persistence (agent_executions, agent_tasks, agent_events, agent_logs)
  ↓
Dashboard Reflection (canonical tables)
```

### Canonical Flow Rules

**RULE #1:** All execution MUST flow through RuntimeService
**RULE #2:** All orchestration MUST flow through ExecutionOrchestrator
**RULE #3:** All provider access MUST flow through Runtime Connectors
**RULE #4:** All credential injection MUST be runtime-scoped
**RULE #5:** All events MUST be published through EventService
**RULE #6:** All logs MUST be published through LogService
**RULE #7:** All state MUST be persisted in canonical tables

---

## CANONICAL CREDENTIAL SYSTEM

### Credential Authority Statement

**ALL credentials MUST be stored in database, encrypted, tenant-scoped, and runtime-injected.**

**CANONICAL CREDENTIAL TABLE:** integrations

**CANONICAL CREDENTIAL FUNCTIONS:**
1. `getTenantIntegrations(tenantId)` - Fetch all integrations for tenant
2. `getGoogleAccessToken(tenantId)` - Decrypt and return Google access token
3. `getGoogleRefreshToken(tenantId)` - Decrypt and return Google refresh token
4. `getWordPressAppPassword(tenantId)` - Decrypt and return WordPress app password
5. `getShopifyAccessToken(tenantId)` - Decrypt and return Shopify access token
6. `getCustomApiKey(tenantId)` - Decrypt and return custom API key

### Canonical Credential Rules

**RULE #1:** NO credentials in environment variables per tenant
**RULE #2:** NO credentials in frontend code
**RULE #3:** NO credentials passed directly to providers
**RULE #4:** ALL credentials MUST be encrypted at rest
**RULE #5:** ALL credentials MUST be tenant-scoped
**RULE #6:** ALL credentials MUST be runtime-injected only during execution

### Canonical Credential Flow

```
DATABASE (integrations table)
  ↓
ENCRYPTED CREDENTIAL (AES-256-GCM)
  ↓
RUNTIME CREDENTIAL RETRIEVAL (getTenantIntegrations)
  ↓
RUNTIME DECRYPTION (decryptSecret)
  ↓
RUNTIME INJECTION (runtime connector)
  ↓
PROVIDER API CALL (credential injected)
```

---

## CANONICAL AGENT ARCHITECTURE

### Canonical Agents

**THE 9 CANONICAL CLAUX AGENTS:**
1. **ARIA** - Keyword Intelligence
2. **SCRIBE** - Content Generation
3. **LOCL** - Local SEO Audits
4. **LINX** - Backlink Intelligence
5. **CORE** - Core SEO Operations
6. **REPUTE** - Reputation Management
7. **AMPLI** - Content Publishing
8. **PRISM** - Analytics & Reporting
9. **PULSE** - Ranking Tracking

### Canonical Agent Execution Pattern

**PATTERN:** Agent Service → RuntimeService → ExecutionOrchestrator → Runtime Task → Runtime Connector → Provider

**CURRENT STATE:** ❌ Agents use .service.ts pattern with direct provider calls
**TARGET STATE:** ✅ Agents use RuntimeService with runtime connectors

### Canonical Agent Rules

**RULE #1:** Agents MUST execute through RuntimeService
**RULE #2:** Agents MUST NOT call providers directly
**RULE #3:** Agents MUST use Runtime Connectors for provider access
**RULE #4:** Agents MUST NOT implement execution logic
**RULE #5:** Agents MUST NOT manage state directly
**RULE #6:** Agents MUST NOT publish events directly
**RULE #7:** Agents MUST NOT log directly

---

## CANONICAL PROVIDER ACCESS

### Canonical Provider Pattern

**PATTERN:** Runtime Connector → Provider API

**CANONICAL PROVIDERS:**
1. **DataForSEO** - Keyword Research
2. **OpenAI** - Content Generation
3. **SERP** - Ranking Tracking
4. **GMB (Google My Business)** - Local SEO
5. **WordPress** - Content Publishing
6. **Shopify** - E-commerce Publishing
7. **Custom API** - Custom Publishing

### Canonical Provider Rules

**RULE #1:** ALL provider access MUST flow through Runtime Connectors
**RULE #2:** NO direct provider calls from agents
**RULE #3:** ALL provider credentials MUST be runtime-injected
**RULE #4:** ALL provider errors MUST be handled by runtime
**RULE #5:** ALL provider events MUST be published by runtime
**RULE #6:** ALL provider logs MUST be published by runtime
**RULE #7:** ALL provider rate limits MUST be enforced by runtime

---

## CANONICAL DATABASE SCHEMA

### Canonical Runtime Tables

**TABLE 1: agent_executions**
- Purpose: Execution state management
- Columns: id, tenant_id, agent_name, workflow_type, status, metadata, created_at, updated_at, completed_at
- Canonical: ✅ YES

**TABLE 2: agent_tasks**
- Purpose: Task state management
- Columns: id, execution_id, task_name, task_type, status, input_payload, output_payload, retry_count, created_at, updated_at, completed_at
- Canonical: ✅ YES

**TABLE 3: agent_events**
- Purpose: Event publishing
- Columns: id, tenant_id, execution_id, event_name, event_source, event_version, payload, created_at
- Canonical: ✅ YES

**TABLE 4: agent_logs**
- Purpose: Log publishing
- Columns: id, tenant_id, execution_id, level, message, context, created_at
- Canonical: ✅ YES

**TABLE 5: agent_metrics**
- Purpose: Metrics collection
- Columns: id, tenant_id, metric_name, metric_value, created_at
- Canonical: ✅ YES

### Canonical Credential Table

**TABLE 6: integrations**
- Purpose: Credential storage
- Columns: id, tenant_id, provider, google_access_token_encrypted, google_refresh_token_encrypted, wp_app_password_encrypted, shopify_access_token_encrypted, custom_api_key_encrypted, google_status, wp_status, shopify_status, custom_status, metadata, created_at, updated_at
- Canonical: ✅ YES

### Deprecated Tables (To Be Removed)

**TABLE 7: agent_runs** - DEPRECATED
- Purpose: Old execution state
- Canonical: ❌ NO
- Action: Remove after dashboard migration

**TABLE 8: agent_states** - DEPRECATED
- Purpose: Old state tracking
- Canonical: ❌ NO
- Action: Remove after dashboard migration

**TABLE 9: agent_activities** - DEPRECATED
- Purpose: Old activity tracking
- Canonical: ❌ NO
- Action: Remove after dashboard migration

---

## CANONICAL API ROUTES

### Canonical Execution Entry Points

**ROUTE 1: /api/agents/aria/discovery**
- Authority: RuntimeService + ExecutionOrchestrator
- Pattern: Canonical ✅
- Status: OPERATIONAL

**ROUTE 2: /api/agents/scribe/draft**
- Authority: RuntimeService + ExecutionOrchestrator
- Pattern: Canonical ✅
- Status: OPERATIONAL

**ROUTE 3: /api/runtime/task**
- Authority: RuntimeService + TaskService
- Pattern: Canonical ✅
- Status: OPERATIONAL

**ROUTE 4: /api/runtime/timeline**
- Authority: RuntimeService + ExecutionService
- Pattern: Canonical ✅
- Status: OPERATIONAL

**ROUTE 5: /api/runtime/recovery**
- Authority: RuntimeService + RecoverySystem
- Pattern: Canonical ✅
- Status: OPERATIONAL

### Deprecated API Routes (To Be Removed)

**ROUTE 6: /api/agents/linx/execute** - DEPRECATED
- Authority: Deprecated Runtime Wrapper
- Pattern: Deprecated ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 7: /api/agents/repute/execute** - DEPRECATED
- Authority: Deprecated Runtime Wrapper
- Pattern: Deprecated ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 8: /api/agents/prism/execute** - DEPRECATED
- Authority: Deprecated Runtime Wrapper
- Pattern: Deprecated ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 9: /api/agents/locl/execute** - DEPRECATED
- Authority: Deprecated Runtime Wrapper
- Pattern: Deprecated ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 10: /api/agents/pulse/execute** - DEPRECATED
- Authority: Deprecated Runtime Wrapper
- Pattern: Deprecated ❌
- Status: NON-OPERATIONAL
- Action: Remove

### Dangerous API Routes (To Be Removed)

**ROUTE 11: /api/integrations/dispatch/cms** - DANGEROUS
- Authority: None (bypasses runtime)
- Pattern: Dangerous ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 12: /api/integrations/dispatch/gsc** - DANGEROUS
- Authority: None (bypasses runtime)
- Pattern: Dangerous ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 13: /api/integrations/dispatch/openai** - DANGEROUS
- Authority: None (bypasses runtime)
- Pattern: Dangerous ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 14: /api/integrations/dispatch/gbp** - DANGEROUS
- Authority: None (bypasses runtime)
- Pattern: Dangerous ❌
- Status: NON-OPERATIONAL
- Action: Remove

**ROUTE 15: /api/integrations/dispatch/dataforseo** - DANGEROUS
- Authority: None (bypasses runtime)
- Pattern: Dangerous ❌
- Status: NON-OPERATIONAL
- Action: Remove

### Webhook Callback Routes (Preserve for External Automation)

**ROUTE 16: /api/integrations/callback/gsc** - WEBHOOK-ONLY
- Authority: Webhook bridge (not orchestration)
- Pattern: Webhook ✅
- Status: PRESERVE
- Action: Mark as webhook-only

**ROUTE 17: /api/integrations/callback/openai** - WEBHOOK-ONLY
- Authority: Webhook bridge (not orchestration)
- Pattern: Webhook ✅
- Status: PRESERVE
- Action: Mark as webhook-only

**ROUTE 18: /api/integrations/callback/cms** - WEBHOOK-ONLY
- Authority: Webhook bridge (not orchestration)
- Pattern: Webhook ✅
- Status: PRESERVE
- Action: Mark as webhook-only

**ROUTE 19: /api/integrations/callback/gbp** - WEBHOOK-ONLY
- Authority: Webhook bridge (not orchestration)
- Pattern: Webhook ✅
- Status: PRESERVE
- Action: Mark as webhook-only

**ROUTE 20: /api/integrations/callback/dataforseo** - WEBHOOK-ONLY
- Authority: Webhook bridge (not orchestration)
- Pattern: Webhook ✅
- Status: PRESERVE
- Action: Mark as webhook-only

---

## CANONICAL AUTHORITY ENFORCEMENT

### Authority Violation Detection

**VIOLATION #1:** Direct provider calls from agents
- Detection: grep for "from.*shared" in agent services
- Current: 4 violations (aria, scribe, pulse, locl)
- Action: Refactor to use runtime connectors

**VIOLATION #2:** Direct credential passing
- Detection: grep for credential parameters in agent services
- Current: 1 violation (publish.service.ts)
- Action: Refactor to use runtime credential injection

**VIOLATION #3:** Alternate runtime systems
- Detection: grep for "AgentRuntimeDatabase" or "AgentRuntimeSDK"
- Current: 1 violation (events, observability, workflows)
- Action: Refactor to use canonical RuntimeService

**VIOLATION #4:** Alternate logging systems
- Detection: grep for "agent.logger" in agent services
- Current: 5 violations (aria, scribe, publish, locl, pulse)
- Action: Refactor to use canonical LogService

**VIOLATION #5:** Deprecated runtime table queries
- Detection: grep for "agent_runs", "agent_states", "agent_activities"
- Current: 5 violations (dashboard, actions, v1 API)
- Action: Migrate to canonical tables

---

## CANONICAL EXECUTION AUTHORITY LAW

### LAW #1: SINGLE RUNTIME AUTHORITY

**CLAUX Runtime is the ONLY orchestration authority.**

**MANDATE:** All execution MUST flow through RuntimeService + ExecutionOrchestrator.

**VIOLATION:** Any system that bypasses RuntimeService or ExecutionOrchestrator.

---

### LAW #2: SINGLE CREDENTIAL AUTHORITY

**Integrations table + runtime credential injection is the ONLY credential system.**

**MANDATE:** All credentials MUST be stored in integrations table, encrypted, tenant-scoped, and runtime-injected.

**VIOLATION:** Any credential storage outside integrations table or direct credential passing.

---

### LAW #3: SINGLE PROVIDER ACCESS AUTHORITY

**Runtime Connectors are the ONLY provider access layer.**

**MANDATE:** All provider access MUST flow through Runtime Connectors with runtime credential injection.

**VIOLATION:** Any direct provider call from agents or direct credential passing to providers.

---

### LAW #4: SINGLE EVENT AUTHORITY

**EventService is the ONLY event publishing system.**

**MANDATE:** All events MUST be published through EventService.

**VIOLATION:** Any event publishing outside EventService.

---

### LAW #5: SINGLE LOGGING AUTHORITY

**LogService is the ONLY logging system.**

**MANDATE:** All logs MUST be published through LogService.

**VIOLATION:** Any logging outside LogService.

---

### LAW #6: SINGLE DATABASE AUTHORITY

**Canonical runtime tables are the ONLY state storage.**

**MANDATE:** All execution state MUST be stored in agent_executions, agent_tasks, agent_events, agent_logs.

**VIOLATION:** Any state storage in deprecated tables (agent_runs, agent_states, agent_activities).

---

## CANONICAL EXECUTION AUTHORITY MATRIX

| Component | Authority | Status | Enforcement |
|-----------|-----------|--------|-------------|
| RuntimeService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| ExecutionOrchestrator | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| ExecutionService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| TaskService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| EventService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| LogService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| MetricsService | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| Credential System | CANONICAL ✅ | OPERATIONAL | ENFORCED |
| Agent Runtime SDK/Database | CONFLICTING ❌ | OPERATIONAL | BLOCKED |
| Agent Logger | CONFLICTING ❌ | OPERATIONAL | BLOCKED |
| Old Runtime Tables | CONFLICTING ❌ | OPERATIONAL | BLOCKED |
| Integration Mesh Orchestration | DANGEROUS ❌ | NON-OPERATIONAL | REMOVE |
| Dispatch API Routes | DANGEROUS ❌ | NON-OPERATIONAL | REMOVE |
| Direct Provider Clients | DANGEROUS ❌ | OPERATIONAL | BLOCKED |
| CMS Connectors (Direct) | DANGEROUS ❌ | OPERATIONAL | BLOCKED |

---

## CANONICAL AUTHORITY COMPLIANCE

### Current Compliance Status

**CANONICAL COMPONENTS:** 8 ✅
**CONFLICTING COMPONENTS:** 3 ❌ (BLOCKED)
**DANGEROUS COMPONENTS:** 5 ❌ (2 SAFE TO REMOVE, 3 BLOCKED)
**DEAD COMPONENTS:** 6 ❌ (SAFE TO REMOVE)

**COMPLIANCE SCORE:** 8/22 (36%)

### Target Compliance Status (After Phase 1A.1)

**CANONICAL COMPONENTS:** 8 ✅
**CONFLICTING COMPONENTS:** 3 ❌ (BLOCKED)
**DANGEROUS COMPONENTS:** 3 ❌ (BLOCKED)
**DEAD COMPONENTS:** 0 ✅ (REMOVED)

**COMPLIANCE SCORE:** 8/14 (57%)

### Target Compliance Status (After Phase 2-3)

**CANONICAL COMPONENTS:** 8 ✅
**CONFLICTING COMPONENTS:** 0 ✅ (REFACTORED)
**DANGEROUS COMPONENTS:** 0 ✅ (REFACTORED)
**DEAD COMPONENTS:** 0 ✅ (REMOVED)

**COMPLIANCE SCORE:** 8/8 (100%)

---

## CANONICAL AUTHORITY ENFORCEMENT PLAN

### Phase 1A.1: Remove Dead and Dangerous Systems (Week 1)

**OBJECTIVE:** Remove all dead and dangerous systems with zero dependencies

**SYSTEMS TO REMOVE:**
1. Integration Mesh Orchestration (8 files)
2. Dispatch API Routes (5 files)
3. Deprecated Runtime Wrappers (5 files)
4. Canonical System Agents (2 files)
5. Unused Agent Subsystems (7 dirs, ~20 files)
6. Agent Thinking Subsystems (4 files)
7. Runtime Adapters (2 files)
8. Runtime Tasks (8 files)
9. Empty Monorepo Directories (3 dirs)

**EXPECTED OUTCOME:** 57+ files removed, zero breakage

---

### Phase 2: Resolve Conflicting Systems (Week 2-3)

**OBJECTIVE:** Refactor or migrate conflicting systems to canonical authority

**SYSTEMS TO RESOLVE:**
1. Agent Runtime SDK/Database (refactor events, observability, workflows)
2. Old Runtime Tables (migrate dashboard, actions, v1 API)

**EXPECTED OUTCOME:** 2 conflicting systems resolved, canonical authority unified

---

### Phase 3: Refactor Provider Access (Week 4-7)

**OBJECTIVE:** Refactor all provider access to use runtime connectors

**SYSTEMS TO REFACTOR:**
1. Create Runtime Connectors (7 providers)
2. Integrate Real Provider APIs (4 providers)
3. Refactor Agent Services (5 agents)
4. Remove Mock Provider Clients (4 files)
5. Remove Agent Logger (1 file)

**EXPECTED OUTCOME:** 100% provider access through canonical authority

---

## CANONICAL AUTHORITY VERIFICATION

### Pre-Deployment Verification Checklist

- [ ] RuntimeService is the only runtime entry point
- [ ] ExecutionOrchestrator is the only orchestration authority
- [ ] All credentials are in integrations table
- [ ] All credentials are encrypted
- [ ] All credentials are tenant-scoped
- [ ] All credentials are runtime-injected
- [ ] All provider access flows through Runtime Connectors
- [ ] All events are published through EventService
- [ ] All logs are published through LogService
- [ ] All state is in canonical runtime tables
- [ ] No direct provider calls from agents
- [ ] No direct credential passing
- [ ] No alternate runtime systems
- [ ] No alternate logging systems
- [ ] No deprecated runtime table queries

### Post-Deployment Verification Checklist

- [ ] All agents execute through RuntimeService
- [ ] All provider access uses Runtime Connectors
- [ ] All credentials are runtime-injected
- [ ] All events are published through EventService
- [ ] All logs are published through LogService
- [ ] Dashboard queries canonical tables
- [ ] No references to dead systems
- [ ] No references to conflicting systems
- [ ] No references to dangerous systems

---

## FINAL AUTHORITY STATEMENT

**CLAUX Canonical Execution Authority is FINAL and LOCKED.**

**SINGLE RUNTIME AUTHORITY:** RuntimeService + ExecutionOrchestrator
**SINGLE CREDENTIAL AUTHORITY:** integrations table + runtime credential injection
**SINGLE PROVIDER ACCESS AUTHORITY:** Runtime Connectors
**SINGLE EVENT AUTHORITY:** EventService
**SINGLE LOGGING AUTHORITY:** LogService
**SINGLE DATABASE AUTHORITY:** Canonical runtime tables

**ANY SYSTEM THAT VIOLATES THESE AUTHORITIES MUST BE REMOVED OR REFACTORED.**

**NO EXCEPTIONS.**
**NO NEGOTIATION.**
**NO ARCHITECTURE DRIFT.**

---

**END OF AUTHORITY**
