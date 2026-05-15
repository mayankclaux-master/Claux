# AGENT MIGRATION WAVE2 REPORT

**Phase:** Phase Z4 - Canonical Agent Live Execution Migration + Direct Provider Deprecation  
**Wave:** Wave 2 - DataForSEO + GBP Agents  
**Status:** PENDING (After Wave 1)

## WAVE 2 AGENTS

### ARIA
**Responsibilities:** Keyword Intelligence
**Providers:** DataForSEO SERP APIs, GSC APIs
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** DataForSEO adapter in aria.tasks.ts (line 119-124)
**Task Types:** fetch_business_profile, fetch_keywords, normalize_keywords, classify_intent, quality_filter, cluster_keywords, analyze_opportunities, store_keywords, generate_briefs, publish_workflow
**Migration Required:** Replace DataForSEO adapter with IntegrationDispatcher
**Risk:** MEDIUM - Core keyword intelligence agent

### LINX
**Responsibilities:** Backlink Intelligence
**Providers:** DataForSEO backlink APIs
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** DataForSEO adapter (task implementations not yet visible)
**Task Types:** Backlink analysis, toxic detection, authority scoring, internal linking
**Migration Required:** Replace DataForSEO adapter with IntegrationDispatcher
**Risk:** MEDIUM - Backlink analysis agent

### LOCL
**Responsibilities:** Local SEO + GBP
**Providers:** GBP APIs, citation APIs
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** GBP adapter (task implementations not yet visible)
**Task Types:** GBP sync, local rankings, map pack analysis, NAP validation
**Migration Required:** Replace GBP adapter with IntegrationDispatcher
**Risk:** MEDIUM - Local SEO agent

## MIGRATION REQUIREMENTS

**Provider Execution Correlation:** Must track DataForSEO/GBP execution through dispatcher
**Callback Reconstruction:** Must reconstruct runtime context from callbacks
**Execution Continuation Safety:** Must safely continue execution after callbacks
**Timeout Recovery:** Must handle provider timeouts gracefully
**Replay-Safe Retries:** Must preserve replay determinism

## SUCCESS CRITERIA

⏳ ARIA uses IntegrationDispatcher for DataForSEO/GSC
⏳ LINX uses IntegrationDispatcher for DataForSEO
⏳ LOCL uses IntegrationDispatcher for GBP
⏳ Provider execution correlation implemented
⏳ Callback reconstruction implemented
⏳ Execution continuation safety implemented
⏳ Timeout recovery implemented
⏳ Replay-safe retries implemented
