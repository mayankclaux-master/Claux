# CLAUX PROVIDER BYPASS MAP

**Date:** 2025-01-09
**Engineer:** Cascade AI
**Scope:** Phase 1A - Architectural Authority Purification
**Status:** Provider Access Analysis Complete

---

## EXECUTIVE SUMMARY

This map provides a detailed analysis of all provider access violations in CLAUX. The objective is to identify every direct provider call that bypasses runtime authority and prepare migration strategies.

**CANONICAL PATTERN:** Agent → Runtime → Connector → Provider
**ACTUAL PATTERN:** Agent → Provider Client → Provider (100% bypass)
**TOTAL PROVIDER VIOLATIONS:** 7 providers
**TOTAL BYPASS INSTANCES:** 15+ direct calls
**CREDENTIAL INJECTION:** 14% (1 of 7 providers)

---

## PROVIDER VIOLATION CLASSIFICATION

| Provider | Client File | Used By | Pattern | Credential Injection | Status | Risk |
|----------|------------|---------|---------|----------------------|--------|------|
| DataForSEO | dataforseo.client.ts | ARIA agent | Direct call | None | ❌ MOCK | HIGH |
| OpenAI | openai.client.ts | SCRIBE agent | Direct call | None | ❌ MOCK | HIGH |
| SERP | serp.client.ts | PULSE agent | Direct call | None | ❌ MOCK | HIGH |
| GMB | gmb.client.ts | LOCL agent | Direct call | ✅ CORRECT | ⚠️ MOCK FALLBACK | MEDIUM |
| WordPress | wordpress.connector.ts | PUBLISH agent | Direct call | ❌ DIRECT PASSING | ✅ REAL | HIGH |
| Shopify | shopify.connector.ts | PUBLISH agent | Direct call | ❌ DIRECT PASSING | ✅ REAL | HIGH |
| Custom | custom.connector.ts | PUBLISH agent | Direct call | ❌ DIRECT PASSING | ✅ REAL | HIGH |

---

## PROVIDER #1: DataForSEO

### Current Implementation

