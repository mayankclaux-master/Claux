# DASHBOARD PROVIDER OBSERVABILITY REPORT

**Phase:** Phase Z2 - Provider Execution Convergence + Canonical n8n Runtime Migration  
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

## CURRENT STATE

**Integration Observability:**
**Location:** `lib/integrations/mesh/observability/index.ts`
**Status:** CREATED
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
- Bind to agent_events (integration_latency logs) ⏳
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

## IMPLEMENTATION PLAN

**Phase 1:** Bind provider latency to dashboard
- Query agent_logs for integration_latency ⏳
- Display in existing dashboard component ⏳

**Phase 2:** Bind provider failure rate to dashboard
- Query agent_events for provider_failure ⏳
- Display in existing dashboard component ⏳

**Phase 3:** Bind retries to dashboard
- Query agent_events for integration_retry ⏳
- Display in existing dashboard component ⏳

**Phase 4:** Bind cooldown states to dashboard
- Query agent_events for provider_cooldown ⏳
- Display in existing dashboard component ⏳

**Phase 5:** Bind active integrations to dashboard
- Query agent_events for outbound_request ⏳
- Display in existing dashboard component ⏳

**Phase 6:** Bind execution continuation state to dashboard
- Query agent_events for execution_continuation ⏳
- Display in existing dashboard component ⏳

## SUCCESS CRITERIA

⏳ Provider latency exposed
⏳ Provider failure rate exposed
⏳ Retries exposed
⏳ Cooldown states exposed
⏳ Active integrations exposed
⏳ Execution continuation state exposed
⏳ Dashboard uses canonical runtime artifacts
⏳ No dashboard redesign
