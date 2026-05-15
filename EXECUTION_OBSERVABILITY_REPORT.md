# EXECUTION OBSERVABILITY REPORT

**Phase:** Phase Z3 - Live Agent Migration + n8n Workflow Convergence  
**Status:** PENDING - DASHBOARD BINDING REQUIRED

## OBSERVABILITY REQUIREMENTS

Dashboard already exists.

ONLY bind runtime artifacts to existing dashboard.

Expose:
- Provider latency
- Provider failure rate
- Retries
- Cooldown states
- Active integrations
- Execution continuation state
- Dead-letter executions
- Provider health

## CURRENT STATE

**Integration Observability:**
**Location:** `lib/integrations/mesh/observability/index.ts`
**Status:** COMPLETED
**Features:**
- Record outbound requests ✅
- Record webhook receipts ✅
- Record retries ✅
- Record provider failures ✅
- Record cooldowns ✅
- Record latency ✅
- Record execution continuation ✅

**Runtime Events:**
- `outbound_request` ✅
- `webhook_receipt` ✅
- `integration_retry` ✅
- `provider_failure` ✅
- `provider_cooldown` ✅
- `integration_callback` ✅
- `execution_continuation` ✅

**Runtime Logs:**
- Integration latency ✅
- Integration dispatch ✅
- Integration completion ✅
- Integration failure ✅

## REQUIRED DASHBOARD BINDING

**Provider Latency:**
- Bind to agent_logs (integration_latency logs) ⏳
- Display average latency per provider ⏳
- Display latency percentiles ⏳

**Provider Failure Rate:**
- Bind to agent_events (provider_failure events) ⏳
- Display failure rate per provider ⏳
- Display failure trend ⏳

**Retries:**
- Bind to agent_events (integration_retry events) ⏳
- Display retry count per provider ⏳
- Display retry success rate ⏳

**Cooldown States:**
- Bind to agent_events (provider_cooldown events) ⏳
- Display active cooldowns per provider ⏳
- Display cooldown duration ⏳

**Active Integrations:**
- Bind to agent_events (outbound_request events) ⏳
- Display active integrations per tenant ⏳
- Display integration throughput ⏳

**Execution Continuation State:**
- Bind to agent_events (execution_continuation events) ⏳
- Display pending continuations ⏳
- Display continuation success rate ⏳

## CONSTRAINTS

**DO NOT:**
- Redesign dashboard
- Create new dashboard components
- Create new dashboard pages
- Introduce new dashboard architecture

**DO:**
- Bind to existing dashboard
- Use existing dashboard components
- Use existing dashboard pages
- Use existing dashboard architecture

## SUCCESS CRITERIA

⏳ Provider latency exposed
⏳ Provider failure rate exposed
⏳ Retries exposed
⏳ Cooldown states exposed
⏳ Active integrations exposed
⏳ Execution continuation state exposed
⏳ Dead-letter executions exposed
⏳ Provider health exposed
⏳ Dashboard uses canonical runtime artifacts
⏳ No dashboard redesign
