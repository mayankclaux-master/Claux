# CLAUX OPERATIONAL EXECUTION TRACE

**Version:** 1.0.0
**Date:** May 18, 2026
**Purpose:** Complete operational flow trace for CLAUX AMPLI operationalization

---

## EXECUTIVE SUMMARY

This document traces the COMPLETE operational flow from signup through WordPress publishing execution, mapping APIs, services, repositories, tables, runtime paths, execution state transitions, and failure points.

**Scope:** Real operational behavior validation, not theoretical architecture.

---

## COMPLETE OPERATIONAL FLOW

### FLOW 1: SIGNUP → ONBOARDING → TENANT CREATION → DASHBOARD

#### Step 1: User Signup

**API:** `POST /auth/signup`

**File:** `apps/web/app/auth/signup/page.tsx`

**Flow:**
1. User enters email and password
2. Clerk creates user account
3. Clerk JWT issued
4. User redirected to onboarding

**Services:**
- Clerk authentication

**Tables:**
- `profiles` (created by Clerk webhook)

**Runtime Path:**
```
User input → Clerk signup → JWT issuance → Redirect to /onboarding
```

**Failure Points:**
- Clerk API failure
- Email already exists
- Password too weak
- Network failure

**State Transitions:**
- Unauthenticated → Authenticated (with incomplete profile)

---

#### Step 2: Onboarding

**API:** `POST /api/onboarding/bootstrap`
**API:** `POST /api/onboarding/complete`

**File:** `apps/web/app/onboarding/page.tsx`

**Flow:**
1. User completes onboarding form (business name, website URL, category)
2. Bootstrap API creates tenant record
3. Bootstrap API creates workspace record
4. Bootstrap API creates business profile record
5. Complete API updates profile status
6. User redirected to dashboard

**Services:**
- Supabase admin client
- Tenant creation service
- Workspace creation service
- Business profile creation service

**Tables:**
- `tenants` (created by bootstrap API)
- `workspaces` (created by bootstrap API)
- `business_profiles` (created by bootstrap API)
- `profiles` (updated by complete API)

**Runtime Path:**
```
User input → /api/onboarding/bootstrap → tenant creation → workspace creation → business profile creation → /api/onboarding/complete → profile update → Redirect to /dashboard
```

**Failure Points:**
- Supabase connection failure
- Tenant creation failure
- Workspace creation failure
- Business profile creation failure
- Profile update failure
- Network failure

**State Transitions:**
- Authenticated (incomplete profile) → Authenticated (complete profile)

---

#### Step 3: Dashboard Arrival

**API:** `GET /dashboard`

**File:** `apps/web/app/dashboard/page.tsx`

**Flow:**
1. User navigates to dashboard
2. Middleware validates authentication
3. Dashboard component loads
4. Dashboard fetches tenant context
5. Dashboard fetches agent states
6. Dashboard renders

**Services:**
- Clerk authentication
- Supabase server client
- Dashboard context service

**Tables:**
- `profiles` (queried for tenant context)
- `agent_states` (queried for agent states)

**Runtime Path:**
```
Navigation → Middleware auth validation → Dashboard component load → Tenant context fetch → Agent states fetch → Dashboard render
```

**Failure Points:**
- Middleware auth failure
- Supabase connection failure
- Tenant context fetch failure
- Agent states fetch failure
- Component render failure

**State Transitions:**
- Authenticated (complete profile) → Dashboard loaded

---

### FLOW 2: WORDPRESS INTEGRATION SAVE → ENCRYPTED CREDENTIAL PERSISTENCE

#### Step 4: WordPress Integration Save

**API:** `POST /api/integrations/cms`

**File:** `apps/web/app/api/integrations/cms/route.ts`

**Flow:**
1. User navigates to /dashboard/settings/integrations
2. User clicks "Connect WordPress"
3. User enters WordPress credentials (site URL, username, app password)
4. User clicks "Save Integration"
5. CMS API validates authentication
6. CMS API retrieves tenant ID from profiles
7. CMS API ensures integration row exists
8. CMS API encrypts app password
9. CMS API updates integrations table
10. CMS API returns success

**Services:**
- Clerk authentication (getToken)
- Supabase admin client
- Encryption service (encryptSecret)
- Integration service (ensureIntegrationRow)

