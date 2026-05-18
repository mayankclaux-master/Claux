# CLAUX PRODUCTION ENV AUDIT

**Version:** 1.0.0
**Date:** May 18, 2026
**Purpose:** Complete deployment safety audit for CLAUX AMPLI operationalization

---

## EXECUTIVE SUMMARY

This document audits ALL required Vercel environment variables, their validation logic, fallback behavior, startup failure points, and runtime failure points for CLAUX AMPLI operationalization.

**Scope:** Real operational behavior validation, not theoretical architecture.

---

## REQUIRED VS OPTIONAL VARIABLES

### CRITICAL: REQUIRED FOR DEPLOYMENT

These variables MUST be set or the application will NOT function.

| Variable | Required For | Missing Behavior |
|----------|--------------|-----------------|
| `NEXT_PUBLIC_APP_URL` | All dispatch calls | Runtime crash on dispatch |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client initialization | Application crash on startup |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client initialization | Application crash on startup |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations | Admin operations fail |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk initialization | Application crash on startup |
| `CLERK_SECRET_KEY` | Clerk backend operations | Authentication fails |
| `INTEGRATION_ENCRYPTION_KEY` | Credential encryption/decryption | Credential operations fail with default key |

### OPTIONAL: NOT REQUIRED FOR AMPLI OPERATIONALIZATION

These variables are optional for AMPLI operationalization but may be required for other agents.

| Variable | Required For | Missing Behavior |
|----------|--------------|-----------------|
| `OPENAI_API_KEY` | SCRIBE agent | OpenAI calls fail |
| `DATAFORSEO_API_KEY` | ARIA, LINX, PULSE agents | DataForSEO calls fail |
| `DATAFORSEO_USERNAME` | DataForSEO authentication | DataForSEO calls fail |
| `SERP_API_KEY` | SERP integration | SERP calls fail |
| `N8N_WEBHOOK_URL` | Integration mesh dispatch | Dispatch falls back to direct adapters |
| `N8N_API_KEY` | Integration mesh dispatch | Dispatch falls back to direct adapters |
| `GOOGLE_OAUTH_CLIENT_ID` | Google integration | Google OAuth fails |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google integration | Google OAuth fails |
| `ENABLE_AMPLI_DISPATCH_EXECUTION` | AMPLI dispatch mode | Defaults to direct adapter execution |
| `ENABLE_ARIA_DISPATCH_EXECUTION` | ARIA dispatch mode | Defaults to direct adapter execution |
| `ENABLE_SCRIBE_DISPATCH_EXECUTION` | SCRIBE dispatch mode | Defaults to direct adapter execution |
| `ENABLE_LOCL_DISPATCH_EXECUTION` | LOCL dispatch mode | Defaults to direct adapter execution |
| `ENABLE_LINX_DISPATCH_EXECUTION` | LINX dispatch mode | Defaults to direct adapter execution |
| `ENABLE_REPUTE_DISPATCH_EXECUTION` | REPUTE dispatch mode | Defaults to direct adapter execution |
| `ENABLE_PRISM_DISPATCH_EXECUTION` | PRISM dispatch mode | Defaults to direct adapter execution |
| `ENABLE_PULSE_DISPATCH_EXECUTION` | PULSE dispatch mode | Defaults to direct adapter execution |

---

## VARIABLE-BY-VARIABLE AUDIT

### 1. NEXT_PUBLIC_APP_URL

**Purpose:** Base URL for all internal API dispatch calls

**Required For:** All agent dispatch calls (AMPLI, ARIA, SCRIBE, LOCL, LINX, REPUTE, PRISM, PULSE)

**Validation Logic:**
```typescript
// lib/config/app-url.ts
const envUrl = process.env.NEXT_PUBLIC_APP_URL;

if (envUrl) {
  return envUrl;
}

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "NEXT_PUBLIC_APP_URL is required in production"
  );
}

return "http://localhost:3000";
```

**Fallback Behavior:**
- Development: Falls back to `http://localhost:3000`
- Production: THROWS ERROR - application crash

**Startup Failure Point:** NO - only used at runtime during dispatch

**Runtime Failure Point:** YES - if missing in production, all dispatch calls fail with error

**Affected Systems:**
- WordPress publishing dispatch
- Custom API publishing dispatch
- Shopify publishing dispatch
- Webflow publishing dispatch
- Ghost publishing dispatch
- DataForSEO dispatch (ARIA, LINX, PULSE)
- GBP dispatch (LOCL, REPUTE)
- GSC dispatch (PRISM)
- OpenAI dispatch (SCRIBE, REPUTE, PRISM)

