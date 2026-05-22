# CLAUX Agent Responsibility Matrix

**Report Date:** 2025-01-19
**Task:** TASK 3C.2 - AGENT RESPONSIBILITY REDEFINITION
**Status:** COMPLETED

## Executive Summary

This report defines the canonical responsibility matrix for all CLAUX agents. All agents are redefined as SEO intelligence + task planning layers only. RuntimeService becomes the sole execution authority. Agents NEVER execute providers directly, NEVER own execution state, NEVER own retries, NEVER own workflows/orchestration.

**RESPONSIBILITY MATRIX STATUS:** ✅ DEFINED

---

## Canonical Agent Definition

### Agent Role

**Agents are SEO intelligence + task planning layers ONLY.**

**Agents DO:**
- Analyze SEO data
- Plan execution strategies
- Create runtime tasks
- Process provider results
- Generate SEO insights

**Agents DO NOT:**
- Execute providers directly
- Own execution state
- Own retry logic
- Own workflows/orchestration
- Own scheduling
- Control locks
- Manage execution lifecycle

**RuntimeService DOES:**
- Execute all provider calls
- Own all execution state
- Own all retry logic
- Own all orchestration
- Own all scheduling
- Manage all locks
- Manage execution lifecycle

---

## Agent Responsibility Matrix

### ARIA - Keyword Intelligence Agent

**Status:** PARTIAL (requires RuntimeService integration)

---

#### 1. Inputs

```typescript
interface ARIAInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    website_url: string;
    category: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **Keyword Research Strategy:** Analyze business profile to determine keyword research strategy
- **Keyword Quality Analysis:** Classify keyword intent (transactional, informational, commercial)
- **Keyword Validation:** Validate keywords for quality (length, format, relevance)
- **Keyword Filtering:** Apply quality filters (volume > 50, difficulty < 80)
- **Keyword Prioritization:** Prioritize keywords based on search volume and intent
- **Keyword Normalization:** Normalize keywords for consistency
- **Keyword Deduplication:** Deduplicate keywords across runs

---

#### 3. Runtime Task Creation Responsibilities

- **Create Keyword Research Tasks:** Create runtime tasks for keyword research via RuntimeService
- **Task Configuration:** Configure keyword research tasks with target domain, location, language
- **Task Scheduling:** Schedule keyword research tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process keyword research results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute keyword research tasks
- **ExecutionOrchestrator:** Orchestrate keyword research task execution
- **DataForSEO Runtime Connector:** Execute keyword research API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **DataForSEO API:** Keyword research data
- **DataForSEO Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **aria_keywords table:** Keyword research results
- **Keyword metadata:** Search volume, difficulty, intent
- **Keyword classifications:** Transactional, informational, commercial
- **Quality metrics:** Volume, difficulty scores

---

#### 7. Execution Lifecycle

```
1. Agent receives business profile
2. Agent analyzes business profile
3. Agent creates keyword research task via RuntimeService
4. RuntimeService executes task via DataForSEO Connector
5. Agent receives keyword research results
6. Agent processes and filters keywords
7. Agent stores keywords in aria_keywords table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Keyword intelligence, quality analysis, filtering
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **DataForSEO Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct DataForSEO API calls
- **FORBIDDEN:** Direct keyword research execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### SCRIBE - Content Generation Agent

**Status:** PARTIAL (requires RuntimeService integration)

---

#### 1. Inputs

```typescript
interface SCRIBEInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    category: string;
  };
  keywords: Array<{
    keyword: string;
    search_volume: number;
    intent: string;
  }>;
}
```

---

#### 2. Intelligence Responsibilities

- **Content Strategy:** Analyze keywords to determine content strategy
- **Keyword Diversification:** Diversify keyword selection (high, medium, low volume)
- **Content Planning:** Plan content generation based on keyword intent
- **Content Quality Analysis:** Analyze generated content for quality (word count, relevance)
- **Duplicate Detection:** Detect duplicate content to prevent redundancy
- **Content Optimization:** Optimize content for SEO (title, structure, keywords)

---

#### 3. Runtime Task Creation Responsibilities

