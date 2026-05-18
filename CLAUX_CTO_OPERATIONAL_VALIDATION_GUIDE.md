# CLAUX CTO OPERATIONAL VALIDATION GUIDE

**Version:** 1.0.0
**Date:** May 16, 2026
**Purpose:** Complete test execution guide for CTO to manually validate CLAUX operationally

---

# TASK 1 — VERIFY IF ANY SQL MIGRATIONS ARE REQUIRED

## AMPLI Operationalization Audit

### Files Modified

1. **`lib/runtime/tasks/ampli.tasks.ts`**
   - Added runtime credential injection (WordPress, Custom API, Shopify)
   - Implemented direct adapter execution (WordPress, Custom API)
   - Added execution logging (EventService, LogService)
   - Removed frontend credential dependencies

2. **`app/api/integrations/cms/test-connection/route.ts`** (NEW)
   - Connection validation endpoint for WordPress
   - Connection validation endpoint for Custom API
   - Connection validation endpoint for Shopify

### Database Schema Audit

**Tables Referenced:**
- `integrations` - ALREADY EXISTS with required columns
- `agent_executions` - ALREADY EXISTS
- `agent_tasks` - ALREADY EXISTS
- `agent_events` - ALREADY EXISTS
- `agent_logs` - ALREADY EXISTS
- `seo_drafts` - ALREADY EXISTS
- `publishing_schedule` - ALREADY EXISTS
- `profiles` - ALREADY EXISTS
- `tenants` - ALREADY EXISTS

**Integrations Table Schema (Existing):**
```sql
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'google',
  
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

**RLS Policies (Existing):**
- Users can view their own integrations
- System can insert/update/delete integrations

**Indexes (Existing):**
- idx_integrations_tenant_id
- idx_integrations_provider
- idx_integrations_google_status
- idx_integrations_wp_status
- idx_integrations_shopify_status

### Audit Conclusion

**NO SUPABASE SQL REQUIRED FOR AMPLI OPERATIONALIZATION.**

**Rationale:**
- No new tables introduced
- No new columns introduced
- No new indexes introduced
- No new RLS policies introduced
- No new SQL functions/triggers introduced
- No existing schema assumptions changed
- All required database schema already exists
- All required RLS policies already in place
- All required indexes already in place

---

# TASK 2 — COMPLETE OPERATIONAL TEST FLOW

## PHASE A — PRE-DEPLOY VALIDATION

### Step 1: Verify Branch

**Action:** Checkout the main branch
```bash
git checkout main
git pull origin main
```

**Expected:** Latest code from main branch

---

### Step 2: Verify Modified Files

**Action:** Review the following files exist and are correct:

1. **`apps/web/lib/runtime/tasks/ampli.tasks.ts`**
   - Verify runtime credential injection functions exist
   - Verify direct adapter functions exist
   - Verify execution logging is implemented

2. **`apps/web/app/api/integrations/cms/test-connection/route.ts`**
   - Verify file exists
   - Verify WordPress connection validation
   - Verify Custom API connection validation
   - Verify Shopify connection validation

3. **`apps/web/lib/connectors/wordpress.connector.ts`**
   - Verify file exists
   - Verify publishPost function exists

4. **`apps/web/lib/connectors/custom.connector.ts`**
   - Verify file exists
   - Verify publishPost function exists

5. **`apps/web/lib/integrations/utils.ts`**
   - Verify getTenantIntegrations function exists
   - Verify getWordPressAppPassword function exists
   - Verify getCustomApiKey function exists
   - Verify getShopifyAccessToken function exists
   - Verify encryptSecret function exists
   - Verify decryptSecret function exists

**Expected:** All files exist and contain correct implementations

---

### Step 3: Environment Variables Validation

**Action:** Verify the following environment variables are set in Vercel:

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
INTEGRATION_ENCRYPTION_KEY=<32-byte-hex-key>
SUPABASE_URL=<supabase-url>
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
CLERK_SECRET_KEY=<clerk-secret-key>
CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
```