**Tables:**
- `profiles` (queried for tenant_id)
- `integrations` (updated with WordPress credentials)

**Runtime Path:**
```
User input → /api/integrations/cms → Auth validation → Tenant ID retrieval → Integration row ensure → Credential encryption → Integrations table update → Success response
```

**Failure Points:**
- Auth validation failure
- Tenant ID retrieval failure
- Integration row ensure failure
- Encryption failure
- Integrations table update failure
- Network failure

**State Transitions:**
- Dashboard loaded → WordPress credentials saved

**Data Persistence:**
```sql
UPDATE integrations
SET 
  wp_site_url = 'https://example.com',
  wp_username = 'admin',
  wp_app_password_encrypted = 'encrypted_value',
  wp_status = 'connected',
  updated_at = NOW()
WHERE tenant_id = 'tenant-id';
```

---

#### Step 5: Encrypted Credential Persistence

**File:** `apps/web/lib/integrations/utils.ts`

**Encryption Flow:**
1. App password received from user input
2. `encryptSecret()` called with app password
3. AES-256-GCM encryption using INTEGRATION_ENCRYPTION_KEY
4. Encrypted value returned
5. Encrypted value stored in integrations table

**Encryption Algorithm:**
```typescript
// AES-256-GCM
const key = crypto.scryptSync(encryptionKey, 'salt', 32);
const iv = crypto.randomBytes(16);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
let encrypted = cipher.update(secret, 'utf8', 'hex');
encrypted += cipher.final('hex');
const authTag = cipher.getAuthTag();
return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
```

**Decryption Algorithm:**
```typescript
// AES-256-GCM
const key = crypto.scryptSync(encryptionKey, 'salt', 32);
const [ivHex, authTagHex, encrypted] = encryptedSecret.split(':');
const iv = Buffer.from(ivHex, 'hex');
const authTag = Buffer.from(authTagHex, 'hex');
const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
decipher.setAuthTag(authTag);
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
return decrypted;
```

**Failure Points:**
- INTEGRATION_ENCRYPTION_KEY missing (uses insecure default)
- Encryption failure
- Decryption failure
- Invalid encrypted value format

**Security Considerations:**
- Credentials encrypted at rest
- Credentials only decrypted at runtime
- Credentials never exposed in logs
- Credentials never exposed in events
- Credentials never exposed in responses

---

### FLOW 3: RUNTIME CREDENTIAL RETRIEVAL → EXECUTION CREATION → TASK CREATION → EVENT CREATION → LOG CREATION

#### Step 6: Runtime Credential Retrieval

**File:** `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**Flow:**
1. AMPLI task triggered with tenant_id and execution_id
2. `getTenantIntegrations(tenantId)` called
3. Supabase admin client queries integrations table
4. Integration record retrieved
5. `getWordPressAppPassword(tenantId)` called
6. Encrypted password retrieved from integrations table
7. `decryptSecret()` called with encrypted password
8. Password decrypted using INTEGRATION_ENCRYPTION_KEY
9. Decrypted password returned
10. Credentials injected into connector execution

**Services:**
- Supabase admin client
- Credential retrieval service (getTenantIntegrations)
- Decryption service (decryptSecret)

**Tables:**
- `integrations` (queried for WordPress credentials)

**Runtime Path:**
```
Task trigger → getTenantIntegrations(tenantId) → Integrations table query → Credential retrieval → getWordPressAppPassword(tenantId) → Password decryption → Credential injection
```

**Failure Points:**
- Tenant ID missing or invalid
- Integration record not found
- Encrypted password missing
- Decryption failure
- INTEGRATION_ENCRYPTION_KEY missing or invalid

**State Transitions:**
- Task triggered → Credentials retrieved → Credentials injected

---

#### Step 7: Execution Creation

**File:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`

**Flow:**
1. ExecutionOrchestrator.start() called
2. ExecutionService.createExecution() called
3. Execution record created in agent_executions table
4. Execution ID returned
5. Execution state set to 'running'

**Services:**
- ExecutionService
- Repository layer

**Tables:**
- `agent_executions` (insert execution record)

**Runtime Path:**
```
ExecutionOrchestrator.start() → ExecutionService.createExecution() → agent_executions table insert → Execution ID returned → State set to 'running'
```

**Failure Points:**
- ExecutionService initialization failure
- agent_executions table insert failure
- Database connection failure