- **Create Content Generation Tasks:** Create runtime tasks for content generation via RuntimeService
- **Task Configuration:** Configure content generation tasks with keyword, category, tone
- **Task Scheduling:** Schedule content generation tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process content generation results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute content generation tasks
- **ExecutionOrchestrator:** Orchestrate content generation task execution
- **OpenAI Runtime Connector:** Execute content generation API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **OpenAI API:** Content generation
- **OpenAI Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **scribe_content table:** Generated content
- **Content metadata:** Title, word count, target keywords
- **Content status:** Draft, publishing, published
- **Quality metrics:** Word count, relevance scores

---

#### 7. Execution Lifecycle

```
1. Agent receives keywords from ARIA
2. Agent diversifies keyword selection
3. Agent creates content generation tasks via RuntimeService
4. RuntimeService executes tasks via OpenAI Connector
5. Agent receives content generation results
6. Agent analyzes content quality
7. Agent stores content in scribe_content table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Content strategy, diversification, quality analysis
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **OpenAI Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct OpenAI API calls
- **FORBIDDEN:** Direct content generation execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### LOCL - Google My Business Audit Agent

**Status:** PARTIAL (requires RuntimeService integration)

---

#### 1. Inputs

```typescript
interface LOCLInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    business_name: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **GMB Audit Strategy:** Analyze business profile to determine GMB audit strategy
- **Completeness Analysis:** Calculate GMB profile completeness score
- **Optimization Analysis:** Calculate GMB optimization score
- **Gap Detection:** Detect missing optimization items (reviews, photos, posts)
- **Recommendation Generation:** Generate actionable recommendations for GMB optimization
- **Competitor Analysis:** Analyze competitor GMB profiles (future)

---

#### 3. Runtime Task Creation Responsibilities

- **Create GMB Audit Tasks:** Create runtime tasks for GMB audit via RuntimeService
- **Task Configuration:** Configure GMB audit tasks with business name, location
- **Task Scheduling:** Schedule GMB audit tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process GMB audit results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute GMB audit tasks
- **ExecutionOrchestrator:** Orchestrate GMB audit task execution
- **Google Business Profile Runtime Connector:** Execute GMB API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **Google Business Profile API:** GMB profile data
- **Google Business Profile Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **locl_audits table:** GMB audit results
- **Audit metadata:** Completeness score, optimization score
- **Gap analysis:** Missing items, recommendations
- **Optimization metrics:** Review count, rating, photos, posts

---

#### 7. Execution Lifecycle

```
1. Agent receives business profile
2. Agent creates GMB audit task via RuntimeService
3. RuntimeService executes task via Google Business Profile Connector
4. Agent receives GMB audit results
5. Agent calculates completeness and optimization scores
6. Agent generates recommendations
7. Agent stores audit in locl_audits table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Audit strategy, score calculation, recommendation generation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Google Business Profile Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct Google Business Profile API calls
- **FORBIDDEN:** Direct GMB audit execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### LINX - Backlink Analysis Agent

**Status:** DEAD (requires full implementation)

---

#### 1. Inputs

```typescript
interface LINXInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    website_url: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **Backlink Strategy:** Analyze website to determine backlink analysis strategy
- **Backlink Profile Analysis:** Analyze backlink profile (domain authority, link quality)
- **Competitor Analysis:** Analyze competitor backlink profiles
- **Gap Detection:** Detect backlink gaps and opportunities
- **Recommendation Generation:** Generate backlink building recommendations
- **Link Quality Assessment:** Assess link quality (domain authority, relevance)

---

#### 3. Runtime Task Creation Responsibilities

- **Create Backlink Analysis Tasks:** Create runtime tasks for backlink analysis via RuntimeService
- **Task Configuration:** Configure backlink analysis tasks with target domain, competitors
- **Task Scheduling:** Schedule backlink analysis tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process backlink analysis results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute backlink analysis tasks
- **ExecutionOrchestrator:** Orchestrate backlink analysis task execution
- **Custom API Runtime Connector:** Execute backlink API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **Backlink API (Custom):** Backlink data
- **Custom API Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **linx_backlinks table:** Backlink analysis results
- **Backlink metadata:** Domain authority, link quality, relevance
- **Gap analysis:** Backlink gaps, opportunities
- **Recommendations:** Backlink building recommendations

---

#### 7. Execution Lifecycle