**FILE:** `apps/web/lib/agents/shared/dataforseo.client.ts`
**LINES:** 55
**STATUS:** ❌ MOCK DATA
**USED BY:** ARIA agent (aria.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `fetchKeywordsForSite(domain: string)`

**CURRENT CODE:**
```typescript
export async function fetchKeywordsForSite(domain: string): Promise<KeywordData[]> {
  // TODO: Replace with actual DataForSEO API call
  // Mock data for testing
  const mockKeywords: KeywordData[] = [
    { keyword: "dentist in mumbai", volume: 5400, difficulty: 65 },
    // ... more mock data
  ];
  await new Promise((resolve) => setTimeout(resolve, 500));
  return mockKeywords;
}
```

**VIOLATIONS:**
- ❌ Returns mock data instead of real API data
- ❌ Called directly by ARIA agent (bypasses runtime)
- ❌ No runtime credential injection
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** None (mock data)

**DEPENDENCIES:**
- `apps/web/lib/agents/aria/aria.service.ts` (line 9: imports dataforseo.client)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → DataForSEO API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/dataforseo.connector.ts`
2. Implement real DataForSEO API integration
3. Use runtime credential injection via `getTenantIntegrations()`
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** HIGH (requires ARIA agent refactoring)

**STEPS:**
1. Create runtime connector for DataForSEO
2. Integrate real DataForSEO API
3. Implement runtime credential injection
4. Refactor aria.service.ts to use runtime connector
5. Remove dataforseo.client.ts
6. Test ARIA agent execution

---

## PROVIDER #2: OpenAI

### Current Implementation

**FILE:** `apps/web/lib/agents/shared/openai.client.ts`
**LINES:** 64
**STATUS:** ❌ MOCK DATA
**USED BY:** SCRIBE agent (scribe.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `generateArticle(params: {keyword, businessCategory})`

**CURRENT CODE:**
```typescript
export async function generateArticle(params: {
  keyword: string;
  businessCategory: string;
}): Promise<ArticleContent> {
  // TODO: Replace with actual OpenAI API call
  // Mock content for testing
  const mockContent: ArticleContent = {
    title: `Best ${keyword} for ${businessCategory}`,
    content: `<h1>Best ${keyword} for ${businessCategory}</h1>...`
  };
  await new Promise((resolve) => setTimeout(resolve, 800));
  return mockContent;
}
```

**VIOLATIONS:**
- ❌ Returns template content instead of AI-generated content
- ❌ Called directly by SCRIBE agent (bypasses runtime)
- ❌ No runtime credential injection
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** None (mock data)

**DEPENDENCIES:**
- `apps/web/lib/agents/scribe/scribe.service.ts` (line 9: imports openai.client)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → OpenAI API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/openai.connector.ts`
2. Implement real OpenAI API integration
3. Use runtime credential injection via `getTenantIntegrations()`
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** HIGH (requires SCRIBE agent refactoring)

**STEPS:**
1. Create runtime connector for OpenAI
2. Integrate real OpenAI API
3. Implement runtime credential injection
4. Refactor scribe.service.ts to use runtime connector
5. Remove openai.client.ts
6. Test SCRIBE agent execution

---

## PROVIDER #3: SERP

### Current Implementation

**FILE:** `apps/web/lib/agents/shared/serp.client.ts`
**LINES:** 57
**STATUS:** ❌ MOCK DATA
**USED BY:** PULSE agent (pulse.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `fetchKeywordRank(params: {keyword, domain})`

**CURRENT CODE:**
```typescript
export async function fetchKeywordRank(params: FetchKeywordRankParams): Promise<KeywordRankResult> {
  const { keyword, domain } = params;
  // TODO: Replace with actual SERP API call
  // Generate deterministic rank based on keyword + domain hash
  const hashInput = `${keyword}:${domain}`;
  const hash = stringToHash(hashInput);
  const mockRank = (hash % 100) + 1; // Rank between 1-100
  const mockResult: KeywordRankResult = {
    rank: mockRank,
    url: domain
  };
  await new Promise((resolve) => setTimeout(resolve, 100));
  return mockResult;
}
```

**VIOLATIONS:**
- ❌ Returns deterministic mock rankings instead of real SERP data
- ❌ Called directly by PULSE agent (bypasses runtime)
- ❌ No runtime credential injection
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** None (mock data)

**DEPENDENCIES:**
- `apps/web/lib/agents/pulse/pulse.service.ts` (line 9: imports serp.client)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → SERP API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/serp.connector.ts`
2. Implement real SERP API integration
3. Use runtime credential injection via `getTenantIntegrations()`
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** HIGH (requires PULSE agent refactoring)

**STEPS:**
1. Create runtime connector for SERP
2. Integrate real SERP API
3. Implement runtime credential injection
4. Refactor pulse.service.ts to use runtime connector
5. Remove serp.client.ts
6. Test PULSE agent execution

---

## PROVIDER #4: GMB (Google My Business)

### Current Implementation

**FILE:** `apps/web/lib/agents/shared/gmb.client.ts`
**LINES:** 93
**STATUS:** ⚠️ REAL API WITH MOCK FALLBACK
**USED BY:** LOCL agent (locl.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `fetchBusinessProfile(tenantId, businessName)`

**CURRENT CODE:**
```typescript
export async function fetchBusinessProfile(tenantId: string, businessName: string): Promise<GMBProfile> {
  const integrations = await getTenantIntegrations(tenantId);

  if (!integrations || integrations.google_status !== "connected" || !integrations.gbp_location_id) {
    // Return mock result if not connected
    const mockProfile: GMBProfile = {
      gmb_name: businessName,
      primary_category: "Health Clinic",
      review_count: 45,
      average_rating: 4.2,
      photos_count: 15,
      posts_count: 3
    };
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockProfile;
  }

  const accessToken = await getGoogleAccessToken(tenantId);

  if (!accessToken) {
    throw new Error("Failed to get Google access token");
  }

  try {
    const response = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${integrations.gbp_location_id}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    // ... process real data
  } catch (error) {
    // Fallback to mock data on error
    const mockProfile: GMBProfile = { /* mock data */ };
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockProfile;
  }
}
```

**VIOLATIONS:**
- ⚠️ Has mock fallback (should fail gracefully, not return mock data)
- ❌ Called directly by LOCL agent (bypasses runtime)
- ✅ Uses runtime credential injection (CORRECT)
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** Runtime credential injection (CORRECT) but bypasses runtime orchestration

**DEPENDENCIES:**
- `apps/web/lib/agents/locl/locl.service.ts` (line 9: imports gmb.client)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → GMB API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/gmb.connector.ts`
2. Use existing runtime credential injection (KEEP)
3. Remove mock fallback (fail gracefully instead)
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 1-2 days
**BREAKAGE RISK:** MEDIUM (credential injection already correct)

**STEPS:**
1. Create runtime connector for GMB
2. Move existing credential injection logic to connector
3. Remove mock fallback (fail gracefully)
4. Refactor locl.service.ts to use runtime connector
5. Remove gmb.client.ts
6. Test LOCL agent execution

---

## PROVIDER #5: WordPress

### Current Implementation

**FILE:** `apps/web/lib/connectors/wordpress.connector.ts`
**LINES:** 122
**STATUS:** ✅ REAL API IMPLEMENTATION
**USED BY:** PUBLISH agent (publish.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `publishPost(config)`

**CURRENT CODE:**
```typescript
export async function publishPost(config: {
  siteUrl: string;
  username: string;
  appPassword: string;
  title: string;
  content: string;
  slug?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const response = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${username}:${appPassword}`)}`,
    },
    body: JSON.stringify({ title, content, slug, status: 'publish' }),
    signal: AbortSignal.timeout(30000),
  });
  // ... process response
}
```

**VIOLATIONS:**
- ❌ Called directly by PUBLISH agent (bypasses runtime)
- ❌ Credentials passed directly (not runtime injected)
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** Direct credential passing (INCORRECT)

**DEPENDENCIES:**
- `apps/web/lib/agents/publish/publish.service.ts` (line 9: imports wordpress.connector)
- `apps/web/lib/runtime/tasks/ampli.tasks.ts` (line 20: imports wordpress.connector - dead code)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → WordPress API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/wordpress-runtime.connector.ts`
2. Use runtime credential injection via `getWordPressAppPassword()`
3. Keep existing wordpress.connector.ts for internal use by runtime connector
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** MEDIUM (connector file is good, just needs runtime wrapper)

**STEPS:**
1. Create runtime connector wrapper for WordPress
2. Implement runtime credential injection
3. Refactor publish.service.ts to use runtime connector
4. Keep wordpress.connector.ts for internal use
5. Test PUBLISH agent execution

---

## PROVIDER #6: Shopify

### Current Implementation

**FILE:** `apps/web/lib/connectors/shopify.connector.ts`
**LINES:** 115
**STATUS:** ✅ REAL API IMPLEMENTATION
**USED BY:** PUBLISH agent (publish.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `publishPost(config)`

**CURRENT CODE:**
```typescript
export async function publishPost(config: {
  storeUrl: string;
  accessToken: string;
  blogId: string;
  title: string;
  content: string;
  slug?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const response = await fetch(
    `${storeUrl}/admin/api/${blogId}/articles.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        article: {
          title,
          body_html: content,
          handle: slug,
          published: true,
        },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );
  // ... process response
}
```

**VIOLATIONS:**
- ❌ Called directly by PUBLISH agent (bypasses runtime)
- ❌ Credentials passed directly (not runtime injected)
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** Direct credential passing (INCORRECT)

**DEPENDENCIES:**
- `apps/web/lib/agents/publish/publish.service.ts` (line 10: imports shopify.connector)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → Shopify API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/shopify-runtime.connector.ts`
2. Use runtime credential injection via `getShopifyAccessToken()`
3. Keep existing shopify.connector.ts for internal use by runtime connector
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** MEDIUM (connector file is good, just needs runtime wrapper)

**STEPS:**
1. Create runtime connector wrapper for Shopify
2. Implement runtime credential injection
3. Refactor publish.service.ts to use runtime connector
4. Keep shopify.connector.ts for internal use
5. Test PUBLISH agent execution

---

## PROVIDER #7: Custom API

### Current Implementation

**FILE:** `apps/web/lib/connectors/custom.connector.ts`
**LINES:** 108
**STATUS:** ✅ REAL API IMPLEMENTATION
**USED BY:** PUBLISH agent (publish.service.ts)
**ACCESS PATTERN:** Direct call (bypasses runtime)

**FUNCTION:** `publishPost(config)`

**CURRENT CODE:**
```typescript
export async function publishPost(config: {
  apiUrl: string;
  apiKey: string;
  title: string;
  content: string;
  slug?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      title,
      content,
      html: content,
      slug,
    }),
    signal: AbortSignal.timeout(30000),
  });
  // ... process response
}
```

**VIOLATIONS:**
- ❌ Called directly by PUBLISH agent (bypasses runtime)
- ❌ Credentials passed directly (not runtime injected)
- ❌ No runtime error handling
- ❌ No runtime event publishing
- ❌ No runtime logging
- ❌ No runtime rate limiting
- ❌ No runtime cost tracking

**CREDENTIAL USAGE:** Direct credential passing (INCORRECT)

**DEPENDENCIES:**
- `apps/web/lib/agents/publish/publish.service.ts` (line 11: imports custom.connector)
- `apps/web/lib/runtime/tasks/ampli.tasks.ts` (line 21: imports custom.connector - dead code)

---

### Canonical Pattern Required

**PATTERN:** Agent → RuntimeService → ExecutionOrchestrator → Runtime Connector → Custom API

**REQUIRED IMPLEMENTATION:**
1. Create runtime connector: `apps/web/lib/runtime/connectors/custom-runtime.connector.ts`
2. Use runtime credential injection via `getCustomApiKey()`
3. Keep existing custom.connector.ts for internal use by runtime connector
4. Handle errors via runtime
5. Publish events via EventService
6. Log via LogService
7. Enforce rate limits via runtime
8. Track costs via runtime

---

### Migration Strategy

**PHASE:** Phase 3 (after Phase 2 complete)
**ESTIMATED EFFORT:** 2-3 days
**BREAKAGE RISK:** MEDIUM (connector file is good, just needs runtime wrapper)

**STEPS:**
1. Create runtime connector wrapper for Custom API
2. Implement runtime credential injection
3. Refactor publish.service.ts to use runtime connector
4. Keep custom.connector.ts for internal use
5. Test PUBLISH agent execution

---

## BYPASS SUMMARY TABLE

| Provider | Bypass Type | Mock Data | Credential Injection | Agent Service | Migration Phase | Est. Effort |
|----------|-------------|-----------|---------------------|--------------|-----------------|-------------|
| DataForSEO | Direct call | ❌ YES | None | aria.service.ts | Phase 3 | 2-3 days |
| OpenAI | Direct call | ❌ YES | None | scribe.service.ts | Phase 3 | 2-3 days |
| SERP | Direct call | ❌ YES | None | pulse.service.ts | Phase 3 | 2-3 days |
| GMB | Direct call | ⚠️ FALLBACK | ✅ CORRECT | locl.service.ts | Phase 3 | 1-2 days |
| WordPress | Direct call | ✅ NO | ❌ DIRECT PASSING | publish.service.ts | Phase 3 | 2-3 days |
| Shopify | Direct call | ✅ NO | ❌ DIRECT PASSING | publish.service.ts | Phase 3 | 2-3 days |
| Custom | Direct call | ✅ NO | ❌ DIRECT PASSING | publish.service.ts | Phase 3 | 2-3 days |

**TOTAL BYPASSES:** 7 providers
**TOTAL AGENT SERVICES TO REFACTOR:** 5 (aria, scribe, pulse, locl, publish)
**TOTAL ESTIMATED EFFORT:** 13-19 days

---

## MIGRATION PHASING

### Phase 3.1: Create Runtime Connectors (Week 1)

**OBJECTIVE:** Create all runtime connectors with credential injection

**TASKS:**
1. Create `apps/web/lib/runtime/connectors/dataforseo.connector.ts`
2. Create `apps/web/lib/runtime/connectors/openai.connector.ts`
3. Create `apps/web/lib/runtime/connectors/serp.connector.ts`
4. Create `apps/web/lib/runtime/connectors/gmb.connector.ts`
5. Create `apps/web/lib/runtime/connectors/wordpress-runtime.connector.ts`
6. Create `apps/web/lib/runtime/connectors/shopify-runtime.connector.ts`
7. Create `apps/web/lib/runtime/connectors/custom-runtime.connector.ts`

**ESTIMATED EFFORT:** 5-7 days

---

### Phase 3.2: Integrate Real Provider APIs (Week 2)

**OBJECTIVE:** Replace mock data with real provider APIs

**TASKS:**
1. Integrate real DataForSEO API in dataforseo.connector.ts
2. Integrate real OpenAI API in openai.connector.ts
3. Integrate real SERP API in serp.connector.ts
4. Remove mock fallback from gmb.connector.ts

**ESTIMATED EFFORT:** 3-4 days

---

### Phase 3.3: Refactor Agent Services (Week 3)

**OBJECTIVE:** Refactor all agent services to use runtime connectors

**TASKS:**
1. Refactor aria.service.ts to use RuntimeService + dataforseo connector
2. Refactor scribe.service.ts to use RuntimeService + openai connector
3. Refactor pulse.service.ts to use RuntimeService + serp connector
4. Refactor locl.service.ts to use RuntimeService + gmb connector
5. Refactor publish.service.ts to use RuntimeService + CMS connectors

**ESTIMATED EFFORT:** 5-8 days

---

### Phase 3.4: Remove Mock Provider Clients (Week 4)

**OBJECTIVE:** Remove all mock provider clients

**TASKS:**
1. Remove `apps/web/lib/agents/shared/dataforseo.client.ts`
2. Remove `apps/web/lib/agents/shared/openai.client.ts`
3. Remove `apps/web/lib/agents/shared/serp.client.ts`
4. Remove `apps/web/lib/agents/shared/gmb.client.ts`
5. Remove `apps/web/lib/agents/shared/` directory

**ESTIMATED EFFORT:** 0.5 day

---

## CANONICAL CONNECTOR TEMPLATE

```typescript
/**
 * Runtime Connector Template
 * 
 * This template defines the canonical pattern for all runtime connectors
 */

import { getTenantIntegrations } from '@/lib/integrations/utils';

export class ProviderConnector {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Execute provider call with runtime credential injection
   */
  async executeProviderCall(params: any): Promise<any> {
    // 1. Get credentials via runtime credential injection
    const credentials = await this.getRuntimeCredentials();
    
    if (!credentials) {
      throw new Error(`Provider credentials not found for tenant ${this.tenantId}`);
    }

    // 2. Call provider API
    try {
      const result = await this.callProviderAPI(credentials, params);
      
      // 3. Return result
      return result;
    } catch (error) {
      // 4. Handle error via runtime
      throw this.handleProviderError(error);
    }
  }

  /**
   * Get runtime credentials
   */
  private async getRuntimeCredentials(): Promise<string | null> {
    // Implementation specific to provider
    return null;
  }

  /**
   * Call provider API
   */
  private async callProviderAPI(credentials: string, params: any): Promise<any> {
    // Implementation specific to provider
    return null;
  }

  /**
   * Handle provider error
   */
  private handleProviderError(error: any): Error {
    // Implementation specific to provider
    return new Error('Provider call failed');
  }
}
```

---

## VERIFICATION CRITERIA

After Phase 3 migration, verify:

```bash
# No references to mock provider clients
grep -r "shared/dataforseo\|shared/openai\|shared/serp\|shared/gmb" apps/web/lib/agents
# Should return nothing

# All agent services use RuntimeService
grep -r "RuntimeService" apps/web/lib/agents
# Should return references in all agent services

# All runtime connectors use credential injection
grep -r "getTenantIntegrations\|getGoogleAccessToken\|getWordPressAppPassword" apps/web/lib/runtime/connectors
# Should return references in all connectors

# No direct credential passing in agent services
grep -r "appPassword\|accessToken\|apiKey" apps/web/lib/agents | grep -v "getTenantIntegrations"
# Should return nothing
```

---

## CONCLUSION

**CURRENT STATE:** 100% of provider access bypasses runtime authority
**TARGET STATE:** 100% of provider access flows through runtime
**MIGRATION PATH:** Phase 3 (4 weeks, 13-19 days)
**BREAKAGE RISK:** HIGH (requires refactoring 5 agent services)

**CRITICAL REQUIREMENT:** Do NOT remove any provider clients until runtime connectors are implemented and tested

---

**END OF MAP**
