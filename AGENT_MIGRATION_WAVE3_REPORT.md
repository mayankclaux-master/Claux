# AGENT MIGRATION WAVE3 REPORT

**Phase:** Phase Z4 - Canonical Agent Live Execution Migration + Direct Provider Deprecation  
**Wave:** Wave 3 - OpenAI + CMS Publishing Agents  
**Status:** PENDING (After Wave 2)

## WAVE 3 AGENTS

### SCRIBE
**Responsibilities:** Content Generation
**Providers:** OpenAI, CMS publishing through AMPLI
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** OpenAI adapter in scribe.tasks.ts (line 153-156, 202-205)
**Task Types:** fetch_business_profile, fetch_content_briefs, select_keywords, generate_outlines, generate_articles, generate_metadata, generate_schema, quality_check, store_content, generate_artifacts
**Migration Required:** Replace OpenAI adapter with IntegrationDispatcher
**Risk:** HIGH - Core content generation agent

### AMPLI
**Responsibilities:** Distribution + Publishing Orchestration
**Providers:** WordPress, Shopify, Webflow, Ghost, social publishing APIs
**Current State:** Uses RuntimeService + ExecutionOrchestrator
**Direct Provider Calls:** CMS adapters (task implementations not yet visible)
**Task Types:** Publishing orchestration, rollout sequencing, approval coordination, retries, rollback
**Migration Required:** Replace CMS adapters with IntegrationDispatcher
**Risk:** HIGH - Publishing orchestration agent

## PUBLISHING REQUIREMENTS

**Approval Checkpoints:** Must preserve approval gates
**Rollback Safety:** Must support publishing rollback
**Duplicate Prevention:** Must prevent duplicate publishes
**Stale Execution Invalidation:** Must invalidate stale executions
**Publishing Recovery:** Must recover from partial publishes
**Artifact Checksum Validation:** Must validate artifact checksums

## SUCCESS CRITERIA

⏳ SCRIBE uses IntegrationDispatcher for OpenAI
⏳ AMPLI uses IntegrationDispatcher for CMS publishing
⏳ Approval checkpoints preserved
⏳ Rollback safety implemented
⏳ Duplicate prevention implemented
⏳ Stale execution invalidation implemented
⏳ Publishing recovery implemented
⏳ Artifact checksum validation implemented
