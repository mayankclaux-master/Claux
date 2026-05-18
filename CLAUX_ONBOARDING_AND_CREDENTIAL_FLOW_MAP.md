# CLAUX ONBOARDING AND CREDENTIAL FLOW MAP

**Version:** 1.0.0
**Date:** May 16, 2026
**Status:** CANONICAL FLOW DEFINITION

---

## EXECUTIVE SUMMARY

This document maps the EXISTING onboarding and credential flows in CLAUX, identifying operational paths, missing links, and architectural inconsistencies.

**Critical Finding:** Onboarding uses the `credentials` table (PARTIAL encryption), while CMS connections use the `integrations` table (FULL encryption). This creates TWO DIFFERENT credential storage systems.

---

## CURRENT ONBOARDING FLOW

### Flow 1: Tenant Onboarding (credentials table)

**Status:** OPERATIONAL BUT USING WRONG TABLE

**Entry Point:** `/app/onboarding/page.tsx`

**Flow:**
```
User completes onboarding form
  → POST /api/onboarding/complete
  → lib/onboarding/orchestration.ts (orchestrateOnboarding)
  → lib/onboarding/validation.ts (validateTenantOnboarding)
  → lib/onboarding/ingestion.ts (ingestTenantOnboarding)
  → lib/onboarding/credentials.ts (storeCredential)
  → credentials table (ONBOARDING_TABLES.sql)
  → Encryption: TODO NOT IMPLEMENTED (line 83)
```

**Files:**
- `app/onboarding/page.tsx` - UI
- `app/api/onboarding/complete/route.ts` - API endpoint
- `lib/onboarding/orchestration.ts` - orchestration logic
- `lib/onboarding/validation.ts` - validation logic
- `lib/onboarding/ingestion.ts` - data ingestion
- `lib/onboarding/credentials.ts` - credential storage
- `supabase/ONBOARDING_TABLES.sql` - database schema

**Data Stored:**
- tenant_id, workspace_id
- credential_type: 'gsc' | 'openai' | 'dataforseo' | 'custom'
- credential_data (JSONB)
- encrypted (boolean flag - NOT IMPLEMENTED)

**Encryption Status:** PARTIAL
- Flag exists but decryption is TODO
- Line 83: "TODO: Decrypt if encrypted"
- Credentials stored PLAINTEXT in database

---

### Flow 2: CMS Connection (integrations table)

**Status:** OPERATIONAL WITH FULL ENCRYPTION

**Entry Point:** `/app/dashboard/settings/integrations/page.tsx`

**Flow:**
```
User connects WordPress/Shopify/Custom API
  → POST /api/integrations/cms
  → lib/integrations/utils.ts (ensureIntegrationRow)
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table (create_integrations_table.sql)
  → Encryption: FULLY IMPLEMENTED (AES-256-GCM)
```

**Files:**
- `app/dashboard/settings/integrations/page.tsx` - UI
- `app/api/integrations/cms/route.ts` - API endpoint
- `lib/integrations/utils.ts` - encryption utilities
- `supabase/create_integrations_table.sql` - database schema

**Data Stored:**
- tenant_id
- wp_site_url, wp_username, wp_app_password_encrypted
- shopify_store_url, shopify_access_token_encrypted, shopify_blog_id
- custom_api_url, custom_api_key_encrypted
- Status fields (wp_status, shopify_status, custom_status)

**Encryption Status:** FULLY IMPLEMENTED
- AES-256-GCM encryption
- INTEGRATION_ENCRYPTION_KEY env var
- encryptSecret() / decryptSecret() functions
- Credentials encrypted at rest

---

### Flow 3: Google OAuth Connection (integrations table)

**Status:** PARTIAL - TOKEN REFRESH NOT OPERATIONAL

**Entry Point:** Google OAuth callback

**Flow:**
```
User clicks "Connect Google"
  → Google OAuth flow
  → GET /api/integrations/google/callback
  → Exchange authorization code for tokens
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table (create_integrations_table.sql)
  → Encryption: FULLY IMPLEMENTED (AES-256-GCM)
```

**Files:**
- `app/api/integrations/google/callback/route.ts` - OAuth callback
- `app/api/integrations/google/refresh/route.ts` - token refresh (PARTIAL)
- `app/api/integrations/google/disconnect/route.ts` - disconnect
- `lib/integrations/utils.ts` - encryption utilities
- `lib/integrations/token-refresh/job.ts` - token refresh job (NOT OPERATIONAL)
- `supabase/create_integrations_table.sql` - database schema

