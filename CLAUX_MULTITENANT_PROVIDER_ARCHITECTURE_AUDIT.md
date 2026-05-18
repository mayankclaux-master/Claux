# CLAUX MULTITENANT PROVIDER ARCHITECTURE AUDIT

**Version:** 1.0.0
**Date:** May 16, 2026
**Status:** CRITICAL ARCHITECTURE REALITY AUDIT

---

## EXECUTIVE SUMMARY

**Board Rejection:** The "Vercel env per client" approach is ARCHITECTURALLY INVALID because CLAUX is designed for 100+ tenants.

**Audit Finding:** CLAUX ALREADY CONTAINS a multitenant credential architecture, but it is FRAGMENTED across MULTIPLE CONFLICTING SYSTEMS.

**Critical Issue:** FOUR different credential storage systems exist, creating architectural confusion and potential data inconsistency.

**Recommendation:** CONSOLIDATE to the `integrations` table + `lib/integrations/utils.ts` pattern, which is the ONLY fully operational system with real encryption.

---

## Q1: DOES CLAUX ALREADY CONTAIN A MULTITENANT CREDENTIAL ARCHITECTURE?

**Answer:** YES - BUT FRAGMENTED

CLAUX contains MULTIPLE credential storage systems that are INCONSISTENT and PARTIALLY IMPLEMENTED.

---

## Q2: WHERE ARE CREDENTIALS CURRENTLY STORED?

### FOUR DIFFERENT CREDENTIAL TABLES FOUND:

#### 1. `credentials` Table (ONBOARDING_TABLES.sql)
**Status:** PARTIAL
**Location:** `/supabase/ONBOARDING_TABLES.sql` (lines 44-54)
**Purpose:** Onboarding credentials for GSC, OpenAI, DataForSEO, Custom
**Schema:**
```sql
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  credential_data JSONB NOT NULL,
  encrypted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, credential_type)
);
```
**Used By:** `lib/onboarding/credentials.ts`
**Encryption:** TODO NOT IMPLEMENTED (line 83: "TODO: Decrypt if encrypted")
**RLS:** ENABLED

