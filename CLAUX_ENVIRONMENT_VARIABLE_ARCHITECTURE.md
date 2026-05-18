# CLAUX ENVIRONMENT VARIABLE ARCHITECTURE

**Version:** 1.0.0
**Date:** May 15, 2026
**Status:** CANONICAL ENVIRONMENT DEFINITION

---

## EXECUTIVE SUMMARY

This document maps all required environment variables for the CLAUX system, including Vercel environment variables, OAuth variables, provider secrets, callback URLs, and n8n variables.

**Purpose:** Ensure complete environment configuration for production deployment.

---

## ENVIRONMENT VARIABLE CATEGORIES

### 1. Vercel Environment Variables
### 2. Supabase Environment Variables
### 3. Clerk Authentication Variables
### 4. Provider API Variables
### 5. OAuth Callback URLs
### 6. n8n Variables (Optional)
### 7. Application Configuration Variables

---

## 1. VERCEL ENVIRONMENT VARIABLES

### Required Variables

**NEXT_PUBLIC_APP_URL**
- Type: String
- Required: YES
- Description: The public URL of the application
- Example: `https://claux.app`
- Environment: Production, Preview, Development

**NEXT_PUBLIC_API_URL**
- Type: String
- Required: YES
- Description: The API URL for the application (same as APP_URL for monolithic)
- Example: `https://claux.app`
- Environment: Production, Preview, Development

**NODE_ENV**
- Type: String
- Required: YES (auto-set by Vercel)
- Description: Node environment
- Values: `production`, `development`, `test`
- Environment: Auto-set

**VERCEL**
- Type: String
- Required: YES (auto-set by Vercel)
- Description: Vercel environment indicator
- Environment: Auto-set

**VERCEL_URL**
- Type: String
- Required: YES (auto-set by Vercel)
- Description: Vercel deployment URL
- Environment: Auto-set

---

## 2. SUPABASE ENVIRONMENT VARIABLES

### Required Variables

**NEXT_PUBLIC_SUPABASE_URL**
- Type: String
- Required: YES
- Description: Supabase project URL
- Example: `https://xyz.supabase.co`
- Environment: Production, Preview, Development

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Type: String
- Required: YES
- Description: Supabase anonymous key (public)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Environment: Production, Preview, Development

**SUPABASE_SERVICE_ROLE_KEY**
- Type: String
- Required: YES
- Description: Supabase service role key (admin access, server-side only)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**SUPABASE_DB_URL**
- Type: String
- Required: YES (for direct database access)
- Description: Supabase database connection string
- Example: `postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

---

## 3. CLERK AUTHENTICATION VARIABLES

### Required Variables

**NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY**
- Type: String
- Required: YES
- Description: Clerk publishable key (public)
- Example: `pk_test_...`
- Environment: Production, Preview, Development

**CLERK_SECRET_KEY**
- Type: String
- Required: YES
- Description: Clerk secret key (server-side only)
- Example: `sk_test_...`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**NEXT_PUBLIC_CLERK_SIGN_IN_URL**
- Type: String
- Required: YES
- Description: Clerk sign-in URL
- Example: `/sign-in`
- Environment: Production, Preview, Development

**NEXT_PUBLIC_CLERK_SIGN_UP_URL**
- Type: String
- Required: YES
- Description: Clerk sign-up URL
- Example: `/sign-up`
- Environment: Production, Preview, Development

**NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL**
- Type: String
- Required: YES
- Description: Redirect URL after sign-in
- Example: `/dashboard`
- Environment: Production, Preview, Development

**NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL**
- Type: String
- Required: YES
- Description: Redirect URL after sign-up
- Example: `/dashboard`
- Environment: Production, Preview, Development

---

## 4. PROVIDER API VARIABLES

### DataForSEO Variables

**DATAFORSEO_API_LOGIN**
- Type: String
- Required: YES
- Description: DataForSEO API login
- Example: `your_login`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**DATAFORSEO_API_PASSWORD**
- Type: String
- Required: YES
- Description: DataForSEO API password
- Example: `your_password`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**DATAFORSEO_API_BASE_URL**
- Type: String
- Required: YES
- Description: DataForSEO API base URL
- Example: `https://api.dataforseo.com`
- Environment: Production, Preview, Development

