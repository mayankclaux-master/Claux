# CLAUX OPERATIONAL CONTRACT BLUEPRINT

**Version:** 1.0.0
**Date:** May 15, 2026
**Status:** CANONICAL OPERATIONAL DEFINITION

---

## EXECUTIVE SUMMARY

This document defines the canonical operational blueprint for all 9 CLAUX agents. It specifies exact business missions, execution tasks, required inputs, provider dependencies, execution flows, output artifacts, database requirements, dashboard requirements, n8n requirements, execution models, and MVP exclusions.

**Purpose:** Prevent unnecessary engineering and platform sprawl by defining exact operational scope before implementation.

**Agents Defined:**
1. ARIA - Keyword Intelligence
2. SCRIBE - Content Generation
3. LOCL - Local SEO (GBP)
4. LINX - Backlink Analysis
5. CORE - Technical SEO
6. REPUTE - Reputation Management
7. AMPLI - Distribution/Publishing
8. PRISM - Analytics/Reporting
9. PULSE - Ranking Monitoring

---

## AGENT 1: ARIA - KEYWORD INTELLIGENCE

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Discover high-value keywords, analyze SERP landscape, cluster keywords by semantic similarity, identify ranking opportunities, classify search intent, and generate content briefs for downstream agents.

**Customer Value:** Provides the foundational keyword intelligence that drives all content strategy and SEO efforts. Reduces keyword research time from weeks to minutes with AI-powered analysis.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Fetch business profile (website URL, category)
2. Fetch keywords from DataForSEO
3. Normalize and validate keywords
4. Classify keyword intent (transactional, informational, commercial)
5. Quality filter (volume > 50, difficulty < 80)
6. Cluster keywords by semantic similarity
7. Analyze ranking opportunities (volume/difficulty ratio)
8. Store keywords in database with deduplication
9. Generate content briefs for top 10 keywords
10. Publish workflow for SCRIBE agent

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Business profile (website URL, category)

**Credentials:**
- DataForSEO API credentials (via integration dispatch)

**Tenant Settings:**
- None

**Prior Artifacts:**
- None

**Dependencies on Other Agents:**
- None (first agent in pipeline)

### SECTION D — PROVIDER/APIs REQUIRED

**DataForSEO:**
- Why: Keyword discovery and SERP analysis
- Endpoint Class: Keywords API, SERP API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (5 requests/second)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/aria/discovery)
→ ExecutionOrchestrator
→ ARIA task implementations
→ IntegrationDispatcher (DataForSEO)
→ DataForSEO API
→ Keyword processing (normalize, classify, cluster, analyze)
→ Database persistence (seo_keywords, seo_clusters, seo_content_briefs)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers ARIA discovery via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls DataForSEO
6. Keywords processed and stored
7. Content briefs generated and marked ready_for_scribe
8. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Keywords (normalized, with intent classification)
- Keyword clusters (grouped by semantic similarity)
- Ranking opportunities (scored by volume/difficulty)
- Content briefs (for top 10 keywords)
- Intelligence summary (total keywords, clusters, opportunities)

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**seo_keywords:**
- Status: EXISTS
- Purpose: Store discovered keywords with metadata
- Columns: keyword, search_volume, difficulty, intent, opportunity_score, cluster_id

**seo_clusters:**
- Status: EXISTS
- Purpose: Store keyword clusters
- Columns: cluster_id, cluster_name, cluster_type, keywords (JSONB)

**seo_content_briefs:**
- Status: EXISTS
- Purpose: Store content briefs for SCRIBE
- Columns: keyword, intent, opportunity_score, brief, status