#### 2. `integrations` Table (create_integrations_table.sql)
**Status:** OPERATIONAL
**Location:** `/supabase/create_integrations_table.sql`
**Purpose:** Per-tenant integration credentials for Google, WordPress, Shopify, Custom API
**Schema:**
```sql
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google',
  
  -- Google OAuth tokens (encrypted)
  google_access_token_encrypted TEXT,
  google_refresh_token_encrypted TEXT,
  google_token_expires_at TIMESTAMPTZ,
  google_connected_email TEXT,
  
  -- Google service properties
  search_console_property TEXT,
  ga4_property_id TEXT,
  ga4_account_id TEXT,
  gbp_account_id TEXT,
  gbp_location_id TEXT,
  
  -- WordPress CMS
  wp_site_url TEXT,
  wp_username TEXT,
  wp_app_password_encrypted TEXT,
  
  -- Shopify CMS
  shopify_store_url TEXT,
  shopify_access_token_encrypted TEXT,
  shopify_blog_id TEXT,
  
  -- Custom API
  custom_api_url TEXT,
  custom_api_key_encrypted TEXT,
  
  -- Connection status
  google_status TEXT NOT NULL DEFAULT 'not_connected',
  wp_status TEXT NOT NULL DEFAULT 'not_connected',
  shopify_status TEXT NOT NULL DEFAULT 'not_connected',
  custom_status TEXT NOT NULL DEFAULT 'not_connected',
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Used By:** `app/api/integrations/cms/route.ts`, `lib/integrations/utils.ts`
**Encryption:** FULLY IMPLEMENTED via `lib/integrations/utils.ts` (AES-256-GCM)
**RLS:** ENABLED
**Status:** OPERATIONAL

#### 3. `provider_credentials` Table (REFERENCED BUT NOT FOUND)
**Status:** DEAD / MISSING
**Referenced By:** `lib/integrations/credentials/credential-manager.ts`
**Purpose:** General provider credentials
**SQL File:** NOT FOUND IN MIGRATIONS
**Encryption:** PLACEHOLDER (lines 142-153: "placeholder - use real encryption in production")
**Status:** DEAD CODE

#### 4. `cms_credentials` Table (REFERENCED BUT NOT FOUND)
**Status:** DEAD / MISSING
**Referenced By:** `actions/cms.ts` (line 40)
**Purpose:** CMS credentials
**SQL File:** NOT FOUND IN MIGRATIONS
**Status:** DEAD CODE

---

## Q3: IS THERE ALREADY CREDENTIAL ENCRYPTION, ABSTRACTION, PROVIDER ADAPTERS, TENANT-SCOPED RETRIEVAL?

### Credential Encryption

**Status:** PARTIAL - ONLY IN `integrations` TABLE

**IMPLEMENTED:**
- `lib/integrations/utils.ts` - REAL AES-256-GCM encryption/decryption
- `encryptSecret(secret: string)` - encrypts using INTEGRATION_ENCRYPTION_KEY env var
- `decryptSecret(encryptedSecret: string)` - decrypts using INTEGRATION_ENCRYPTION_KEY env var
- Used by `app/api/integrations/cms/route.ts` for WordPress, Shopify, Custom API credentials

**NOT IMPLEMENTED:**
- `lib/onboarding/credentials.ts` - line 83: "TODO: Decrypt if encrypted"
- `lib/integrations/credentials/credential-manager.ts` - lines 142-153: placeholder encryption

### Credential Abstraction

**Status:** PARTIAL - ONLY IN `integrations` TABLE

**IMPLEMENTED:**
- `lib/integrations/utils.ts` provides abstraction functions:
  - `getTenantIntegrations(tenantId)` - retrieves integrations row
  - `getGoogleAccessToken(tenantId)` - decrypts and returns Google access token
  - `getGoogleRefreshToken(tenantId)` - decrypts and returns Google refresh token
  - `getWordPressAppPassword(tenantId)` - decrypts and returns WordPress app password
  - `getShopifyAccessToken(tenantId)` - decrypts and returns Shopify access token
  - `getCustomApiKey(tenantId)` - decrypts and returns custom API key

**NOT IMPLEMENTED:**
- `lib/onboarding/credentials.ts` - no abstraction for runtime retrieval
- `lib/integrations/credentials/credential-manager.ts` - table doesn't exist

### Provider Adapters

**Status:** DEPRECATED - SHOULD USE INTEGRATIONDISPATCHER

**DEPRECATED ADAPTERS:**
- `lib/runtime/adapters/providers/dataforseo.adapter.ts` - DEPRECATED (line 4: "@deprecated")
- `lib/runtime/adapters/providers/openai.adapter.ts` - DEPRECATED (line 4: "@deprecated")

**INTENDED ARCHITECTURE:**
- Use IntegrationDispatcher via `lib/integrations/mesh/dispatchers/index.ts`
- Dispatch to n8n for provider execution
- Direct adapters preserved as compatibility wrappers during migration

### Tenant-Scoped Provider Retrieval

**Status:** OPERATIONAL - ONLY IN `integrations` TABLE

**IMPLEMENTED:**
- All retrieval functions in `lib/integrations/utils.ts` are tenant-scoped:
  - `getTenantIntegrations(tenantId)` - filters by tenant_id
  - `getGoogleAccessToken(tenantId)` - filters by tenant_id
  - `getWordPressAppPassword(tenantId)` - filters by tenant_id
  - `getShopifyAccessToken(tenantId)` - filters by tenant_id
  - `getCustomApiKey(tenantId)` - filters by tenant_id

**NOT IMPLEMENTED:**
- `lib/onboarding/credentials.ts` - no runtime retrieval abstraction
- `lib/integrations/credentials/credential-manager.ts` - table doesn't exist

---

## Q4: CAN ONBOARDING ALREADY CONNECT WORDPRESS/CUSTOM WEBSITES, SAVE/RETRIEVE CREDENTIALS, VALIDATE CONNECTIONS?

### WordPress Connection

**Status:** OPERATIONAL

**IMPLEMENTED:**
- `app/api/integrations/cms/route.ts` (POST) - saves WordPress credentials:
  - siteUrl, username, appPassword
  - Encrypts app password via `encryptSecret()`
  - Stores in `integrations` table (wp_site_url, wp_username, wp_app_password_encrypted)
  - Updates wp_status to 'connected'
- `lib/connectors/wordpress.connector.ts` - WordPress connector exists
- `lib/integrations/utils.ts` - `getWordPressAppPassword(tenantId)` retrieves and decrypts

**VALIDATION:** NOT IMPLEMENTED - no connection validation

### Custom Website Connection

**Status:** OPERATIONAL

**IMPLEMENTED:**
- `app/api/integrations/cms/route.ts` (POST) - saves custom API credentials:
  - apiUrl, apiKey
  - Encrypts apiKey via `encryptSecret()`
  - Stores in `integrations` table (custom_api_url, custom_api_key_encrypted)
  - Updates custom_status to 'connected'
- `lib/connectors/custom.connector.ts` - Custom API connector exists
- `lib/integrations/utils.ts` - `getCustomApiKey(tenantId)` retrieves and decrypts

**VALIDATION:** NOT IMPLEMENTED - no connection validation

### Credential Retrieval

**Status:** OPERATIONAL

**IMPLEMENTED:**
- `lib/integrations/utils.ts` - retrieval functions exist for all providers
- Tenant-scoped via tenant_id parameter
- Automatic decryption via `decryptSecret()`

### Connection Validation

**Status:** MISSING

**NOT IMPLEMENTED:**
- No connection validation for WordPress
- No connection validation for Custom API
- No connection validation for Shopify
- No connection validation for Google

---

## Q5: DOES RUNTIME ALREADY SUPPORT TENANT-SCOPED CREDENTIAL INJECTION, PROVIDER EXECUTION PER TENANT, ADAPTER RESOLUTION?

### Tenant-Scoped Credential Injection

**Status:** OPERATIONAL

**IMPLEMENTED:**
- `lib/integrations/utils.ts` - all retrieval functions are tenant-scoped
- Runtime tasks receive `tenant_id` in context
- Tasks pass `tenant_id` to dispatch routes via `X-Tenant-Id` header
- Dispatch routes validate tenant_id against user profile

**FLOW:**
```
Task Execution (tenant_id in context)
  → API Route (/api/integrations/dispatch/cms)
  → X-Tenant-Id header
  → getTenantIntegrations(tenant_id)
  → Decrypt credentials
  → Execute provider call
