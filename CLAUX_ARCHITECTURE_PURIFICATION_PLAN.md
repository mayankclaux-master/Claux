# CLAUX ARCHITECTURE PURIFICATION PLAN

**Date:** 2025-01-09
**Architect:** Cascade AI
**Scope:** Complete architecture purification plan for CLAUX
**Phase:** Phase 1 - Architecture Purification

---

## EXECUTIVE SUMMARY

This plan provides a **dependency-safe, zero-breakage migration strategy** to purify the CLAUX architecture to align with the FINAL CLAUX ARCHITECTURE. The plan is divided into 4 phases with exact cleanup order, sequencing, and rollback procedures.

**TOTAL SYSTEMS TO REMOVE:** 22 conflicts + 16 dead systems = 38 systems
**TOTAL FILES TO DELETE:** 60+ files
**TOTAL FILES TO REFACTOR:** 5 agent services + dashboard
**ESTIMATED EFFORT:** 4-6 weeks
**ESTIMATED BREAKAGE RISK:** LOW (with this plan)

---

## PHASE 1: IMMEDIATE PURIFICATION (Week 1)

**OBJECTIVE:** Remove all dangerous and dead systems with zero dependencies
**RISK LEVEL:** LOW
**BREAKAGE RISK:** NONE

### Step 1.1: Remove Dangerous Dispatch API Routes

**SYSTEMS TO REMOVE:**
- `apps/web/app/api/integrations/dispatch/cms/route.ts`
- `apps/web/app/api/integrations/dispatch/gsc/route.ts`
- `apps/web/app/api/integrations/dispatch/openai/route.ts`
- `apps/web/app/api/integrations/dispatch/gbp/route.ts`
- `apps/web/app/api/integrations/dispatch/dataforseo/route.ts`

**DEPENDENCIES:** None (not used by any agent)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/app/api/integrations/dispatch/cms/route.ts
rm apps/web/app/api/integrations/dispatch/gsc/route.ts
rm apps/web/app/api/integrations/dispatch/openai/route.ts
rm apps/web/app/api/integrations/dispatch/gbp/route.ts
rm apps/web/app/api/integrations/dispatch/dataforseo/route.ts
rmdir apps/web/app/api/integrations/dispatch
```

**VERIFICATION:**
```bash
# Verify no references to dispatch routes
grep -r "integrations/dispatch" apps/web/app/api
# Should return nothing
```

---

### Step 1.2: Remove Deprecated Agent API Routes

**SYSTEMS TO REMOVE:**
- `apps/web/app/api/agents/linx/execute/route.ts`
- `apps/web/app/api/agents/repute/execute/route.ts`
- `apps/web/app/api/agents/prism/execute/route.ts`
- `apps/web/app/api/agents/locl/execute/route.ts`
- `apps/web/app/api/agents/pulse/execute/route.ts`

**DEPENDENCIES:** None (agents don't exist or use different patterns)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm -rf apps/web/app/api/agents/linx
rm -rf apps/web/app/api/agents/repute
rm -rf apps/web/app/api/agents/prism
rm -rf apps/web/app/api/agents/locl
rm -rf apps/web/app/api/agents/pulse
```

**VERIFICATION:**
```bash
# Verify no references to deprecated routes
grep -r "agents/linx/execute\|agents/repute/execute\|agents/prism/execute\|agents/locl/execute\|agents/pulse/execute" apps/web
# Should return nothing
```

---

### Step 1.3: Remove Integration Mesh Orchestration

**SYSTEMS TO REMOVE:**
- `apps/web/lib/integrations/mesh/dispatchers/index.ts`
- `apps/web/lib/integrations/mesh/feature-flags.ts`
- `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts`
- `apps/web/lib/integrations/mesh/recovery/recovery-tests.ts`
- `apps/web/lib/integrations/mesh/recovery/provider-recovery-tests.ts`
- `apps/web/lib/integrations/mesh/runtime/state-machine.ts`
- `apps/web/lib/integrations/mesh/runtime/index.ts`
- `apps/web/lib/integrations/mesh/observability/index.ts`