**Impact:** CRITICAL - if missing, NO agent execution possible

---

### 2. NEXT_PUBLIC_SUPABASE_URL

**Purpose:** Supabase project URL

**Required For:** Supabase client initialization

**Validation Logic:**
```typescript
// lib/env.ts
NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', true),
```

**Fallback Behavior:** NONE - if missing, getEnvVar throws error

**Startup Failure Point:** YES - application crash on first Supabase client creation

**Runtime Failure Point:** N/A - fails at startup

**Affected Systems:**
- All database operations
- All authentication operations
- All integration operations
- All runtime operations

**Impact:** CRITICAL - if missing, application CANNOT START

---

### 3. NEXT_PUBLIC_SUPABASE_ANON_KEY

**Purpose:** Supabase anonymous key for client-side operations

**Required For:** Supabase client initialization

**Validation Logic:**
```typescript
// lib/env.ts
NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', true),
```

**Fallback Behavior:** NONE - if missing, getEnvVar throws error

**Startup Failure Point:** YES - application crash on first Supabase client creation

**Runtime Failure Point:** N/A - fails at startup

**Affected Systems:**
- All database operations
- All authentication operations
- All integration operations
- All runtime operations

**Impact:** CRITICAL - if missing, application CANNOT START

---

### 4. SUPABASE_SERVICE_ROLE_KEY

**Purpose:** Supabase service role key for admin operations (bypasses RLS)

**Required For:** Admin operations (integration callbacks, dispatch routes)

**Validation Logic:**
```typescript
// app/api/integrations/callback/cms/route.ts
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_SERVICE_ROLE_KEY!
```

**Fallback Behavior:** NONE - if missing, throws error at runtime

**Startup Failure Point:** NO - only used in API routes

**Runtime Failure Point:** YES - if missing, integration callbacks and dispatch routes fail

**Affected Systems:**
- Integration callback routes (CMS, GSC, GBP, OpenAI, DataForSEO)
- Integration dispatch routes (CMS, GSC, GBP, OpenAI, DataForSEO)
- Admin database operations

**Impact:** CRITICAL - if missing, integration callbacks and dispatch FAIL

---

### 5. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

**Purpose:** Clerk publishable key for client-side authentication

**Required For:** Clerk initialization

**Validation Logic:**
```typescript
// lib/env.ts
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: getEnvVar('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', true),
```

**Fallback Behavior:** NONE - if missing, getEnvVar throws error

**Startup Failure Point:** YES - application crash on first Clerk component render

**Runtime Failure Point:** N/A - fails at startup

**Affected Systems:**
- All authentication operations
- All protected routes
- All tenant operations

**Impact:** CRITICAL - if missing, application CANNOT START

---

### 6. CLERK_SECRET_KEY

**Purpose:** Clerk secret key for backend authentication operations

**Required For:** Clerk backend operations

**Validation Logic:**
```typescript
// lib/env.ts
CLERK_SECRET_KEY: getEnvVar('CLERK_SECRET_KEY', true),
```

**Fallback Behavior:** NONE - if missing, getEnvVar throws error

**Startup Failure Point:** YES - application crash on first backend auth operation

**Runtime Failure Point:** N/A - fails at startup

**Affected Systems:**
- All server-side authentication operations
- All API route authentication
- All tenant validation

**Impact:** CRITICAL - if missing, application CANNOT START

---

### 7. INTEGRATION_ENCRYPTION_KEY

**Purpose:** AES-256-GCM encryption key for credential storage

**Required For:** Credential encryption/decryption

**Validation Logic:**
```typescript
// lib/integrations/utils.ts
const encryptionKey = env.INTEGRATION_ENCRYPTION_KEY || 'default-key-change-in-production';
```

**Fallback Behavior:** FALLS BACK TO 'default-key-change-in-production' (INSECURE)

**Startup Failure Point:** NO - only used at runtime during credential operations

**Runtime Failure Point:** YES - if missing, uses INSECURE default key

**Affected Systems:**
- WordPress credential encryption/decryption
- Custom API credential encryption/decryption
- Shopify credential encryption/decryption
- Google token encryption/decryption

**Impact:** HIGH - if missing, credentials stored with INSECURE default key

**SECURITY WARNING:** Default key is INSECURE - MUST be set in production

---

### 8. OPENAI_API_KEY

**Purpose:** OpenAI API key for AI operations

**Required For:** SCRIBE agent, REPUTE agent, PRISM agent

