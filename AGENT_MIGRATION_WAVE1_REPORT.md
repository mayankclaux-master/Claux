# AGENT MIGRATION WAVE1 REPORT

**Phase:** Phase Z4 - Canonical Agent Live Execution Migration + Direct Provider Deprecation  
**Wave:** Wave 1 - Lower Risk Agents  
**Status:** PENDING

## WAVE 1 AGENTS

### PRISM
**Responsibilities:** Analytics + Reporting
**Providers:** GA4, GSC (data ingestion only)
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** None visible in runtime.ts
**Task Types:** analytics_aggregation, kpi_analysis, attribution_analysis, campaign_reporting, dashboard_summarization, executive_summarization, performance_analytics, intelligence_summary
**Migration Required:** Create task implementations using IntegrationDispatcher for GA4/GSC data ingestion
**Risk:** LOW - Analytics agent, no critical path dependencies

### PULSE
**Responsibilities:** SEO Monitoring + Intelligence
**Providers:** DataForSEO (SERP rankings)
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** Task type "dataforseo_rankings_fetch" requires migration
**Task Types:** dataforseo_rankings_fetch, ranking_movement_calculation, volatility_detection, keyword_clustering, competitor_serp_analysis, opportunity_detection, cannibalization_detection, intelligence_summary
**Migration Required:** Replace DataForSEO adapter calls with IntegrationDispatcher
**Risk:** LOW - Monitoring agent, non-critical for live operations

### REPUTE
**Responsibilities:** Review + Reputation Management
**Providers:** GBP (reviews)
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** Task type "review_ingestion" requires migration
**Task Types:** review_ingestion, sentiment_analysis, reputation_risk_detection, review_clustering, response_drafting, negative_review_escalation, reputation_summary_generation, reputation_trend_analysis, intelligence_summary
**Migration Required:** Replace GBP adapter calls with IntegrationDispatcher
**Risk:** LOW - Reputation agent, non-critical for live operations

## MIGRATION STRATEGY

**Step 1:** Create task implementations for PRISM, PULSE, REPUTE
**Step 2:** Replace direct provider adapter calls with IntegrationDispatcher
**Step 3:** Add feature flags for incremental rollout
**Step 4:** Test with feature flags disabled (fallback to direct adapters)
**Step 5:** Enable feature flags for one tenant
**Step 6:** Monitor execution for 24 hours
**Step 7:** Enable feature flags for all tenants
**Step 8:** Disable fallback to direct adapters

## SUCCESS CRITERIA

⏳ PRISM uses IntegrationDispatcher for GA4/GSC data
⏳ PULSE uses IntegrationDispatcher for DataForSEO
⏳ REPUTE uses IntegrationDispatcher for GBP
⏳ Feature flags control migration
⏳ Fallback to direct adapters works
⏳ No execution failures during migration
⏳ Replay determinism preserved
⏳ Tenant isolation preserved