**DEPENDENCIES:** None (all feature flags disabled)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm -rf apps/web/lib/integrations/mesh/dispatchers
rm apps/web/lib/integrations/mesh/feature-flags.ts
rm apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts
rm -rf apps/web/lib/integrations/mesh/recovery
rm -rf apps/web/lib/integrations/mesh/runtime
rm -rf apps/web/lib/integrations/mesh/observability
```

**VERIFICATION:**
```bash
# Verify no references to integration mesh orchestration
grep -r "IntegrationDispatcher\|ENABLE_.*_DISPATCH_EXECUTION\|shouldUseIntegrationMesh" apps/web
# Should return nothing
```

---

### Step 1.4: Remove Empty Monorepo Directories

**SYSTEMS TO REMOVE:**
- `apps/api/` (empty directory)
- `agents/` (empty directory)
- `lib/` (empty directory)

**DEPENDENCIES:** None (empty directories)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore directories from git

**EXECUTION:**
```bash
rmdir apps/api
rmdir agents
rmdir lib
```

**VERIFICATION:**
```bash
# Verify directories removed
ls apps/
ls -d agents/ lib/ 2>/dev/null || echo "Directories removed successfully"
```

---

### Step 1.5: Remove Unused Agent Subsystems

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/capabilities/` (3 files)
- `apps/web/lib/agents/governance/` (3 files)
- `apps/web/lib/agents/memory/` (3 files)
- `apps/web/lib/agents/planning/` (3 files)
- `apps/web/lib/agents/topology/` (3 files)
- `apps/web/lib/agents/registry/` (3 files)
- `apps/web/lib/agents/runtime/` (5 files)
- `apps/web/lib/agents/linx/thinking.ts`
- `apps/web/lib/agents/locl/thinking.ts`
- `apps/web/lib/agents/prism/thinking.ts`
- `apps/web/lib/agents/pulse/thinking.ts`

**DEPENDENCIES:** None (not used by any agent)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm -rf apps/web/lib/agents/capabilities
rm -rf apps/web/lib/agents/governance
rm -rf apps/web/lib/agents/memory
rm -rf apps/web/lib/agents/planning
rm -rf apps/web/lib/agents/topology
rm -rf apps/web/lib/agents/registry
rm -rf apps/web/lib/agents/runtime
rm apps/web/lib/agents/linx/thinking.ts
rm apps/web/lib/agents/locl/thinking.ts
rm apps/web/lib/agents/prism/thinking.ts
rm apps/web/lib/agents/pulse/thinking.ts
```

**VERIFICATION:**
```bash
# Verify no references to removed subsystems
grep -r "from.*capabilities\|from.*governance\|from.*memory\|from.*planning\|from.*topology\|from.*registry" apps/web/lib/agents
# Should return nothing
```

---

### Step 1.6: Remove Deprecated Runtime Wrappers

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/linx/runtime.ts`
- `apps/web/lib/agents/repute/runtime.ts`
- `apps/web/lib/agents/prism/runtime.ts`
- `apps/web/lib/agents/locl/runtime.ts` (deprecated)
- `apps/web/lib/agents/pulse/runtime.ts` (deprecated)

**DEPENDENCIES:** None (deprecated, not used)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/lib/agents/linx/runtime.ts
rm apps/web/lib/agents/repute/runtime.ts
rm apps/web/lib/agents/prism/runtime.ts
rm apps/web/lib/agents/locl/runtime.ts
rm apps/web/lib/agents/pulse/runtime.ts
```

**VERIFICATION:**
```bash
# Verify no references to deprecated runtime wrappers
grep -r "LinxAgentRuntime\|ReputeAgentRuntime\|PrismAgentRuntime\|LoclAgentRuntime\|PulseAgentRuntime" apps/web
# Should return nothing
```

---

### Step 1.7: Remove Canonical System Agents

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/system/canonical-agents.ts`
- `apps/web/lib/agents/system/types.ts`

**DEPENDENCIES:** None (not used by business agents)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/lib/agents/system/canonical-agents.ts
rm apps/web/lib/agents/system/types.ts
rmdir apps/web/lib/agents/system
```

**VERIFICATION:**
```bash
# Verify no references to canonical system agents
grep -r "canonical-agents\|PLANNER_AGENT\|EXECUTOR_AGENT\|VALIDATOR_AGENT" apps/web
# Should return nothing
```

---

### Step 1.8: Remove Runtime Adapters (Dead)

**SYSTEMS TO REMOVE:**
- `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
- `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`