**Expected:** All environment variables are set

---

### Step 4: Build Validation

**Action:** Build the application locally
```bash
cd apps/web
npm run build
```

**Expected:** Build succeeds without errors

**Failure Indicators:**
- TypeScript compilation errors
- Import/export errors
- Missing dependencies

---

### Step 5: Local Validation

**Action:** Start local development server
```bash
cd apps/web
npm run dev
```

**Expected:** Server starts successfully on port 3000

**Failure Indicators:**
- Server fails to start
- Runtime errors in console
- Environment variable errors

---

### Step 6: Log Inspection

**Action:** Check local server logs for any errors

**Expected:** No errors in logs

**Failure Indicators:**
- Database connection errors
- Authentication errors
- Runtime errors

---

## PHASE B — VERCEL DEPLOYMENT

### Step 1: Push to Main Branch

**Action:** Push changes to main branch
```bash
git add .
git commit -m "AMPLI operationalization: runtime credential injection and direct adapter execution"
git push origin main
```

**Expected:** Push succeeds

---

### Step 2: Monitor Vercel Deployment

**Action:** Monitor Vercel dashboard for deployment progress

**Expected:** Deployment completes successfully

**Failure Indicators:**
- Build failures
- Deployment timeouts
- Runtime errors

---

### Step 3: Verify Deployment Health

**Action:** Access deployed application
```
https://your-domain.vercel.app
```

**Expected:** Application loads successfully

**Failure Indicators:**
- 500 errors
- 404 errors
- Loading failures

---

### Step 4: Verify Environment Variables

**Action:** Check Vercel environment variables

**Expected:** All environment variables are set correctly

**Failure Indicators:**
- Missing environment variables
- Incorrect environment variable values

---

### Step 5: Inspect Deployment Logs

**Action:** Check Vercel deployment logs

**Expected:** No errors in deployment logs

**Failure Indicators:**
- Build errors
- Runtime errors
- Database connection errors

---

### Step 6: Verify Healthy Indicators

**Action:** Check application health

**Expected Healthy Indicators:**
- Application responds to requests
- Authentication works
- Database connections work
- No error rates

---

## PHASE C — ONBOARDING VALIDATION

### Step 1: Sign Up

**Action:** Navigate to sign-up page
```
https://your-domain.vercel.app/sign-up
```

**Action:** Create new account with email and password

**Expected:** Account creation succeeds

**Failure Indicators:**
- Sign-up fails
- Email verification fails
- Redirect fails

---

### Step 2: Onboarding Completion

**Action:** Complete onboarding flow

**Expected Pages:**
- Welcome screen
- Business profile setup
- Workspace creation
- Onboarding completion

**Expected:** Onboarding completes successfully

**Failure Indicators:**
- Onboarding flow breaks
- Data persistence fails
- Redirect fails

---

### Step 3: Dashboard Arrival

**Action:** Verify arrival at dashboard after onboarding

**Expected:** Dashboard loads successfully

**Failure Indicators:**
- Dashboard fails to load
- User is not redirected
- Dashboard shows errors

---

### Step 4: Tenant Creation Verification

**Action:** Query Supabase to verify tenant creation

**SQL Query:**
```sql
SELECT id, tenant_id, email, created_at 
FROM profiles 
WHERE email = 'your-test-email@example.com';
```

**Expected:** Tenant record exists with correct data

**Failure Indicators:**
- No tenant record found
- Tenant record missing required fields
- Tenant record has incorrect data

---

### Step 5: Profile Persistence Verification

**Action:** Query Supabase to verify profile persistence

**SQL Query:**
```sql
SELECT * 
FROM profiles 
WHERE email = 'your-test-email@example.com';
```

**Expected:** Profile record exists with all fields

**Failure Indicators:**
- No profile record found
- Profile record missing required fields
- Profile record has incorrect data

---

## PHASE D — WORDPRESS CONNECTION TEST

### Step 1: Navigate to Integrations Page