**Data Stored:**
- tenant_id
- google_access_token_encrypted
- google_refresh_token_encrypted
- google_token_expires_at
- google_connected_email
- google_status

**Encryption Status:** FULLY IMPLEMENTED
- AES-256-GCM encryption
- Tokens encrypted at rest

**Token Refresh Status:** PARTIAL
- Token refresh job exists but not scheduled
- No automatic token expiry monitoring
- Manual refresh endpoint exists

---

## CURRENT CREDENTIAL RETRIEVAL FLOWS

### Retrieval Flow 1: Onboarding Credentials (credentials table)

**Status:** PARTIAL - DECRYPTION NOT IMPLEMENTED

**Flow:**
```
Runtime execution requires onboarding credential
  → lib/onboarding/credentials.ts (retrieveCredential)
  → credentials table (ONBOARDING_TABLES.sql)
  → Decryption: TODO NOT IMPLEMENTED (line 83)
  → Return credential_data as-is
```

**Files:**
- `lib/onboarding/credentials.ts` - retrieval logic
- `supabase/ONBOARDING_TABLES.sql` - database schema

**Decryption Status:** NOT IMPLEMENTED
- Line 83: "TODO: Decrypt if encrypted"
- Credentials returned PLAINTEXT
- Security vulnerability

---

### Retrieval Flow 2: CMS Credentials (integrations table)

**Status:** OPERATIONAL WITH FULL DECRYPTION

**Flow:**
```
Runtime execution requires CMS credential
  → lib/integrations/utils.ts (getWordPressAppPassword/getShopifyAccessToken/getCustomApiKey)
  → integrations table (create_integrations_table.sql)
  → Decryption: FULLY IMPLEMENTED (AES-256-GCM)
  → Return decrypted credential
```

**Files:**
- `lib/integrations/utils.ts` - retrieval and decryption logic
- `supabase/create_integrations_table.sql` - database schema

**Decryption Status:** FULLY IMPLEMENTED
- AES-256-GCM decryption
- Credentials decrypted at runtime
- Secure credential retrieval

**Functions Available:**
- `getTenantIntegrations(tenantId)` - retrieve all integrations
- `getGoogleAccessToken(tenantId)` - retrieve and decrypt Google access token
- `getGoogleRefreshToken(tenantId)` - retrieve and decrypt Google refresh token
- `getWordPressAppPassword(tenantId)` - retrieve and decrypt WordPress app password
- `getShopifyAccessToken(tenantId)` - retrieve and decrypt Shopify access token
- `getCustomApiKey(tenantId)` - retrieve and decrypt custom API key

---

### Retrieval Flow 3: Provider Credentials (provider_credentials table)

**Status:** DEAD - TABLE DOES NOT EXIST

**Flow:**
```
Runtime execution requires provider credential
  → lib/integrations/credentials/credential-manager.ts (getCredential)
  → provider_credentials table (TABLE MISSING)
  → Decryption: PLACEHOLDER (lines 142-153)
  → Return null
```

**Files:**
- `lib/integrations/credentials/credential-manager.ts` - retrieval logic
- `supabase/` - TABLE MISSING

**Decryption Status:** PLACEHOLDER
- Lines 142-153: "placeholder - use real encryption in production"
- Encryption/decryption return value as-is
- Table does not exist in migrations

---

## ARCHITECTURAL INCONSISTENCIES

### Inconsistency 1: TWO CREDENTIAL TABLES

**Impact:** HIGH

**Table 1: credentials (ONBOARDING_TABLES.sql)**
- Used by onboarding flow
- Stores GSC, OpenAI, DataForSEO, Custom credentials
- Encryption: TODO NOT IMPLEMENTED
- Decryption: TODO NOT IMPLEMENTED

**Table 2: integrations (create_integrations_table.sql)**
- Used by CMS connection flow
- Stores Google, WordPress, Shopify, Custom API credentials
- Encryption: FULLY IMPLEMENTED (AES-256-GCM)
- Decryption: FULLY IMPLEMENTED (AES-256-GCM)

**Issue:** Two different credential storage systems with different encryption implementations

---

### Inconsistency 2: MISSING CREDENTIAL TABLES

**Impact:** MEDIUM

**Table 3: provider_credentials**
- Referenced in `lib/integrations/credentials/credential-manager.ts`
- Table does not exist in migrations
- Dead code

**Table 4: cms_credentials**
- Referenced in `actions/cms.ts`
- Table does not exist in migrations
- Dead code

**Issue:** Referenced tables that don't exist create confusion and dead code