**business_profiles:**
- Status: EXISTS
- Purpose: Fetch business context
- Columns: website_url, category

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Total keywords discovered
- Total clusters created
- Total opportunities identified
- Content briefs generated
- Last execution status
- Execution history

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for DataForSEO callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Event-driven (user-triggered)
- Long-running (2-5 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Competitor keyword analysis (deferred to PULSE)
- Historical keyword tracking (deferred to PULSE)
- Keyword gap analysis vs competitors (deferred)
- Automated keyword suggestions based on content (deferred)
- Keyword cannibalization detection (deferred to PULSE)
- SERP feature analysis (deferred)
- Intent re-classification over time (deferred)

---

## AGENT 2: SCRIBE - CONTENT GENERATION

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Generate high-quality SEO-optimized content from ARIA content briefs, including outlines, full articles, metadata, and structured data schema.

**Customer Value:** Automates content production at scale while maintaining SEO best practices and quality standards.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Fetch business profile (category)
2. Fetch content briefs from ARIA (status: ready_for_scribe)
3. Select keywords with diversification (high/medium/low volume)
4. Generate article outlines using OpenAI
5. Generate full articles using OpenAI
6. Generate SEO metadata (title, description, keywords)
7. Generate structured data schema (JSON-LD)
8. Quality check (word count, readability, SEO score)
9. Store content in database as drafts
10. Generate publishing artifacts

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Business profile (category)

**Credentials:**
- OpenAI API credentials (via integration dispatch)

**Tenant Settings:**
- None

**Prior Artifacts:**
- Content briefs from ARIA (status: ready_for_scribe)

**Dependencies on Other Agents:**
- ARIA (content briefs)

### SECTION D — PROVIDER/APIs REQUIRED

**OpenAI:**
- Why: Content generation (outlines, articles)
- Endpoint Class: Chat Completions API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: High (60 requests/minute)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/scribe/draft)
→ ExecutionOrchestrator
→ SCRIBE task implementations
→ IntegrationDispatcher (OpenAI)
→ OpenAI API
→ Content generation (outlines, articles, metadata, schema)
→ Quality validation
→ Database persistence (seo_drafts)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers SCRIBE generation OR ARIA completes workflow
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls OpenAI for each keyword
6. Content generated, validated, and stored as drafts
7. Publishing artifacts generated
8. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Article outlines
- Full articles (HTML)
- SEO metadata (title, description, keywords)
- Structured data schema (JSON-LD)
- Quality scores (word count, readability, SEO)
- Publishing artifacts (payload for AMPLI)

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**seo_drafts:**
- Status: EXISTS
- Purpose: Store generated content drafts
- Columns: title, body_html, meta_title, meta_description, meta_keywords, schema_json, word_count, quality_score, readability_score, seo_score, status, target_keywords

**seo_content_briefs:**
- Status: EXISTS
- Purpose: Fetch briefs for generation
- Columns: keyword, intent, opportunity_score, brief, status