**State Transitions:**
- Execution started → Execution record created → State: running

**Data Persistence:**
```sql
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
  'tenant-id',
  'AMPLI',
  'running',
  '{"task": "task_publish_wordpress", ...}'::jsonb,
  NOW(),
  NOW()
);
```

---

#### Step 8: Task Creation

**File:** `apps/web/lib/runtime/services/task.service.ts`

**Flow:**
1. TaskService.createTask() called
2. Task record created in agent_tasks table
3. Task linked to execution_id
4. Task state set to 'pending'

**Services:**
- TaskService
- Repository layer

**Tables:**
- `agent_tasks` (insert task record)

**Runtime Path:**
```
TaskService.createTask() → agent_tasks table insert → Task linked to execution_id → State set to 'pending'
```

**Failure Points:**
- TaskService initialization failure
- agent_tasks table insert failure
- Database connection failure

**State Transitions:**
- Execution running → Task created → State: pending

**Data Persistence:**
```sql
INSERT INTO agent_tasks (
  id,
  execution_id,
  task_name,
  status,
  input_data,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'execution-id',
  'task_publish_wordpress',
  'pending',
  '{"approved_drafts": [...]}'::jsonb,
  NOW(),
  NOW()
);
```

---

#### Step 9: Event Creation

**File:** `apps/web/lib/runtime/services/event.service.ts`

**Flow:**
1. EventService.publishEvent() called
2. Event record created in agent_events table
3. Event linked to tenant_id and execution_id
4. Event payload stored

**Services:**
- EventService
- Repository layer

**Tables:**
- `agent_events` (insert event record)

**Runtime Path:**
```
EventService.publishEvent() → agent_events table insert → Event linked to tenant_id and execution_id → Event payload stored
```

**Failure Points:**
- EventService initialization failure
- agent_events table insert failure
- Database connection failure

**State Transitions:**
- Task started → Event created

**Data Persistence:**
```sql
INSERT INTO agent_events (
  id,
  tenant_id,
  execution_id,
  event_name,
  event_source,
  payload,
  event_version,
  created_at
) VALUES (
  gen_random_uuid(),
  'tenant-id',
  'execution-id',
  'wordpress_publishing_started',
  'ampli',
  '{"draft_count": 1}'::jsonb,
  '1.0',
  NOW()
);
```

---

#### Step 10: Log Creation

**File:** `apps/web/lib/runtime/services/log.service.ts`

**Flow:**
1. LogService.writeLog() called
2. Log record created in agent_logs table
3. Log linked to execution_id
4. Log message and metadata stored

**Services:**
- LogService
- Repository layer

**Tables:**
- `agent_logs` (insert log record)

**Runtime Path:**
```
LogService.writeLog() → agent_logs table insert → Log linked to execution_id → Log message and metadata stored
```

**Failure Points:**
- LogService initialization failure
- agent_logs table insert failure
- Database connection failure

**State Transitions:**
- Task started → Log created

**Data Persistence:**
```sql
INSERT INTO agent_logs (
  id,
  execution_id,
  log_level,
  message,
  metadata,
  created_at
) VALUES (
  gen_random_uuid(),
  'execution-id',
  'INFO',
  'WordPress publishing started',
  '{"draft_count": 1}'::jsonb,
  NOW()
);
```

---

### FLOW 4: PUBLISHING EXECUTION → ARTIFACT PERSISTENCE → EXECUTION COMPLETION

#### Step 11: Publishing Execution

