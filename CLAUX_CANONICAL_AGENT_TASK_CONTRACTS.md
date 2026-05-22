# CLAUX Canonical Agent Task Contracts

**Report Date:** 2025-01-19
**Task:** TASK 3C.3 - CANONICAL TASK CONTRACTS
**Status:** COMPLETED

## Executive Summary

This report defines the canonical runtime task contracts for all CLAUX agent operations. All agent actions are defined as canonical runtime tasks with standardized contracts, execution states, retry behavior, failure behavior, artifact persistence, and tenant boundaries. RuntimeService is the sole task owner and executor.

**CANONICAL TASK CONTRACTS STATUS:** ✅ DEFINED

---

## Task Contract Definition

### Task Contract Structure

For each task, the following is defined:

- **Runtime Owner:** RuntimeService (sole owner)
- **Connector Used:** Specific runtime connector
- **Provider Used:** Specific provider API
- **Input Contract:** TypeScript interface for task input
- **Output Contract:** TypeScript interface for task output
- **Execution States:** Task execution lifecycle states
- **Retry Behavior:** Retry logic (owned by RuntimeService)
- **Failure Behavior:** Failure handling (owned by RuntimeService)
- **Artifact Persistence:** Where results are stored
- **Tenant Boundaries:** Tenant isolation enforcement

---

## ARIA Tasks

### task_keyword_research

**Runtime Owner:** RuntimeService
**Connector Used:** DataForSEOConnector
**Provider Used:** DataForSEO API

---

#### Input Contract

```typescript
interface KeywordResearchInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  domain: string;
  location?: string; // Default: "us"
  language?: string; // Default: "en"
  maxResults?: number; // Default: 100
}
```

---

#### Output Contract

