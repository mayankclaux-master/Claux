# CLAUX WORDPRESS AND CUSTOM WEBSITE OPERATIONAL READINESS

**Version:** 1.0.0
**Date:** May 16, 2026
**Status:** OPERATIONAL READINESS ASSESSMENT

---

## EXECUTIVE SUMMARY

This document assesses the operational readiness of WordPress and custom website publishing capabilities in CLAUX.

**Critical Finding:** WordPress and custom website integration support is PARTIALLY OPERATIONAL for credential storage, but MISSING for runtime execution and publishing.

---

## WORDPRESS OPERATIONAL READINESS

### Credential Storage

**Status:** OPERATIONAL

**Location:** `app/api/integrations/cms/route.ts`

**Implementation:**
```typescript
if (type === "wordpress") {
  const { siteUrl, username, appPassword } = credentials;
  
  updateData.wp_site_url = siteUrl;
  updateData.wp_username = username;
  updateData.wp_app_password_encrypted = encryptSecret(appPassword);
  updateData.wp_status = "connected";
}
```

**Storage Location:** `integrations` table (create_integrations_table.sql)
- wp_site_url
- wp_username
- wp_app_password_encrypted
- wp_status

**Encryption:** FULLY IMPLEMENTED (AES-256-GCM)
- `encryptSecret(appPassword)` - encrypts using INTEGRATION_ENCRYPTION_KEY
- Credentials encrypted at rest

**Status:** FULLY OPERATIONAL

---

### Credential Retrieval

**Status:** OPERATIONAL

**Location:** `lib/integrations/utils.ts`

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

**Decryption:** FULLY IMPLEMENTED (AES-256-GCM)
- `decryptSecret()` - decrypts using INTEGRATION_ENCRYPTION_KEY
- Credentials decrypted at runtime

**Status:** FULLY OPERATIONAL

---

### WordPress Connector

**Status:** OPERATIONAL

**Location:** `lib/connectors/wordpress.connector.ts`

