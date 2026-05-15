# PROVIDER EXECUTION MIGRATION REPORT

**Phase:** Phase Z2 - Provider Execution Convergence + Canonical n8n Runtime Migration  
**Status:** MIGRATION STRATEGY DOCUMENTED

## MIGRATION OBJECTIVE

Migrate ALL live provider execution in CLAUX to the canonical integration mesh introduced in Z1.

**Canonical Flow Required:**
Agent → RuntimeService → ExecutionOrchestrator → Integration Dispatcher → n8n bridge → Provider → Callback → Runtime Event → Task Completion

**Current State (Conflicting):**
Agents → RuntimeService → Provider Adapter → External Provider (DIRECT CALL)

## MIGRATION COMPLETED

### 1. Runtime Event Continuation Layer ✅
**Status:** COMPLETED
**Action:** Fixed lint errors in integration mesh
**Details:** Updated integration mesh to use correct RuntimeService API (runtime.event.publishEvent, runtime.log.writeLog)
**Files Modified:**
- `lib/integrations/mesh/callbacks/index.ts`
- `lib/integrations/mesh/runtime/index.ts`
- `lib/integrations/mesh/observability/index.ts`
- `lib/integrations/mesh/validation/index.ts`

### 2. Canonical n8n Execution Routes ✅
**Status:** COMPLETED
**Action:** Built dispatch API routes for all providers
**Details:** Created 5 dispatch routes that validate tenant, sign payloads, dispatch to n8n, generate receipts
**Files Created:**
- `app/api/integrations/dispatch/openai/route.ts`
- `app/api/integrations/dispatch/dataforseo/route.ts`
- `app/api/integrations/dispatch/gbp/route.ts`
- `app/api/integrations/dispatch/gsc/route.ts`
- `app/api/integrations/dispatch/cms/route.ts`

### 3. Canonical Callback Routes ✅
**Status:** COMPLETED
**Action:** Built callback API routes for all providers
**Details:** Created 5 callback routes that verify signatures, validate replay safety, prevent duplicates, emit runtime events, continue execution
**Files Created:**
- `app/api/integrations/callback/openai/route.ts`
- `app/api/integrations/callback/dataforseo/route.ts`
- `app/api/integrations/callback/gbp/route.ts`
- `app/api/integrations/callback/gsc/route.ts`
- `app/api/integrations/callback/cms/route.ts`

## PENDING MIGRATION TASKS

### 4. Remove Direct Provider Execution
**Status:** PENDING - COMPATIBILITY PRESERVATION REQUIRED
**Conflicting Files:**
- `lib/runtime/adapters/providers/openai.adapter.ts`
- `lib/runtime/adapters/providers/dataforseo.adapter.ts`
- `lib/providers/hardened-openai.ts`
- `lib/providers/hardened-dataforseo.ts`
- `lib/agents/shared/openai.client.ts`
- `lib/agents/shared/dataforseo.client.ts`

**Migration Strategy:**
- These files should be preserved as compatibility wrappers during transition
- Mark as @deprecated with migration path
- Add deprecation warnings
- Gradually migrate agents to use dispatch APIs
- Remove after migration complete

**Risk Assessment:**
- **HIGH RISK:** Removing these files immediately would break existing agent execution
- **Agents Affected:** ARIA, SCRIBE, LOCL, LINX, REPUTE, PRISM, PULSE
- **Recommendation:** Preserve compatibility, document deprecation, migrate incrementally

### 5. Agent Migration to Dispatch APIs
**Status:** PENDING
**Agents to Migrate:**
- ARIA - Currently uses DataForSEO adapter directly
- SCRIBE - Currently uses OpenAI adapter directly
- LOCL - Currently uses GBP/DataForSEO adapters directly
- LINX - Currently uses DataForSEO adapter directly
- REPUTE - Currently uses GBP adapters directly
- PRISM - Currently uses GSC/GA4 adapters directly
- PULSE - Currently uses DataForSEO/GSC adapters directly

