# CANONICAL API TOPOLOGY

**Phase:** Phase Z1 - Integration Mesh Foundation + Canonical API Topology  
**Status:** COMPLETED

## CANONICAL EXECUTION FLOW

```
Agent
→ RuntimeService
→ ExecutionOrchestrator
→ Integration Adapter
→ Integration Dispatcher
→ n8n Webhook
→ External Provider
→ Callback/Webhook
→ Runtime Event
→ Task Completion
```

## INTEGRATION MESH LAYER

**Location:** `apps/web/lib/integrations/mesh/`

**Components:**
- `contracts/` - Integration execution contracts
- `dispatchers/` - Canonical n8n bridge
- `callbacks/` - Callback ingestion system
- `webhooks/` - Tenant-safe webhook system
- `providers/` - Provider execution registry
- `validation/` - Validation layer
- `runtime/` - Runtime integration layer
- `observability/` - Execution observability

## CANONICAL AGENTS

1. ARIA - Keyword Intelligence
2. SCRIBE - Content Intelligence
3. LOCL - GBP/Local SEO
4. LINX - Backlink Intelligence
5. CORE - Technical SEO + Runtime Governance
6. REPUTE - Reputation Intelligence
7. AMPLI - Publishing/Distribution Orchestration
8. PRISM - Analytics/Reporting
9. PULSE - Monitoring/Ranking Intelligence

## PROVIDER OWNERSHIP MATRIX

**ARIA:** DataForSEO, GSC (n8n: external API execution, Runtime: clustering, keyword intelligence, opportunity scoring, SERP interpretation)

**SCRIBE:** OpenAI, CMS (n8n: CMS publishing execution, Runtime: generation, optimization, topical reasoning)

**LOCL:** GBP, citation providers (n8n: sync jobs, external ingestion, Runtime: local SEO intelligence, NAP validation, map pack analysis)

**LINX:** DataForSEO (Runtime: backlink scoring, toxic analysis, internal linking)

**CORE:** NO n8n ownership (Runtime: governance, escalation, recovery intervention, queue intervention, runtime health, anomaly detection)

**REPUTE:** GBP reviews, review platforms (n8n: ingestion/sync, Runtime: sentiment reasoning, escalation, response drafting)

**AMPLI:** WordPress, Shopify, Webflow, Ghost, social platforms (n8n: actual publishing execution, Runtime: orchestration, rollout sequencing, approval routing)

**PRISM:** GA4, GSC, analytics providers (n8n: data ingestion, Runtime: attribution, KPI interpretation, reporting intelligence)

**PULSE:** DataForSEO, GSC (Runtime: volatility analysis, anomaly detection, monitoring intelligence)

## SUCCESS CRITERIA

✅ Runtime remains sole orchestrator
✅ n8n becomes connector-only bridge
✅ Integration mesh layer created
✅ Canonical execution flow defined
✅ Provider ownership matrix defined
✅ No duplicate orchestration
✅ No alternate runtimes
✅ No dashboard rewrites
✅ No fictional abstractions
✅ Architecture remains deterministic