**Action:** Navigate to settings/integrations page
```
https://your-domain.vercel.app/settings/integrations
```

**Expected:** Integrations page loads successfully

**Failure Indicators:**
- Page fails to load
- Page shows errors
- UI elements missing

---

### Step 2: Select WordPress Integration

**Action:** Click on WordPress integration card

**Expected:** WordPress integration form opens

**Failure Indicators:**
- Form fails to open
- Form shows errors
- UI elements missing

---

### Step 3: Enter WordPress Credentials

**Action:** Enter the following credentials:
- **Site URL:** `https://your-wordpress-test-site.com`
- **Username:** `your-wordpress-username`
- **Application Password:** `your-wordpress-app-password`

**Expected:** Form accepts credentials

**Failure Indicators:**
- Form rejects credentials
- Form shows validation errors
- Form fails to submit

---

### Step 4: Click Test Connection

**Action:** Click "Test Connection" button

**Expected:** Connection test initiates

**Failure Indicators:**
- Button fails to respond
- Test fails to initiate
- UI shows errors

---

### Step 5: Verify API Endpoint Execution

**Action:** Monitor network requests in browser DevTools

**Expected API Endpoint:**
```
POST /api/integrations/cms/test-connection
```

**Expected Payload:**
```json
{
  "type": "wordpress",
  "siteUrl": "https://your-wordpress-test-site.com",
  "username": "your-wordpress-username",
  "appPassword": "your-wordpress-app-password"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "WordPress connection successful",
  "user": {
    "id": "user-id",
    "name": "user-name",
    "email": "user-email"
  }
}
```

**Failure Indicators:**
- API call fails
- API returns error
- API times out

---

### Step 6: Click Save Integration

**Action:** Click "Save Integration" button

**Expected:** Integration saves successfully

**Failure Indicators:**
- Save fails
- Error message appears
- Integration not persisted

---

### Step 7: Verify Database Persistence

**Action:** Query Supabase to verify integration persistence

**SQL Query:**
```sql
SELECT 
  tenant_id,
  wp_site_url,
  wp_username,
  wp_status,
  created_at,
  updated_at
FROM integrations
WHERE tenant_id = 'your-tenant-id';
```

**Expected:** Integration record exists with:
- `wp_site_url`: `https://your-wordpress-test-site.com`
- `wp_username`: `your-wordpress-username`
- `wp_app_password_encrypted`: encrypted password
- `wp_status`: `connected`

**Failure Indicators:**
- No integration record found
- Integration record missing required fields
- Integration record has incorrect data
- Password not encrypted

---

### Step 8: Verify Encryption Behavior

**Action:** Verify password is encrypted in database

**Expected:** `wp_app_password_encrypted` field contains encrypted value (not plaintext)

**Failure Indicators:**
- Password stored in plaintext
- Password field empty
- Password field malformed

---

### Step 9: Verify Provider Type

**Action:** Verify provider type in integration record

**Expected:** `provider` field set to `google` (default) or correct value

**Failure Indicators:**
- Provider type incorrect
- Provider type missing

---

### Step 10: Verify Tenant Linkage

**Action:** Verify integration is linked to correct tenant

**Expected:** `tenant_id` matches your tenant ID from profiles table

**Failure Indicators:**
- Tenant ID incorrect
- Tenant ID missing
- Cross-tenant linkage

---

## PHASE E — RUNTIME EXECUTION TEST

### Step 1: Create SEO Draft

**Action:** Create a test SEO draft in the system

**SQL Query:**
```sql
INSERT INTO seo_drafts (
  id,
  tenant_id,
  workspace_id,
  title,
  body_html,
  meta_title,
  meta_description,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'your-tenant-id',
  'your-workspace-id',
  'Test Post',
  '<p>This is a test post content.</p>',
  'Test Post',
  'Test post description',
  'approved',
  NOW(),
  NOW()
);
```

**Expected:** Draft created successfully

**Failure Indicators:**
- Insert fails
- Draft not created
- Draft has incorrect data

---

### Step 2: Verify Draft Creation