```

### Provider Execution Per Tenant

**Status:** OPERATIONAL

**IMPLEMENTED:**
- All agent tasks pass `tenant_id` in context
- All dispatch routes validate `tenant_id` against user profile
- IntegrationDispatcher signs payloads with `tenant_id`
- X-Tenant-ID header passed to n8n

**EVIDENCE:**
- `lib/runtime/tasks/ampli.tasks.ts` (line 113): `'X-Tenant-Id': context.tenant_id`
- `lib/runtime/tasks/aria.tasks.ts` (line 128): `'X-Tenant-Id': context.tenant_id`
- `lib/runtime/tasks/scribe.tasks.ts` (line 166): `'X-Tenant-Id': context.tenant_id`
- All other agent tasks follow same pattern

### Adapter Resolution

**Status:** DEPRECATED - SHOULD USE INTEGRATIONDISPATCHER

**DEPRECATED:**
- Direct adapters (DataForSEO, OpenAI) marked deprecated
- Should use IntegrationDispatcher → n8n → provider

**INTENDED:**
- Feature flags control dispatch vs direct adapter
- `isDispatchExecutionEnabled(agentName)` - checks if dispatch enabled
- `shouldFallbackToDirectProvider(tenantId, agentName)` - checks fallback condition

---

## Q6: WHAT EXACTLY IS MISSING TO OPERATIONALIZE WORDPRESS/CUSTOM WEBSITE PUBLISHING, PROVIDER AUTH PERSISTENCE, RUNTIME CREDENTIAL INJECTION?

### WordPress Publishing

**MISSING:**
1. Connection validation - no test connection endpoint
2. Credential injection into AMPLI tasks - AMPLI tasks call dispatch but don't retrieve credentials
3. Dispatch route credential retrieval - `/api/integrations/dispatch/cms` doesn't retrieve credentials from `integrations` table
4. n8n workflow - no n8n workflow to handle WordPress publishing
5. Direct adapter fallback - `task_publish_wordpress_direct` is stub (returns empty result)

**OPERATIONAL:**
1. Credential storage - EXISTS in `integrations` table
2. Credential encryption - EXISTS via `lib/integrations/utils.ts`
3. Credential retrieval - EXISTS via `getWordPressAppPassword(tenantId)`
4. WordPress connector - EXISTS in `lib/connectors/wordpress.connector.ts`

### Custom Website Publishing

**MISSING:**
1. Connection validation - no test connection endpoint
2. Credential injection into AMPLI tasks - AMPLI tasks call dispatch but don't retrieve credentials
3. Dispatch route credential retrieval - `/api/integrations/dispatch/cms` doesn't retrieve credentials from `integrations` table
4. n8n workflow - no n8n workflow to handle custom API publishing
5. Direct adapter fallback - stub implementation

**OPERATIONAL:**
1. Credential storage - EXISTS in `integrations` table
2. Credential encryption - EXISTS via `lib/integrations/utils.ts`
3. Credential retrieval - EXISTS via `getCustomApiKey(tenantId)`
4. Custom API connector - EXISTS in `lib/connectors/custom.connector.ts`

### Provider Auth Persistence

**MISSING:**
1. Token refresh for Google OAuth - `lib/integrations/token-refresh/job.ts` exists but not operational
2. Credential expiry tracking - no expiry monitoring
3. Credential rotation - no rotation mechanism

**OPERATIONAL:**
1. Google token storage - EXISTS in `integrations` table (google_access_token_encrypted, google_refresh_token_encrypted)
2. Token encryption - EXISTS via `lib/integrations/utils.ts`
3. Token retrieval - EXISTS via `getGoogleAccessToken(tenantId)`, `getGoogleRefreshToken(tenantId)`

### Runtime Credential Injection

**MISSING:**
1. Dispatch route credential retrieval - `/api/integrations/dispatch/cms` doesn't retrieve credentials from `integrations` table
2. Credential injection into n8n payload - credentials not passed to n8n
3. n8n credential injection - n8n workflows don't receive credentials

**OPERATIONAL:**
1. Credential retrieval functions - EXISTS in `lib/integrations/utils.ts`
2. Tenant-scoped retrieval - EXISTS via tenant_id parameter
3. Decryption - EXISTS via `decryptSecret()`

---

## Q7: WAS THE "VERCEL ENV PER CLIENT" IDEA UNNECESSARY BECAUSE OPERATIONAL MULTITENANCY INFRASTRUCTURE ALREADY EXISTS?

**Answer:** YES - BUT FRAGMENTED

**CORRECT ASSESSMENT:**
The "Vercel env per client" approach was unnecessary because CLAUX ALREADY has:
1. Tenant-scoped credential storage (`integrations` table)
2. Real encryption implementation (`lib/integrations/utils.ts`)
3. Tenant-scoped credential retrieval (`lib/integrations/utils.ts`)
4. Runtime execution with tenant context (all tasks receive tenant_id)
5. Dispatch architecture with tenant propagation (X-Tenant-ID header)

**PROBLEM:**
The architecture is FRAGMENTED across FOUR different credential storage systems:
1. `credentials` table (onboarding, encryption TODO)
2. `integrations` table (CMS, encryption IMPLEMENTED)
3. `provider_credentials` table (credential-manager, table MISSING)
4. `cms_credentials` table (actions/cms, table MISSING)

**SOLUTION:**
Consolidate to `integrations` table + `lib/integrations/utils.ts` pattern, which is the ONLY fully operational system.

---

## Q8: WHAT IS THE TRUE INTENDED ARCHITECTURE FOR TENANT ONBOARDING → CREDENTIAL STORAGE → RUNTIME RETRIEVAL → ADAPTER EXECUTION?

### CURRENT INTENDED ARCHITECTURE (FRAGMENTED)

#### Onboarding Flow
```
User completes onboarding
  → lib/onboarding/orchestration.ts
  → lib/onboarding/credentials.ts
  → credentials table (ONBOARDING_TABLES.sql)
  → Encryption: TODO NOT IMPLEMENTED