```
1. Agent receives website URL
2. Agent creates backlink analysis task via RuntimeService
3. RuntimeService executes task via Custom API Connector
4. Agent receives backlink analysis results
5. Agent analyzes backlink profile
6. Agent generates recommendations
7. Agent stores results in linx_backlinks table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Backlink strategy, profile analysis, recommendation generation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Custom API Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct backlink API calls
- **FORBIDDEN:** Direct backlink analysis execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### CORE - Technical Audit Agent

**Status:** DEAD (requires full implementation)

---

#### 1. Inputs

```typescript
interface COREInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    website_url: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **Technical SEO Strategy:** Analyze website to determine technical SEO audit strategy
- **Site Structure Analysis:** Analyze site structure, URL patterns, navigation
- **Performance Analysis:** Analyze site performance (page speed, Core Web Vitals)
- **Schema Validation:** Validate structured data implementation
- **Mobile Optimization:** Analyze mobile optimization
- **Indexability Analysis:** Analyze indexability and crawlability
- **Recommendation Generation:** Generate technical SEO recommendations

---

#### 3. Runtime Task Creation Responsibilities

- **Create Technical Audit Tasks:** Create runtime tasks for technical audit via RuntimeService
- **Task Configuration:** Configure technical audit tasks with target URL, audit scope
- **Task Scheduling:** Schedule technical audit tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process technical audit results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute technical audit tasks
- **ExecutionOrchestrator:** Orchestrate technical audit task execution
- **Google Search Console Runtime Connector:** Execute GSC API calls
- **Custom API Runtime Connector:** Execute technical audit API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **Google Search Console API:** Technical SEO data
- **PageSpeed Insights API:** Performance data
- **Custom API Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **core_audits table:** Technical audit results
- **Technical metadata:** Performance scores, schema validation, mobile optimization
- **Issue detection:** Technical issues, warnings
- **Recommendations:** Technical SEO recommendations

---

#### 7. Execution Lifecycle

```
1. Agent receives website URL
2. Agent creates technical audit tasks via RuntimeService
3. RuntimeService executes tasks via Google Search Console Connector
4. Agent receives technical audit results
5. Agent analyzes technical SEO
6. Agent generates recommendations
7. Agent stores results in core_audits table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Technical strategy, analysis, recommendation generation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Google Search Console Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct Google Search Console API calls
- **FORBIDDEN:** Direct technical audit execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### REPUTE - Review Monitoring Agent

**Status:** DEAD (requires full implementation)

---

#### 1. Inputs

```typescript
interface REPUTEInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    business_name: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **Review Strategy:** Analyze business profile to determine review monitoring strategy
- **Sentiment Analysis:** Analyze review sentiment (positive, negative, neutral)
- **Review Trend Analysis:** Analyze review trends over time
- **Competitor Analysis:** Analyze competitor review profiles
- **Response Recommendations:** Generate review response recommendations
- **Alert Generation:** Generate alerts for negative reviews or rating drops

---

#### 3. Runtime Task Creation Responsibilities

- **Create Review Monitoring Tasks:** Create runtime tasks for review monitoring via RuntimeService
- **Task Configuration:** Configure review monitoring tasks with business name, platforms
- **Task Scheduling:** Schedule review monitoring tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process review monitoring results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute review monitoring tasks
- **ExecutionOrchestrator:** Orchestrate review monitoring task execution
- **Custom API Runtime Connector:** Execute review API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **Review APIs (Custom):** Review data (Google, Yelp, etc.)
- **Custom API Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **repute_reviews table:** Review monitoring results
- **Review metadata:** Rating, sentiment, platform
- **Sentiment analysis:** Positive, negative, neutral ratios
- **Alerts:** Negative reviews, rating drops

---

#### 7. Execution Lifecycle