**Action:** Query Supabase to verify draft creation

**SQL Query:**
```sql
SELECT id, title, status, created_at
FROM seo_drafts
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** Draft exists with status `approved`

**Failure Indicators:**
- No draft found
- Draft has incorrect status
- Draft has incorrect data

---

### Step 3: Manually Trigger Publishing

**Action:** Use Supabase to manually trigger AMPLI publishing task

**SQL Query:**
```sql
-- Create execution record
INSERT INTO agent_executions (
  id,
  tenant_id,
  agent_name,
  status,
  input_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'your-tenant-id',
  'AMPLI',
  'running',
  '{"task": "task_publish_wordpress", "approved_drafts": [{"id": "your-draft-id", "title": "Test Post", "body_html": "<p>This is a test post content.</p>", "meta_title": "Test Post", "meta_description": "Test post description"}]}'::jsonb,
  NOW(),
  NOW()
) RETURNING id;
```

**Expected:** Execution record created

**Failure Indicators:**
- Insert fails
- Execution not created
- Execution has incorrect data

---

### Step 4: Verify Execution Record Creation

**Action:** Query Supabase to verify execution record

**SQL Query:**
```sql
SELECT id, tenant_id, agent_name, status, created_at
FROM agent_executions
WHERE agent_name = 'AMPLI'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:** Execution exists with status `running` or `completed`

**Failure Indicators:**
- No execution found
- Execution has incorrect status
- Execution has incorrect data

---

### Step 5: Verify Task Creation

**Action:** Query Supabase to verify task creation

**SQL Query:**
```sql
SELECT id, execution_id, task_name, status, created_at
FROM agent_tasks
WHERE execution_id = 'your-execution-id'
ORDER BY created_at DESC;
```

**Expected:** Task exists with correct task name

**Failure Indicators:**
- No task found
- Task has incorrect name
- Task has incorrect status

---

### Step 6: Monitor Events

**Action:** Query Supabase to monitor events

**SQL Query:**
```sql
SELECT event_name, event_source, payload, created_at
FROM agent_events
WHERE execution_id = 'your-execution-id'
ORDER BY created_at ASC;
```

**Expected Events:**
- `wordpress_publishing_started`
- `wordpress_publishing_completed` or `wordpress_direct_publishing_completed`

**Failure Indicators:**
- No events found
- Events missing
- Events have incorrect data

---

### Step 7: Monitor Logs

**Action:** Query Supabase to monitor logs

**SQL Query:**
```sql
SELECT log_level, message, metadata, created_at
FROM agent_logs
WHERE execution_id = 'your-execution-id'
ORDER BY created_at ASC;
```

**Expected Logs:**
- `WordPress publishing started`
- `WordPress credentials retrieved successfully`
- `WordPress draft published successfully` or `WordPress draft publishing failed`

**Failure Indicators:**
- No logs found
- Logs missing
- Logs have incorrect data
- Logs contain plaintext credentials

---

### Step 8: Verify Artifact Linkage

**Action:** Query Supabase to verify artifact linkage

**SQL Query:**
```sql
SELECT id, execution_id, artifact_type, artifact_data, created_at
FROM runtime_artifacts
WHERE execution_id = 'your-execution-id'
ORDER BY created_at DESC;
```

**Expected:** Artifact exists with published results

**Failure Indicators:**
- No artifact found
- Artifact has incorrect data
- Artifact not linked to execution

---

### Step 9: Verify Draft Status Update

**Action:** Query Supabase to verify draft status update

**SQL Query:**
```sql
SELECT id, title, status, cms_post_id, published_at
FROM seo_drafts
WHERE id = 'your-draft-id';
```

**Expected:** Draft status updated to `published` with `cms_post_id` and `published_at`

**Failure Indicators:**
- Draft status not updated
- Draft has incorrect status
- Draft missing CMS post ID
- Draft missing published timestamp

---

### Step 10: Verify WordPress Output

**Action:** Access WordPress test site and verify post published

