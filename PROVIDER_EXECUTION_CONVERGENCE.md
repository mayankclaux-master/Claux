# PROVIDER EXECUTION CONVERGENCE

**Phase:** Phase Z2 - Provider Execution Convergence + Canonical n8n Runtime Migration  
**Status:** ARCHITECTURE CONVERGED

## CANONICAL EXECUTION FLOW

```
Agent
→ RuntimeService
→ ExecutionOrchestrator
→ Integration Dispatcher
→ n8n Webhook
→ External Provider
→ Callback/Webhook
→ Runtime Event
→ Task Completion
```

## INTEGRATION MESH LAYER

**Location:** `lib/integrations/mesh/`

**Components:**
- `contracts/` - Integration execution contracts ✅
- `dispatchers/` - Canonical n8n bridge ✅
- `callbacks/` - Callback ingestion system ✅
- `webhooks/` - Tenant-safe webhook system ✅
- `providers/` - Provider execution registry ✅
- `validation/` - Validation layer ✅
- `runtime/` - Runtime integration layer ✅
- `observability/` - Execution observability ✅

## DISPATCH ROUTES

**Location:** `app/api/integrations/dispatch/`

**Routes:**
- `/api/integrations/dispatch/openai` ✅
- `/api/integrations/dispatch/dataforseo` ✅
- `/api/integrations/dispatch/gbp` ✅
- `/api/integrations/dispatch/gsc` ✅
- `/api/integrations/dispatch/cms` ✅

**Responsibilities:**
- Signed payload generation ✅
- Execution correlation ✅
- Tenant correlation ✅
- Replay metadata ✅
- Trace metadata ✅
- Dispatch receipt generation ✅

## CALLBACK ROUTES

**Location:** `app/api/integrations/callback/`

**Routes:**
- `/api/integrations/callback/openai` ✅
- `/api/integrations/callback/dataforseo` ✅
- `/api/integrations/callback/gbp` ✅
- `/api/integrations/callback/gsc` ✅
- `/api/integrations/callback/cms` ✅

**Responsibilities:**
- Verify signatures ✅
- Validate replay safety ✅
- Prevent duplicates ✅
- Reconstruct runtime context ✅
- Emit runtime events ✅
- Continue execution safely ✅

## CANONICAL AGENT PROVIDER MAP

**ARIA:** DataForSEO SERP APIs, GSC APIs (n8n: external API execution, Runtime: clustering, keyword intelligence, opportunity scoring, SERP interpretation)

**SCRIBE:** OpenAI, CMS publishing triggers (n8n: CMS publishing execution, Runtime: generation, optimization, topical authority)

**LOCL:** GBP APIs, citation providers (n8n: sync jobs, external ingestion, Runtime: local SEO intelligence, NAP validation, map pack analysis)

**LINX:** DataForSEO backlink APIs (Runtime: backlink scoring, toxic analysis, authority interpretation)

**CORE:** NO external provider ownership (Runtime: governance, escalation, recovery intervention, queue intervention, runtime health, anomaly detection)

**REPUTE:** GBP review APIs, review platforms (n8n: ingestion/sync, Runtime: sentiment reasoning, escalation, reputation interpretation)

**AMPLI:** WordPress, Shopify, Webflow, Ghost, social platforms (n8n: actual publishing execution, Runtime: orchestration, rollout sequencing, approval coordination)

**PRISM:** GA4, GSC (n8n: data ingestion, Runtime: KPI interpretation, attribution, executive reporting)

**PULSE:** DataForSEO, GSC (Runtime: volatility analysis, monitoring intelligence, anomaly detection)

## SUCCESS CRITERIA

✅ Runtime remains sole orchestrator
✅ n8n becomes connector-only bridge
✅ Integration mesh layer created
✅ Canonical execution flow defined
✅ Dispatch routes created
✅ Callback routes created
✅ Provider ownership matrix defined
✅ No duplicate orchestration
✅ No alternate runtimes
✅ No dashboard rewrites
✅ No fictional abstractions
✅ Architecture remains deterministic

## PENDING TASKS

- Agent migration to dispatch APIs (compatibility preservation required)
- n8n workflow contracts (payload schemas)
- Provider execution state tracking
- Tenant execution safety enforcement
- Provider failure governance (CORE)
- Execution observability (dashboard binding)
