# CLAUX PROVIDER DEPENDENCY MATRIX

**Version:** 1.0.0
**Date:** May 15, 2026
**Status:** CANONICAL PROVIDER DEFINITION

---

## EXECUTIVE SUMMARY

This document maps all external provider dependencies for the 9 CLAUX agents, including shared providers, provider overlaps, duplicated integrations, and consolidation opportunities.

**Purpose:** Prevent provider sprawl and identify consolidation opportunities before implementation.

---

## PROVIDER INVENTORY

### 1. DATAFORSEO

**Provider Type:** SEO Data API
**Purpose:** Keyword discovery, backlink analysis, ranking tracking
**MVP-Critical:** YES

**Agents Using:**
- ARIA (keyword discovery, SERP analysis)
- LINX (backlink discovery and analysis)
- PULSE (ranking tracking)

**API Endpoints:**
- Keywords API
- Backlinks API
- SERP API

**Authentication:**
- API Key
- Login credentials

**Rate Limits:**
- 5 requests/second (medium sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Single DataForSEO account per tenant
- Credentials stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single dispatch endpoint for all agents)

---

### 2. OPENAI

**Provider Type:** AI/ML API
**Purpose:** Content generation, sentiment analysis, response drafting
**MVP-Critical:** YES (for SCRIBE), NO (optional for REPUTE)

**Agents Using:**
- SCRIBE (outline generation, article generation)
- REPUTE (sentiment analysis - optional, response drafting - optional)

**API Endpoints:**
- Chat Completions API

**Authentication:**
- API Key

**Rate Limits:**
- 60 requests/minute (high sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Single OpenAI account per tenant
- Credentials stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single dispatch endpoint for all agents)

---

### 3. GOOGLE BUSINESS PROFILE (GBP) API

**Provider Type:** Local SEO API
**Purpose:** GBP data sync, review monitoring, post management
**MVP-Critical:** YES

**Agents Using:**
- LOCL (GBP sync, local rankings, map pack analysis)
- REPUTE (review ingestion, review monitoring)

**API Endpoints:**
- GBP API (accounts, locations, reviews)

**Authentication:**
- OAuth 2.0
- Service account credentials

**Rate Limits:**
- 10 requests/second (medium sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Single GBP account per tenant
- OAuth tokens stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single dispatch endpoint for all agents)

---

### 4. WORDPRESS REST API

**Provider Type:** CMS API
**Purpose:** Content publishing
**MVP-Critical:** YES

**Agents Using:**
- AMPLI (WordPress publishing)

**API Endpoints:**
- WordPress REST API (posts)

**Authentication:**
- Basic Authentication (username + application password)

**Rate Limits:**
- No strict limits (low sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant WordPress credentials
- Credentials stored in integration settings
- No rate limiting needed

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single connector for WordPress)

---

### 5. SHOPIFY REST ADMIN API

**Provider Type:** E-commerce CMS API
**Purpose:** Product/content publishing
**MVP-Critical:** YES

**Agents Using:**
- AMPLI (Shopify publishing)

**API Endpoints:**
- Shopify REST Admin API (blogs, articles)

**Authentication:**
- X-Shopify-Access-Token header

**Rate Limits:**
- 40 requests/minute (medium sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant Shopify credentials
- Credentials stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single connector for Shopify)

---

### 6. WEBFLOW CMS API

**Provider Type:** CMS API
**Purpose:** Content publishing
**MVP-Critical:** YES

**Agents Using:**
- AMPLI (Webflow publishing)

**API Endpoints:**
- Webflow CMS API (collections, items)

**Authentication:**
- API Token (Bearer token)

**Rate Limits:**
- 60 requests/minute (medium sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant Webflow credentials
- Credentials stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single connector for Webflow)

---

### 7. GHOST ADMIN API

**Provider Type:** CMS API
**Purpose:** Content publishing
**MVP-Critical:** YES

**Agents Using:**
- AMPLI (Ghost publishing)

**API Endpoints:**
- Ghost Admin API (posts)

**Authentication:**
- Admin API Key (Bearer token)

