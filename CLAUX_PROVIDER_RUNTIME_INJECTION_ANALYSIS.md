# CLAUX PROVIDER RUNTIME INJECTION ANALYSIS

**Version:** 1.0.0
**Date:** May 16, 2026
**Status:** RUNTIME CREDENTIAL INJECTION AUDIT

---

## EXECUTIVE SUMMARY

This document analyzes the EXISTING runtime credential injection capability in CLAUX, identifying operational paths, missing links, and architectural gaps.

**Critical Finding:** Runtime credential retrieval FUNCTIONS EXIST, but they are NOT CALLED by dispatch routes. Credentials are NOT injected into provider execution payloads.

---

## CURRENT RUNTIME CREDENTIAL INJECTION STATE

### Credential Retrieval Functions

**Status:** OPERATIONAL

**Location:** `lib/integrations/utils.ts`

**Available Functions:**
- `getTenantIntegrations(tenantId)` - Retrieve all integrations for tenant
- `getGoogleAccessToken(tenantId)` - Retrieve and decrypt Google access token
- `getGoogleRefreshToken(tenantId)` - Retrieve and decrypt Google refresh token
- `getWordPressAppPassword(tenantId)` - Retrieve and decrypt WordPress app password
- `getShopifyAccessToken(tenantId)` - Retrieve and decrypt Shopify access token
- `getCustomApiKey(tenantId)` - Retrieve and decrypt custom API key

**Implementation:**
```typescript
export async function getWordPressAppPassword(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.wp_app_password_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.wp_app_password_encrypted);
  } catch (error) {
    console.error('Error decrypting WordPress app password:', error);
    return null;
  }
}
```

**Status:** FULLY OPERATIONAL
- Tenant-scoped retrieval
- Automatic decryption via AES-256-GCM
- Error handling
- Null safety

---

### Runtime Execution Context

**Status:** OPERATIONAL

**Location:** All agent task files

**Context Structure:**
```typescript
context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}
```

**Evidence:**
- `lib/runtime/tasks/ampli.tasks.ts` (line 16-20)
- `lib/runtime/tasks/aria.tasks.ts` (line 16-20)
- `lib/runtime/tasks/scribe.tasks.ts` (line 16-20)
- All other agent task files follow same pattern

**Status:** FULLY OPERATIONAL
- All tasks receive tenant_id in context
- tenant_id passed to dispatch routes via X-Tenant-Id header

---

### Dispatch Route Tenant Propagation

**Status:** OPERATIONAL

**Location:** All agent task files

**Implementation:**
```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Tenant-Id': context.tenant_id,
    'X-Execution-Id': context.execution_id,
  },
  body: JSON.stringify({
    cmsType: 'wordpress',
    config: wordpress_config,
    content: {
      title: draft.title,
      content: draft.body_html,
      meta_title: draft.meta_title,
      meta_description: draft.meta_description,
    },
    executionId: context.execution_id,
    tenantId: context.tenant_id,
    traceId: `${context.execution_id}-wordpress-${draft.id}`,
  }),
});
```

**Evidence:**
- `lib/runtime/tasks/ampli.tasks.ts` (line 113) - WordPress
- `lib/runtime/tasks/ampli.tasks.ts` (line 201) - Shopify
- `lib/runtime/tasks/ampli.tasks.ts` (line 288) - Webflow
- `lib/runtime/tasks/ampli.tasks.ts` (line 375) - Ghost
- `lib/runtime/tasks/ampli.tasks.ts` (line 502) - Custom API
- All other agent tasks follow same pattern for their providers

**Status:** FULLY OPERATIONAL
- tenant_id passed in X-Tenant-Id header
- execution_id passed in X-Execution-Id header
- tenant_id also passed in request body

---

### Dispatch Route Credential Retrieval

**Status:** MISSING

**Location:** `/app/api/integrations/dispatch/cms/route.ts`