---

### Inconsistency 3: ENCRYPTION INCONSISTENCY

**Impact:** HIGH

**Onboarding Credentials:**
- Encryption flag exists but not implemented
- TODO comment at line 83
- Credentials stored plaintext
- Security vulnerability

**CMS Credentials:**
- Full AES-256-GCM encryption implemented
- Credentials encrypted at rest
- Secure credential storage

**Issue:** Inconsistent encryption implementation across credential systems

---

## MISSING LINKS

### Missing Link 1: Onboarding to Runtime Credential Retrieval

**Status:** MISSING

**Current State:**
- Onboarding stores credentials in `credentials` table
- Runtime cannot retrieve onboarding credentials securely
- Decryption not implemented

**Required:**
- Migrate onboarding credentials to `integrations` table
- Use `lib/integrations/utils.ts` for encryption/decryption
- Implement runtime retrieval for onboarding credentials

---

### Missing Link 2: Dispatch Route Credential Retrieval

**Status:** MISSING

**Current State:**
- Dispatch routes receive tenant_id via X-Tenant-Id header
- Dispatch routes do not retrieve credentials from database
- Credentials not injected into n8n payload

**Required:**
- Add credential retrieval to dispatch routes
- Use `lib/integrations/utils.ts` for retrieval and decryption
- Inject credentials into n8n payload

---

### Missing Link 3: Connection Validation

**Status:** MISSING

**Current State:**
- No test connection endpoints
- Credentials stored without validation
- Invalid credentials not detected until runtime

**Required:**
- Add test connection endpoints for all providers
- Validate credentials before storing
- Provide immediate feedback to users

---

### Missing Link 4: Token Refresh Execution

**Status:** MISSING

**Current State:**
- Token refresh job exists in `lib/integrations/token-refresh/job.ts`
- Job not scheduled or executed
- Tokens may expire without refresh

**Required:**
- Schedule token refresh job
- Monitor token expiry
- Automatically refresh expired tokens

---

## CANONICAL INTENDED ARCHITECTURE

### Intended Flow 1: Unified Credential Storage

**Status:** NOT IMPLEMENTED

**Intended Flow:**
```
User completes onboarding OR connects provider
  → Single credential storage system (integrations table)
  → lib/integrations/utils.ts (encryptSecret)
  → integrations table (create_integrations_table.sql)
  → Encryption: FULLY IMPLEMENTED (AES-256-GCM)
```

**Current State:**
- Onboarding uses `credentials` table (wrong table)
- CMS connections use `integrations` table (correct table)
- Two different credential storage systems

---

### Intended Flow 2: Unified Credential Retrieval

**Status:** PARTIALLY IMPLEMENTED

**Intended Flow:**
```
Runtime execution requires any credential
  → lib/integrations/utils.ts (get*Credential functions)
  → integrations table (create_integrations_table.sql)
  → Decryption: FULLY IMPLEMENTED (AES-256-GCM)
  → Return decrypted credential
```

**Current State:**
- CMS credentials: FULLY IMPLEMENTED
- Onboarding credentials: NOT IMPLEMENTED (wrong table)
- Provider credentials: DEAD CODE (table missing)

---

### Intended Flow 3: Runtime Credential Injection

**Status:** NOT IMPLEMENTED

**Intended Flow:**
```
Task execution (tenant_id in context)
  → API Route (/api/integrations/dispatch/*)
  → Retrieve credentials from integrations table via lib/integrations/utils.ts
  → Decrypt credentials via lib/integrations/utils.ts
  → Inject credentials into n8n payload
  → IntegrationDispatcher (lib/integrations/mesh/dispatchers/index.ts)
  → n8n webhook
  → Provider execution
```

**Current State:**
- Tenant_id passed to dispatch routes
- Credentials not retrieved from database
- Credentials not injected into n8n payload
- n8n receives no credentials

---

## SUBSYSTEM STATUS

### Onboarding System

**Status:** OPERATIONAL BUT USING WRONG TABLE

**Components:**
- UI: OPERATIONAL (`app/onboarding/page.tsx`)
- API: OPERATIONAL (`app/api/onboarding/complete/route.ts`)
- Orchestration: OPERATIONAL (`lib/onboarding/orchestration.ts`)
- Validation: OPERATIONAL (`lib/onboarding/validation.ts`)
- Ingestion: OPERATIONAL (`lib/onboarding/ingestion.ts`)
- Credential Storage: PARTIAL (`lib/onboarding/credentials.ts` - wrong table, encryption TODO)