**Rate Limits:**
- No strict limits (low sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant Ghost credentials
- Credentials stored in integration settings
- No rate limiting needed

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single connector for Ghost)

---

### 8. CUSTOM API

**Provider Type:** Custom Backend API
**Purpose:** Content publishing to custom backends
**MVP-Critical:** YES

**Agents Using:**
- AMPLI (custom API publishing)

**API Endpoints:**
- Custom REST API (user-defined)

**Authentication:**
- Bearer token (user-defined)

**Rate Limits:**
- No strict limits (low sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant custom API credentials
- Credentials stored in integration settings
- No rate limiting needed

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single connector for custom API)

---

### 9. GOOGLE ANALYTICS API (OPTIONAL)

**Provider Type:** Analytics API
**Purpose:** Analytics data aggregation
**MVP-Critical:** NO (optional for PRISM)

**Agents Using:**
- PRISM (analytics data aggregation - optional)

**API Endpoints:**
- Google Analytics Reporting API

**Authentication:**
- OAuth 2.0

**Rate Limits:**
- 10 requests/second (medium sensitivity)

**Sync vs Async:**
- Async (via IntegrationDispatcher)

**Callback Required:**
- No

**Shared Configuration:**
- Per-tenant Google Analytics credentials
- Credentials stored in integration settings
- Rate limiting managed at dispatch layer

**Consolidation Opportunities:**
- ✅ ALREADY CONSOLIDATED (single dispatch endpoint if implemented)

---

## PROVIDER OVERLAPS

### Shared Provider Usage

**DataForSEO:**
- Shared by: ARIA, LINX, PULSE
- Overlap: 3 agents
- Consolidation: ✅ Already consolidated via IntegrationDispatcher

**OpenAI:**
- Shared by: SCRIBE, REPUTE (optional)
- Overlap: 2 agents
- Consolidation: ✅ Already consolidated via IntegrationDispatcher

**Google Business Profile API:**
- Shared by: LOCL, REPUTE
- Overlap: 2 agents
- Consolidation: ✅ Already consolidated via IntegrationDispatcher

**CMS APIs (WordPress, Shopify, Webflow, Ghost, Custom):**
- Used by: AMPLI only
- Overlap: None (each CMS is separate)
- Consolidation: ✅ Already consolidated via unified CMS dispatch

---

## DUPLICATED INTEGRATIONS

### No Duplications Found

**Analysis:**
- All providers use unified IntegrationDispatcher pattern
- No duplicated connector code
- No duplicated credential storage
- No duplicated rate limiting logic

**Conclusion:** ✅ No consolidation opportunities - already optimized

---

## CONSOLIDATION OPPORTUNITIES

### Current State: ALREADY CONSOLIDATED

**IntegrationDispatcher Pattern:**
- All external API calls go through IntegrationDispatcher
- Single dispatch endpoint per provider type
- Centralized credential management
- Centralized rate limiting
- Centralized error handling
- Centralized fallback logic

**Benefits:**
- Reduced code duplication
- Simplified credential management
- Unified rate limiting
- Consistent error handling
- Easier to add new providers
- Easier to monitor provider health

---

## PROVIDER-PER-AGENT MATRIX

| Agent | DataForSEO | OpenAI | GBP | WordPress | Shopify | Webflow | Ghost | Custom API | Google Analytics |
|-------|-----------|--------|-----|-----------|---------|--------|-------|------------|------------------|
| ARIA | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| SCRIBE | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| LOCL | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| LINX | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| CORE | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| REPUTE | ❌ | ⚠️ (optional) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| AMPLI | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| PRISM | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ (optional) |
| PULSE | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend:**
- ✅ Required for MVP
- ⚠️ Optional for MVP
- ❌ Not used

---

## RATE LIMITING STRATEGY

### Per-Provider Rate Limits

**DataForSEO:**
- Limit: 5 requests/second
- Strategy: Token bucket algorithm
- Priority: Medium

**OpenAI:**
- Limit: 60 requests/minute
- Strategy: Token bucket algorithm
- Priority: High

**Google Business Profile API:**
- Limit: 10 requests/second
- Strategy: Token bucket algorithm
- Priority: Medium