```typescript
interface KeywordResearchOutput {
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
    cpc?: number;
    intent?: string;
  }>;
  totalResults: number;
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (1s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** aria_keywords
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - keyword (string)
  - search_volume (number)
  - difficulty (number)
  - intent (string)
  - created_at (timestamp)
  - updated_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_serp_analysis

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** SERP API (Custom)

---

#### Input Contract

```typescript
interface SERPAnalysisInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keyword: string;
  location?: string; // Default: "us"
  device?: string; // Default: "desktop"
  language?: string; // Default: "en"
}
```

---

#### Output Contract

```typescript
interface SERPAnalysisOutput {
  keyword: string;
  results: Array<{
    position: number;
    title: string;
    url: string;
    domain: string;
    description: string;
  }>;
  totalResults: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** aria_serp_results
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - keyword (string)
  - position (number)
  - title (string)
  - url (string)
  - domain (string)
  - description (string)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_keyword_clustering

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface KeywordClusteringInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keywords: Array<{
    keyword: string;
    volume: number;
    difficulty: number;
  }>;
  clusterCount?: number; // Default: 5
}
```

---

#### Output Contract

```typescript
interface KeywordClusteringOutput {
  clusters: Array<{
    clusterId: number;
    clusterName: string;
    keywords: Array<{
      keyword: string;
      volume: number;
      difficulty: number;
    }>;
  }>;
  totalClusters: number;
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** aria_keyword_clusters
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - cluster_id (number)
  - cluster_name (string)
  - keyword (string)
  - volume (number)
  - difficulty (number)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## SCRIBE Tasks

### task_generate_article

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface GenerateArticleInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keyword: string;
  businessCategory: string;
  tone?: string; // Default: "professional"
  wordCount?: number; // Default: 1000
  outline?: string; // Optional outline
}
```

---

#### Output Contract

```typescript
interface GenerateArticleOutput {
  title: string;
  content: string;
  wordCount: number;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** scribe_content
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - title (string)
  - body_html (string)
  - status (string) // draft, publishing, published
  - target_keywords (string[])
  - word_count (number)
  - created_at (timestamp)
  - updated_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_generate_metadata

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface GenerateMetadataInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  title: string;
  content: string;
  keyword: string;
}
```

---

#### Output Contract

```typescript
interface GenerateMetadataOutput {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (1s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** scribe_metadata
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - content_id (UUID)
  - meta_title (string)
  - meta_description (string)
  - meta_keywords (string[])
  - og_title (string)
  - og_description (string)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_generate_outline

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface GenerateOutlineInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keyword: string;
  businessCategory: string;
  sectionCount?: number; // Default: 5
}
```

---

#### Output Contract

```typescript
interface GenerateOutlineOutput {
  outline: Array<{
    section: number;
    title: string;
    points: string[];
  }>;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (1s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** scribe_outlines
- **Columns:**
  - tenant_id (UUID)
  - run_id (UUID)
  - keyword (string)
  - outline (json)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## AMPLI Tasks

### task_publish_wordpress

**Runtime Owner:** RuntimeService
**Connector Used:** WordPressConnector
**Provider Used:** WordPress REST API

---

#### Input Contract

```typescript
interface PublishWordPressInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  title: string;
  content: string;
  status?: string; // Default: "draft"
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
}
```

---

#### Output Contract

```typescript
interface PublishWordPressOutput {
  postId: number;
  url: string;
  status: string;
  publishedAt: string;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** publish_jobs
- **Columns:**
  - tenant_id (UUID)
  - content_id (UUID)
  - status (string) // queued, publishing, success, failed
  - cms_type (string)
  - published_url (string)
  - error_message (string)
  - retry_count (number)
  - max_retries (number)
  - created_at (timestamp)
  - updated_at (timestamp)

- **Table:** scribe_content (updated)
- **Columns:**
  - status (string) // updated to "published"
  - published_url (string)
  - published_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_publish_custom

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Custom API

---

#### Input Contract

```typescript
interface PublishCustomInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  title: string;
  content: string;
  slug: string;
  apiUrl: string;
  method?: string; // Default: "POST"
  headers?: Record<string, string>;
}
```

---

#### Output Contract

```typescript
interface PublishCustomOutput {
  success: boolean;
  url?: string;
  error?: string;
  statusCode?: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** publish_jobs
- **Columns:**
  - tenant_id (UUID)
  - content_id (UUID)
  - status (string) // queued, publishing, success, failed
  - cms_type (string)
  - published_url (string)
  - error_message (string)
  - retry_count (number)
  - max_retries (number)
  - created_at (timestamp)
  - updated_at (timestamp)

- **Table:** scribe_content (updated)
- **Columns:**
  - status (string) // updated to "published"
  - published_url (string)
  - published_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## PULSE Tasks

### task_monitor_rankings

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** SERP API (Custom)

---

#### Input Contract

```typescript
interface MonitorRankingsInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keyword: string;
  location?: string; // Default: "us"
  device?: string; // Default: "desktop"
  language?: string; // Default: "en"
}
```

---

#### Output Contract

```typescript
interface MonitorRankingsOutput {
  keyword: string;
  rank: number | null;
  url: string;
  domain: string;
  searchEngine: string;
  location: string;
  device: string;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** pulse_rankings
- **Columns:**
  - tenant_id (UUID)
  - keyword (string)
  - url (string)
  - search_engine (string)
  - location (string)
  - device (string)
  - current_rank (number)
  - previous_rank (number)
  - rank_change (number)
  - tracking_priority (string)
  - visibility_score (number)
  - status (string)
  - checked_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_detect_anomalies

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface DetectAnomaliesInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  keyword: string;
  currentRank: number | null;
  previousRank: number | null;
  rankHistory: Array<{
    rank: number;
    checkedAt: string;
  }>;
}
```

---

#### Output Contract

```typescript
interface DetectAnomaliesOutput {
  hasAnomaly: boolean;
  anomalyType?: string;
  severity?: string;
  description?: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (1s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** pulse_anomalies
- **Columns:**
  - tenant_id (UUID)
  - keyword (string)
  - has_anomaly (boolean)
  - anomaly_type (string)
  - severity (string)
  - description (string)
  - detected_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## LOCL Tasks

### task_gbp_audit

**Runtime Owner:** RuntimeService
**Connector Used:** GoogleBusinessProfileConnector
**Provider Used:** Google Business Profile API

---

#### Input Contract

```typescript
interface GBPAuditInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  businessName: string;
  locationId?: string;
}
```

---

#### Output Contract

```typescript
interface GBPAuditOutput {
  gmbName: string;
  primaryCategory: string;
  reviewCount: number;
  averageRating: number;
  photosCount: number;
  postsCount: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** locl_audits
- **Columns:**
  - tenant_id (UUID)
  - gmb_name (string)
  - primary_category (string)
  - review_count (number)
  - average_rating (number)
  - photos_count (number)
  - posts_count (number)
  - completeness_score (number)
  - optimization_score (number)
  - missing_items (string[])
  - recommendations (string[])
  - checked_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_local_visibility_scan

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Local SEO API (Custom)

---

#### Input Contract

```typescript
interface LocalVisibilityScanInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  businessName: string;
  location: string;
  radius?: number; // Default: 10 miles
}
```

---

#### Output Contract

```typescript
interface LocalVisibilityScanOutput {
  businessName: string;
  location: string;
  visibilityScore: number;
  competitorCount: number;
  averageRating: number;
  topCompetitors: Array<{
    name: string;
    rating: number;
    rank: number;
  }>;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** locl_visibility_scans
- **Columns:**
  - tenant_id (UUID)
  - business_name (string)
  - location (string)
  - visibility_score (number)
  - competitor_count (number)
  - average_rating (number)
  - top_competitors (json)
  - scanned_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## REPUTE Tasks

### task_review_monitoring

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Review API (Custom)

---

#### Input Contract

```typescript
interface ReviewMonitoringInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  businessName: string;
  platforms?: string[]; // Default: ["google", "yelp"]
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}
```

---

#### Output Contract

```typescript
interface ReviewMonitoringOutput {
  businessName: string;
  platforms: Array<{
    platform: string;
    reviewCount: number;
    averageRating: number;
    reviews: Array<{
      author: string;
      rating: number;
      text: string;
      date: string;
    }>;
  }>;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** repute_reviews
- **Columns:**
  - tenant_id (UUID)
  - business_name (string)
  - platform (string)
  - author (string)
  - rating (number)
  - text (string)
  - date (timestamp)
  - sentiment (string)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_sentiment_analysis

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface SentimentAnalysisInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  reviews: Array<{
    text: string;
    platform: string;
    date: string;
  }>;
}
```

---

#### Output Contract

```typescript
interface SentimentAnalysisOutput {
  reviews: Array<{
    text: string;
    platform: string;
    date: string;
    sentiment: string;
    confidence: number;
  }>;
  summary: {
    positive: number;
    negative: number;
    neutral: number;
  };
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (1s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** repute_sentiment
- **Columns:**
  - tenant_id (UUID)
  - platform (string)
  - positive (number)
  - negative (number)
  - neutral (number)
  - analyzed_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## LINX Tasks

### task_backlink_analysis

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Backlink API (Custom)

---

#### Input Contract

```typescript
interface BacklinkAnalysisInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  domain: string;
  maxResults?: number; // Default: 100
}
```

---

#### Output Contract

```typescript
interface BacklinkAnalysisOutput {
  domain: string;
  backlinks: Array<{
    url: string;
    domain: string;
    authority: number;
    relevance: number;
    anchorText: string;
    followStatus: boolean;
  }>;
  totalBacklinks: number;
  averageAuthority: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** linx_backlinks
- **Columns:**
  - tenant_id (UUID)
  - domain (string)
  - url (string)
  - referring_domain (string)
  - authority (number)
  - relevance (number)
  - anchor_text (string)
  - follow_status (boolean)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_internal_link_audit

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Crawler API (Custom)

---

#### Input Contract

```typescript
interface InternalLinkAuditInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  domain: string;
  maxPages?: number; // Default: 100
}
```

---

#### Output Contract

```typescript
interface InternalLinkAuditOutput {
  domain: string;
  pages: Array<{
    url: string;
    internalLinks: number;
    externalLinks: number;
    brokenLinks: number;
    linkStructure: string;
  }>;
  totalPages: number;
  averageInternalLinks: number;
  brokenLinkCount: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** linx_internal_links
- **Columns:**
  - tenant_id (UUID)
  - domain (string)
  - url (string)
  - internal_links (number)
  - external_links (number)
  - broken_links (number)
  - link_structure (string)
  - audited_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## PRISM Tasks

### task_generate_report

**Runtime Owner:** RuntimeService
**Connector Used:** OpenAIConnector
**Provider Used:** OpenAI API

---

#### Input Contract

```typescript
interface GenerateReportInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  reportType: string;
  data: {
    keywords?: Array<{ keyword: string; volume: number; rank: number }>;
    rankings?: Array<{ keyword: string; rank: number; change: number }>;
    traffic?: Array<{ date: string; sessions: number; users: number }>;
    backlinks?: Array<{ domain: string; authority: number }>;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}
```

---

#### Output Contract

```typescript
interface GenerateReportOutput {
  reportType: string;
  title: string;
  content: string;
  insights: string[];
  recommendations: string[];
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    currency: string;
    amount: number;
  };
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** prism_reports
- **Columns:**
  - tenant_id (UUID)
  - report_type (string)
  - title (string)
  - content (string)
  - insights (string[])
  - recommendations (string[])
  - date_range (json)
  - generated_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_analytics_snapshot

**Runtime Owner:** RuntimeService
**Connector Used:** GoogleAnalyticsConnector
**Provider Used:** Google Analytics Data API

---

#### Input Contract

```typescript
interface AnalyticsSnapshotInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  propertyId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics?: string[]; // Default: ["sessions", "users", "pageviews"]
  dimensions?: string[]; // Default: ["date"]
}
```

---

#### Output Contract

```typescript
interface AnalyticsSnapshotOutput {
  propertyId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  metrics: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
  };
  dimensions: Array<{
    date: string;
    sessions: number;
    users: number;
    pageviews: number;
  }>;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** prism_analytics_snapshots
- **Columns:**
  - tenant_id (UUID)
  - property_id (string)
  - date_range (json)
  - sessions (number)
  - users (number)
  - pageviews (number)
  - bounce_rate (number)
  - dimensions (json)
  - snapshot_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## CORE Tasks

### task_technical_audit

**Runtime Owner:** RuntimeService
**Connector Used:** GoogleSearchConsoleConnector
**Provider Used:** Google Search Console API

---

#### Input Contract

```typescript
interface TechnicalAuditInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  siteUrl: string;
  auditScope?: string[]; // Default: ["performance", "indexing", "mobile"]
}
```

---

#### Output Contract

```typescript
interface TechnicalAuditOutput {
  siteUrl: string;
  performance: {
    score: number;
    issues: string[];
  };
  indexing: {
    indexedPages: number;
    coverage: string;
    issues: string[];
  };
  mobile: {
    mobileFriendly: boolean;
    issues: string[];
  };
  totalIssues: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** core_audits
- **Columns:**
  - tenant_id (UUID)
  - site_url (string)
  - performance_score (number)
  - performance_issues (string[])
  - indexed_pages (number)
  - coverage (string)
  - indexing_issues (string[])
  - mobile_friendly (boolean)
  - mobile_issues (string[])
  - total_issues (number)
  - audited_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

### task_schema_validation

**Runtime Owner:** RuntimeService
**Connector Used:** CustomAPIConnector
**Provider Used:** Schema Validator API (Custom)

---

#### Input Contract

```typescript
interface SchemaValidationInput {
  tenantId: string;
  executionId: string;
  taskId: string;
  siteUrl: string;
  pages?: string[]; // Default: all pages
}
```

---

#### Output Contract

```typescript
interface SchemaValidationOutput {
  siteUrl: string;
  pages: Array<{
    url: string;
    hasSchema: boolean;
    schemaTypes: string[];
    errors: string[];
    warnings: string[];
  }>;
  totalErrors: number;
  totalWarnings: number;
}
```

---

#### Execution States

1. **PENDING:** Task created, waiting for execution
2. **RUNNING:** Task is executing
3. **COMPLETED:** Task completed successfully
4. **FAILED:** Task failed
5. **RETRYING:** Task is retrying
6. **ABORTED:** Task aborted (max retries exceeded)

---

#### Retry Behavior

- **Retryable Errors:** RateLimitError, NetworkError, ExecutionTimeoutError
- **Non-Retryable Errors:** AuthenticationError, TenantIsolationViolationError, CredentialInjectionError
- **Max Retries:** 3
- **Retry Delay:** Exponential backoff (2s * 2^retryCount)
- **Retry Decision:** Owned by ErrorAuthority

---

#### Failure Behavior

- **On AuthenticationError:** Fail immediately, do not retry
- **On RateLimitError:** Retry with exponential backoff
- **On NetworkError:** Retry with exponential backoff
- **On ExecutionTimeoutError:** Retry with exponential backoff
- **On Max Retries Exceeded:** Abort task, mark as FAILED

---

#### Artifact Persistence

- **Table:** core_schema_validation
- **Columns:**
  - tenant_id (UUID)
  - site_url (string)
  - page_url (string)
  - has_schema (boolean)
  - schema_types (string[])
  - errors (string[])
  - warnings (string[])
  - validated_at (timestamp)
  - created_at (timestamp)

---

#### Tenant Boundaries

- **Tenant Isolation:** All queries scoped to tenant_id
- **Cross-Tenant Access:** Forbidden
- **Artifact Isolation:** All artifacts scoped to tenant_id

---

## Task Summary

### Total Tasks Defined

**ARIA:** 3 tasks
- task_keyword_research
- task_serp_analysis
- task_keyword_clustering

**SCRIBE:** 3 tasks
- task_generate_article
- task_generate_metadata
- task_generate_outline

**AMPLI:** 2 tasks
- task_publish_wordpress
- task_publish_custom

**PULSE:** 2 tasks
- task_monitor_rankings
- task_detect_anomalies

**LOCL:** 2 tasks
- task_gbp_audit
- task_local_visibility_scan

**REPUTE:** 2 tasks
- task_review_monitoring
- task_sentiment_analysis

**LINX:** 2 tasks
- task_backlink_analysis
- task_internal_link_audit

**PRISM:** 2 tasks
- task_generate_report
- task_analytics_snapshot

**CORE:** 2 tasks
- task_technical_audit
- task_schema_validation

**Total:** 20 canonical runtime tasks

---

## Connector Usage Summary

| Connector | Tasks |
|-----------|-------|
| DataForSEOConnector | task_keyword_research |
| OpenAIConnector | task_keyword_clustering, task_generate_article, task_generate_metadata, task_generate_outline, task_detect_anomalies, task_sentiment_analysis, task_generate_report |
| WordPressConnector | task_publish_wordpress |
| CustomAPIConnector | task_serp_analysis, task_publish_custom, task_monitor_rankings, task_local_visibility_scan, task_review_monitoring, task_backlink_analysis, task_internal_link_audit, task_schema_validation |
| GoogleBusinessProfileConnector | task_gbp_audit |
| GoogleAnalyticsConnector | task_analytics_snapshot |
| GoogleSearchConsoleConnector | task_technical_audit |

---

## Conclusion

The canonical agent task contracts have been successfully defined. All 20 runtime tasks are defined with standardized contracts, execution states, retry behavior, failure behavior, artifact persistence, and tenant boundaries. RuntimeService is the sole task owner and executor.

**CANONICAL TASK CONTRACTS STATUS:** ✅ DEFINED

**Next Steps:**
- TASK 3C.4: Remove Agent Execution Ownership
- TASK 3C.5: Runtime Integration Implementation
- TASK 3C.6: Mock Execution Purge

---

**END OF CONTRACTS**