**Validation Logic:**
```typescript
// lib/agents/shared/openai.client.ts
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// (Commented out - uses dispatch instead)
```

**Fallback Behavior:** NONE - if missing, OpenAI dispatch calls fail

**Startup Failure Point:** NO - only used at runtime during OpenAI calls

**Runtime Failure Point:** YES - if missing, OpenAI calls fail

**Affected Systems:**
- SCRIBE content generation
- REPUTE sentiment analysis
- REPUTE response drafting
- PRISM AI-assisted analytics

**Impact:** MEDIUM for AMPLI - AMPLI does not use OpenAI directly

---

### 9. DATAFORSEO_API_KEY

**Purpose:** DataForSEO API key for SEO data retrieval

**Required For:** ARIA agent, LINX agent, PULSE agent

**Validation Logic:**
```typescript
// lib/agents/shared/dataforseo.client.ts
// const API_KEY = process.env.DATAFORSEO_API_KEY;
// (Commented out - uses dispatch instead)
```

**Fallback Behavior:** NONE - if missing, DataForSEO dispatch calls fail

**Startup Failure Point:** NO - only used at runtime during DataForSEO calls

**Runtime Failure Point:** YES - if missing, DataForSEO calls fail

**Affected Systems:**
- ARIA keyword research
- LINX backlink analysis
- PULSE ranking monitoring

**Impact:** MEDIUM for AMPLI - AMPLI does not use DataForSEO directly

---

### 10. DATAFORSEO_USERNAME

**Purpose:** DataForSEO username for authentication

**Required For:** DataForSEO API authentication

**Validation Logic:**
```typescript
// lib/runtime/production/environment-validator.ts
const username = process.env.DATAFORSEO_USERNAME;
```

**Fallback Behavior:** NONE - if missing, DataForSEO validation fails

**Startup Failure Point:** NO - only used in environment validator

**Runtime Failure Point:** YES - if missing, DataForSEO calls fail

**Affected Systems:**
- ARIA keyword research
- LINX backlink analysis
- PULSE ranking monitoring

**Impact:** MEDIUM for AMPLI - AMPLI does not use DataForSEO directly

---

### 11. N8N_WEBHOOK_URL

**Purpose:** n8n webhook URL for integration mesh dispatch

**Required For:** Integration mesh dispatch (optional)

**Validation Logic:**
```typescript
// app/api/integrations/dispatch/cms/route.ts
webhookUrl: process.env.N8N_WEBHOOK_URL || '',
```

**Fallback Behavior:** FALLS BACK TO '' (empty string) - dispatch fails, falls back to direct adapter

**Startup Failure Point:** NO - only used at runtime during dispatch

**Runtime Failure Point:** NO - falls back to direct adapter execution

**Affected Systems:**
- All agent dispatch operations
- Integration mesh orchestration

**Impact:** LOW for AMPLI - AMPLI uses direct adapter execution as fallback

---

### 12. N8N_API_KEY

**Purpose:** n8n API key for integration mesh authentication

**Required For:** Integration mesh dispatch (optional)

**Validation Logic:**
```typescript
// app/api/integrations/dispatch/cms/route.ts
apiKey: process.env.N8N_API_KEY,
```

**Fallback Behavior:** FALLS BACK TO undefined - dispatch fails, falls back to direct adapter

**Startup Failure Point:** NO - only used at runtime during dispatch

**Runtime Failure Point:** NO - falls back to direct adapter execution

**Affected Systems:**
- All agent dispatch operations
- Integration mesh orchestration

**Impact:** LOW for AMPLI - AMPLI uses direct adapter execution as fallback

---

### 13. GOOGLE_OAUTH_CLIENT_ID

**Purpose:** Google OAuth client ID for Google integration

**Required For:** Google OAuth integration

**Validation Logic:**
```typescript
// .env.example
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id_here
```

**Fallback Behavior:** NONE - if missing, Google OAuth fails

**Startup Failure Point:** NO - only used during Google OAuth flow

**Runtime Failure Point:** YES - if missing, Google OAuth fails

**Affected Systems:**
- Google Search Console integration
- Google Business Profile integration

**Impact:** LOW for AMPLI - AMPLI does not use Google integration directly

---

### 14. GOOGLE_OAUTH_CLIENT_SECRET

**Purpose:** Google OAuth client secret for Google integration

**Required For:** Google OAuth integration

**Validation Logic:**
```typescript
// .env.example
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret_here
```

**Fallback Behavior:** NONE - if missing, Google OAuth fails

**Startup Failure Point:** NO - only used during Google OAuth flow