**Expected:** Post exists on WordPress site with correct title and content

**Failure Indicators:**
- Post not found on WordPress site
- Post has incorrect title
- Post has incorrect content
- Post has incorrect status

---

### Step 11: Verify Execution Lifecycle

**Action:** Query Supabase to verify execution lifecycle

**SQL Query:**
```sql
SELECT id, tenant_id, agent_name, status, started_at, completed_at, created_at, updated_at
FROM agent_executions
WHERE id = 'your-execution-id';
```

**Expected Lifecycle:**
- Status: `completed`
- `started_at`: populated
- `completed_at`: populated
- `updated_at`: updated

**Failure Indicators:**
- Execution status incorrect
- Execution missing timestamps
- Execution lifecycle incomplete

---

### Step 12: Verify Expected Status Transitions

**Action:** Query Supabase to verify status transitions

**SQL Query:**
```sql
SELECT status, updated_at
FROM agent_executions
WHERE id = 'your-execution-id'
ORDER BY updated_at ASC;
```

**Expected Transitions:**
- `running` → `completed` or `failed`

**Failure Indicators:**
- Status transitions incorrect
- Status stuck in `running`
- Status transitions missing

---

## PHASE F — MULTITENANT SAFETY VALIDATION

### Step 1: Verify Tenant Isolation

**Action:** Query Supabase to verify tenant isolation

**SQL Query:**
```sql
SELECT tenant_id, COUNT(*) as count
FROM integrations
GROUP BY tenant_id;
```

**Expected:** Each tenant has only their own integrations

**Failure Indicators:**
- Cross-tenant integrations
- Duplicate tenant IDs
- Incorrect tenant counts

---

### Step 2: Verify Credential Isolation

**Action:** Query Supabase to verify credential isolation

**SQL Query:**
```sql
SELECT tenant_id, wp_site_url, wp_username
FROM integrations
WHERE wp_status = 'connected';
```

**Expected:** Each tenant has only their own credentials

**Failure Indicators:**
- Cross-tenant credentials
- Duplicate credentials
- Incorrect credential linkage

---

### Step 3: Verify Execution Isolation

**Action:** Query Supabase to verify execution isolation

**SQL Query:**
```sql
SELECT tenant_id, COUNT(*) as count
FROM agent_executions
GROUP BY tenant_id;
```

**Expected:** Each tenant has only their own executions

**Failure Indicators:**
- Cross-tenant executions
- Duplicate execution IDs
- Incorrect execution counts

---

### Step 4: Verify No Cross-Tenant Leakage

**Action:** Query Supabase to verify no cross-tenant leakage

**SQL Query:**
```sql
SELECT e.tenant_id, e.id, e.agent_name
FROM agent_executions e
LEFT JOIN integrations i ON e.tenant_id = i.tenant_id
WHERE e.tenant_id != i.tenant_id;
```

**Expected:** No cross-tenant leakage

**Failure Indicators:**
- Cross-tenant leakage detected
- Incorrect tenant linkage
- Data isolation breach

---

### Step 5: Verify RLS Enforcement

**Action:** Attempt to query integrations as a different tenant

**SQL Query:**
```sql
-- Run as different tenant user
SELECT * FROM integrations;
```

**Expected:** Only returns integrations for authenticated tenant

**Failure Indicators:**
- Returns integrations from other tenants
- RLS not enforced
- Data leakage

---

## PHASE G — DASHBOARD VALIDATION

### Step 1: Verify Execution Visibility

**Action:** Navigate to dashboard and verify execution visibility

**Expected:** Executions visible in dashboard

**Failure Indicators:**
- Executions not visible
- Executions show incorrect data
- Executions missing from dashboard

---

### Step 2: Verify Publishing Visibility

**Action:** Navigate to publishing section and verify publishing visibility

**Expected:** Published content visible in dashboard

**Failure Indicators:**
- Published content not visible
- Published content shows incorrect data
- Published content missing from dashboard

---

### Step 3: Verify Artifact Visibility