### OpenAI Variables

**OPENAI_API_KEY**
- Type: String
- Required: YES
- Description: OpenAI API key
- Example: `sk-...`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**OPENAI_ORGANIZATION_ID**
- Type: String
- Required: NO (optional)
- Description: OpenAI organization ID
- Example: `org-...`
- Environment: Production, Preview, Development

**OPENAI_MODEL**
- Type: String
- Required: NO (default: gpt-4)
- Description: Default OpenAI model
- Example: `gpt-4`
- Environment: Production, Preview, Development

### Google Business Profile Variables

**GOOGLE_CLIENT_ID**
- Type: String
- Required: YES
- Description: Google OAuth client ID
- Example: `123456789-...apps.googleusercontent.com`
- Environment: Production, Preview, Development

**GOOGLE_CLIENT_SECRET**
- Type: String
- Required: YES
- Description: Google OAuth client secret
- Example: `GOCSPX-...`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**GOOGLE_PROJECT_ID**
- Type: String
- Required: YES
- Description: Google Cloud project ID
- Example: `your-project-id`
- Environment: Production, Preview, Development

**GOOGLE_REDIRECT_URI**
- Type: String
- Required: YES
- Description: Google OAuth redirect URI
- Example: `https://claux.app/api/integrations/google/callback`
- Environment: Production, Preview, Development

### WordPress Variables (Per-Tenant, Not Global)

**Note:** WordPress credentials are stored per-tenant in the database, not as global environment variables.

**WORDPRESS_API_BASE_URL** (Optional Global Default)
- Type: String
- Required: NO
- Description: Default WordPress API base URL
- Example: `https://your-site.com`
- Environment: Production, Preview, Development

### Shopify Variables (Per-Tenant, Not Global)

**Note:** Shopify credentials are stored per-tenant in the database, not as global environment variables.

**SHOPIFY_API_BASE_URL** (Optional Global Default)
- Type: String
- Required: NO
- Description: Default Shopify API base URL
- Example: `https://your-store.myshopify.com`
- Environment: Production, Preview, Development

### Webflow Variables (Per-Tenant, Not Global)

**Note:** Webflow credentials are stored per-tenant in the database, not as global environment variables.

**WEBFLOW_API_BASE_URL** (Optional Global Default)
- Type: String
- Required: NO
- Description: Default Webflow API base URL
- Example: `https://api.webflow.com`
- Environment: Production, Preview, Development

### Ghost Variables (Per-Tenant, Not Global)

**Note:** Ghost credentials are stored per-tenant in the database, not as global environment variables.

**GHOST_API_BASE_URL** (Optional Global Default)
- Type: String
- Required: NO
- Description: Default Ghost API base URL
- Example: `https://your-site.ghost.io`
- Environment: Production, Preview, Development

### Custom API Variables (Per-Tenant, Not Global)

**Note:** Custom API credentials are stored per-tenant in the database, not as global environment variables.

### Google Analytics Variables (Optional)

**GOOGLE_ANALYTICS_CLIENT_ID**
- Type: String
- Required: NO (optional for PRISM)
- Description: Google Analytics OAuth client ID
- Example: `123456789-...apps.googleusercontent.com`
- Environment: Production, Preview, Development

**GOOGLE_ANALYTICS_CLIENT_SECRET**
- Type: String
- Required: NO (optional for PRISM)
- Description: Google Analytics OAuth client secret
- Example: `GOCSPX-...`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**GOOGLE_ANALYTICS_PROPERTY_ID**
- Type: String
- Required: NO (optional for PRISM)
- Description: Google Analytics property ID
- Example: `GA-123456789`
- Environment: Production, Preview, Development

---

## 5. OAUTH CALLBACK URLs

### Google OAuth Callbacks

**Google Business Profile Callback**
- URL: `/api/integrations/google/callback`
- Purpose: Handle Google OAuth callback for GBP
- Environment: Production, Preview, Development

**Google Analytics Callback**
- URL: `/api/integrations/google/analytics/callback`
- Purpose: Handle Google OAuth callback for Analytics
- Environment: Production, Preview, Development