**Migration Strategy:**
- Update agent runtime implementations to call dispatch APIs
- Update agent task implementations to call dispatch APIs
- Preserve fallback to direct adapters during transition
- Add feature flags for gradual rollout
- Monitor execution during migration

### 6. n8n Workflow Contracts
**Status:** PENDING
**Required:** Canonical payload schemas for OpenAI, DataForSEO, GBP, GSC, CMS
**Action:** Build payload schema validation

### 7. Provider Execution State Tracking
**Status:** PENDING
**Required:** Persist dispatch started, acknowledged, provider accepted, failed, callback received, execution resumed
**Action:** Use agent_events and agent_logs (no new tables)

### 8. Tenant Execution Safety
**Status:** PENDING
**Required:** Tenant-bound callbacks, signatures, replay isolation, execution isolation, quota isolation
**Action:** Enforce in callback routes

### 9. Provider Failure Governance (CORE)
**Status:** PENDING
**Required:** Provider degradation, cooldown activation, retry escalation, dead-letter escalation, provider isolation, execution quarantine
**Action:** Bind into existing CORE governance runtime

### 10. Execution Observability
**Status:** PENDING
**Required:** Expose provider latency, failure rate, retries, cooldown states, active integrations, execution continuation state
**Action:** Bind to existing dashboard

## COMPATIBILITY PRESERVATION

**Decision:** Preserve existing direct provider execution during migration

**Reasons:**
1. Prevent breaking existing agent execution
2. Allow gradual migration
3. Enable testing of new architecture
4. Provide fallback during transition
5. Monitor execution stability

**Deprecation Path:**
1. Mark existing adapters as @deprecated
2. Add deprecation warnings
3. Add feature flags for new dispatch APIs
4. Migrate agents incrementally
5. Remove deprecated adapters after migration complete

## MIGRATION RISKS

### High Risk
- **Breaking Agent Execution:** Removing direct provider calls would break all agents immediately
- **Agents Affected:** ARIA, SCRIBE, LOCL, LINX, REPUTE, PRISM, PULSE
- **Mitigation:** Preserve compatibility, migrate incrementally

### Medium Risk
- **Runtime Continuation:** Callbacks must correctly resume execution
- **Mitigation:** Test callback flows thoroughly before migration
- **Tenant Isolation:** Callbacks must not leak across tenants
- **Mitigation:** Enforce tenant validation in callback routes

### Low Risk
- **API Contract Changes:** n8n workflow contracts must match provider expectations
- **Mitigation:** Build schema validation before migration
- **Observability Gaps:** Dashboard may not show new integration metrics
- **Mitigation:** Bind integration observability to existing dashboard

## RECOMMENDED MIGRATION ORDER

1. **Phase 1:** Build n8n workflow contracts (payload schemas)
2. **Phase 2:** Build provider execution state tracking
3. **Phase 3:** Build tenant execution safety
4. **Phase 4:** Build provider failure governance (CORE)
5. **Phase 5:** Build execution observability
6. **Phase 6:** Add feature flags for dispatch APIs
7. **Phase 7:** Migrate one agent at a time (start with non-critical agent)
8. **Phase 8:** Monitor execution during migration
9. **Phase 9:** Migrate all agents
10. **Phase 10:** Remove deprecated adapters

## CONCLUSION

**Migration Status:** PARTIALLY COMPLETED
**Completed:** Integration mesh lint fixes, dispatch routes, callback routes
**Pending:** Agent migration, n8n contracts, state tracking, tenant safety, governance, observability
**Recommendation:** Preserve existing direct provider execution as compatibility wrappers during incremental migration

**DO NOT:**
- Silently break runtime execution
- Remove direct provider adapters immediately
- Migrate all agents at once
- Skip testing

**DO:**
- Preserve compatibility during transition
- Migrate incrementally
- Add feature flags
- Monitor execution
- Test thoroughly