```

#### CMS Connection Flow
```
User connects WordPress/Custom API
  → app/api/integrations/cms/route.ts
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table (create_integrations_table.sql)
  → Encryption: IMPLEMENTED (AES-256-GCM)
```

#### Runtime Retrieval Flow
```
Task execution (tenant_id in context)
  → lib/integrations/utils.ts (getWordPressAppPassword/getCustomApiKey)
  → integrations table
  → Decryption: IMPLEMENTED (AES-256-GCM)
```

#### Adapter Execution Flow
```
Task execution
  → lib/runtime/tasks/ampli.tasks.ts
  → /api/integrations/dispatch/cms (X-Tenant-Id header)
  → IntegrationDispatcher (lib/integrations/mesh/dispatchers/index.ts)
  → n8n webhook
  → Provider execution
  → MISSING: Credential injection into n8n payload
```

### CANONICAL INTENDED ARCHITECTURE (SHOULD BE)

#### Onboarding Flow
```
User completes onboarding
  → lib/onboarding/orchestration.ts
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table (consolidated)
  → Encryption: IMPLEMENTED (AES-256-GCM)
```

#### CMS Connection Flow
```
User connects WordPress/Custom API
  → app/api/integrations/cms/route.ts
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table
  → Encryption: IMPLEMENTED (AES-256-GCM)
