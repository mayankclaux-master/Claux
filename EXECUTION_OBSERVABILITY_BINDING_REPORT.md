# EXECUTION OBSERVABILITY BINDING REPORT

**Phase:** Phase Z4 - Canonical Agent Live Execution Migration + Direct Provider Deprecation  
**Status:** PENDING - DASHBOARD BINDING REQUIRED

## OBSERVABILITY REQUIREMENTS

Mission Control must display:
- Provider execution status
- Provider latency
- Provider retries
- Provider failures
- Callback continuation status
- Execution resume status
- Queue pressure
- Provider cooldown state

All derived ONLY from:
- agent_events
- agent_logs
- integration observability layer

NO new persistence systems.

## CURRENT STATE

**Integration Observability Layer:**
**Location:** `lib/integrations/mesh/observability/index.ts`
**Status:** COMPLETED (Phase Z3)
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

## REQUIRED DASHBOARD BINDING

**Provider Execution Status:**
- Bind to agent_events (outbound_request events) ⏳
- Display active executions per provider ⏳
- Display execution state (DISPATCHED, PROCESSING, COMPLETED, FAILED) ⏳

**Provider Latency:**
- Bind to agent_logs (integration_latency logs) ⏳
- Display average latency per provider ⏳
- Display latency percentiles (P50, P95, P99) ⏳

**Provider Retries:**
- Bind to agent_events (integration_retry events) ⏳
- Display retry count per provider ⏳
- Display retry success rate ⏳

**Provider Failures:**
- Bind to agent_events (provider_failure events) ⏳
- Display failure rate per provider ⏳
- Display failure trend ⏳

**Callback Continuation Status:**
- Bind to agent_events (integration_callback events) ⏳
- Display pending callbacks ⏳
- Display callback success rate ⏳

**Execution Resume Status:**
- Bind to agent_events (execution_continuation events) ⏳
- Display pending continuations ⏳
- Display continuation success rate ⏳

**Queue Pressure:**
- Bind to agent_events (queue pressure metrics) ⏳
- Display queue depth ⏳
- Display queue throughput ⏳

**Provider Cooldown State:**
- Bind to agent_events (provider_cooldown events) ⏳
- Display active cooldowns per provider ⏳
- Display cooldown duration ⏳

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

⏳ Provider execution status exposed
⏳ Provider latency exposed
⏳ Provider retries exposed
⏳ Provider failures exposed
⏳ Callback continuation status exposed
⏳ Execution resume status exposed
⏳ Queue pressure exposed
⏳ Provider cooldown state exposed
⏳ Dashboard uses canonical runtime artifacts
⏳ No dashboard redesign