### Callback URL Configuration

**Google Cloud Console Configuration:**
1. Navigate to Google Cloud Console
2. Select OAuth consent screen
3. Add authorized redirect URIs:
   - Production: `https://claux.app/api/integrations/google/callback`
   - Preview: `https://claux-preview.vercel.app/api/integrations/google/callback`
   - Development: `http://localhost:3000/api/integrations/google/callback`

---

## 6. N8N VARIABLES (OPTIONAL)

### Required Variables (If Using n8n)

**N8N_API_URL**
- Type: String
- Required: NO (optional)
- Description: n8n instance URL
- Example: `https://n8n.your-domain.com`
- Environment: Production, Preview, Development

**N8N_API_KEY**
- Type: String
- Required: NO (optional)
- Description: n8n API key
- Example: `your-n8n-api-key`
- Environment: Production, Preview, Development
- Security: ⚠️ NEVER expose to client-side

**N8N_WEBHOOK_URL**
- Type: String
- Required: NO (optional)
- Description: n8n webhook base URL
- Example: `https://n8n.your-domain.com/webhook`
- Environment: Production, Preview, Development

**ENABLE_N8N_DISPATCH**
- Type: Boolean
- Required: NO (optional)
- Description: Enable n8n dispatch for provider calls
- Values: `true`, `false`
- Default: `false`
- Environment: Production, Preview, Development

---

## 7. APPLICATION CONFIGURATION VARIABLES

### Feature Flags

**ENABLE_RUNTIME_EXECUTION**
- Type: Boolean
- Required: NO (default: true)
- Description: Enable runtime execution system
- Values: `true`, `false`
- Default: `true`
- Environment: Production, Preview, Development

**ENABLE_INTELLIGENCE**
- Type: Boolean
- Required: NO (default: true)
- Description: Enable intelligence system
- Values: `true`, `false`
- Default: `true`
- Environment: Production, Preview, Development

**ENABLE_TELEMETRY**
- Type: Boolean
- Required: NO (default: true)
- Description: Enable telemetry collection
- Values: `true`, `false`
- Default: `true`
- Environment: Production, Preview, Development

**ENABLE_THINKING_LOGS**
- Type: Boolean
- Required: NO (default: true)
- Description: Enable agent thinking logs
- Values: `true`, `false`
- Default: `true`
- Environment: Production, Preview, Development

### Runtime Configuration

**RUNTIME_STALL_DETECTION_TIMEOUT_MS**
- Type: Number
- Required: NO (default: 3600000)
- Description: Stall detection timeout in milliseconds
- Default: `3600000` (1 hour)
- Environment: Production, Preview, Development

**RUNTIME_MAX_RETRIES**
- Type: Number
- Required: NO (default: 3)
- Description: Maximum retry attempts for failed tasks
- Default: `3`
- Environment: Production, Preview, Development

**RUNTIME_RETRY_BACKOFF_MS**
- Type: Number
- Required: NO (default: 2000)
- Description: Retry backoff in milliseconds
- Default: `2000` (2 seconds)
- Environment: Production, Preview, Development

### Database Configuration

**DATABASE_POOL_SIZE**
- Type: Number
- Required: NO (default: 10)
- Description: Database connection pool size
- Default: `10`
- Environment: Production, Preview, Development

**DATABASE_TIMEOUT_MS**
- Type: Number
- Required: NO (default: 30000)
- Description: Database query timeout in milliseconds
- Default: `30000` (30 seconds)
- Environment: Production, Preview, Development

---

## ENVIRONMENT-SPECIFIC CONFIGURATIONS

### Production Environment

**Required Variables:**
- All required variables from above
- Production-specific URLs
- Production API keys

**Security Requirements:**
- All secret keys must be set
- No development overrides
- Strict RLS policies enabled

### Preview Environment

**Required Variables:**
- All required variables from above
- Preview-specific URLs
- Preview API keys (can use production keys for testing)

**Security Requirements:**
- All secret keys must be set
- Development overrides allowed
- RLS policies enabled

### Development Environment