**business_profiles:**
- Status: EXISTS
- Purpose: Fetch business category
- Columns: category

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Total articles generated
- Articles passed quality check
- Total word count
- Draft status (draft, approved, published)
- Last execution status
- Execution history

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for OpenAI callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Event-driven (user-triggered OR ARIA workflow completion)
- Long-running (5-15 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Multi-language content generation (deferred)
- Content personalization (deferred)
- A/B testing content variants (deferred)
- Content rewriting/editing (deferred)
- Image generation for articles (deferred)
- Video content generation (deferred)
- Content versioning (deferred)
- Automated content updates (deferred)

---

## AGENT 3: LOCL - LOCAL SEO (GBP)

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Sync Google Business Profile data, monitor local citations, validate NAP consistency, monitor local rankings, generate GBP post recommendations, track local competitors, analyze map pack, score local SEO health.

**Customer Value:** Automates local SEO management and provides actionable insights for improving local search visibility.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Sync GBP profile data
2. Monitor local citations (if enabled)
3. Validate NAP consistency
4. Monitor local rankings (if enabled)
5. Generate GBP post recommendations
6. Track local competitors
7. Analyze map pack
8. Score local SEO health
9. Generate location-level SEO intelligence

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Business profile ID
- GBP credentials

**Credentials:**
- Google Business Profile API credentials (via integration dispatch)

**Tenant Settings:**
- enableLocalRanking (boolean)
- enableCitationMonitoring (boolean)

**Prior Artifacts:**
- None

**Dependencies on Other Agents:**
- None

### SECTION D — PROVIDER/APIs REQUIRED

**Google Business Profile API:**
- Why: GBP data sync, review monitoring, post management
- Endpoint Class: GBP API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (10 requests/second)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/locl/execute)
→ ExecutionOrchestrator
→ LOCL task implementations
→ IntegrationDispatcher (GBP)
→ GBP API
→ Local SEO processing (citations, NAP, rankings, competitors, map pack)
→ Health scoring
→ Database persistence (locl_audits)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers LOCL execution via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls GBP API
6. Local SEO data processed and analyzed
7. Health score calculated
8. Intelligence summary generated
9. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- GBP profile sync results
- Citation monitoring results
- NAP consistency validation results
- Local ranking data
- GBP post recommendations
- Local competitor tracking data
- Map pack analysis
- Local SEO health score
- Location-level SEO intelligence summary

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**locl_audits:**
- Status: EXISTS (mentioned in governance report)
- Purpose: Store LOCL audit results
- Columns: business_profile_id, gmb_name, citations, nap_consistency, rankings, health_score, map_pack_data, competitor_data