**DEPENDENCIES:** None (dead code, not used)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/lib/runtime/adapters/providers/openai.adapter.ts
rm apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts
rmdir apps/web/lib/runtime/adapters/providers
rmdir apps/web/lib/runtime/adapters
```

**VERIFICATION:**
```bash
# Verify no references to runtime adapters
grep -r "runtime/adapters" apps/web
# Should return nothing
```

---

### Step 1.9: Remove Runtime Tasks (Dead)

**SYSTEMS TO REMOVE:**
- `apps/web/lib/runtime/tasks/aria.tasks.ts`
- `apps/web/lib/runtime/tasks/scribe.tasks.ts`
- `apps/web/lib/runtime/tasks/locl.tasks.ts`
- `apps/web/lib/runtime/tasks/linx.tasks.ts`
- `apps/web/lib/runtime/tasks/repute.tasks.ts`
- `apps/web/lib/runtime/tasks/prism.tasks.ts`
- `apps/web/lib/runtime/tasks/pulse.tasks.ts`
- `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**DEPENDENCIES:** None (dead code, not used)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/lib/runtime/tasks/aria.tasks.ts
rm apps/web/lib/runtime/tasks/scribe.tasks.ts
rm apps/web/lib/runtime/tasks/locl.tasks.ts
rm apps/web/lib/runtime/tasks/linx.tasks.ts
rm apps/web/lib/runtime/tasks/repute.tasks.ts
rm apps/web/lib/runtime/tasks/prism.tasks.ts
rm apps/web/lib/runtime/tasks/pulse.tasks.ts
rm apps/web/lib/runtime/tasks/ampli.tasks.ts
rmdir apps/web/lib/runtime/tasks
```

**VERIFICATION:**
```bash
# Verify no references to runtime tasks
grep -r "runtime/tasks" apps/web
# Should return nothing
```

---

## PHASE 1 COMPLETION CHECKLIST

- [ ] Dispatch API routes removed
- [ ] Deprecated agent API routes removed
- [ ] Integration mesh orchestration removed
- [ ] Empty monorepo directories removed
- [ ] Unused agent subsystems removed
- [ ] Deprecated runtime wrappers removed
- [ ] Canonical system agents removed
- [ ] Runtime adapters removed
- [ ] Runtime tasks removed

**PHASE 1 STATUS:** Ready to execute

---

## PHASE 2: DASHBOARD MIGRATION (Week 2)

**OBJECTIVE:** Migrate dashboard from old runtime to new runtime
**RISK LEVEL:** MEDIUM
**BREAKAGE RISK:** LOW (with testing)

### Step 2.1: Migrate Agent States API Route

**FILE:** `apps/web/app/api/dashboard/agent-states/route.ts`

**CURRENT BEHAVIOR:**
- Queries `agent_states` table (deprecated)
- Returns agent states from old runtime

**TARGET BEHAVIOR:**
- Query `agent_executions` table (canonical)
- Return execution states from new runtime

**MIGRATION STRATEGY:**
```typescript
// BEFORE (deprecated)
const { data: states } = await supabase
  .from('agent_states')
  .select('*')
  .eq('tenant_id', tenantId);

// AFTER (canonical)
const { data: executions } = await supabase
  .from('agent_executions')
  .select('*')
  .eq('tenant_id', tenantId);
```

**DEPENDENCIES:** None
**BREAKAGE RISK:** LOW
**ROLLBACK:** Restore original file

**TESTING:**
- Test dashboard loads correctly
- Test agent states display correctly
- Test filtering works

---

### Step 2.2: Migrate Agent Activities API Route

**FILE:** `apps/web/app/api/dashboard/agent-activities/route.ts`

**CURRENT BEHAVIOR:**
- Queries `agent_activities` table (deprecated)
- Returns agent activities from old runtime

**TARGET BEHAVIOR:**
- Query `agent_events` table (canonical)
- Return events from new runtime

**MIGRATION STRATEGY:**
```typescript
// BEFORE (deprecated)
const { data: activities } = await supabase
  .from('agent_activities')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false })
  .limit(50);

// AFTER (canonical)
const { data: events } = await supabase
  .from('agent_events')
  .select('*')
  .eq('tenant_id', tenantId)
  .order('created_at', { ascending: false })
  .limit(50);
```

**DEPENDENCIES:** None
**BREAKAGE RISK:** LOW
**ROLLBACK:** Restore original file

**TESTING:**
- Test dashboard loads correctly
- Test activity feed displays correctly
- Test pagination works

---

### Step 2.3: Migrate Dashboard Stats Functions

**FILE:** `apps/web/lib/dashboard/index.ts`

**CURRENT BEHAVIOR:**
- Queries old runtime tables
- Functions: getAriaStats, getScribeStats, getPulseStats, getLoclStats

**TARGET BEHAVIOR:**
- Query new runtime tables
- Update all stats functions

**MIGRATION STRATEGY:**
```typescript
// BEFORE (deprecated)
async function getAriaStats(tenantId: string) {
  const { data } = await supabase
    .from('aria_keywords')
    .select('id')
    .eq('tenant_id', tenantId);
  return { totalKeywords: data?.length || 0 };
}