**Issue:** Uses `credentials` table instead of `integrations` table

---

### Credential Storage System

**Status:** FRAGMENTED

**Tables:**
1. `credentials` - PARTIAL (wrong table for onboarding, encryption TODO)
2. `integrations` - OPERATIONAL (correct table, encryption IMPLEMENTED)
3. `provider_credentials` - DEAD (table missing)
4. `cms_credentials` - DEAD (table missing)

**Issue:** Four different credential tables, only one operational

---

### Encryption System

**Status:** PARTIAL

**Implemented:**
- `lib/integrations/utils.ts` - FULL AES-256-GCM encryption/decryption

**Not Implemented:**
- `lib/onboarding/credentials.ts` - TODO comment, encryption not implemented
- `lib/integrations/credentials/credential-manager.ts` - placeholder encryption

**Issue:** Inconsistent encryption implementation

---

### Credential Retrieval System

**Status:** PARTIAL

**Implemented:**
- `lib/integrations/utils.ts` - FULL retrieval and decryption for CMS credentials

**Not Implemented:**
- `lib/onboarding/credentials.ts` - retrieval exists but decryption TODO
- `lib/integrations/credentials/credential-manager.ts` - table missing

**Issue:** Only CMS credentials can be retrieved securely

---

### Provider Connection System

**Status:** OPERATIONAL FOR STORAGE, MISSING VALIDATION

**Implemented:**
- CMS connection API: OPERATIONAL (`app/api/integrations/cms/route.ts`)
- Google OAuth: OPERATIONAL (`app/api/integrations/google/callback/route.ts`)
- Credential storage: OPERATIONAL (integrations table)
- Encryption: OPERATIONAL (lib/integrations/utils.ts)

**Not Implemented:**
- Connection validation endpoints
- Test connection functionality
- Token refresh job execution

**Issue:** Credentials stored without validation

---

### Runtime Credential Injection System

**Status:** MISSING

**Implemented:**
- Tenant_id propagation: OPERATIONAL (X-Tenant-Id header)
- Credential retrieval functions: OPERATIONAL (lib/integrations/utils.ts)

**Not Implemented:**
- Credential retrieval in dispatch routes
- Credential injection into n8n payload
- n8n credential handling

**Issue:** Credentials not injected into provider execution

---

## RECOMMENDATIONS

### IMMEDIATE (CRITICAL)

1. **Migrate onboarding to integrations table**
   - Update `lib/onboarding/credentials.ts` to use `integrations` table
   - Use `lib/integrations/utils.ts` for encryption
   - Remove dependency on `credentials` table
   - Deprecate `credentials` table

2. **Implement encryption in onboarding/credentials.ts**
   - Remove TODO comment at line 83
   - Use `lib/integrations/utils.ts` encryptSecret/decryptSecret
   - Ensure all credentials encrypted at rest

3. **Remove dead code**
   - Remove `lib/integrations/credentials/credential-manager.ts`
   - Remove `actions/cms.ts` reference to `cms_credentials`
   - Document deprecation of missing tables

### SHORT-TERM (HIGH PRIORITY)

4. **Add credential retrieval to dispatch routes**
   - Retrieve credentials from `integrations` table
   - Use `lib/integrations/utils.ts` for retrieval and decryption
   - Inject credentials into n8n payload
   - Test end-to-end credential flow

5. **Add connection validation endpoints**
   - WordPress test connection
   - Custom API test connection
   - Shopify test connection
   - Google test connection

6. **Implement token refresh job execution**
   - Schedule token refresh job
   - Monitor token expiry
   - Automatically refresh expired tokens

### LONG-TERM (MEDIUM PRIORITY)

7. **Add credential rotation**
   - Implement credential rotation mechanism
   - Add credential expiry monitoring
   - Add credential rotation UI

8. **Add credential audit logging**
   - Log all credential access
   - Log all credential changes
   - Monitor for suspicious activity

---

## CONCLUSION

The onboarding and credential flow is FRAGMENTED across TWO different credential storage systems:

1. **Onboarding** uses `credentials` table (PARTIAL encryption, TODO decryption)
2. **CMS connections** use `integrations` table (FULL encryption, FULL decryption)

The `integrations` table + `lib/integrations/utils.ts` pattern is the ONLY fully operational system with real encryption and decryption.

**Recommendation:** Migrate onboarding to use the `integrations` table pattern to consolidate credential storage and ensure consistent encryption across all credential types.

**Status:** FLOW EXISTS BUT FRAGMENTED - CONSOLIDATION REQUIRED