```
1. Agent receives business name
2. Agent creates review monitoring tasks via RuntimeService
3. RuntimeService executes tasks via Custom API Connector
4. Agent receives review monitoring results
5. Agent analyzes review sentiment
6. Agent generates alerts and recommendations
7. Agent stores results in repute_reviews table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Review strategy, sentiment analysis, alert generation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Custom API Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct review API calls
- **FORBIDDEN:** Direct review monitoring execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### AMPLI (PUBLISH) - Content Publishing Agent

**Status:** PARTIAL (requires RuntimeService integration + retry logic removal)

---

#### 1. Inputs

```typescript
interface AMPLIInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  cmsConfig: {
    cms_type: string;
    site_url: string;
    api_url: string;
  };
  draftContent: Array<{
    id: string;
    title: string;
    body_html: string;
    status: string;
  }>;
}
```

---

#### 2. Intelligence Responsibilities

- **Publishing Strategy:** Analyze draft content to determine publishing strategy
- **CMS Selection:** Select appropriate CMS based on configuration
- **Content Preparation:** Prepare content for publishing (sanitization, slug generation)
- **Publish Scheduling:** Schedule publishing based on content priority
- **Publish Monitoring:** Monitor publish status and handle failures
- **Result Validation:** Validate published content (URL, status)

---

#### 3. Runtime Task Creation Responsibilities

- **Create Publishing Tasks:** Create runtime tasks for content publishing via RuntimeService
- **Task Configuration:** Configure publishing tasks with CMS, content, credentials
- **Task Scheduling:** Schedule publishing tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process publishing results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute publishing tasks
- **ExecutionOrchestrator:** Orchestrate publishing task execution
- **WordPress Runtime Connector:** Execute WordPress API calls
- **Custom API Runtime Connector:** Execute custom CMS API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **WordPress API:** Content publishing
- **Shopify API:** Content publishing (future)
- **Custom API:** Content publishing
- **WordPress Runtime Connector:** Provider execution
- **Custom API Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **publish_jobs table:** Publishing job records
- **scribe_content table:** Updated content status and published URLs
- **Publish metadata:** CMS type, status, published URL, timestamp

---

#### 7. Execution Lifecycle

```
1. Agent receives draft content
2. Agent creates publishing tasks via RuntimeService
3. RuntimeService executes tasks via WordPress Connector
4. Agent receives publishing results
5. Agent validates published content
6. Agent updates content status to published
7. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Publishing strategy, content preparation, result validation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **WordPress Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct WordPress API calls
- **FORBIDDEN:** Direct publishing execution
- **FORBIDDEN:** Retry logic ownership (CRITICAL VIOLATION - MUST REMOVE)
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### PRISM - Reporting Agent

**Status:** DEAD (requires full implementation)

---

#### 1. Inputs

```typescript
interface PRISMInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    website_url: string;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}
```

---

#### 2. Intelligence Responsibilities

- **Reporting Strategy:** Analyze business profile to determine reporting strategy
- **Data Aggregation:** Aggregate data from multiple sources (ARIA, SCRIBE, LOCL, PULSE, etc.)
- **Analytics Analysis:** Analyze analytics data (traffic, rankings, conversions)
- **Trend Analysis:** Analyze trends over time
- **Insight Generation:** Generate actionable insights from data
- **Report Generation:** Generate comprehensive SEO reports

---

#### 3. Runtime Task Creation Responsibilities

- **Create Analytics Tasks:** Create runtime tasks for analytics data via RuntimeService
- **Task Configuration:** Configure analytics tasks with date range, metrics
- **Task Scheduling:** Schedule analytics tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process analytics results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute analytics tasks
- **ExecutionOrchestrator:** Orchestrate analytics task execution
- **Google Analytics Runtime Connector:** Execute GA API calls
- **Google Search Console Runtime Connector:** Execute GSC API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **Google Analytics API:** Analytics data
- **Google Search Console API:** Search performance data
- **Google Analytics Runtime Connector:** Provider execution
- **Google Search Console Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **prism_reports table:** SEO reports
- **Report metadata:** Date range, metrics, insights
- **Analytics snapshots:** Traffic, rankings, performance data
- **Recommendations:** Actionable recommendations

---

#### 7. Execution Lifecycle