// AFTER (canonical) - also query agent_executions for execution stats
async function getAriaStats(tenantId: string) {
  const { data: keywords } = await supabase
    .from('aria_keywords')
    .select('id')
    .eq('tenant_id', tenantId);
  
  const { data: executions } = await supabase
    .from('agent_executions')
    .select('id, status')
    .eq('agent_name', 'ARIA')
    .eq('tenant_id', tenantId);
  
  return {
    totalKeywords: keywords?.length || 0,
    totalExecutions: executions?.length || 0,
    completedExecutions: executions?.filter(e => e.status === 'completed').length || 0,
  };
}
```

**DEPENDENCIES:** None
**BREAKAGE RISK:** LOW
**ROLLBACK:** Restore original file

**TESTING:**
- Test dashboard loads correctly
- Test stats display correctly
- Test all agent stats

---

### Step 2.4: Remove Old Runtime API Routes

**SYSTEMS TO REMOVE:**
- `apps/web/app/api/dashboard/agent-states/route.ts` (after migration)
- `apps/web/app/api/dashboard/agent-activities/route.ts` (after migration)

**DEPENDENCIES:** None (after migration)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/app/api/dashboard/agent-states/route.ts
rm apps/web/app/api/dashboard/agent-activities/route.ts
```

**VERIFICATION:**
```bash
# Verify no references to old runtime tables
grep -r "agent_states\|agent_activities\|agent_runs" apps/web/lib/dashboard
# Should return nothing
```

---

## PHASE 2 COMPLETION CHECKLIST

- [ ] Agent states API route migrated
- [ ] Agent activities API route migrated
- [ ] Dashboard stats functions migrated
- [ ] Old runtime API routes removed
- [ ] Dashboard tested
- [ ] No references to old runtime tables

**PHASE 2 STATUS:** Ready to execute after Phase 1

---

## PHASE 3: AGENT MIGRATION (Week 3-4)

**OBJECTIVE:** Migrate agents from .service.ts pattern to runtime tasks
**RISK LEVEL:** HIGH
**BREAKAGE RISK:** MEDIUM (requires careful refactoring)

### Step 3.1: Create Runtime Connectors

**NEW FILES TO CREATE:**
- `apps/web/lib/runtime/connectors/dataforseo.connector.ts`
- `apps/web/lib/runtime/connectors/openai.connector.ts`
- `apps/web/lib/runtime/connectors/serp.connector.ts`
- `apps/web/lib/runtime/connectors/gmb.connector.ts`
- `apps/web/lib/runtime/connectors/wordpress.connector.ts`
- `apps/web/lib/runtime/connectors/shopify.connector.ts`
- `apps/web/lib/runtime/connectors/custom.connector.ts`

**PATTERN:**
```typescript
// Example: dataforseo.connector.ts
import { getTenantIntegrations } from '@/lib/integrations/utils';

export class DataForSEOConnector {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async fetchKeywordsForSite(domain: string) {
    // Get credentials via runtime credential injection
    // Call real DataForSEO API
    // Handle errors via runtime
    // Return results
  }
}
```

**DEPENDENCIES:** Credential system (already exists)
**BREAKAGE RISK:** NONE (new files)
**ROLLBACK:** Delete new files

---

### Step 3.2: Create Runtime Tasks for ARIA

**NEW FILE TO CREATE:**
- `apps/web/lib/runtime/tasks/aria-runtime.tasks.ts`

**PATTERN:**
```typescript
import { DataForSEOConnector } from '../connectors/dataforseo.connector';

export const ariaTasks = {
  async fetchKeywords(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new DataForSEOConnector(tenantId);
    const keywords = await connector.fetchKeywordsForSite(inputPayload.domain);
    return keywords;
  },
};
```

**DEPENDENCIES:** Runtime connectors
**BREAKAGE RISK:** NONE (new file)
**ROLLBACK:** Delete new file

---

### Step 3.3: Create Runtime Tasks for SCRIBE

**NEW FILE TO CREATE:**
- `apps/web/lib/runtime/tasks/scribe-runtime.tasks.ts`

**PATTERN:**
```typescript
import { OpenAIConnector } from '../connectors/openai.connector';

export const scribeTasks = {
  async generateArticle(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new OpenAIConnector(tenantId);
    const article = await connector.generateArticle(inputPayload.keyword, inputPayload.businessCategory);
    return article;
  },
};
```

**DEPENDENCIES:** Runtime connectors
**BREAKAGE RISK:** NONE (new file)
**ROLLBACK:** Delete new file

---

### Step 3.4: Create Runtime Tasks for LOCL

**NEW FILE TO CREATE:**
- `apps/web/lib/runtime/tasks/locl-runtime.tasks.ts`