**File:** `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**Flow:**
1. task_publish_wordpress() called with tenant_id, execution_id, input_data
2. EventService initialized
3. LogService initialized
4. Start event published (wordpress_publishing_started)
5. Start log written (WordPress publishing started)
6. getTenantIntegrations(tenantId) called
7. WordPress credentials retrieved
8. getWordPressAppPassword(tenantId) called
9. App password decrypted
10. For each approved draft:
    a. publishWordPressPost() called with credentials
    b. WordPress REST API called
    c. Response parsed
    d. Success/failure logged
    e. Draft status updated
11. Completion event published (wordpress_publishing_completed)
12. Completion log written
13. Task result returned

**Services:**
- EventService
- LogService
- Credential retrieval service
- WordPress connector (publishWordPressPost)

**Tables:**
- `integrations` (queried for WordPress credentials)
- `agent_events` (insert event records)
- `agent_logs` (insert log records)
- `seo_drafts` (updated with publishing status)

**Runtime Path:**
```
Task trigger → Service initialization → Start event/log → Credential retrieval → Credential decryption → Connector execution → WordPress API call → Response parsing → Success/failure log → Draft status update → Completion event/log → Task result returned
```

**Failure Points:**
- Service initialization failure
- Credential retrieval failure
- Credential decryption failure
- WordPress connector failure
- WordPress API call failure
- Response parsing failure
- Draft status update failure
- Event/log write failure

**State Transitions:**
- Task pending → Task running → Task completed/failed

**Data Persistence:**
```sql
UPDATE seo_drafts
SET 
  status = 'published',
  cms_post_id = 'wordpress-post-id',
  published_at = NOW(),
  updated_at = NOW()
WHERE id = 'draft-id';
```

---

#### Step 12: Artifact Persistence

**File:** `apps/web/lib/runtime/tasks/ampli.tasks.ts`

**Flow:**
1. WordPress connector returns success with URL
2. Published result created:
   - draft_id
   - cms_post_id
   - url
   - status
3. Published results returned in task data
4. Artifacts can be persisted to runtime_artifacts table (if needed)

**Services:**
- WordPress connector
- Artifact persistence (optional)

**Tables:**
- `seo_drafts` (updated with CMS post ID)
- `runtime_artifacts` (optional artifact persistence)

**Runtime Path:**
```
Connector execution → Result parsing → Published result creation → Artifact persistence (optional) → Task result returned
```

**Failure Points:**
- WordPress connector failure
- Result parsing failure
- Artifact persistence failure (if used)

**State Transitions:**
- Connector execution → Artifact persisted → Task completed

**Data Persistence:**
```sql
-- Optional artifact persistence
INSERT INTO runtime_artifacts (
  id,
  execution_id,
  artifact_type,
  artifact_data,
  created_at
) VALUES (
  gen_random_uuid(),
  'execution-id',
  'published_draft',
  '{"draft_id": "draft-id", "cms_post_id": "wordpress-post-id", "url": "https://example.com/post"}'::jsonb,
  NOW()
);
```

---

#### Step 13: Execution Completion

**File:** `apps/web/lib/runtime/orchestrator/execution-orchestrator.ts`

**Flow:**
1. Task completes with result
2. ExecutionService.updateExecution() called
3. Execution record updated in agent_executions table
4. Execution state set to 'completed' or 'failed'
5. Execution timestamps updated (started_at, completed_at)
6. Execution result stored

**Services:**
- ExecutionService
- Repository layer

**Tables:**
- `agent_executions` (updated with completion status)

**Runtime Path:**
```
Task completion → ExecutionService.updateExecution() → agent_executions table update → State set to 'completed'/'failed' → Timestamps updated → Result stored
```

**Failure Points:**
- ExecutionService.updateExecution() failure
- agent_executions table update failure
- Database connection failure

**State Transitions:**
- Task completed → Execution completed → State: completed/failed

**Data Persistence:**
```sql
UPDATE agent_executions
SET 
  status = 'completed',
  started_at = 'start-timestamp',
  completed_at = NOW(),
  updated_at = NOW()
WHERE id = 'execution-id';
```

---

## CRITICAL FAILURE POINTS

### CRITICAL: Application Startup Failures

**Failure Mode:** Application cannot start

**Variables:**
- `NEXT_PUBLIC_SUPABASE_URL` missing
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` missing
- `CLERK_SECRET_KEY` missing

**Detection:** Application crash on startup

**Recovery:** Set missing environment variables in Vercel

---

### CRITICAL: Authentication Failures

**Failure Mode:** Users cannot authenticate

**Causes:**
- Clerk API failure
- JWT validation failure
- Middleware auth failure
- Profile creation failure

**Detection:** Auth errors in logs, 401 responses

**Recovery:** Check Clerk configuration, verify webhook setup

---

### CRITICAL: Database Failures

**Failure Mode:** Database operations fail

**Causes:**
- Supabase connection failure
- RLS policy failure
- Table missing
- Query failure

**Detection:** Database errors in logs, 500 responses

**Recovery:** Check Supabase configuration, verify RLS policies