**Required Variables:**
- All required variables from above
- Localhost URLs
- Development API keys

**Security Requirements:**
- Secret keys can be set via `.env.local`
- Development overrides allowed
- RLS policies can be relaxed for testing

---

## .ENV EXAMPLE FILE

```env
# Vercel Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres:[password]@db.xyz.supabase.co:5432/postgres

# Clerk Authentication Variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# DataForSEO Variables
DATAFORSEO_API_LOGIN=your_login
DATAFORSEO_API_PASSWORD=your_password
DATAFORSEO_API_BASE_URL=https://api.dataforseo.com

# OpenAI Variables
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Google Business Profile Variables
GOOGLE_CLIENT_ID=123456789-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

# n8n Variables (Optional)
N8N_API_URL=https://n8n.your-domain.com
N8N_API_KEY=your-n8n-api-key
ENABLE_N8N_DISPATCH=false

# Feature Flags
ENABLE_RUNTIME_EXECUTION=true
ENABLE_INTELLIGENCE=true
ENABLE_TELEMETRY=true
ENABLE_THINKING_LOGS=true

# Runtime Configuration
RUNTIME_STALL_DETECTION_TIMEOUT_MS=3600000
RUNTIME_MAX_RETRIES=3
RUNTIME_RETRY_BACKOFF_MS=2000
```

---

## VERCEL ENVIRONMENT VARIABLE SETUP

### Production Environment

1. Navigate to Vercel project settings
2. Go to "Environment Variables"
3. Add all required variables
4. Set environments to "Production"
5. Redeploy to apply changes

### Preview Environment

1. Navigate to Vercel project settings
2. Go to "Environment Variables"
3. Add all required variables
4. Set environments to "Preview, Development"
5. Preview deployments will use these variables

### Development Environment

1. Create `.env.local` file in project root
2. Add all required variables
3. Run `npm run dev` to load variables

---

## SECURITY BEST PRACTICES

### Secret Key Management

**DO:**
- Store secret keys in Vercel environment variables
- Rotate secret keys regularly
- Use different keys for production and development
- Monitor for leaked credentials

**DO NOT:**
- Commit secret keys to git
- Expose secret keys in client-side code
- Share secret keys in public repositories
- Use production keys in development

### Environment Variable Validation

**Validation Strategy:**
- Validate required environment variables at startup
- Fail fast if required variables are missing
- Log validation errors for debugging
- Provide clear error messages for missing variables

### Tenant-Specific Credentials

**Strategy:**
- Store tenant-specific credentials in database (integrations table)
- Encrypt credentials at rest
- Use tenant-scoped RLS policies
- Never store tenant credentials in environment variables

---

## ENVIRONMENT VARIABLE VALIDATION

### Startup Validation

**Validation Checklist:**
- [ ] NEXT_PUBLIC_APP_URL is set
- [ ] NEXT_PUBLIC_SUPABASE_URL is set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is set
- [ ] SUPABASE_SERVICE_ROLE_KEY is set
- [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set
- [ ] CLERK_SECRET_KEY is set
- [ ] DATAFORSEO_API_LOGIN is set
- [ ] DATAFORSEO_API_PASSWORD is set
- [ ] OPENAI_API_KEY is set
- [ ] GOOGLE_CLIENT_ID is set
- [ ] GOOGLE_CLIENT_SECRET is set
- [ ] GOOGLE_PROJECT_ID is set

**Validation Implementation:**
- Add validation script in `lib/env/validation.ts`
- Run validation at application startup
- Fail application if critical variables are missing
- Log warnings for optional variables

---

## MONITORING AND ALERTING

### Environment Variable Health Checks

**Health Check Metrics:**
- Environment variable validation status
- Secret key expiry (if applicable)
- OAuth token validity
- API key quota utilization

**Alerting Strategy:**
- Alert on missing required variables
- Alert on expired credentials
- Alert on rate limit breaches
- Alert on OAuth token expiry

---

## CONCLUSION

This document defines the complete environment variable architecture for the CLAUX system. All required variables have been mapped with their types, requirements, and security considerations.

**Status:** ENVIRONMENT ARCHITECTURE DEFINED