```
1. Agent receives date range
2. Agent creates analytics tasks via RuntimeService
3. RuntimeService executes tasks via Google Analytics Connector
4. Agent receives analytics results
5. Agent aggregates data from multiple sources
6. Agent generates insights and recommendations
7. Agent stores report in prism_reports table
8. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Reporting strategy, data aggregation, insight generation
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Google Analytics Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct Google Analytics API calls
- **FORBIDDEN:** Direct Google Search Console API calls
- **FORBIDDEN:** Direct analytics execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

### PULSE - Keyword Ranking Tracking Agent

**Status:** PARTIAL (requires RuntimeService integration)

---

#### 1. Inputs

```typescript
interface PULSEInputs {
  tenantId: string;
  runId: string;
  executionId: string;
  businessProfile: {
    website_url: string;
  };
  keywords: Array<{
    keyword: string;
    search_volume: number;
    intent: string;
  }>;
}
```

---

#### 2. Intelligence Responsibilities

- **Ranking Strategy:** Analyze keywords to determine ranking tracking strategy
- **Tracking Priority:** Calculate tracking priority based on volume and intent
- **Visibility Analysis:** Calculate visibility score from rank
- **Movement Analysis:** Analyze rank movement over time
- **Anomaly Detection:** Detect ranking anomalies (sudden drops, spikes)
- **Trend Analysis:** Analyze ranking trends over time

---

#### 3. Runtime Task Creation Responsibilities

- **Create Ranking Tasks:** Create runtime tasks for ranking tracking via RuntimeService
- **Task Configuration:** Configure ranking tasks with keywords, location, device
- **Task Scheduling:** Schedule ranking tasks through RuntimeService
- **Task Monitoring:** Monitor task execution status through RuntimeService
- **Result Processing:** Process ranking results from RuntimeService

---

#### 4. Runtime Execution Dependencies

- **RuntimeService:** Create and execute ranking tasks
- **ExecutionOrchestrator:** Orchestrate ranking task execution
- **Custom API Runtime Connector:** Execute SERP API calls
- **EventService:** Publish task events
- **LogService:** Publish task logs

---

#### 5. Provider Dependencies

- **SERP API (Custom):** Ranking data
- **Custom API Runtime Connector:** Provider execution

---

#### 6. Expected Artifacts

- **pulse_rankings table:** Ranking tracking results
- **Ranking metadata:** Current rank, previous rank, rank change
- **Visibility metrics:** Visibility score, tracking priority
- **Movement metrics:** Rank change, trend analysis

---

#### 7. Execution Lifecycle

```
1. Agent receives keywords from ARIA
2. Agent creates ranking tasks via RuntimeService
3. RuntimeService executes tasks via Custom API Connector
4. Agent receives ranking results
5. Agent calculates visibility score and movement
6. Agent stores rankings in pulse_rankings table
7. Agent completes
```

---

#### 8. Runtime Boundaries

- **Agent Responsibility:** Ranking strategy, priority calculation, movement analysis
- **RuntimeService Responsibility:** Task creation, execution, retry logic
- **Custom API Connector Responsibility:** Provider API execution
- **EventService Responsibility:** Event publishing
- **LogService Responsibility:** Log publishing

---

#### 9. Forbidden Responsibilities

- **FORBIDDEN:** Direct SERP API calls
- **FORBIDDEN:** Direct ranking execution
- **FORBIDDEN:** Retry logic ownership
- **FORBIDDEN:** Execution state ownership
- **FORBIDDEN:** Workflow orchestration
- **FORBIDDEN:** Scheduling ownership
- **FORBIDDEN:** Lock management

---

## Canonical Agent Execution Flow

### Standard Execution Flow

```
1. Agent receives inputs (tenantId, runId, executionId, business data)
2. Agent analyzes inputs and determines strategy
3. Agent creates runtime tasks via RuntimeService
4. RuntimeService creates tasks in runtime_tasks table
5. ExecutionOrchestrator orchestrates task execution
6. Runtime Connector executes provider API calls
7. Provider API returns results
8. Runtime Connector returns canonical response
9. RuntimeService updates task status
10. EventService publishes task events
11. LogService publishes task logs
12. Agent receives results from RuntimeService
13. Agent processes results (intelligence analysis)
14. Agent stores artifacts in agent-specific tables
15. Agent completes
```

---

### Cross-Agent Data Flow

```
ARIA → aria_keywords table
  ↓
SCRIBE reads aria_keywords table
  ↓
SCRIBE → scribe_content table
  ↓
AMPLI reads scribe_content table
  ↓
AMPLI → publish_jobs table + scribe_content table (updated)
  ↓
PULSE reads aria_keywords table
  ↓
