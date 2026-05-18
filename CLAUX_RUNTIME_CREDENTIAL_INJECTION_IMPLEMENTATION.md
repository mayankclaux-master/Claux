# CLAUX RUNTIME CREDENTIAL INJECTION IMPLEMENTATION

**Version:** 1.0.0
**Date:** May 16, 2026
**Status:** CANONICAL IMPLEMENTATION

---

## EXECUTIVE SUMMARY

This document details the canonical implementation of runtime credential injection for AMPLI, CLAUX's first real autonomous execution system.

**Purpose:** Establish the canonical pattern for runtime credential retrieval and injection in CLAUX execution tasks.

---

## ARCHITECTURAL PRINCIPLES

### Core Principles

1. **NO Frontend Credential Injection**
   - Execution payloads NEVER contain raw credentials
   - Credentials retrieved dynamically at runtime
   - Runtime is authoritative execution owner

2. **Tenant-Scoped Credential Retrieval**
   - Credentials retrieved via tenant-scoped functions
   - No cross-tenant credential access
   - RLS policies enforced

3. **Secure Decryption**
   - Credentials decrypted at runtime only
   - AES-256-GCM encryption
   - No plaintext persistence

4. **Connector-Level Injection**
   - Credentials injected into connector execution only
   - Credentials never exposed in task results
   - Credentials never exposed in logs

---

## IMPLEMENTATION PATTERN

### Canonical Pattern

```typescript
export async function task_publish_<provider>(context: {
  tenant_id: string;
  workspace_id: string;
  execution_id: string;
  input_data: any;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  
  // STEP 1: Initialize runtime services
  const eventService = new EventService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  const logService = new LogService({ 
    tenantId: context.tenant_id, 
    logOperations: true, 
    enableMetrics: false 
  });
  
  // STEP 2: Publish start event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: '<provider>_publishing_started',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { draft_count: approved_drafts?.length || 0 },
  });
  
  // STEP 3: Log start
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: '<provider> publishing started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // STEP 4: Dispatch execution (if enabled)
  if (isDispatchExecutionEnabled(agentName)) {
    try {
      const published = [];
      
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
              cmsType: '<provider>',
              content: { /* content */ },
              executionId: context.execution_id,
              tenantId: context.tenant_id,
              traceId: `${context.execution_id}-<provider>-${draft.id}`,
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
        return task_publish_<provider>_direct(context, eventService, logService);
      }
      throw error;
    }
  }
  
  // STEP 5: Fallback to direct adapter
  return task_publish_<provider>_direct(context, eventService, logService);
}
```

---

## DIRECT ADAPTER IMPLEMENTATION

### Canonical Pattern

```typescript
async function task_publish_<provider>_direct(
  context: {
    tenant_id: string;
    workspace_id: string;
    execution_id: string;
    input_data: any;
  },
  eventService: EventService,
  logService: LogService
): Promise<{ success: boolean; data?: any; error?: string }> {
  const { approved_drafts } = context.input_data;
  const published = [];
  
  // STEP 1: Log start
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: '<provider> direct adapter execution started',
    metadata: { draft_count: approved_drafts?.length || 0 },
  });
  
  // STEP 2: Retrieve tenant credentials dynamically
  const integrations = await getTenantIntegrations(context.tenant_id);
  
  if (!integrations) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: '<provider> integrations not found for tenant',
      metadata: { tenant_id: context.tenant_id },
    });
    
    return {
      success: false,
      error: '<provider> integrations not configured',
    };
  }
  
  // STEP 3: Extract credentials
  const <field1> = integrations.<field1>;
  const <field2> = await get<Provider>Credential(context.tenant_id);
  
  if (!<field1> || !<field2>) {
    await logService.writeLog({
      execution_id: context.execution_id,
      log_level: LogLevel.ERROR,
      message: '<provider> credentials incomplete',
      metadata: { has_<field1>: !!<field1>, has_<field2>: !!<field2> },
    });
    
    return {
      success: false,
      error: '<provider> credentials not configured',
    };
  }
  
  // STEP 4: Log credential retrieval success
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.INFO,
    message: '<provider> credentials retrieved successfully',
    metadata: { <field1>: <field1> },
  });
  
  // STEP 5: Publish each draft
  for (const draft of approved_drafts) {
    try {
      const result = await publish<Provider>Post({
        <field1>: <field1>,
        <field2>: <field2>,
        /* other fields */
      });
      
      if (result.success) {
        published.push({
          draft_id: draft.id,
          cms_post_id: result.url,
          url: result.url,
          status: 'published',
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.INFO,
          message: `<provider> draft published successfully: ${draft.id}`,
          metadata: { draft_id: draft.id, url: result.url },
        });
      } else {
        published.push({
          draft_id: draft.id,
          status: 'failed',
          error: result.error,
        });
        
        await logService.writeLog({
          execution_id: context.execution_id,
          log_level: LogLevel.ERROR,
          message: `<provider> draft publishing failed: ${draft.id}`,
          metadata: { draft_id: draft.id, error: result.error },
        });
      }
    } catch (error) {
      published.push({
        draft_id: draft.id,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      await logService.writeLog({
        execution_id: context.execution_id,
        log_level: LogLevel.ERROR,
        message: `<provider> draft publishing failed: ${draft.id}`,
        metadata: { draft_id: draft.id, error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }
  
  // STEP 6: Publish completion event
  await eventService.publishEvent({
    tenant_id: context.tenant_id,
    execution_id: context.execution_id,
    event_name: '<provider>_direct_publishing_completed',
    event_source: 'ampli',
    event_version: '1.0',
    payload: { 
      total_published: published.filter(p => p.status === 'published').length,
      total_failed: published.filter(p => p.status === 'failed').length,
    },
  });
  
  return {
    success: true,
    data: { published, total_published: published.filter(p => p.status === 'published').length },
  };
}
```