---

### CRITICAL: Credential Encryption Failures

**Failure Mode:** Credentials cannot be encrypted/decrypted

**Causes:**
- `INTEGRATION_ENCRYPTION_KEY` missing
- `INTEGRATION_ENCRYPTION_KEY` invalid
- Encryption algorithm failure
- Decryption algorithm failure

**Detection:** Credential errors in logs, integration save failures

**Recovery:** Set `INTEGRATION_ENCRYPTION_KEY` to valid 32-byte hex key

---

### CRITICAL: WordPress Connector Failures

**Failure Mode:** WordPress publishing fails

**Causes:**
- WordPress credentials invalid
- WordPress API failure
- Network failure
- Response parsing failure

**Detection:** WordPress errors in logs, publishing failures

**Recovery:** Verify WordPress credentials, check WordPress API status

---

## EXECUTION STATE TRANSITIONS

### User Registration Flow

```
Unauthenticated → Authenticated (incomplete profile) → Authenticated (complete profile) → Dashboard loaded
```

### WordPress Integration Flow

```
Dashboard loaded → Credentials entered → Credentials encrypted → Credentials persisted → Integration connected
```

### Execution Flow

```
Execution started → Execution record created → Task created → Task started → Event created → Log created → Credentials retrieved → Credentials decrypted → Connector execution → WordPress API call → Response parsed → Success/failure logged → Draft status updated → Artifact persisted → Task completed → Execution completed
```

### Failure Flow

```
Execution started → Execution record created → Task created → Task started → Event created → Log created → Credentials retrieval failure → Task failed → Execution failed
```

---

## MOCKED VS REAL OPERATIONS

### REAL OPERATIONS

✅ **User Signup** - REAL (Clerk authentication)
✅ **Onboarding** - REAL (tenant creation, workspace creation, business profile creation)
✅ **Dashboard** - REAL (tenant context, agent states)
✅ **WordPress Integration Save** - REAL (credential encryption, persistence)
✅ **Runtime Credential Retrieval** - REAL (tenant-scoped retrieval, decryption)
✅ **Execution Creation** - REAL (agent_executions table)
✅ **Task Creation** - REAL (agent_tasks table)
✅ **Event Creation** - REAL (agent_events table)
✅ **Log Creation** - REAL (agent_logs table)
✅ **WordPress Publishing Execution** - REAL (WordPress connector, REST API)
✅ **Artifact Persistence** - REAL (seo_drafts table update)
✅ **Execution Completion** - REAL (agent_executions table update)

### MOCKED OPERATIONS

❌ **ARIA Agent Execution** - MOCKED (not operationalized)
❌ **SCRIBE Agent Execution** - MOCKED (not operationalized)
❌ **LOCL Agent Execution** - MOCKED (not operationalized)
❌ **LINX Agent Execution** - MOCKED (not operationalized)
❌ **REPUTE Agent Execution** - MOCKED (not operationalized)
❌ **PRISM Agent Execution** - MOCKED (not operationalized)
❌ **PULSE Agent Execution** - MOCKED (not operationalized)
❌ **Shopify Publishing** - MOCKED (stub implementation)
❌ **Webflow Publishing** - MOCKED (stub implementation)
❌ **Ghost Publishing** - MOCKED (stub implementation)
❌ **Rollback** - MOCKED (stub implementation)

### PARTIAL OPERATIONS

⚠️ **Dashboard Execution Feed** - PARTIAL (shows real agent states but mocked execution feed)
⚠️ **Dashboard Rankings** - PARTIAL (shows real ranking seeds but mocked rankings)
⚠️ **Dashboard Analytics** - PARTIAL (shows real data but mocked analytics)
⚠️ **Dashboard Reports** - PARTIAL (shows real data but mocked reports)

---

## CONCLUSION

**Operational Trace Status:** COMPLETE

**Real Operations:** 11 (WordPress publishing fully operational)
**Mocked Operations:** 11 (other agents and CMS connectors not operationalized)
**Partial Operations:** 4 (dashboard components partially mocked)

**Critical Failure Points:** 5 (startup, auth, database, credential encryption, WordPress connector)

**Execution State Transitions:** Fully documented for WordPress publishing flow

**Recommendation:** WordPress publishing is REAL and operational. Other agents and CMS connectors remain MOCKED.