**WordPress:**
- Limit: No strict limit
- Strategy: None
- Priority: Low

**Shopify:**
- Limit: 40 requests/minute
- Strategy: Token bucket algorithm
- Priority: Medium

**Webflow:**
- Limit: 60 requests/minute
- Strategy: Token bucket algorithm
- Priority: Medium

**Ghost:**
- Limit: No strict limit
- Strategy: None
- Priority: Low

**Custom API:**
- Limit: No strict limit
- Strategy: None
- Priority: Low

**Google Analytics:**
- Limit: 10 requests/second
- Strategy: Token bucket algorithm
- Priority: Medium

---

## CREDENTIAL MANAGEMENT

### Credential Storage

**Location:** Database (integrations table)
**Encryption:** Encrypted at rest
**Access:** Tenant-scoped via RLS

**Credential Types:**
- API Keys (DataForSEO, OpenAI, Webflow, Ghost, Custom)
- OAuth Tokens (GBP, Google Analytics)
- Basic Auth (WordPress)
- Access Tokens (Shopify)

**Credential Rotation:**
- Manual rotation via dashboard
- No automatic rotation for MVP

---

## PROVIDER HEALTH MONITORING

### Health Checks

**Per-Provider Health Metrics:**
- Success rate
- Error rate
- Latency
- Rate limit utilization
- Credential validity

**Monitoring Strategy:**
- Log all provider calls
- Track success/failure rates
- Alert on high error rates
- Alert on credential expiry

**Dashboard Display:**
- Provider status indicators
- Last successful call timestamp
- Error rate per provider
- Rate limit utilization per provider

---

## FALLBACK STRATEGY

### Fallback Logic

**IntegrationDispatcher Fallback:**
1. Try dispatch endpoint (n8n if configured)
2. If dispatch fails, fall back to direct adapter
3. If direct adapter fails, return error

**Direct Adapter Availability:**
- DataForSEO: ✅ Direct adapter exists
- OpenAI: ✅ Direct adapter exists
- GBP: ❌ No direct adapter (requires dispatch)
- CMS APIs: ⚠️ Partial direct adapters (stub implementations)

**Feature Flags:**
- `isDispatchExecutionEnabled(agentName)` - controls dispatch usage
- `shouldFallbackToDirectProvider(tenantId, agentName)` - controls fallback behavior

---

## PROVIDER DEPENDENCY GRAPH

```
CORE (no external providers)
  ↓
ARIA → DataForSEO
  ↓
SCRIBE → OpenAI
  ↓
AMPLI → WordPress, Shopify, Webflow, Ghost, Custom API

LOCL → GBP
  ↓
REPUTE → GBP, OpenAI (optional)

LINX → DataForSEO

PULSE → DataForSEO

PRISM → Google Analytics (optional)
```

---

## MVP PROVIDER REQUIREMENTS

### Must-Have Providers (MVP)

**Phase 1 (Foundation):**
- DataForSEO (ARIA, LINX, PULSE)
- OpenAI (SCRIBE)

**Phase 2 (Content Pipeline):**
- WordPress (AMPLI)
- Shopify (AMPLI) - optional
- Webflow (AMPLI) - optional
- Ghost (AMPLI) - optional
- Custom API (AMPLI) - optional

**Phase 3 (Local/Reputation):**
- GBP (LOCL, REPUTE)

**Phase 4 (Analytics):**
- Google Analytics (PRISM) - optional

### Nice-to-Have Providers (Post-MVP)

- Google Analytics (PRISM)
- Additional CMS platforms
- Additional SEO data providers

---

## PROVIDER COST ESTIMATION

### Per-Provider Cost Model

**DataForSEO:**
- Pricing: Pay-per-request
- Estimated monthly cost: $100-500 (depending on usage)
- Cost drivers: Keyword volume, backlink volume, ranking frequency

**OpenAI:**
- Pricing: Pay-per-token
- Estimated monthly cost: $50-200 (depending on content volume)
- Cost drivers: Article count, outline count, response drafting

**Google Business Profile API:**
- Pricing: Free
- Estimated monthly cost: $0
- Cost drivers: None