**PATTERN:**
```typescript
import { GMBConnector } from '../connectors/gmb.connector';

export const loclTasks = {
  async fetchBusinessProfile(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new GMBConnector(tenantId);
    const profile = await connector.fetchBusinessProfile(inputPayload.businessName);
    return profile;
  },
};
```

**DEPENDENCIES:** Runtime connectors
**BREAKAGE RISK:** NONE (new file)
**ROLLBACK:** Delete new file

---

### Step 3.5: Create Runtime Tasks for PULSE

**NEW FILE TO CREATE:**
- `apps/web/lib/runtime/tasks/pulse-runtime.tasks.ts`

**PATTERN:**
```typescript
import { SERPConnector } from '../connectors/serp.connector';

export const pulseTasks = {
  async fetchKeywordRank(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new SERPConnector(tenantId);
    const rank = await connector.fetchKeywordRank(inputPayload.keyword, inputPayload.domain);
    return rank;
  },
};
```

**DEPENDENCIES:** Runtime connectors
**BREAKAGE RISK:** NONE (new file)
**ROLLBACK:** Delete new file

---

### Step 3.6: Create Runtime Tasks for PUBLISH (AMPLI)

**NEW FILE TO CREATE:**
- `apps/web/lib/runtime/tasks/publish-runtime.tasks.ts`

**PATTERN:**
```typescript
import { WordPressConnector } from '../connectors/wordpress.connector';
import { ShopifyConnector } from '../connectors/shopify.connector';
import { CustomConnector } from '../connectors/custom.connector';

export const publishTasks = {
  async publishToWordPress(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new WordPressConnector(tenantId);
    const result = await connector.publishPost(inputPayload);
    return result;
  },
  async publishToShopify(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new ShopifyConnector(tenantId);
    const result = await connector.publishPost(inputPayload);
    return result;
  },
  async publishToCustom(context: TaskContext) {
    const { tenantId, inputPayload } = context;
    const connector = new CustomConnector(tenantId);
    const result = await connector.publishPost(inputPayload);
    return result;
  },
};
```

**DEPENDENCIES:** Runtime connectors
**BREAKAGE RISK:** NONE (new file)
**ROLLBACK:** Delete new file

---

### Step 3.7: Refactor ARIA Agent Service

**FILE:** `apps/web/lib/agents/aria/aria.service.ts`

**CURRENT BEHAVIOR:**
- Direct provider client calls
- Direct database operations
- Direct logging

**TARGET BEHAVIOR:**
- Execute through runtime tasks
- Runtime handles provider access
- Runtime handles logging

**MIGRATION STRATEGY:**
```typescript
// BEFORE (current)
import { fetchKeywordsForSite } from "../shared/dataforseo.client";
// ... direct calls

// AFTER (canonical)
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { ariaTasks } from "@/lib/runtime/tasks/aria-runtime.tasks";

export async function executeAriaDiscovery(context: AgentContext) {
  const runtime = new RuntimeService({ tenantId: context.tenantId });
  const orchestrator = new ExecutionOrchestrator(runtime, { tenantId: context.tenantId });
  
  const result = await orchestrator.createExecution({
    agentName: 'ARIA',
    workflowType: 'keyword_discovery',
    inputPayload: context.input,
    tasks: [{
      taskName: 'fetch_keywords',
      taskType: 'fetch_keywords',
      stepOrder: 1,
      inputPayload: context.input,
    }],
  });
  
  if (!result.success || !result.data) return result;
  
  return await orchestrator.startExecution(result.data);
}
```

**DEPENDENCIES:** RuntimeService, ExecutionOrchestrator, runtime tasks
**BREAKAGE RISK:** MEDIUM
**ROLLBACK:** Restore original file

**TESTING:**
- Test ARIA agent executes correctly
- Test keywords are fetched
- Test execution is tracked in runtime

---

### Step 3.8: Refactor SCRIBE Agent Service

**FILE:** `apps/web/lib/agents/scribe/scribe.service.ts`

**MIGRATION STRATEGY:** Same as ARIA (Step 3.7)

**DEPENDENCIES:** RuntimeService, ExecutionOrchestrator, runtime tasks
**BREAKAGE RISK:** MEDIUM
**ROLLBACK:** Restore original file

**TESTING:**
- Test SCRIBE agent executes correctly
- Test articles are generated
- Test execution is tracked in runtime

---

### Step 3.9: Refactor LOCL Agent Service

**FILE:** `apps/web/lib/agents/locl/locl.service.ts`

**MIGRATION STRATEGY:** Same as ARIA (Step 3.7)