---

## WORDPRESS IMPLEMENTATION

### Credential Retrieval

```typescript
// Retrieve tenant credentials dynamically
const integrations = await getTenantIntegrations(context.tenant_id);

const siteUrl = integrations.wp_site_url;
const username = integrations.wp_username;
const appPassword = await getWordPressAppPassword(context.tenant_id);
```

### Credential Validation

```typescript
if (!siteUrl || !username || !appPassword) {
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.ERROR,
    message: 'WordPress credentials incomplete',
    metadata: { has_site_url: !!siteUrl, has_username: !!username, has_app_password: !!appPassword },
  });
  
  return {
    success: false,
    error: 'WordPress credentials not configured',
  };
}
```

### Connector Execution

```typescript
const result = await publishWordPressPost({
  title: draft.title,
  html: draft.body_html,
  siteUrl: siteUrl,
  username: username,
  applicationPassword: appPassword,
});
```

---

## CUSTOM API IMPLEMENTATION

### Credential Retrieval

```typescript
// Retrieve tenant credentials dynamically
const integrations = await getTenantIntegrations(context.tenant_id);

const apiUrl = integrations.custom_api_url;
const apiKey = await getCustomApiKey(context.tenant_id);
```

### Credential Validation

```typescript
if (!apiUrl || !apiKey) {
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.ERROR,
    message: 'Custom API credentials incomplete',
    metadata: { has_api_url: !!apiUrl, has_api_key: !!apiKey },
  });
  
  return {
    success: false,
    error: 'Custom API credentials not configured',
  };
}
```

### Connector Execution

```typescript
const slug = draft.title.toLowerCase().replace(/\s+/g, '-');
const result = await publishCustomPost({
  title: draft.title,
  html: draft.body_html,
  slug: slug,
  apiUrl: apiUrl,
  apiKey: apiKey,
});
```

---

## SHOPIFY IMPLEMENTATION

### Credential Retrieval

```typescript
// Retrieve tenant credentials dynamically
const integrations = await getTenantIntegrations(context.tenant_id);

const storeUrl = integrations.shopify_store_url;
const accessToken = await getShopifyAccessToken(context.tenant_id);
```

### Credential Validation

```typescript
if (!storeUrl || !accessToken) {
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.ERROR,
    message: 'Shopify credentials incomplete',
    metadata: { has_store_url: !!storeUrl, has_access_token: !!accessToken },
  });
  
  return {
    success: false,
    error: 'Shopify credentials not configured',
  };
}
```

### Connector Execution

```typescript
// Stub implementation - Shopify connector not yet created
for (const draft of approved_drafts) {
  published.push({
    draft_id: draft.id,
    status: 'failed',
    error: 'Shopify connector not yet implemented',
  });
}
```

---

## SECURITY CONSIDERATIONS

### Credential Storage

- Credentials stored encrypted in `integrations` table
- AES-256-GCM encryption
- Encryption key: `INTEGRATION_ENCRYPTION_KEY`

### Credential Retrieval

- Credentials retrieved via tenant-scoped functions
- RLS policies enforce tenant isolation
- No cross-tenant credential access

### Credential Decryption

- Credentials decrypted at runtime only
- Decrypted credentials never persisted
- Decrypted credentials scoped to function execution