**Runtime Failure Point:** YES - if missing, Google OAuth fails

**Affected Systems:**
- Google Search Console integration
- Google Business Profile integration

**Impact:** LOW for AMPLI - AMPLI does not use Google integration directly

---

### 15. ENABLE_AMPLI_DISPATCH_EXECUTION

**Purpose:** Enable integration mesh dispatch for AMPLI agent

**Required For:** AMPLI dispatch mode (optional)

**Validation Logic:**
```typescript
// lib/integrations/mesh/feature-flags.ts
export const ENABLE_AMPLI_DISPATCH_EXECUTION = process.env.ENABLE_AMPLI_DISPATCH_EXECUTION === 'true';
```

**Fallback Behavior:** DEFAULTS TO false - uses direct adapter execution

**Startup Failure Point:** NO - only used at runtime during AMPLI execution

**Runtime Failure Point:** NO - defaults to direct adapter execution

**Affected Systems:**
- AMPLI WordPress publishing
- AMPLI Custom API publishing
- AMPLI Shopify publishing

**Impact:** NONE - AMPLI uses direct adapter execution as default

---

### 16. ENABLE_ARIA_DISPATCH_EXECUTION

**Purpose:** Enable integration mesh dispatch for ARIA agent

**Required For:** ARIA dispatch mode (optional)

**Validation Logic:**
```typescript
// lib/integrations/mesh/feature-flags.ts
export const ENABLE_ARIA_DISPATCH_EXECUTION = process.env.ENABLE_ARIA_DISPATCH_EXECUTION === 'true';
```

**Fallback Behavior:** DEFAULTS TO false - uses direct adapter execution

**Startup Failure Point:** NO - only used at runtime during ARIA execution

**Runtime Failure Point:** NO - defaults to direct adapter execution

**Affected Systems:**
- ARIA keyword research
- ARIA keyword analysis

**Impact:** NONE for AMPLI - ARIA not operationalized

---

### 17. ENABLE_SCRIBE_DISPATCH_EXECUTION

**Purpose:** Enable integration mesh dispatch for SCRIBE agent

**Required For:** SCRIBE dispatch mode (optional)

**Validation Logic:**
```typescript
// lib/integrations/mesh/feature-flags.ts
export const ENABLE_SCRIBE_DISPATCH_EXECUTION = process.env.ENABLE_SCRIBE_DISPATCH_EXECUTION === 'true';
```

**Fallback Behavior:** DEFAULTS TO false - uses direct adapter execution

**Startup Failure Point:** NO - only used at runtime during SCRIBE execution

**Runtime Failure Point:** NO - defaults to direct adapter execution

**Affected Systems:**
- SCRIBE content generation
- SCRIBE content drafting

**Impact:** NONE for AMPLI - SCRIBE not operationalized

---

## STARTUP FAILURE POINTS

### CRITICAL: Application Will Not Start

**Variables that cause application crash on startup if missing:**

1. `NEXT_PUBLIC_SUPABASE_URL` - Supabase client initialization
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase client initialization
3. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk initialization
4. `CLERK_SECRET_KEY` - Clerk backend operations

**Failure Mode:** Application crash on first client/server component render

**Detection:** Application fails to start, build succeeds but runtime crash

**Recovery:** Set missing environment variables in Vercel

---

## RUNTIME FAILURE POINTS

### CRITICAL: Runtime Operations Fail

**Variables that cause runtime operations to fail if missing:**

1. `NEXT_PUBLIC_APP_URL` - All dispatch calls fail
2. `SUPABASE_SERVICE_ROLE_KEY` - Integration callbacks and dispatch routes fail
3. `INTEGRATION_ENCRYPTION_KEY` - Credential operations use insecure default key

**Failure Mode:** Partial application functionality, specific operations fail

**Detection:** Application starts but specific features fail with errors

**Recovery:** Set missing environment variables in Vercel, redeploy

---

### MEDIUM: Specific Agent Operations Fail

**Variables that cause specific agent operations to fail if missing:**

1. `OPENAI_API_KEY` - SCRIBE, REPUTE, PRISM operations fail
2. `DATAFORSEO_API_KEY` - ARIA, LINX, PULSE operations fail
3. `DATAFORSEO_USERNAME` - DataForSEO authentication fails

**Failure Mode:** Specific agent features fail, application continues

**Detection:** Application starts, specific agent operations fail

**Recovery:** Set missing environment variables for specific agents

---

### LOW: Fallback Behavior Available

**Variables that have safe fallback behavior:**