```

#### Runtime Retrieval Flow
```
Task execution (tenant_id in context)
  → lib/integrations/utils.ts (getWordPressAppPassword/getCustomApiKey)
  → integrations table
  → Decryption: IMPLEMENTED (AES-256-GCM)
```

#### Adapter Execution Flow
```
Task execution
  → lib/runtime/tasks/ampli.tasks.ts
  → /api/integrations/dispatch/cms (X-Tenant-Id header)
  → Retrieve credentials from integrations table via lib/integrations/utils.ts
  → Inject credentials into n8n payload
  → IntegrationDispatcher (lib/integrations/mesh/dispatchers/index.ts)
  → n8n webhook
  → Provider execution
```

---

## SUBSYSTEM AUDIT RESULTS

### 1. Onboarding System

**Status:** OPERATIONAL BUT USING WRONG CREDENTIAL TABLE

**Files:**
- `lib/onboarding/credentials.ts` - PARTIAL (encryption TODO)
- `lib/onboarding/orchestration.ts` - OPERATIONAL
- `lib/onboarding/validation.ts` - OPERATIONAL
- `lib/onboarding/ingestion.ts` - OPERATIONAL
- `lib/onboarding/activation/tenant-activation-pipeline.ts` - OPERATIONAL
- `app/api/onboarding/complete/route.ts` - OPERATIONAL
- `app/onboarding/page.tsx` - OPERATIONAL

**Issue:** Uses `credentials` table instead of `integrations` table
**Recommendation:** Migrate to `integrations` table pattern

---

### 2. Credential Storage Architecture

**Status:** FRAGMENTED - FOUR DIFFERENT SYSTEMS

**Tables:**
1. `credentials` (ONBOARDING_TABLES.sql) - PARTIAL, encryption TODO
2. `integrations` (create_integrations_table.sql) - OPERATIONAL, encryption IMPLEMENTED
3. `provider_credentials` (referenced in credential-manager.ts) - DEAD, table MISSING
4. `cms_credentials` (referenced in actions/cms.ts) - DEAD, table MISSING

**Recommendation:** Consolidate to `integrations` table, deprecate others

---

### 3. Provider Connection Architecture

**Status:** OPERATIONAL FOR CMS, MISSING VALIDATION

**Files:**
- `app/api/integrations/cms/route.ts` - OPERATIONAL
- `app/api/integrations/google/callback/route.ts` - OPERATIONAL
- `app/api/integrations/google/refresh/route.ts` - PARTIAL (token refresh job exists)
- `app/api/integrations/google/disconnect/route.ts` - OPERATIONAL
- `lib/integrations/utils.ts` - OPERATIONAL
- `lib/integrations/token-refresh/job.ts` - PARTIAL (not operational)

**Missing:**
- Connection validation endpoints
- Token refresh job execution

---

### 4. Runtime Credential Injection Capability

**Status:** PARTIAL - RETRIEVAL EXISTS, INJECTION MISSING

**Files:**
- `lib/integrations/utils.ts` - OPERATIONAL (retrieval functions)
- `lib/integrations/mesh/dispatchers/index.ts` - OPERATIONAL (dispatch)
- `app/api/integrations/dispatch/cms/route.ts` - PARTIAL (no credential retrieval)

**Missing:**
- Credential retrieval in dispatch routes
- Credential injection into n8n payload
- n8n credential handling

---

### 5. Multitenant Execution Design

**Status:** OPERATIONAL

**Files:**
- `lib/runtime/services/runtime.service.ts` - OPERATIONAL (tenant_id in config)
- `lib/runtime/services/execution.service.ts` - OPERATIONAL (tenant_id in config)
- `lib/runtime/orchestrator/execution-orchestrator.ts` - OPERATIONAL (tenant_id in config)
- All agent task files - OPERATIONAL (tenant_id in context)

**Evidence:**
- All services initialized with tenant_id
- All tasks receive tenant_id in context
- X-Tenant-Id header passed to dispatch routes
- Tenant validation in dispatch routes

---

### 6. Adapter Infrastructure

**Status:** DEPRECATED - SHOULD USE INTEGRATIONDISPATCHER

**Files:**
- `lib/runtime/adapters/providers/dataforseo.adapter.ts` - DEPRECATED
- `lib/runtime/adapters/providers/openai.adapter.ts` - DEPRECATED
- `lib/runtime/adapters/index.ts` - DEPRECATED

**Intended:**
- Use IntegrationDispatcher via `lib/integrations/mesh/dispatchers/index.ts`
- Direct adapters preserved as compatibility wrappers

---

### 7. Publishing Infrastructure (AMPLI)

**Status:** PARTIAL - DISPATCH EXISTS, CREDENTIAL INJECTION MISSING

**Files:**
- `lib/runtime/tasks/ampli.tasks.ts` - PARTIAL (dispatch calls exist, credential injection missing)
- `lib/connectors/wordpress.connector.ts` - OPERATIONAL
- `lib/connectors/shopify.connector.ts` - OPERATIONAL
- `lib/connectors/custom.connector.ts` - OPERATIONAL

**Missing:**
- Credential retrieval in AMPLI tasks
- Credential injection into dispatch payload
- n8n workflows for CMS publishing
- Direct adapter implementations (stubs)

---

### 8. WordPress/Custom Website Integration Support

**Status:** OPERATIONAL FOR STORAGE, MISSING FOR EXECUTION

**Files:**
- `app/api/integrations/cms/route.ts` - OPERATIONAL (credential storage)
- `lib/integrations/utils.ts` - OPERATIONAL (credential retrieval)
- `lib/connectors/wordpress.connector.ts` - OPERATIONAL (connector)
- `lib/connectors/custom.connector.ts` - OPERATIONAL (connector)

**Missing:**
- Connection validation
- Credential injection into runtime execution
- n8n workflow integration
- Direct adapter implementations

---

## CRITICAL FINDINGS

### 1. FOUR CREDENTIAL TABLES EXIST - ARCHITECTURAL INCONSISTENCY

**Impact:** HIGH
**Risk:** Data inconsistency, confusion, maintenance burden

**Tables:**
1. `credentials` - onboarding, encryption TODO
2. `integrations` - CMS, encryption IMPLEMENTED
3. `provider_credentials` - DEAD, table MISSING
4. `cms_credentials` - DEAD, table MISSING

**Recommendation:** Migrate all to `integrations` table pattern

---

### 2. ENCRYPTION IS PARTIALLY IMPLEMENTED

**Impact:** HIGH
**Risk:** Security vulnerability in onboarding credentials

**Implemented:**
- `lib/integrations/utils.ts` - REAL AES-256-GCM encryption

**Not Implemented:**
- `lib/onboarding/credentials.ts` - TODO comment
- `lib/integrations/credentials/credential-manager.ts` - placeholder

**Recommendation:** Implement encryption in onboarding/credentials.ts using lib/integrations/utils.ts

---

### 3. RUNTIME CREDENTIAL INJECTION IS MISSING

**Impact:** HIGH
**Risk:** Cannot execute provider calls at runtime

**Missing:**
- Credential retrieval in dispatch routes
- Credential injection into n8n payload
- n8n credential handling

**Recommendation:** Add credential retrieval and injection to dispatch routes

---

### 4. CONNECTION VALIDATION IS MISSING

**Impact:** MEDIUM
**Risk:** Invalid credentials not detected until runtime

**Missing:**
- WordPress connection validation
- Custom API connection validation
- Shopify connection validation
- Google connection validation

**Recommendation:** Add test connection endpoints for all providers

---

### 5. TOKEN REFRESH IS PARTIALLY IMPLEMENTED

**Impact:** MEDIUM
**Risk:** Google OAuth tokens may expire

**Partial:**
- `lib/integrations/token-refresh/job.ts` exists

**Missing:**
- Job execution scheduling
- Token expiry monitoring
- Automatic refresh logic

**Recommendation:** Implement token refresh job execution

---

## RECOMMENDATIONS

### IMMEDIATE (CRITICAL)

1. **Consolidate credential storage to `integrations` table**
   - Migrate onboarding credentials from `credentials` table to `integrations` table
   - Deprecate `credentials` table
   - Remove references to `provider_credentials` and `cms_credentials` tables

2. **Implement encryption in onboarding/credentials.ts**
   - Use `lib/integrations/utils.ts` encryption functions
   - Remove TODO comment
   - Ensure all credentials are encrypted

3. **Add credential retrieval to dispatch routes**
   - Retrieve credentials from `integrations` table via `lib/integrations/utils.ts`
   - Inject credentials into n8n payload
   - Test end-to-end credential flow

### SHORT-TERM (HIGH PRIORITY)

4. **Add connection validation endpoints**
   - WordPress test connection
   - Custom API test connection
   - Shopify test connection
   - Google test connection

5. **Implement token refresh job execution**
   - Schedule token refresh job
   - Monitor token expiry
   - Automatically refresh expired tokens

6. **Complete AMPLI task implementations**
   - Add credential retrieval to AMPLI tasks
   - Implement direct adapter fallbacks
   - Test WordPress/Custom API publishing

### LONG-TERM (MEDIUM PRIORITY)

7. **Deprecate direct adapters**
   - Complete migration to IntegrationDispatcher
   - Remove deprecated adapters
   - Update documentation

8. **Add credential rotation**
   - Implement credential rotation mechanism
   - Add credential expiry monitoring
   - Add credential rotation UI

---

## CONCLUSION

CLAUX ALREADY CONTAINS a multitenant credential architecture, but it is FRAGMENTED across FOUR different credential storage systems.

The `integrations` table + `lib/integrations/utils.ts` pattern is the ONLY fully operational system with:
- Real encryption (AES-256-GCM)
- Tenant-scoped credential retrieval
- Runtime credential injection capability (partial)

The "Vercel env per client" approach was unnecessary, but the current architecture needs CONSOLIDATION to the `integrations` table pattern.

**Status:** ARCHITECTURE EXISTS BUT FRAGMENTED - CONSOLIDATION REQUIRED