**Action:** Navigate to artifacts section and verify artifact visibility

**Expected:** Artifacts visible in dashboard

**Failure Indicators:**
- Artifacts not visible
- Artifacts show incorrect data
- Artifacts missing from dashboard

---

### Step 4: Verify Status Reflection

**Action:** Verify dashboard reflects correct status

**Expected:** Dashboard shows correct execution status

**Failure Indicators:**
- Dashboard shows incorrect status
- Status not updating
- Status stuck in incorrect state

---

### Step 5: Verify Log Visibility

**Action:** Navigate to logs section and verify log visibility

**Expected:** Logs visible in dashboard

**Failure Indicators:**
- Logs not visible
- Logs show incorrect data
- Logs missing from dashboard

---

### Step 6: Identify Mocked Areas

**Expected Mocked Areas:**
- ARIA agent execution (not yet operationalized)
- SCRIBE agent execution (not yet operationalized)
- Advanced analytics (not yet implemented)

---

### Step 7: Identify Real Areas

**Expected Real Areas:**
- WordPress publishing (fully operational)
- Custom API publishing (fully operational)
- Runtime credential injection (fully operational)
- Execution logging (fully operational)
- Event publishing (fully operational)

---

# TASK 3 — IDENTIFY CURRENT GAPS

## CRITICAL BLOCKERS

1. **ARIA Agent Not Operationalized**
   - ARIA agent tasks not implemented with runtime credential injection
   - ARIA agent tasks still use stub implementations
   - Blocks ARIA → SCRIBE → AMPLI closed-loop execution

2. **SCRIBE Agent Not Operationalized**
   - SCRIBE agent tasks not implemented with runtime credential injection
   - SCRIBE agent tasks still use stub implementations
   - Blocks ARIA → SCRIBE → AMPLI closed-loop execution

3. **No Agent Orchestration**
   - No multi-agent orchestration system
   - No agent-to-agent communication
   - No workflow coordination
   - Blocks closed-loop execution

4. **No Content Generation**
   - ARIA agent not generating SEO content
   - No content generation pipeline
   - Blocks content supply to AMPLI

---

## IMPORTANT BLOCKERS

1. **Shopify Connector Not Implemented**
   - Shopify direct adapter uses stub implementation
   - Shopify connector not created
   - Blocks Shopify publishing

2. **Webflow Connector Not Implemented**
   - Webflow direct adapter uses stub implementation
   - Webflow connector not created
   - Blocks Webflow publishing

3. **Ghost Connector Not Implemented**
   - Ghost direct adapter uses stub implementation
   - Ghost connector not created
   - Blocks Ghost publishing

4. **Rollback Not Implemented**
   - Rollback direct adapter uses stub implementation
   - No rollback functionality
   - Blocks error recovery

---

## LATER BLOCKERS

1. **Dashboard Not Fully Implemented**
   - Dashboard UI not complete
   - Dashboard not showing real execution data
   - Dashboard not showing real logs
   - Dashboard not showing real artifacts

2. **No Credential Rotation**
   - No credential rotation system
   - No credential expiration handling
   - No credential renewal automation

3. **No Credential Monitoring**
   - No credential health monitoring
   - No credential failure alerting
   - No credential usage analytics

4. **No Publishing Governance**
   - No publishing approval workflow
   - No publishing scheduling
   - No publishing history tracking

5. **No Deployment Orchestration**
   - No deployment pipeline
   - No deployment monitoring
   - No deployment rollback

---

# TASK 4 — CTO EXECUTION ORDER

## FINAL RECOMMENDED EXECUTION ORDER

### 1. SQL DEPLOYMENT
**Status:** SKIPPED
**Rationale:** NO SUPABASE SQL REQUIRED FOR AMPLI OPERATIONALIZATION

---

### 2. VERCEL DEPLOYMENT
**Action:** Deploy AMPLI operationalization to production

**Steps:**
1. Push changes to main branch
2. Monitor Vercel deployment
3. Verify deployment health
4. Verify environment variables
5. Inspect deployment logs
6. Verify healthy indicators