**Implementation:**
```typescript
export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
  const { title, html, siteUrl, username, applicationPassword } = params;

  if (!siteUrl || !username || !applicationPassword) {
    return {
      success: false,
      error: "WordPress credentials not configured"
    };
  }

  // Generate Basic Auth header
  const authString = `${username}:${applicationPassword}`;
  const encodedAuth = Buffer.from(authString).toString('base64');

  // Generate slug from title
  const slug = generateSlug(title);

  // Prepare API endpoint
  const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

  // Prepare request body
  const requestBody = {
    title: title,
    content: html,
    status: "publish",
    slug: slug,
    categories: [1] // Default category
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `WordPress API error: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();

    if (data && data.link) {
      return {
        success: true,
        url: data.link
      };
    } else {
      return {
        success: false,
        error: "WordPress API response missing URL"
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: "WordPress API request timed out (10s)"
        };
      }
      return {
        success: false,
        error: `WordPress API request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: "Unknown error occurred during WordPress request"
    };
  }
}
```

**Features:**
- Basic Authentication
- Slug generation from title
- WordPress REST API integration
- Error handling
- Timeout handling (10 seconds)
- URL extraction from response

**Status:** FULLY OPERATIONAL

---

### Connection Validation

**Status:** MISSING

**Missing:**
- No test connection endpoint
- No credential validation before storage
- No connection status verification

**Required:**
- Add test connection endpoint
- Validate credentials before storing
- Provide immediate feedback to users

**Status:** MISSING

---

### Runtime Credential Injection

**Status:** MISSING

**Location:** `lib/runtime/tasks/ampli.tasks.ts`

**Current Implementation:**
```typescript
export async function task_publish_wordpress(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts, wordpress_config } = context.input_data;
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
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

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_post_id: result.result?.post_id,
            status: 'published',
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        console.warn('[AMPLI] Dispatch failed, falling back to direct adapter');
        return task_publish_wordpress_direct(context);
      }
      throw error;
    }
  }
  
  return task_publish_wordpress_direct(context);
}
```

**Missing:**
- No credential retrieval from database
- No credential decryption
- No credential injection into payload
- `wordpress_config` is passed but not populated from database

**Status:** MISSING

---

### Direct Adapter Fallback

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
- Retrieve credentials from database via `getWordPressAppPassword(tenantId)`
- Retrieve site URL and username via `getTenantIntegrations(tenantId)`
- Use WordPress connector to publish
- Return actual results

---

### n8n Workflow Integration

**Status:** MISSING

**Missing:**
- No n8n workflow for WordPress publishing
- No n8n credential handling
- No n8n error handling

**Required:**
- Create n8n workflow for WordPress publishing
- Extract credentials from payload
- Use WordPress connector in n8n
- Handle errors gracefully

**Status:** MISSING

---

## CUSTOM WEBSITE OPERATIONAL READINESS

### Credential Storage

**Status:** OPERATIONAL

**Location:** `app/api/integrations/cms/route.ts`

**Implementation:**
```typescript
if (type === "custom") {
  const { apiUrl, apiKey } = credentials;
  
  updateData.custom_api_url = apiUrl;
  updateData.custom_api_key_encrypted = encryptSecret(apiKey);
  updateData.custom_status = "connected";
}
```

**Storage Location:** `integrations` table (create_integrations_table.sql)
- custom_api_url
- custom_api_key_encrypted
- custom_status

**Encryption:** FULLY IMPLEMENTED (AES-256-GCM)
- `encryptSecret(apiKey)` - encrypts using INTEGRATION_ENCRYPTION_KEY
- Credentials encrypted at rest

**Status:** FULLY OPERATIONAL

---

### Credential Retrieval

**Status:** OPERATIONAL

**Location:** `lib/integrations/utils.ts`

**Implementation:**
```typescript
export async function getCustomApiKey(tenantId: string): Promise<string | null> {
  const integrations = await getTenantIntegrations(tenantId);
  
  if (!integrations?.custom_api_key_encrypted) {
    return null;
  }
  
  try {
    return decryptSecret(integrations.custom_api_key_encrypted);
  } catch (error) {
    console.error('Error decrypting custom API key:', error);
    return null;
  }
}
```

**Decryption:** FULLY IMPLEMENTED (AES-256-GCM)
- `decryptSecret()` - decrypts using INTEGRATION_ENCRYPTION_KEY
- Credentials decrypted at runtime

**Status:** FULLY OPERATIONAL

---

### Custom API Connector

**Status:** OPERATIONAL

**Location:** `lib/connectors/custom.connector.ts`

**Implementation:**
```typescript
export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
  const { title, html, slug, apiUrl, apiKey } = params;

  if (!apiUrl || !apiKey) {
    return {
      success: false,
      error: "Custom API credentials not configured"
    };
  }

  // Prepare request body with flexible payload
  const requestBody = {
    title: title,
    content: html,
    html: html,
    slug: slug,
    status: "published"
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch {
        errorText = "Unable to read error response body";
      }
      return {
        success: false,
        error: `Custom API error: ${response.status} ${response.statusText} - ${errorText}`
      };
    }

    const data = await response.json();

    // Flexible URL extraction: check response.url or response.data.url
    const url = data?.url || data?.data?.url;

    if (url) {
      return {
        success: true,
        url: url
      };
    } else {
      return {
        success: false,
        error: "Custom API response missing URL (expected response.url or response.data.url)"
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: "Custom API request timed out (10s)"
        };
      }
      return {
        success: false,
        error: `Custom API request failed: ${error.message}`
      };
    }
    return {
      success: false,
      error: "Unknown error occurred during custom API request"
    };
  }
}
```

**Features:**
- Bearer token authentication
- Flexible payload structure
- Flexible URL extraction
- Error handling
- Timeout handling (10 seconds)
- Support for custom response formats

**Status:** FULLY OPERATIONAL

---

### Connection Validation

**Status:** MISSING

**Missing:**
- No test connection endpoint
- No credential validation before storage
- No connection status verification

**Required:**
- Add test connection endpoint
- Validate credentials before storing
- Provide immediate feedback to users

**Status:** MISSING

---

### Runtime Credential Injection

**Status:** MISSING

**Location:** `lib/runtime/tasks/ampli.tasks.ts`

**Current Implementation:**
```typescript
export async function task_publish_custom(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const agentName = 'AMPLI';
  const { approved_drafts, custom_config } = context.input_data;
  
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published: any[] = [];
      
      for (const draft of approved_drafts) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/dispatch/cms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': context.tenant_id,
              'X-Execution-Id': context.execution_id,
            },
            body: JSON.stringify({
              cmsType: 'custom',
              config: custom_config,
              content: {
                title: draft.title,
                content: draft.body_html,
                meta_title: draft.meta_title,
                meta_description: draft.meta_description,
              },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-custom-${draft.id}`,
            }),
          });

          if (!response.ok) {
            throw new Error(`CMS dispatch failed: ${response.status}`);
          }

          const result = await response.json();
          
          published.push({
            draft_id: draft.id,
            cms_post_id: result.result?.post_id,
            status: 'published',
          });
        } catch (error) {
          published.push({
            draft_id: draft.id,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        success: true,
        data: { published, total_published: published.filter(p => p.status === 'published').length },
      };
    } catch (error) {
      if (shouldFallbackToDirectProvider(context.tenant_id, agentName)) {
        console.warn('[AMPLI] Dispatch failed, falling back to direct adapter');
        return task_publish_custom_direct(context);
      }
      throw error;
    }
  }
  
  return task_publish_custom_direct(context);
}
```

**Missing:**
- No credential retrieval from database
- No credential decryption
- No credential injection into payload
- `custom_config` is passed but not populated from database

**Status:** MISSING

---

### Direct Adapter Fallback

**Status:** STUB

**Location:** `lib/runtime/tasks/ampli.tasks.ts`

**Implementation:**
```typescript
async function task_publish_custom_direct(context: {
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
- Retrieve credentials from database via `getCustomApiKey(tenantId)`
- Retrieve API URL via `getTenantIntegrations(tenantId)`
- Use Custom API connector to publish
- Return actual results

---

### n8n Workflow Integration

**Status:** MISSING

**Missing:**
- No n8n workflow for Custom API publishing
- No n8n credential handling
- No n8n error handling

**Required:**
- Create n8n workflow for Custom API publishing
- Extract credentials from payload
- Use Custom API connector in n8n
- Handle errors gracefully

**Status:** MISSING

---

## OPERATIONAL READINESS SUMMARY

### WordPress

| Component | Status | Notes |
|-----------|--------|-------|
| Credential Storage | OPERATIONAL | Full AES-256-GCM encryption |
| Credential Retrieval | OPERATIONAL | Full AES-256-GCM decryption |
| WordPress Connector | OPERATIONAL | Full REST API integration |
| Connection Validation | MISSING | No test connection endpoint |
| Runtime Credential Injection | MISSING | Not called in dispatch routes |
| Direct Adapter Fallback | STUB | Returns empty results |
| n8n Workflow | MISSING | No n8n workflow exists |

**Overall Status:** PARTIALLY OPERATIONAL - STORAGE WORKS, EXECUTION MISSING

---

### Custom Website

| Component | Status | Notes |
|-----------|--------|-------|
| Credential Storage | OPERATIONAL | Full AES-256-GCM encryption |
| Credential Retrieval | OPERATIONAL | Full AES-256-GCM decryption |
| Custom API Connector | OPERATIONAL | Full REST API integration |
| Connection Validation | MISSING | No test connection endpoint |
| Runtime Credential Injection | MISSING | Not called in dispatch routes |
| Direct Adapter Fallback | STUB | Returns empty results |
| n8n Workflow | MISSING | No n8n workflow exists |

**Overall Status:** PARTIALLY OPERATIONAL - STORAGE WORKS, EXECUTION MISSING

---

## MISSING COMPONENTS

### Missing 1: Connection Validation Endpoints

**Impact:** MEDIUM
**Risk:** Invalid credentials not detected until runtime

**Required:**
- POST `/api/integrations/cms/test-connection` endpoint
- Validate WordPress credentials
- Validate Custom API credentials
- Validate Shopify credentials
- Provide immediate feedback to users

---

### Missing 2: Runtime Credential Retrieval in Dispatch Routes

**Impact:** CRITICAL
**Risk:** Provider execution impossible without credentials

**Required:**
- Update `/api/integrations/dispatch/cms` to retrieve credentials
- Use `getWordPressAppPassword(tenantId)` for WordPress
- Use `getCustomApiKey(tenantId)` for Custom API
- Use `getTenantIntegrations(tenantId)` for additional config

---

### Missing 3: Credential Injection into n8n Payload

**Impact:** CRITICAL
**Risk:** n8n cannot execute provider calls

**Required:**
- Inject credentials into IntegrationRequest payload
- Update n8n workflows to extract credentials
- Add credential error handling in n8n

---

### Missing 4: Direct Adapter Implementations

**Impact:** MEDIUM
**Risk**: Fallback to direct adapter returns stub results

**Required:**
- Implement `task_publish_wordpress_direct` with actual logic
- Implement `task_publish_custom_direct` with actual logic
- Add credential retrieval to direct adapters
- Test direct adapter execution

---

### Missing 5: n8n Workflows

**Impact:** HIGH
**Risk:** Dispatch execution path non-functional

**Required:**
- Create n8n workflow for WordPress publishing
- Create n8n workflow for Custom API publishing
- Extract credentials from payload
- Use connectors in n8n
- Handle errors gracefully

---

## RECOMMENDATIONS

### IMMEDIATE (CRITICAL)

1. **Add credential retrieval to dispatch routes**
   - Update `/api/integrations/dispatch/cms` to retrieve credentials
   - Use `getWordPressAppPassword(tenantId)` for WordPress
   - Use `getCustomApiKey(tenantId)` for Custom API
   - Use `getTenantIntegrations(tenantId)` for additional config
   - Handle missing credentials gracefully

2. **Inject credentials into n8n payload**
   - Add credentials to IntegrationRequest payload
   - Update IntegrationDispatcher to include credentials
   - Update n8n workflows to extract credentials
   - Add credential error handling

3. **Implement direct adapter fallbacks**
   - Implement `task_publish_wordpress_direct` with actual logic
   - Implement `task_publish_custom_direct` with actual logic
   - Add credential retrieval to direct adapters
   - Test direct adapter execution

### SHORT-TERM (HIGH PRIORITY)

4. **Add connection validation endpoints**
   - Add POST `/api/integrations/cms/test-connection`
   - Validate WordPress credentials
   - Validate Custom API credentials
   - Provide immediate feedback to users

5. **Create n8n workflows**
   - Create n8n workflow for WordPress publishing
   - Create n8n workflow for Custom API publishing
   - Extract credentials from payload
   - Use connectors in n8n
   - Handle errors gracefully

### LONG-TERM (MEDIUM PRIORITY)

6. **Add credential monitoring**
   - Monitor credential usage
   - Monitor credential errors
   - Alert on credential failures

7. **Add credential rotation**
   - Implement credential rotation mechanism
   - Add credential expiry monitoring
   - Add credential rotation UI

---

## CONCLUSION

WordPress and custom website integration support is PARTIALLY OPERATIONAL:

**Operational:**
- Credential storage with full encryption
- Credential retrieval with full decryption
- WordPress connector (full REST API integration)
- Custom API connector (full REST API integration)

**Missing:**
- Connection validation endpoints
- Runtime credential retrieval in dispatch routes
- Credential injection into n8n payload
- Direct adapter implementations (stubs)
- n8n workflows

**Status:** STORAGE OPERATIONAL, EXECUTION MISSING - DISPATCH ROUTE UPDATES REQUIRED

**Path to Operational:**
1. Add credential retrieval to dispatch routes
2. Inject credentials into n8n payload
3. Implement direct adapter fallbacks
4. Create n8n workflows
5. Add connection validation endpoints