**DEPENDENCIES:** RuntimeService, ExecutionOrchestrator, runtime tasks
**BREAKAGE RISK:** MEDIUM
**ROLLBACK:** Restore original file

**TESTING:**
- Test LOCL agent executes correctly
- Test business profiles are fetched
- Test execution is tracked in runtime

---

### Step 3.10: Refactor PULSE Agent Service

**FILE:** `apps/web/lib/agents/pulse/pulse.service.ts`

**MIGRATION STRATEGY:** Same as ARIA (Step 3.7)

**DEPENDENCIES:** RuntimeService, ExecutionOrchestrator, runtime tasks
**BREAKAGE RISK:** MEDIUM
**ROLLBACK:** Restore original file

**TESTING:**
- Test PULSE agent executes correctly
- Test keyword ranks are fetched
- Test execution is tracked in runtime

---

### Step 3.11: Refactor PUBLISH Agent Service

**FILE:** `apps/web/lib/agents/publish/publish.service.ts`

**MIGRATION STRATEGY:** Same as ARIA (Step 3.7)

**DEPENDENCIES:** RuntimeService, ExecutionOrchestrator, runtime tasks
**BREAKAGE RISK:** MEDIUM
**ROLLBACK:** Restore original file

**TESTING:**
- Test PUBLISH agent executes correctly
- Test content is published
- Test execution is tracked in runtime

---

### Step 3.12: Remove Mock Provider Clients

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/shared/dataforseo.client.ts`
- `apps/web/lib/agents/shared/openai.client.ts`
- `apps/web/lib/agents/shared/serp.client.ts`
- `apps/web/lib/agents/shared/gmb.client.ts`

**DEPENDENCIES:** None (agents refactored to use runtime connectors)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm apps/web/lib/agents/shared/dataforseo.client.ts
rm apps/web/lib/agents/shared/openai.client.ts
rm apps/web/lib/agents/shared/serp.client.ts
rm apps/web/lib/agents/shared/gmb.client.ts
rmdir apps/web/lib/agents/shared
```

**VERIFICATION:**
```bash
# Verify no references to mock clients
grep -r "shared/dataforseo\|shared/openai\|shared/serp\|shared/gmb" apps/web
# Should return nothing
```

---

### Step 3.13: Remove Direct CMS Connector Calls

**SYSTEMS TO REMOVE:**
- Direct connector imports from publish.service.ts
- Keep connector files (they will be used by runtime connectors)

**DEPENDENCIES:** None (publish.service.ts refactored)
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore original file

**EXECUTION:**
```typescript
// Remove these imports from publish.service.ts:
// import { publishPost as publishToWordPress } from "@/lib/connectors/wordpress.connector";
// import { publishPost as publishToShopify } from "@/lib/connectors/shopify.connector";
// import { publishPost as publishToCustom } from "@/lib/connectors/custom.connector";

// Connector files remain in place for runtime connectors to use
```

**VERIFICATION:**
```bash
# Verify no direct connector calls from agents
grep -r "connectors/wordpress\|connectors/shopify\|connectors/custom" apps/web/lib/agents
# Should return nothing
```

---

### Step 3.14: Remove Agent Logger

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/base/agent.logger.ts`

**DEPENDENCIES:** All agent services (refactored to use RuntimeService)
**BREAKAGE RISK:** NONE (after agent refactoring)
**ROLLBACK:** Restore file from git

**EXECUTION:**
```bash
rm apps/web/lib/agents/base/agent.logger.ts
```

**VERIFICATION:**
```bash
# Verify no references to agent logger
grep -r "agent.logger\|updateAgentState\|logAgentActivity\|updateAgentRunStatus\|releaseAgentLock" apps/web/lib/agents
# Should return nothing
```

---

### Step 3.15: Remove Agent Base Types (if unused)

**SYSTEMS TO REMOVE:**
- `apps/web/lib/agents/base/agent.types.ts` (if unused after refactoring)

**DEPENDENCIES:** Agent services (verify unused)
**BREAKAGE RISK:** LOW
**ROLLBACK:** Restore file from git

**EXECUTION:**
```bash
# First verify unused
grep -r "from.*base/agent.types" apps/web/lib/agents
# If no references, remove
rm apps/web/lib/agents/base/agent.types.ts
rmdir apps/web/lib/agents/base
```

---

## PHASE 3 COMPLETION CHECKLIST

- [ ] Runtime connectors created
- [ ] Runtime tasks created for all agents
- [ ] ARIA agent service refactored
- [ ] SCRIBE agent service refactored
- [ ] LOCL agent service refactored
- [ ] PULSE agent service refactored
- [ ] PUBLISH agent service refactored
- [ ] Mock provider clients removed
- [ ] Direct CMS connector calls removed
- [ ] Agent logger removed
- [ ] Agent base types removed (if unused)
- [ ] All agents tested

**PHASE 3 STATUS:** Ready to execute after Phase 2

---

## PHASE 4: DATABASE CLEANUP (Week 5-6)

**OBJECTIVE:** Remove old runtime tables and cleanup database
**RISK LEVEL:** HIGH
**BREAKAGE RISK:** HIGH (database changes)

### Step 4.1: Create Database Migration Script

**NEW FILE TO CREATE:**
- `supabase/migrations/20250109_remove_old_runtime_tables.sql`

**MIGRATION SCRIPT:**
```sql
-- Drop old runtime tables
DROP TABLE IF EXISTS agent_runs CASCADE;
DROP TABLE IF EXISTS agent_states CASCADE;
DROP TABLE IF EXISTS agent_activities CASCADE;