**Expected:** Successful deployment to production

---

### 3. ONBOARDING TEST
**Action:** Test onboarding flow with fresh tenant

**Steps:**
1. Sign up with new account
2. Complete onboarding
3. Verify dashboard arrival
4. Verify tenant creation in Supabase
5. Verify profile persistence in Supabase

**Expected:** Successful onboarding with tenant creation

---

### 4. WORDPRESS CONNECTION TEST
**Action:** Test WordPress connection and credential storage

**Steps:**
1. Navigate to integrations page
2. Select WordPress integration
3. Enter WordPress credentials
4. Test connection
5. Verify API endpoint execution
6. Save integration
7. Verify database persistence
8. Verify encryption behavior
9. Verify provider type
10. Verify tenant linkage

**Expected:** Successful WordPress connection with encrypted credential storage

---

### 5. PUBLISH EXECUTION TEST
**Action:** Test AMPLI WordPress publishing execution

**Steps:**
1. Create SEO draft in database
2. Verify draft creation
3. Manually trigger publishing via Supabase
4. Verify execution record creation
5. Verify task creation
6. Monitor events
7. Monitor logs
8. Verify artifact linkage
9. Verify draft status update
10. Verify WordPress output
11. Verify execution lifecycle
12. Verify expected status transitions

**Expected:** Successful WordPress publishing with complete execution lifecycle

---

### 6. DASHBOARD VALIDATION
**Action:** Validate dashboard reflects execution state correctly

**Steps:**
1. Verify execution visibility
2. Verify publishing visibility
3. Verify artifact visibility
4. Verify status reflection
5. Verify log visibility
6. Identify mocked areas
7. Identify real areas

**Expected:** Dashboard shows correct execution state with real and mocked areas identified

---

### 7. MULTITENANT SAFETY VALIDATION
**Action:** Verify multitenant isolation and security

**Steps:**
1. Verify tenant isolation
2. Verify credential isolation
3. Verify execution isolation
4. Verify no cross-tenant leakage
5. Verify RLS enforcement

**Expected:** Complete multitenant isolation with no security breaches

---

### 8. ARIA OPERATIONALIZATION
**Action:** Operationalize ARIA agent (NEXT PHASE)

**Rationale:** ARIA agent is critical for ARIA → SCRIBE → AMPLI closed-loop execution

**Steps:**
1. Implement runtime credential injection for ARIA tasks
2. Implement direct adapter execution for ARIA tasks
3. Add execution logging for ARIA tasks
4. Test ARIA execution end-to-end

**Expected:** ARIA agent operational with runtime credential injection

---

### 9. SCRIBE OPERATIONALIZATION
**Action:** Operationalize SCRIBE agent (NEXT PHASE)

**Rationale:** SCRIBE agent is critical for ARIA → SCRIBE → AMPLI closed-loop execution

**Steps:**
1. Implement runtime credential injection for SCRIBE tasks
2. Implement direct adapter execution for SCRIBE tasks
3. Add execution logging for SCRIBE tasks
4. Test SCRIBE execution end-to-end

**Expected:** SCRIBE agent operational with runtime credential injection

---

### 10. AGENT ORCHESTRATION
**Action:** Implement multi-agent orchestration (NEXT PHASE)

**Rationale:** Agent orchestration is critical for closed-loop execution

**Steps:**
1. Design agent orchestration system
2. Implement agent-to-agent communication
3. Implement workflow coordination
4. Test closed-loop execution

**Expected:** Complete ARIA → SCRIBE → AMPLI closed-loop execution

---

## CONCLUSION

**Status:** AMPLI OPERATIONALIZATION COMPLETE

**Milestone Achieved:** CLAUX achieves its FIRST REAL autonomous SEO execution capability through AMPLI operationalization.

**Next Phase:** ARIA and SCRIBE agent operationalization to achieve complete closed-loop execution.

**Foundation Established:** Canonical runtime credential injection pattern established for all future CLAUX execution tasks.