1. `N8N_WEBHOOK_URL` - Falls back to direct adapter execution
2. `N8N_API_KEY` - Falls back to direct adapter execution
3. `ENABLE_*_DISPATCH_EXECUTION` - Defaults to direct adapter execution

**Failure Mode:** Integration mesh dispatch fails, direct adapter execution used

**Detection:** Application starts, integration mesh fails but direct adapters work

**Recovery:** Optional - direct adapter execution is operational

---

## AMPLI OPERATIONALIZATION SPECIFIC REQUIREMENTS

### REQUIRED FOR AMPLI OPERATIONALIZATION

**Minimum variables required for AMPLI to function:**

1. `NEXT_PUBLIC_APP_URL` - Required for dispatch calls
2. `NEXT_PUBLIC_SUPABASE_URL` - Required for database operations
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for database operations
4. `SUPABASE_SERVICE_ROLE_KEY` - Required for admin operations
5. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Required for authentication
6. `CLERK_SECRET_KEY` - Required for authentication
7. `INTEGRATION_ENCRYPTION_KEY` - Required for credential encryption (SECURITY WARNING if missing)

**NOT Required for AMPLI:**
- `OPENAI_API_KEY` - AMPLI does not use OpenAI
- `DATAFORSEO_API_KEY` - AMPLI does not use DataForSEO
- `DATAFORSEO_USERNAME` - AMPLI does not use DataForSEO
- `N8N_WEBHOOK_URL` - AMPLI uses direct adapter execution
- `N8N_API_KEY` - AMPLI uses direct adapter execution
- `ENABLE_AMPLI_DISPATCH_EXECUTION` - AMPLI uses direct adapter execution

---

## SECURITY AUDIT

### INSECURE DEFAULT VALUES

**Variables with insecure default values:**

1. `INTEGRATION_ENCRYPTION_KEY` - Falls back to 'default-key-change-in-production'
   - **Impact:** Credentials stored with insecure default key
   - **Risk:** HIGH - credentials can be decrypted if default key is known
   - **Action:** MUST be set in production with secure 32-byte hex key

### Missing Variables Detection

**Current validation logic:**
- `getEnvVar()` throws error if required variable is missing
- No runtime validation of variable values
- No validation of encryption key strength
- No validation of API key format

**Recommendation:** Add runtime validation for:
- INTEGRATION_ENCRYPTION_KEY length (must be 32+ bytes)
- API key formats
- URL formats

---

## PRODUCTION DEPLOYMENT CHECKLIST

### Required Variables (MUST be set in Vercel)

- [ ] `NEXT_PUBLIC_APP_URL` - Set to production URL
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Set to Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Set to Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Set to Supabase service role key
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Set to Clerk publishable key
- [ ] `CLERK_SECRET_KEY` - Set to Clerk secret key
- [ ] `INTEGRATION_ENCRYPTION_KEY` - Set to secure 32-byte hex key

### Optional Variables (Recommended for full functionality)

- [ ] `OPENAI_API_KEY` - Required for SCRIBE, REPUTE, PRISM
- [ ] `DATAFORSEO_API_KEY` - Required for ARIA, LINX, PULSE
- [ ] `DATAFORSEO_USERNAME` - Required for DataForSEO authentication
- [ ] `N8N_WEBHOOK_URL` - Optional for integration mesh
- [ ] `N8N_API_KEY` - Optional for integration mesh
- [ ] `GOOGLE_OAUTH_CLIENT_ID` - Required for Google integration
- [ ] `GOOGLE_OAUTH_CLIENT_SECRET` - Required for Google integration

### Feature Flags (Optional)

- [ ] `ENABLE_AMPLI_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_ARIA_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_SCRIBE_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_LOCL_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_LINX_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_REPUTE_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_PRISM_DISPATCH_EXECUTION` - Optional (defaults to false)
- [ ] `ENABLE_PULSE_DISPATCH_EXECUTION` - Optional (defaults to false)

---

## CONCLUSION

**Deployment Safety Status:** SAFE with proper environment configuration

**Critical Variables:** 7 required for AMPLI operationalization
**Optional Variables:** 8 for full functionality
**Feature Flags:** 8 for progressive rollout

**Risk Assessment:**
- HIGH RISK if `INTEGRATION_ENCRYPTION_KEY` not set (insecure default key)
- CRITICAL if any required variable missing (application crash or feature failure)
- LOW risk for optional variables (specific features fail, application continues)

**Recommendation:**
Set all required variables in Vercel before deployment. Validate `INTEGRATION_ENCRYPTION_KEY` is set to secure 32-byte hex key.