**business_profiles:**
- Status: EXISTS
- Purpose: Fetch business profile ID
- Columns: business_profile_id

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- GBP sync status
- NAP consistency score
- Local ranking position
- Citation count
- Health score
- Map pack position
- Competitor comparison
- GBP post recommendations
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for GBP callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Scheduled (daily/weekly)
- Long-running (3-10 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Automated GBP posting (deferred to AMPLI)
- GBP review response automation (deferred to REPUTE)
- Local citation building (deferred)
- GBP Q&A management (deferred)
- GBP photo management (deferred)
- Local event posting (deferred)
- Multi-location management (deferred)
- Local reporting dashboards (deferred to PRISM)

---

## AGENT 4: LINX - BACKLINK ANALYSIS

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Discover backlinks, score backlink quality, detect toxic backlinks, analyze internal linking, detect orphan pages, discover link opportunities, analyze anchor text, analyze authority flow, compare competitor backlinks, generate internal link recommendations.

**Customer Value:** Provides comprehensive backlink intelligence to improve domain authority and avoid toxic links.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Fetch backlinks from DataForSEO
2. Score backlink quality
3. Detect toxic backlinks
4. Analyze anchor text distribution
5. Calculate authority flow
6. Generate internal link recommendations
7. Store backlinks in database

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Domain

**Credentials:**
- DataForSEO API credentials (via integration dispatch)

**Tenant Settings:**
- enableCompetitorAnalysis (boolean)
- enableInternalLinkAnalysis (boolean)

**Prior Artifacts:**
- None

**Dependencies on Other Agents:**
- None

### SECTION D — PROVIDER/APIs REQUIRED

**DataForSEO:**
- Why: Backlink discovery and analysis
- Endpoint Class: Backlinks API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (5 requests/second)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/linx/execute)
→ ExecutionOrchestrator
→ LINX task implementations
→ IntegrationDispatcher (DataForSEO)
→ DataForSEO API
→ Backlink processing (quality scoring, toxic detection, anchor analysis)
→ Database persistence (linx_backlinks)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers LINX execution via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls DataForSEO
6. Backlinks processed and analyzed
7. Results stored in database
8. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Backlink inventory
- Quality scores
- Toxic backlink alerts
- Anchor text distribution
- Authority flow analysis
- Internal link recommendations
- Competitor backlink comparison (if enabled)

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**linx_backlinks:**
- Status: EXISTS (mentioned in runtime files)
- Purpose: Store backlink data
- Columns: domain, url, anchor_text, spam_score, authority_score, status

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Total backlinks
- Quality score distribution
- Toxic backlink count
- Anchor text distribution
- Authority flow
- Internal link recommendations
- Competitor comparison (if enabled)
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for DataForSEO callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Scheduled (weekly)
- Long-running (5-15 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Automated backlink outreach (deferred)
- Competitor backlink monitoring alerts (deferred)
- Backlink disavow file generation (deferred)
- Link building automation (deferred)
- Broken link detection (deferred)
- Redirect analysis (deferred)
- Link velocity tracking (deferred)
- Historical backlink tracking (deferred)

---

## AGENT 5: CORE - TECHNICAL SEO

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Govern system behavior, enforce policies, ensure compliance, monitor system health, detect technical SEO issues, validate technical SEO standards.

**Customer Value:** Ensures system reliability and technical SEO best practices are maintained.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Monitor system health
2. Enforce governance policies
3. Validate technical SEO standards
4. Detect technical issues
5. Generate technical SEO reports

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- None

**Credentials:**
- None

**Tenant Settings:**
- Governance policies

**Prior Artifacts:**
- System telemetry

**Dependencies on Other Agents:**
- None (system-level agent)

### SECTION D — PROVIDER/APIs REQUIRED

**None Required** (internal system agent)

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
System Event / Scheduled Task
→ RuntimeService
→ CORE governance logic
→ Policy enforcement
→ Technical validation
→ Database persistence (agent_events, agent_logs)
→ Dashboard alerts
```

**Exact Lifecycle:**
1. System event triggers CORE governance
2. RuntimeService executes governance logic
3. Policies enforced and validated
4. Technical issues detected and logged
5. Alerts generated if violations detected
6. Execution completes

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- System health status
- Governance violations
- Technical SEO issues
- Compliance reports
- Alert notifications

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**agent_events:**
- Status: EXISTS
- Purpose: Log governance events
- Columns: event_type, event_data, severity

**agent_logs:**
- Status: EXISTS
- Purpose: Log system operations
- Columns: log_level, message, context

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- System health status
- Active governance violations
- Technical SEO issues
- Compliance score
- Alert history

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- NONE (internal system agent)

### SECTION J — EXECUTION MODEL

**Classification:**
- Event-driven (system events)
- Continuous (background monitoring)
- Synchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Automated technical SEO fixes (deferred)
- Advanced governance policies (deferred)
- Multi-tenant governance (deferred)
- Governance analytics (deferred to PRISM)
- Policy recommendation engine (deferred)

---

## AGENT 6: REPUTE - REPUTATION MANAGEMENT

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Ingest reviews from GBP, monitor GBP reviews, analyze review sentiment, detect reputation risks, escalate negative reviews, cluster reviews, draft review responses, generate local SEO reputation summaries, analyze reputation trends.

**Customer Value:** Automates reputation monitoring and provides actionable insights for improving online reputation.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Ingest reviews from GBP
2. Analyze review sentiment (if enabled)
3. Detect reputation risks
4. Cluster reviews
5. Draft review responses (if enabled)
6. Escalate negative reviews (if enabled)
7. Generate local SEO reputation summary
8. Analyze reputation trends
9. Generate reputation intelligence summary

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Business profile ID
- GBP credentials

**Credentials:**
- Google Business Profile API credentials (via integration dispatch)

**Tenant Settings:**
- enableSentimentAnalysis (boolean)
- enableResponseDrafting (boolean)
- enableEscalation (boolean)

**Prior Artifacts:**
- None

**Dependencies on Other Agents:**
- None

### SECTION D — PROVIDER/APIs REQUIRED

**Google Business Profile API:**
- Why: Review ingestion and monitoring
- Endpoint Class: GBP API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (10 requests/second)
- MVP-Critical: YES

**OpenAI (Optional):**
- Why: Review sentiment analysis and response drafting
- Endpoint Class: Chat Completions API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: High (60 requests/minute)
- MVP-Critical: NO (optional feature)

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/repute/execute)
→ ExecutionOrchestrator
→ REPUTE task implementations
→ IntegrationDispatcher (GBP)
→ GBP API
→ Review processing (sentiment, clustering, risk detection)
→ Response drafting (if enabled)
→ Database persistence (gmb_reviews)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers REPUTE execution via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls GBP API
6. Reviews processed and analyzed
7. Responses drafted (if enabled)
8. Intelligence summary generated
9. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Review inventory
- Sentiment analysis results
- Reputation risk alerts
- Review clusters
- Drafted responses (if enabled)
- Escalation alerts (if enabled)
- Reputation summary
- Reputation trend analysis
- Reputation intelligence summary

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**gmb_reviews:**
- Status: EXISTS (mentioned in task files)
- Purpose: Store GBP reviews
- Columns: business_profile_id, review_id, rating, comment, sentiment, status

**business_profiles:**
- Status: EXISTS
- Purpose: Fetch business profile ID
- Columns: business_profile_id

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Total reviews
- Average rating
- Sentiment distribution
- Risk alerts
- Drafted responses (if enabled)
- Escalation alerts (if enabled)
- Reputation trend
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for GBP callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Scheduled (daily)
- Long-running (2-5 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Automated review posting (deferred to AMPLI)
- Review response automation (deferred)
- Multi-platform reputation monitoring (deferred)
- Social media sentiment analysis (deferred)
- Reputation scoring models (deferred)
- Crisis detection (deferred)
- Brand mention monitoring (deferred)

---

## AGENT 7: AMPLI - DISTRIBUTION/PUBLISHING

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Fetch approved content drafts, validate approval gates, publish to WordPress, publish to Shopify, publish to Webflow, publish to Ghost, schedule publishing, rollback publishing, update publishing status.

**Customer Value:** Automates content distribution across multiple CMS platforms with approval workflows.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Fetch drafts for publishing
2. Validate approval gate
3. Publish to WordPress (if configured)
4. Publish to Shopify (if configured)
5. Publish to Webflow (if configured)
6. Publish to Ghost (if configured)
7. Schedule publishing (if configured)
8. Rollback publishing (if needed)
9. Update publishing status

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- CMS credentials (WordPress, Shopify, Webflow, Ghost)

**Credentials:**
- WordPress API credentials
- Shopify API credentials
- Webflow API credentials
- Ghost API credentials

**Tenant Settings:**
- CMS configurations

**Prior Artifacts:**
- Content drafts from SCRIBE (status: approved)

**Dependencies on Other Agents:**
- SCRIBE (content drafts)

### SECTION D — PROVIDER/APIs REQUIRED

**WordPress REST API:**
- Why: Publish content to WordPress
- Endpoint Class: WordPress REST API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Low (no strict limits)
- MVP-Critical: YES

**Shopify REST Admin API:**
- Why: Publish content to Shopify
- Endpoint Class: Shopify REST Admin API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (40 requests/minute)
- MVP-Critical: YES

**Webflow API:**
- Why: Publish content to Webflow
- Endpoint Class: Webflow CMS API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (60 requests/minute)
- MVP-Critical: YES

**Ghost Admin API:**
- Why: Publish content to Ghost
- Endpoint Class: Ghost Admin API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Low (no strict limits)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/ampli/execute)
→ ExecutionOrchestrator
→ AMPLI task implementations
→ IntegrationDispatcher (CMS)
→ CMS APIs (WordPress, Shopify, Webflow, Ghost)
→ Publishing execution
→ Database persistence (publishing_schedule, seo_drafts status update)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers AMPLI publishing via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls CMS APIs
6. Content published to configured platforms
7. Publishing status updated in database
8. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Published content URLs
- Publishing status per platform
- Rollback results (if needed)
- Publishing schedule (if scheduled)

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**seo_drafts:**
- Status: EXISTS
- Purpose: Fetch drafts for publishing and update status
- Columns: title, body_html, meta_title, meta_description, status, cms_post_id

**publishing_approvals:**
- Status: EXISTS (mentioned in task files)
- Purpose: Store approval status
- Columns: draft_id, status, approved_by, approved_at

**publishing_schedule:**
- Status: EXISTS (mentioned in task files)
- Purpose: Store scheduled publishing
- Columns: draft_id, scheduled_at, status

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Drafts awaiting approval
- Approved drafts
- Published content per platform
- Scheduled publishing
- Publishing status
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for CMS callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Event-driven (user-triggered)
- Long-running (2-10 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Automated content promotion (deferred)
- Social media publishing (deferred)
- Email newsletter publishing (deferred)
- Content syndication (deferred)
- Multi-platform scheduling (deferred)
- Publishing analytics (deferred to PRISM)
- Content performance tracking (deferred)

---

## AGENT 8: PRISM - ANALYTICS/REPORTING

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Aggregate analytics data, analyze SEO KPIs, perform attribution analysis, generate campaign reports, generate dashboard summaries, generate executive summaries, analyze performance trends, generate analytics intelligence.

**Customer Value:** Provides comprehensive analytics and reporting to measure SEO performance and ROI.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Aggregate analytics data
2. Analyze SEO KPIs
3. Perform attribution analysis
4. Generate campaign reports (if requested)
5. Generate dashboard summary
6. Generate executive summary (if requested)
7. Analyze performance trends
8. Generate analytics intelligence

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Analytics credentials (Google Analytics, etc.)

**Credentials:**
- Google Analytics API credentials (if configured)

**Tenant Settings:**
- None

**Prior Artifacts:**
- Data from other agents (keywords, rankings, content, etc.)

**Dependencies on Other Agents:**
- All agents (aggregates data from all)

### SECTION D — PROVIDER/APIs REQUIRED

**Google Analytics API (Optional):**
- Why: Fetch analytics data
- Endpoint Class: Google Analytics API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (10 requests/second)
- MVP-Critical: NO (can use internal data only)

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/prism/execute)
→ ExecutionOrchestrator
→ PRISM task implementations
→ Data aggregation (from database)
→ Analytics processing (KPI analysis, attribution, trends)
→ Report generation
→ Database persistence (seo_reports)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers PRISM report via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. Data aggregated from database
6. Analytics processed and analyzed
7. Reports generated and stored
8. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- SEO KPI analysis
- Attribution analysis
- Campaign reports (if requested)
- Dashboard summaries
- Executive summaries (if requested)
- Performance trend analysis
- Analytics intelligence summary

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**seo_reports:**
- Status: EXISTS
- Purpose: Store generated reports
- Columns: report_type, report_data, status

**seo_keywords:**
- Status: EXISTS
- Purpose: Aggregate keyword data
- Columns: keyword, search_volume, difficulty, intent

**seo_drafts:**
- Status: EXISTS
- Purpose: Aggregate content data
- Columns: title, word_count, quality_score, status

**pulse_rankings:**
- Status: EXISTS
- Purpose: Aggregate ranking data
- Columns: keyword, position, change, checked_at

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- SEO KPI dashboard
- Attribution analysis
- Campaign reports (if generated)
- Executive summaries (if generated)
- Performance trends
- Intelligence summaries
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- NONE (internal data aggregation)

### SECTION J — EXECUTION MODEL

**Classification:**
- Scheduled (weekly/monthly)
- Long-running (2-5 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Real-time analytics (deferred)
- Custom report builder (deferred)
- Advanced attribution models (deferred)
- Predictive analytics (deferred)
- Anomaly detection (deferred)
- Multi-channel attribution (deferred)
- ROI calculation (deferred)
- Benchmarking (deferred)

---

## AGENT 9: PULSE - RANKING MONITORING

### SECTION A — BUSINESS MISSION

**Operational Purpose:** Track keyword rankings, track SERP movements, monitor volatility, detect ranking decay, detect ranking opportunities, cluster keywords, group intents, identify topical gaps, detect cannibalization, compare competitor SERP, track historical ranking intelligence.

**Customer Value:** Provides continuous ranking monitoring and intelligence to track SEO performance and identify opportunities.

### SECTION B — EXECUTION TASKS

**MVP Tasks Only:**
1. Fetch current rankings from DataForSEO
2. Calculate ranking movements
3. Detect volatility (if enabled)
4. Cluster keywords (if enabled)
5. Competitor SERP analysis (if enabled)
6. Detect ranking opportunities
7. Detect cannibalization
8. Generate ranking intelligence summary

### SECTION C — REQUIRED INPUTS

**Onboarding Data:**
- Keyword IDs (from ARIA)
- Competitor domains (optional)

**Credentials:**
- DataForSEO API credentials (via integration dispatch)

**Tenant Settings:**
- enableClustering (boolean)
- enableVolatilityDetection (boolean)
- enableCompetitorAnalysis (boolean)

**Prior Artifacts:**
- Keywords from ARIA

**Dependencies on Other Agents:**
- ARIA (keywords)

### SECTION D — PROVIDER/APIs REQUIRED

**DataForSEO:**
- Why: Fetch ranking data
- Endpoint Class: SERP API
- Sync vs Async: Async (via dispatch)
- Callback Required: No
- Rate Limit Sensitivity: Medium (5 requests/second)
- MVP-Critical: YES

### SECTION E — EXECUTION FLOW

**Canonical Runtime Flow:**
```
API Route (/api/agents/pulse/execute)
→ ExecutionOrchestrator
→ PULSE task implementations
→ IntegrationDispatcher (DataForSEO)
→ DataForSEO API
→ Ranking processing (movements, volatility, opportunities, cannibalization)
→ Database persistence (pulse_rankings)
→ Dashboard display
```

**Exact Lifecycle:**
1. User triggers PULSE execution via dashboard
2. API route creates execution via ExecutionOrchestrator
3. RuntimeService logs operations
4. Task implementations execute sequentially
5. IntegrationDispatcher calls DataForSEO
6. Rankings processed and analyzed
7. Results stored in database
8. Intelligence summary generated
9. Execution completes with success/failure status

### SECTION F — OUTPUT ARTIFACTS

**Actual Outputs:**
- Current rankings
- Ranking movements
- Volatility alerts (if enabled)
- Keyword clusters (if enabled)
- Competitor SERP comparison (if enabled)
- Ranking opportunities
- Cannibalization alerts
- Ranking intelligence summary

### SECTION G — DATABASE REQUIREMENTS

**Exact Required Tables:**

**pulse_rankings:**
- Status: EXISTS
- Purpose: Store ranking data
- Columns: keyword, position, change, checked_at, tenant_id

**seo_keywords:**
- Status: EXISTS
- Purpose: Fetch keywords to track
- Columns: keyword, search_volume, difficulty, intent

### SECTION H — DASHBOARD REQUIREMENTS

**User Should See:**
- Current rankings
- Ranking movements
- Volatility alerts (if enabled)
- Ranking opportunities
- Cannibalization alerts
- Competitor comparison (if enabled)
- Ranking trends
- Last execution status

### SECTION I — N8N REQUIREMENTS

**Minimal Role of n8n:**
- Webhook bridge for DataForSEO callbacks (if needed)
- NOT orchestrator (ExecutionOrchestrator handles orchestration)
- NOT required for MVP (can use direct dispatch)

### SECTION J — EXECUTION MODEL

**Classification:**
- Scheduled (daily/weekly)
- Long-running (3-10 minutes)
- Asynchronous

### SECTION K — MVP EXCLUSIONS

**What MUST NOT Be Built Yet:**
- Real-time ranking alerts (deferred)
- SERP feature tracking (deferred)
- SERP screenshot capture (deferred)
- Historical ranking analytics (deferred to PRISM)
- Ranking prediction (deferred)
- Advanced clustering (deferred)
- Intent re-classification (deferred)
- Competitor monitoring (deferred)

---

## ADDITIONAL GLOBAL DELIVERABLES

### 1. PROVIDER INVENTORY MATRIX

See separate document: `CLAUX_PROVIDER_DEPENDENCY_MATRIX.md`

### 2. ENVIRONMENT VARIABLE MATRIX

See separate document: `CLAUX_ENVIRONMENT_VARIABLE_ARCHITECTURE.md`

### 3. N8N TOPOLOGY BLUEPRINT

See separate document: `CLAUX_MINIMAL_N8N_TOPOLOGY.md`

### 4. EXECUTION PRIORITY ORDER

**Recommended Operationalization Order:**

**Phase 1 (Foundation):**
1. CORE - Technical SEO (system governance, must exist first)
2. ARIA - Keyword Intelligence (foundational for all other agents)

**Phase 2 (Content Pipeline):**
3. SCRIBE - Content Generation (depends on ARIA)
4. AMPLI - Distribution/Publishing (depends on SCRIBE)

**Phase 3 (Intelligence):**
5. PULSE - Ranking Monitoring (depends on ARIA)
6. PRISM - Analytics/Reporting (depends on all agents)

**Phase 4 (Specialized):**
7. LOCL - Local SEO (independent, can run parallel)
8. REPUTE - Reputation Management (independent, can run parallel)
9. LINX - Backlink Analysis (independent, can run parallel)

### 5. MVP vs NON-MVP CAPABILITIES

**MVP-Critical Agents:**
- CORE (system governance)
- ARIA (keyword intelligence)
- SCRIBE (content generation)
- AMPLI (distribution)

**MVP-Critical Features (per agent):**
- ARIA: Keyword discovery, intent classification, clustering, brief generation
- SCRIBE: Outline generation, article generation, metadata, schema, quality check
- LOCL: GBP sync, NAP validation, local rankings, health scoring
- LINX: Backlink discovery, quality scoring, toxic detection
- REPUTE: Review ingestion, sentiment analysis, risk detection
- AMPLI: WordPress publishing, approval gates
- PRISM: KPI analysis, dashboard summaries
- PULSE: Ranking tracking, movement calculation, opportunity detection

**Non-MVP (Deferred):**
- All features listed in each agent's MVP Exclusions section

---

## CRITICAL CTO DIRECTIVES COMPLIANCE

**NOT Done:**
- ❌ No AI agent capabilities invented beyond documented scope
- ❌ No autonomous hype features added
- ❌ No speculative infrastructure created
- ❌ No microservices introduced
- ❌ No scaling systems invented
- ❌ No distributed orchestration created
- ❌ No queue infrastructure added (not proven necessary)

**CLAUX Remains:**
- ✅ LEAN (minimal scope defined)
- ✅ CANONICAL (single source of truth)
- ✅ ATTACHMENT-FIRST (execution-first approach)
- ✅ EXECUTION-FIRST (runtime-centric design)

---

## CONCLUSION

This blueprint defines the canonical operational scope for all 9 CLAUX agents. It provides exact specifications for business missions, execution tasks, required inputs, provider dependencies, execution flows, output artifacts, database requirements, dashboard requirements, n8n requirements, execution models, and MVP exclusions.

**Next Steps:**
1. Generate CLAUX_PROVIDER_DEPENDENCY_MATRIX.md
2. Generate CLAUX_ENVIRONMENT_VARIABLE_ARCHITECTURE.md
3. Generate CLAUX_MINIMAL_N8N_TOPOLOGY.md
4. Review and approve blueprint
5. Begin implementation per execution priority order

**Status:** READY FOR IMPLEMENTATION