### Credential Injection

- Credentials injected into connector execution only
- Credentials never exposed in task results
- Credentials never exposed in logs
- Credentials never exposed in events

### Credential Cleanup

- Credentials cleared after use
- No credential caching in memory
- No credential leakage between executions

---

## LOGGING CONSIDERATIONS

### What to Log

**DO Log:**
- Credential retrieval success/failure
- Credential validation success/failure
- Connector execution success/failure
- Draft publishing success/failure
- Execution start/completion
- Error states

**DO NOT Log:**
- Raw credentials
- Decrypted credentials
- Secrets of any kind
- Sensitive data

### Log Metadata

**Safe Metadata:**
- Boolean flags (has_site_url, has_username, etc.)
- Non-sensitive identifiers (draft_id, execution_id, tenant_id)
- Non-sensitive URLs (site_url, api_url)
- Error messages (without secrets)

**Unsafe Metadata:**
- Raw credentials
- Decrypted secrets
- Sensitive tokens

---

## ERROR HANDLING

### Credential Retrieval Errors

```typescript
if (!integrations) {
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.ERROR,
    message: '<provider> integrations not found for tenant',
    metadata: { tenant_id: context.tenant_id },
  });
  
  return {
    success: false,
    error: '<provider> integrations not configured',
  };
}
```

### Credential Validation Errors

```typescript
if (!<field1> || !<field2>) {
  await logService.writeLog({
    execution_id: context.execution_id,
    log_level: LogLevel.ERROR,
    message: '<provider> credentials incomplete',
    metadata: { has_<field1>: !!<field1>, has_<field2>: !!<field2> },
  });
  
  return {
    success: false,
    error: '<provider> credentials not configured',
  };
}
```

### Connector Execution Errors

```typescript
try {
  const result = await publish<Provider>Post({ /* credentials */ });
  
  if (result.success) {
    // Handle success
  } else {
    // Handle connector-reported failure
    published.push({
      draft_id: draft.id,
      status: 'failed',
      error: result.error,
    });
  }
} catch (error) {
  // Handle unexpected error
  published.push({
    draft_id: draft.id,
    status: 'failed',
    error: error instanceof Error ? error.message : 'Unknown error',
  });
}
```

---

## BEST PRACTICES

### DO

- Retrieve credentials dynamically at runtime
- Validate credentials before use
- Log credential retrieval success/failure
- Log connector execution success/failure
- Use tenant-scoped credential functions
- Clear credentials after use
- Handle all error cases
- Provide clear error messages

### DO NOT

- Accept credentials from frontend payloads
- Store credentials in plaintext
- Cache credentials in memory
- Expose credentials in logs
- Expose credentials in events
- Expose credentials in task results
- Bypass tenant isolation
- Ignore error cases

---

## FUTURE PROVIDERS

### Pattern for New Providers

When adding a new provider, follow this pattern:

1. **Add credential retrieval function to `lib/integrations/utils.ts`**
   ```typescript
   export async function get<Provider>Credential(tenantId: string): Promise<string | null> {
     const integrations = await getTenantIntegrations(tenantId);
     
     if (!integrations?.<provider>_credential_encrypted) {
       return null;
     }
     
     try {
       return decryptSecret(integrations.<provider>_credential_encrypted);
     } catch (error) {
       console.error('Error decrypting <provider> credential:', error);
       return null;
     }
   }
   ```

2. **Add connector to `lib/connectors/<provider>.connector.ts`**
   ```typescript
   export async function publishPost(params: PublishPostParams): Promise<PublishResult> {
     const { title, html, <credential_fields> } = params;
     
     // Validate credentials
     if (!<credential_fields>) {
       return { success: false, error: "<provider> credentials not configured" };
     }
     
     // Execute connector logic
     // ...
     
     return { success: true, url: result.url };
   }
   ```

3. **Add task to `lib/runtime/tasks/ampli.tasks.ts`**
   - Follow canonical pattern
   - Retrieve credentials dynamically
   - Validate credentials
   - Log all operations
   - Handle all error cases

---

## CONCLUSION

The canonical runtime credential injection implementation establishes the pattern for all future CLAUX execution tasks.

**Status:** CANONICAL PATTERN ESTABLISHED

**Key Principles:**
- NO frontend credential injection
- Tenant-scoped credential retrieval
- Secure decryption at runtime
- Connector-level injection only
- Comprehensive logging
- Comprehensive error handling

**Foundation:** This implementation provides the foundation for CLAUX's transition to operational autonomous SEO execution platform.