-- Verify new runtime tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs');
```

**DEPENDENCIES:** None
**BREAKAGE RISK:** HIGH (database changes)
**ROLLBACK:** Restore tables from backup

**TESTING:**
- Test migration script in staging
- Verify no data loss
- Verify dashboard still works

---

### Step 4.2: Execute Database Migration

**EXECUTION:**
```bash
# Backup database first
supabase db dump -f backup_before_migration.sql

# Execute migration
supabase db push

# Verify tables dropped
supabase db reset
```

**DEPENDENCIES:** Migration script
**BREAKAGE RISK:** HIGH
**ROLLBACK:** Restore from backup

**VERIFICATION:**
```sql
-- Verify old tables don't exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agent_runs', 'agent_states', 'agent_activities');
-- Should return empty

-- Verify new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('agent_executions', 'agent_tasks', 'agent_events', 'agent_logs');
-- Should return 4 rows
```

---

### Step 4.3: Remove Deprecated SQL Files

**SYSTEMS TO REMOVE:**
- `supabase/create_agent_run_atomic.sql`
- `supabase/initialize_agent_states.sql`
- Any other old runtime SQL files

**DEPENDENCIES:** None
**BREAKAGE RISK:** NONE
**ROLLBACK:** Restore files from git

**EXECUTION:**
```bash
rm supabase/create_agent_run_atomic.sql
rm supabase/initialize_agent_states.sql
# Remove any other old runtime SQL files
```

**VERIFICATION:**
```bash
# Verify no references to old runtime tables in SQL files
grep -r "agent_runs\|agent_states\|agent_activities" supabase
# Should return nothing
```

---

## PHASE 4 COMPLETION CHECKLIST

- [ ] Database migration script created
- [ ] Database backed up
- [ ] Database migration executed
- [ ] Old runtime tables dropped
- [ ] New runtime tables verified
- [ ] Deprecated SQL files removed
- [ ] Dashboard tested after migration

**PHASE 4 STATUS:** Ready to execute after Phase 3

---

## FINAL VERIFICATION

### Step 5.1: Verify No References to Dead Systems

```bash
# Verify no references to old runtime tables
grep -r "agent_runs\|agent_states\|agent_activities" apps/web
# Should return nothing

# Verify no references to deprecated runtime wrappers
grep -r "AgentRuntime\|LinxAgentRuntime\|ReputeAgentRuntime\|PrismAgentRuntime" apps/web
# Should return nothing

# Verify no references to mock clients
grep -r "shared/dataforseo\|shared/openai\|shared/serp\|shared/gmb" apps/web
# Should return nothing

# Verify no references to integration mesh orchestration
grep -r "IntegrationDispatcher\|ENABLE_.*_DISPATCH_EXECUTION\|shouldUseIntegrationMesh" apps/web
# Should return nothing

# Verify no references to dispatch routes
grep -r "integrations/dispatch" apps/web
# Should return nothing

# Verify no references to agent logger
grep -r "agent.logger\|updateAgentState\|logAgentActivity\|updateAgentRunStatus" apps/web
# Should return nothing
```

---

### Step 5.2: Verify Canonical Runtime Authority

```bash
# Verify RuntimeService is used
grep -r "RuntimeService" apps/web/lib/agents
# Should return references in agent services

# Verify ExecutionOrchestrator is used
grep -r "ExecutionOrchestrator" apps/web/lib/agents
# Should return references in agent services

# Verify runtime connectors are used
grep -r "runtime/connectors" apps/web/lib/runtime/tasks
# Should return references in runtime tasks
```

---

### Step 5.3: Verify Credential Injection

```bash
# Verify credential functions are used
grep -r "getTenantIntegrations\|getGoogleAccessToken\|getWordPressAppPassword" apps/web/lib/runtime/connectors
# Should return references in runtime connectors