**WordPress:**
- Pricing: Free (self-hosted)
- Estimated monthly cost: $0
- Cost drivers: None

**Shopify:**
- Pricing: Included in Shopify subscription
- Estimated monthly cost: $0 (already paying for Shopify)
- Cost drivers: None

**Webflow:**
- Pricing: Included in Webflow subscription
- Estimated monthly cost: $0 (already paying for Webflow)
- Cost drivers: None

**Ghost:**
- Pricing: Included in Ghost subscription
- Estimated monthly cost: $0 (already paying for Ghost)
- Cost drivers: None

**Custom API:**
- Pricing: Depends on custom backend
- Estimated monthly cost: $0 (internal)
- Cost drivers: None

**Google Analytics:**
- Pricing: Free
- Estimated monthly cost: $0
- Cost drivers: None

**Total Estimated Monthly Cost (MVP):**
- Minimum: $150-700 (DataForSEO + OpenAI)
- Maximum: $150-700 (same - other providers are free or included)

---

## PROVIDER IMPLEMENTATION STATUS

### Current Implementation Status

**DataForSEO:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ✅ Implemented
- Task Implementations: ✅ Implemented (ARIA, LINX, PULSE)
- Status: PRODUCTION READY

**OpenAI:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ✅ Implemented
- Task Implementations: ✅ Implemented (SCRIBE)
- Status: PRODUCTION READY

**Google Business Profile API:**
- IntegrationDispatcher: ⚠️ Partially implemented
- Direct Adapter: ❌ Not implemented
- Task Implementations: ⚠️ Partially implemented (LOCL, REPUTE)
- Status: NEEDS COMPLETION

**WordPress:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ⚠️ Stub implementation
- Task Implementations: ✅ Implemented (AMPLI)
- Status: PRODUCTION READY

**Shopify:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ⚠️ Stub implementation
- Task Implementations: ✅ Implemented (AMPLI)
- Status: PRODUCTION READY

**Webflow:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ⚠️ Stub implementation
- Task Implementations: ✅ Implemented (AMPLI)
- Status: PRODUCTION READY

**Ghost:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ⚠️ Stub implementation
- Task Implementations: ✅ Implemented (AMPLI)
- Status: PRODUCTION READY

**Custom API:**
- IntegrationDispatcher: ✅ Implemented
- Direct Adapter: ✅ Implemented
- Task Implementations: ✅ Implemented (AMPLI)
- Status: PRODUCTION READY

**Google Analytics:**
- IntegrationDispatcher: ❌ Not implemented
- Direct Adapter: ❌ Not implemented
- Task Implementations: ❌ Not implemented
- Status: NOT REQUIRED FOR MVP

---

## RECOMMENDATIONS

### 1. No Immediate Consolidation Needed

**Rationale:**
- IntegrationDispatcher pattern already consolidates provider access
- No duplicated code
- No duplicated credentials
- Unified rate limiting
- Unified error handling

**Action:** Continue with current IntegrationDispatcher pattern

### 2. Complete GBP Implementation

**Rationale:**
- GBP is MVP-critical for LOCL and REPUTE
- Direct adapter not implemented
- Task implementations partially complete

**Action:**
- Complete GBP IntegrationDispatcher implementation
- Add GBP direct adapter (optional)
- Complete LOCL and REPUTE task implementations

### 3. Implement Provider Health Monitoring

**Rationale:**
- Need to track provider health
- Need to alert on failures
- Need to track rate limit utilization

**Action:**
- Add health check endpoints for each provider
- Add provider health metrics to dashboard
- Add alerting for high error rates

### 4. Implement Credential Rotation

**Rationale:**
- Security best practice
- Compliance requirements

**Action:**
- Add credential rotation UI
- Add credential expiration alerts
- Add automatic credential rotation (post-MVP)

---

## CONCLUSION

The CLAUX provider architecture is already well-consolidated via the IntegrationDispatcher pattern. No immediate consolidation opportunities exist. The primary recommendation is to complete the GBP implementation and add provider health monitoring.

**Status:** PROVIDER ARCHITECTURE OPTIMIZED