PULSE → pulse_rankings table
```

**NOTE:** These are data dependencies, NOT execution dependencies. All execution flows through RuntimeService.

---

## Runtime Service Integration Requirements

### Task Creation

All agents MUST use RuntimeService to create tasks:

```typescript
await runtimeService.createTask({
  tenantId,
  executionId,
  taskId,
  agent,
  operation,
  payload,
  connector,
  provider
});
```

---

### Task Execution

All agents MUST use RuntimeService to execute tasks:

```typescript
const result = await runtimeService.executeTask({
  tenantId,
  executionId,
  taskId,
  agent,
  operation,
  payload
});
```

---

### Task Monitoring

All agents MUST use RuntimeService to monitor task status:

```typescript
const status = await runtimeService.getTaskStatus({
  tenantId,
  executionId,
  taskId
});
```

---

## Forbidden Responsibilities Summary

### FORBIDDEN for ALL Agents

1. **Direct Provider Calls:** Never call provider APIs directly
2. **Execution State Ownership:** Never own execution state
3. **Retry Logic Ownership:** Never own retry logic
4. **Workflow Orchestration:** Never own workflows
5. **Scheduling Ownership:** Never own scheduling
6. **Lock Management:** Never manage locks
7. **Event Publishing:** Never publish events directly (use EventService)
8. **Log Publishing:** Never publish logs directly (use LogService)

---

## Compliance Matrix

### Canonical Architecture Compliance

| Agent | Intelligence Layer | Task Creation | Runtime Integration | Status |
|-------|------------------|---------------|-------------------|--------|
| ARIA | ✅ Defined | ✅ Required | ❌ Incomplete | PARTIAL |
| SCRIBE | ✅ Defined | ✅ Required | ❌ Incomplete | PARTIAL |
| LOCL | ✅ Defined | ✅ Required | ❌ Incomplete | PARTIAL |
| LINX | ✅ Defined | ✅ Required | ❌ Not Implemented | DEAD |
| CORE | ✅ Defined | ✅ Required | ❌ Not Implemented | DEAD |
| REPUTE | ✅ Defined | ✅ Required | ❌ Not Implemented | DEAD |
| AMPLI | ✅ Defined | ✅ Required | ❌ Incomplete | PARTIAL |
| PRISM | ✅ Defined | ✅ Required | ❌ Not Implemented | DEAD |
| PULSE | ✅ Defined | ✅ Required | ❌ Incomplete | PARTIAL |

---

### Forbidden Responsibilities Compliance

| Agent | Direct Provider Calls | Execution State | Retry Logic | Workflow | Scheduling | Locks | Events | Logs | Status |
|-------|---------------------|----------------|------------|----------|-----------|------|--------|------|--------|
| ARIA | ✅ Removed | ✅ Removed | ✅ No | ✅ No | ✅ No | ✅ No | ❌ Not Used | ❌ Not Used | PARTIAL |
| SCRIBE | ✅ Removed | ✅ Removed | ✅ No | ✅ No | ✅ No | ✅ No | ❌ Not Used | ❌ Not Used | PARTIAL |
| LOCL | ✅ Removed | ✅ Removed | ✅ No | ✅ No | ✅ No | ✅ No | ❌ Not Used | ❌ Not Used | PARTIAL |
| LINX | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | DEAD |
| CORE | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | DEAD |
| REPUTE | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | DEAD |
| AMPLI | ✅ Removed | ✅ Removed | ❌ VIOLATION | ✅ No | ✅ No | ✅ No | ❌ Not Used | ❌ Not Used | PARTIAL |
| PRISM | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | DEAD |
| PULSE | ✅ Removed | ✅ Removed | ✅ No | ✅ No | ✅ No | ✅ No | ❌ Not Used | ❌ Not Used | PARTIAL |

---

## Conclusion

The canonical agent responsibility matrix has been successfully defined. All agents are redefined as SEO intelligence + task planning layers only. RuntimeService becomes the sole execution authority. The matrix provides clear boundaries between agent intelligence responsibilities and runtime execution responsibilities.

**RESPONSIBILITY MATRIX STATUS:** ✅ DEFINED

**Next Steps:**
- TASK 3C.3: Canonical Task Contracts
- TASK 3C.4: Remove Agent Execution Ownership
- TASK 3C.5: Runtime Integration Implementation

---

**END OF MATRIX**