# Verify no direct credential passing
grep -r "appPassword\|accessToken\|apiKey" apps/web/lib/agents | grep -v "getTenantIntegrations"
# Should return nothing
```

---

### Step 5.4: Verify Dashboard Queries New Runtime

```bash
# Verify dashboard queries new runtime tables
grep -r "agent_executions\|agent_tasks\|agent_events\|agent_logs" apps/web/lib/dashboard
# Should return references

# Verify dashboard does not query old runtime tables
grep -r "agent_runs\|agent_states\|agent_activities" apps/web/lib/dashboard
# Should return nothing
```

---

### Step 5.5: Integration Testing

**TEST SCENARIOS:**
1. Test ARIA agent execution
2. Test SCRIBE agent execution
3. Test LOCL agent execution
4. Test PULSE agent execution
5. Test PUBLISH agent execution
6. Test dashboard loads
7. Test agent states display
8. Test activity feed displays
9. Test stats display correctly
10. Test credential retrieval

**EXPECTED RESULTS:**
- All agents execute through runtime
- All provider access goes through runtime connectors
- All credentials are runtime injected
- All events are published via EventService
- All logs are written via LogService
- Dashboard queries new runtime tables
- No references to dead systems

---

## ROLLBACK PROCEDURES

### Phase 1 Rollback
```bash
git restore apps/web/app/api/integrations/dispatch
git restore apps/web/app/api/agents
git restore apps/web/lib/integrations/mesh
git restore apps/api agents lib
git restore apps/web/lib/agents/capabilities
git restore apps/web/lib/agents/governance
git restore apps/web/lib/agents/memory
git restore apps/web/lib/agents/planning
git restore apps/web/lib/agents/topology
git restore apps/web/lib/agents/registry
git restore apps/web/lib/agents/runtime
git restore apps/web/lib/agents/*/runtime.ts
git restore apps/web/lib/agents/system
git restore apps/web/lib/runtime/adapters
git restore apps/web/lib/runtime/tasks
```

### Phase 2 Rollback
```bash
git restore apps/web/app/api/dashboard/agent-states/route.ts
git restore apps/web/app/api/dashboard/agent-activities/route.ts
git restore apps/web/lib/dashboard/index.ts
```

### Phase 3 Rollback
```bash
# Delete new runtime connectors
rm -rf apps/web/lib/runtime/connectors
# Delete new runtime tasks
rm apps/web/lib/runtime/tasks/*-runtime.tasks.ts
# Restore agent services
git restore apps/web/lib/agents/aria/aria.service.ts
git restore apps/web/lib/agents/scribe/scribe.service.ts
git restore apps/web/lib/agents/locl/locl.service.ts
git restore apps/web/lib/agents/pulse/pulse.service.ts
git restore apps/web/lib/agents/publish/publish.service.ts
# Restore mock clients
git restore apps/web/lib/agents/shared
# Restore agent logger
git restore apps/web/lib/agents/base/agent.logger.ts
```

### Phase 4 Rollback
```bash
# Restore database from backup
supabase db restore backup_before_migration.sql
# Restore SQL files
git restore supabase/create_agent_run_atomic.sql
git restore supabase/initialize_agent_states.sql
```

---

## SUMMARY

**TOTAL PHASES:** 4
**TOTAL SYSTEMS TO REMOVE:** 38
**TOTAL FILES TO DELETE:** 60+
**TOTAL FILES TO REFACTOR:** 5 agent services + dashboard
**TOTAL FILES TO CREATE:** 7 runtime connectors + 6 runtime tasks
**ESTIMATED EFFORT:** 4-6 weeks
**ESTIMATED BREAKAGE RISK:** LOW (with this plan)

**SUCCESS CRITERIA:**
- All dead systems removed
- All conflicts resolved
- Canonical runtime authority enforced
- All provider access goes through runtime
- All credentials runtime injected
- Dashboard queries new runtime tables
- Old runtime tables dropped
- No references to dead systems

**FINAL ARCHITECTURE STATE:**
- ✅ Single canonical runtime (RuntimeService + ExecutionOrchestrator)
- ✅ Canonical execution flow (Agent → Runtime → Connector → Provider)
- ✅ Canonical credential system (integrations table + runtime injection)
- ✅ Canonical event system (EventService)
- ✅ Canonical logging system (LogService)
- ✅ Canonical task lifecycle (TaskService)
- ✅ Canonical execution state (ExecutionService)
- ✅ No dead abstractions
- ✅ No conflicting systems
- ✅ No dangerous components

---

**END OF PLAN**