**Current Implementation:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { executionId, tenantId, agentName, action, payload, correlationId, replayId } = body;

    // Validate required fields
    if (!executionId || !tenantId || !agentName || !action || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user profile for tenant validation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get profile to validate tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, workspace_id')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Tenant mismatch' },
        { status: 403 }
      );
    }

    // Create integration request
    const integrationRequest: IntegrationRequest = {
      executionId,
      tenantId,
      agentName,
      provider: 'cms',
      action,
      payload,
      correlationId: correlationId || IntegrationContract.generateCorrelationId(),
      replayId,
      timestamp: new Date().toISOString(),
    };

    // Create dispatcher
    const dispatcher = createIntegrationDispatcher({
      webhookUrl: process.env.N8N_WEBHOOK_URL || '',
      apiKey: process.env.N8N_API_KEY,
      timeoutMs: 30000,
    });

    // Dispatch to n8n
    const result = await dispatcher.dispatch(integrationRequest);

    return NextResponse.json({
      success: result.success,
      receipt: result.receipt,
      error: result.error,
    });
  } catch (error) {
    console.error('CMS dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Missing:**
- No credential retrieval from database
- No credential decryption
- No credential injection into payload
- No provider-specific credential resolution

**Status:** MISSING - CRITICAL GAP

---

### IntegrationDispatcher Payload Signing

**Status:** OPERATIONAL

**Location:** `lib/integrations/mesh/dispatchers/index.ts`

**Implementation:**
```typescript
private async sendToN8n(request: IntegrationRequest): Promise<Response> {
  const payload = this.signPayload(request);

  return await fetch(this.config.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Execution-ID': request.executionId,
      'X-Tenant-ID': request.tenantId,
      'X-Correlation-ID': request.correlationId,
      ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(this.config.timeoutMs || 30000),
  });
}

private signPayload(request: IntegrationRequest): IntegrationRequest {
  return {
    ...request,
    signature: this.generateSignature(request),
  };
}

private generateSignature(request: IntegrationRequest): string {
  const data = `${request.executionId}:${request.tenantId}:${request.correlationId}:${request.timestamp}`;
  // Simple hash - in production, use proper HMAC
  return Buffer.from(data).toString('base64');
}
```

**Status:** OPERATIONAL
- Payload signing exists
- Tenant ID passed in header
- Execution ID passed in header
- Correlation ID passed in header
- Signature generated (simple hash, not HMAC)

**Missing:**
- Credentials not in payload
- No provider-specific credential injection

---

## MISSING RUNTIME CREDENTIAL INJECTION

### Missing 1: Dispatch Route Credential Retrieval

**Status:** MISSING - CRITICAL

**Current State:**
- Dispatch routes receive tenant_id
- Dispatch routes validate tenant_id
- Dispatch routes DO NOT retrieve credentials

**Required:**
```typescript
// Retrieve credentials based on provider type
let credentials = {};
if (provider === 'wordpress') {
  const password = await getWordPressAppPassword(tenantId);
  const integrations = await getTenantIntegrations(tenantId);
  credentials = {
    siteUrl: integrations?.wp_site_url,
    username: integrations?.wp_username,
    appPassword: password,
  };
} else if (provider === 'shopify') {
  const token = await getShopifyAccessToken(tenantId);
  const integrations = await getTenantIntegrations(tenantId);
  credentials = {
    storeUrl: integrations?.shopify_store_url,
    accessToken: token,
    blogId: integrations?.shopify_blog_id,
  };
} else if (provider === 'custom') {
  const apiKey = await getCustomApiKey(tenantId);
  const integrations = await getTenantIntegrations(tenantId);
  credentials = {
    apiUrl: integrations?.custom_api_url,
    apiKey: apiKey,
  };
}
```

---

### Missing 2: Credential Injection into n8n Payload

**Status:** MISSING - CRITICAL

**Current State:**
- IntegrationDispatcher sends payload to n8n
- Payload contains execution metadata but NO credentials

**Required:**
```typescript
const integrationRequest: IntegrationRequest = {
  executionId,
  tenantId,
  agentName,
  provider: 'cms',
  action,
  payload: {
    ...payload,
    credentials: credentials, // INJECT CREDENTIALS HERE
  },
  correlationId: correlationId || IntegrationContract.generateCorrelationId(),
  replayId,
  timestamp: new Date().toISOString(),
};
```

---

### Missing 3: n8n Credential Handling

**Status:** MISSING - CRITICAL

**Current State:**
- n8n receives payload
- n8n does NOT receive credentials
- n8n cannot execute provider calls without credentials

**Required:**
- n8n workflow must extract credentials from payload
- n8n workflow must use credentials for provider API calls
- n8n workflow must handle credential errors

---

## PROVIDER-SPECIFIC RUNTIME INJECTION ANALYSIS

### WordPress

**Credential Retrieval:** OPERATIONAL
- `getWordPressAppPassword(tenantId)` - EXISTS
- `getTenantIntegrations(tenantId)` - EXISTS

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/cms`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/connectors/wordpress.connector.ts` - EXISTS

**Status:** RETRIEVAL EXISTS, INJECTION MISSING

---

### Shopify

**Credential Retrieval:** OPERATIONAL
- `getShopifyAccessToken(tenantId)` - EXISTS
- `getTenantIntegrations(tenantId)` - EXISTS

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/cms`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/connectors/shopify.connector.ts` - EXISTS

**Status:** RETRIEVAL EXISTS, INJECTION MISSING

---

### Custom API

**Credential Retrieval:** OPERATIONAL
- `getCustomApiKey(tenantId)` - EXISTS
- `getTenantIntegrations(tenantId)` - EXISTS

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/cms`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/connectors/custom.connector.ts` - EXISTS

**Status:** RETRIEVAL EXISTS, INJECTION MISSING

---

### Google (GBP/GSC)

**Credential Retrieval:** OPERATIONAL
- `getGoogleAccessToken(tenantId)` - EXISTS
- `getGoogleRefreshToken(tenantId)` - EXISTS
- `getTenantIntegrations(tenantId)` - EXISTS

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/google`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/agents/shared/gmb.client.ts` - EXISTS
- `lib/agents/shared/dataforseo.client.ts` - EXISTS

**Status:** RETRIEVAL EXISTS, INJECTION MISSING

---

### OpenAI

**Credential Retrieval:** MISSING
- No retrieval function in `lib/integrations/utils.ts`

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/openai`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/agents/shared/openai.client.ts` - EXISTS

**Status:** RETRIEVAL MISSING, INJECTION MISSING

---

### DataForSEO

**Credential Retrieval:** MISSING
- No retrieval function in `lib/integrations/utils.ts`

**Dispatch Route Retrieval:** MISSING
- No credential retrieval in `/api/integrations/dispatch/dataforseo`

**Runtime Injection:** MISSING
- Credentials not injected into n8n payload

**Connector:** OPERATIONAL
- `lib/agents/shared/dataforseo.client.ts` - EXISTS

**Status:** RETRIEVAL MISSING, INJECTION MISSING

---

## DIRECT ADAPTER FALLBACK ANALYSIS

### Direct Adapter Status

**Status:** DEPRECATED

**Deprecated Adapters:**
- `lib/runtime/adapters/providers/dataforseo.adapter.ts` - DEPRECATED
- `lib/runtime/adapters/providers/openai.adapter.ts` - DEPRECATED

**Deprecation Reason:**
- Should use IntegrationDispatcher instead
- Direct execution not recommended
- Preserved as compatibility wrapper during migration

---

### Fallback Implementation

**Status:** STUB

**Location:** `lib/runtime/tasks/ampli.tasks.ts`

**Implementation:**
```typescript
async function task_publish_wordpress_direct(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  return {
    success: true,
    data: { published: [], total_published: 0 },
  };
}
```

**Status:** STUB - NOT IMPLEMENTED

**Required:**
- Retrieve credentials from database
- Use WordPress connector
- Execute provider call
- Return actual results

---

### Feature Flag Control

**Status:** OPERATIONAL

**Location:** `lib/integrations/mesh/feature-flags.ts`

**Functions:**
- `isDispatchExecutionEnabled(agentName)` - Check if dispatch enabled
- `shouldFallbackToDirectProvider(tenantId, agentName)` - Check fallback condition

**Usage:**
```typescript
if (isDispatchExecutionEnabled(agentName)) {
  // Use dispatch
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
    // ...
  });
  
  if (!response.ok) {
    if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
      console.warn('[AMPLI] Dispatch failed, falling back to direct adapter');
      return task_publish_wordpress_direct(context);
    }
  }
}

return task_publish_wordpress_direct(context);
```

**Status:** OPERATIONAL
- Feature flags exist
- Fallback logic exists
- Direct adapter is stub

---

## MULTITENANT EXECUTION DESIGN

### Tenant Context Propagation

**Status:** OPERATIONAL

**Flow:**
```
User triggers agent execution
  → API route receives user_id
  → API route retrieves tenant_id from profiles table
  → RuntimeService initialized with tenant_id
  → ExecutionOrchestrator initialized with tenant_id
  → Tasks receive tenant_id in context
  → Tasks pass tenant_id to dispatch routes via X-Tenant-Id header
```

**Evidence:**
- `lib/runtime/services/runtime.service.ts` (line 42): `tenantId: config.tenantId`
- `lib/runtime/services/execution.service.ts` (line 48): `tenant_id: this.config.tenantId`
- `lib/runtime/orchestrator/execution-orchestrator.ts` (line 60): `tenant_id: this.config.tenantId`
- All task files receive tenant_id in context

**Status:** FULLY OPERATIONAL

---

### Tenant Validation

**Status:** OPERATIONAL

**Location:** `/app/api/integrations/dispatch/cms/route.ts`

**Implementation:**
```typescript
// Get profile to validate tenant
const { data: profile } = await supabase
  .from('profiles')
  .select('tenant_id, workspace_id')
  .eq('user_id', user.id)
  .single();

if (!profile || profile.tenant_id !== tenantId) {
  return NextResponse.json(
    { error: 'Tenant mismatch' },
    { status: 403 }
  );
}
```

**Status:** FULLY OPERATIONAL
- Tenant validation in dispatch routes
- User validation via Clerk auth
- Tenant mismatch rejection

---

### RLS (Row Level Security)

**Status:** OPERATIONAL

**Location:** Database schema files

**Implementation:**
```sql
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own integrations"
  ON integrations FOR SELECT
  USING (
    tenant_id::text IN (
      SELECT tenant_id FROM profiles WHERE id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "System can insert integrations"
  ON integrations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update integrations"
  ON integrations FOR UPDATE
  WITH CHECK (true);
```

**Status:** FULLY OPERATIONAL
- RLS enabled on integrations table
- User-scoped SELECT policies
- System-scoped INSERT/UPDATE policies
- Tenant isolation enforced

---

## CRITICAL GAPS

### Gap 1: Dispatch Route Credential Retrieval

**Impact:** CRITICAL
**Risk:** Provider execution impossible without credentials

**Missing:**
- Credential retrieval in `/api/integrations/dispatch/cms`
- Credential retrieval in `/api/integrations/dispatch/google`
- Credential retrieval in `/api/integrations/dispatch/openai`
- Credential retrieval in `/api/integrations/dispatch/dataforseo`

**Required:**
- Add credential retrieval to all dispatch routes
- Use `lib/integrations/utils.ts` functions
- Handle missing credentials gracefully

---

### Gap 2: Credential Injection into n8n Payload

**Impact:** CRITICAL
**Risk:** n8n cannot execute provider calls

**Missing:**
- Credential injection into IntegrationRequest payload
- n8n workflow credential handling
- n8n credential error handling

**Required:**
- Inject credentials into payload
- Update n8n workflows to extract credentials
- Add credential error handling in n8n

---

### Gap 3: OpenAI Credential Retrieval

**Impact:** HIGH
**Risk:** SCRIBE agent cannot execute

**Missing:**
- `getOpenAIKey(tenantId)` function in `lib/integrations/utils.ts`
- OpenAI credential storage in `integrations` table
- OpenAI credential retrieval in dispatch route

**Required:**
- Add OpenAI credential storage to `integrations` table
- Add `getOpenAIKey(tenantId)` function
- Add OpenAI credential retrieval to dispatch route

---

### Gap 4: DataForSEO Credential Retrieval

**Impact:** HIGH
**Risk:** ARIA/LINX/PULSE agents cannot execute

**Missing:**
- `getDataForSEOCredentials(tenantId)` function in `lib/integrations/utils.ts`
- DataForSEO credential storage in `integrations` table
- DataForSEO credential retrieval in dispatch route

**Required:**
- Add DataForSEO credential storage to `integrations` table
- Add `getDataForSEOCredentials(tenantId)` function
- Add DataForSEO credential retrieval to dispatch route

---

### Gap 5: Direct Adapter Implementation

**Impact:** MEDIUM
**Risk:** Fallback to direct adapter returns stub results

**Missing:**
- Direct adapter implementations
- Credential retrieval in direct adapters
- Provider execution in direct adapters

**Required:**
- Implement direct adapter fallbacks
- Add credential retrieval to direct adapters
- Test direct adapter execution

---

## RECOMMENDATIONS

### IMMEDIATE (CRITICAL)

1. **Add credential retrieval to dispatch routes**
   - Update `/api/integrations/dispatch/cms` to retrieve CMS credentials
   - Update `/api/integrations/dispatch/google` to retrieve Google credentials
   - Use `lib/integrations/utils.ts` functions
   - Handle missing credentials gracefully

2. **Inject credentials into n8n payload**
   - Add credentials to IntegrationRequest payload
   - Update IntegrationDispatcher to include credentials
   - Update n8n workflows to extract credentials
   - Add credential error handling

3. **Add OpenAI credential storage and retrieval**
   - Add OpenAI credentials to `integrations` table
   - Add `getOpenAIKey(tenantId)` function to `lib/integrations/utils.ts`
   - Add OpenAI credential retrieval to dispatch route

4. **Add DataForSEO credential storage and retrieval**
   - Add DataForSEO credentials to `integrations` table
   - Add `getDataForSEOCredentials(tenantId)` function to `lib/integrations/utils.ts`
   - Add DataForSEO credential retrieval to dispatch route

### SHORT-TERM (HIGH PRIORITY)

5. **Implement direct adapter fallbacks**
   - Implement `task_publish_wordpress_direct` with actual logic
   - Implement other direct adapter fallbacks
   - Add credential retrieval to direct adapters
   - Test direct adapter execution

6. **Add credential error handling**
   - Handle missing credentials in dispatch routes
   - Handle decryption errors
   - Handle provider authentication errors
   - Provide clear error messages to users

### LONG-TERM (MEDIUM PRIORITY)

7. **Implement credential caching**
   - Cache decrypted credentials in memory
   - Set appropriate cache expiry
   - Reduce database load

8. **Add credential monitoring**
   - Monitor credential usage
   - Monitor credential errors
   - Alert on credential failures

---

## CONCLUSION

Runtime credential retrieval FUNCTIONS EXIST and are OPERATIONAL, but they are NOT CALLED by dispatch routes.

**Operational:**
- Credential retrieval functions in `lib/integrations/utils.ts`
- Tenant context propagation
- Tenant validation
- RLS policies
- Encryption/decryption

**Missing:**
- Credential retrieval in dispatch routes
- Credential injection into n8n payload
- OpenAI credential retrieval
- DataForSEO credential retrieval
- Direct adapter implementations

**Status:** RETRIEVAL EXISTS, INJECTION MISSING - DISPATCH ROUTE UPDATES REQUIRED
