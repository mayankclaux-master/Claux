# CLAUX V1 — PRE PHASE 7B — ONBOARDING FORENSIC AUDIT REPORT

**Date:** May 23, 2026
**Status:** FORENSIC AUDIT COMPLETE
**Purpose:** Map all onboarding systems before building new onboarding architecture

---

## A. FULL ONBOARDING DEPENDENCY MAP

### Core Onboarding Entry Points

1. **`app/api/onboarding/bootstrap/route.ts`**
   - Purpose: Bootstrap tenant for user
   - Calls: `bootstrap_tenant_for_user` RPC
   - Dependencies: Clerk auth, Supabase admin client
   - Status: ACTIVE

2. **`app/api/onboarding/complete/route.ts`**
   - Purpose: Complete onboarding with business details
   - Calls: `complete_onboarding` RPC
   - Dependencies: Clerk auth, Supabase admin client
   - Status: ACTIVE

3. **`lib/auth/ensure-workspace.ts`**
   - Purpose: Ensure workspace/tenant exists for user
   - Calls: `bootstrap_tenant_for_user` RPC
   - Dependencies: Supabase admin client
   - Status: ACTIVE

4. **`app/api/webhooks/clerk/route.ts`**
   - Purpose: Clerk webhook handler
   - Calls: `bootstrap_tenant_for_user` RPC on user.created
   - Dependencies: Clerk webhook, Supabase admin client
   - Status: ACTIVE

5. **`app/api/internal/ensure-tenant/route.ts`**
   - Purpose: Internal tenant ensure endpoint
   - Calls: `bootstrap_tenant_for_user` RPC
   - Dependencies: Supabase admin client
   - Status: ACTIVE

6. **`app/api/profile/complete/route.ts`**
   - Purpose: Profile completion endpoint
   - Calls: `complete_onboarding` RPC
   - Dependencies: Clerk auth, Supabase admin client
   - Status: ACTIVE

### Onboarding Library Files

7. **`lib/onboarding/bootstrap.ts`**
   - Purpose: Workspace bootstrap
   - Dependencies: Supabase admin client
   - Status: DEPRECATED (commented out workflow config)
   - Note: Contains only commented-out workflow logic

8. **`lib/onboarding/activation/tenant-activation-pipeline.ts`**
   - Purpose: Tenant activation pipeline
   - Dependencies: RuntimeService, CredentialManager, Supabase
   - Status: ACTIVE
   - Note: Complex activation flow with multiple steps

9. **`lib/onboarding/orchestration.ts`**
   - Purpose: Tenant onboarding orchestration
   - Dependencies: validation, ingestion, credentials
   - Status: ACTIVE
   - Note: Complete orchestration flow

10. **`lib/onboarding/credentials.ts`**
    - Purpose: Credential storage/retrieval
    - Dependencies: Supabase admin client
    - Status: ACTIVE
    - Note: Uses `credentials` table

11. **`lib/onboarding/ingestion.ts`**
    - Purpose: Tenant data ingestion
    - Dependencies: Supabase admin client
    - Status: ACTIVE
    - Note: Creates tenant, workspace, business_profile, gsc_credentials

12. **`lib/onboarding/validation.ts`**
    - Purpose: Validation logic
    - Dependencies: None
    - Status: ACTIVE
    - Note: Validates tenant data, GSC credentials, sitemap, website

### RPC Functions (Database Level)

13. **`bootstrap_tenant_for_user` RPC**
    - Purpose: Bootstrap tenant for user
    - Called from: 4 different entry points
    - Status: ACTIVE
    - Note: Creates tenant, workspace, profile linkage

14. **`complete_onboarding` RPC**
    - Purpose: Complete onboarding with business details
    - Called from: 2 different entry points
    - Status: ACTIVE
    - Note: Updates business_profiles, locations, competitors

### Runtime Bootstrap (NOT Onboarding)

15. **`lib/runtime/bootstrap/*`**
    - Purpose: Runtime service bootstrap
    - Files: types, constants, errors, runtime-assembly, provider-registration, initialization-lifecycle, dependency-validation, startup-validation, runtime-warmup, health-initialization, bootstrap-diagnostics, capability-discovery, validation, metrics, facade
    - Status: ACTIVE
    - Note: These are RUNTIME bootstrap, NOT onboarding bootstrap

---

## B. LEGACY ONBOARDING ENTRYPOINTS

### Duplicate Entry Points

**DUPLICATE #1: Tenant Bootstrap**
- `app/api/onboarding/bootstrap/route.ts` → `bootstrap_tenant_for_user`
- `lib/auth/ensure-workspace.ts` → `bootstrap_tenant_for_user`
- `app/api/webhooks/clerk/route.ts` → `bootstrap_tenant_for_user`
- `app/api/internal/ensure-tenant/route.ts` → `bootstrap_tenant_for_user`

**Risk:** 4 different entry points calling the same RPC can cause race conditions and duplicate tenant creation.

**DUPLICATE #2: Onboarding Completion**
- `app/api/onboarding/complete/route.ts` → `complete_onboarding`
- `app/api/profile/complete/route.ts` → `complete_onboarding`

**Risk:** 2 different entry points for onboarding completion can cause data inconsistency.

### Hidden Side Effects

**SIDE EFFECT #1: Automatic Tenant Creation**
- `bootstrap_tenant_for_user` RPC automatically creates tenant if not exists
- Called from webhook (user.created) - automatic side effect
- Called from manual bootstrap - manual side effect
- No central control over when tenant is created

**SIDE EFFECT #2: Automatic Workspace Creation**
- `bootstrap_tenant_for_user` RPC automatically creates workspace
- No validation if workspace already exists
- Can create duplicate workspaces

**SIDE EFFECT #3: Automatic Profile Linkage**
- `bootstrap_tenant_for_user` RPC automatically links profile to tenant
- Can overwrite existing tenant_id in profile

---

## C. FILES TO DELETE / PRESERVE / REWRITE

### DELETE

1. **`lib/onboarding/bootstrap.ts`**
   - Reason: Deprecated, contains only commented-out workflow logic
   - Action: DELETE

2. **`lib/onboarding/activation/tenant-activation-pipeline.ts`**
   - Reason: Complex activation flow not used in V1, conflicts with new onboarding
   - Action: DELETE

3. **`lib/onboarding/orchestration.ts`**
   - Reason: Old orchestration logic, conflicts with new onboarding
   - Action: DELETE

4. **`lib/onboarding/credentials.ts`**
   - Reason: Old credential handling, replaced by connector-credential-vault
   - Action: DELETE

5. **`lib/onboarding/ingestion.ts`**
   - Reason: Old ingestion logic, conflicts with new onboarding
   - Action: DELETE

6. **`lib/onboarding/validation.ts`**
   - Reason: Old validation logic, can be recreated in new onboarding
   - Action: DELETE

7. **`app/api/onboarding/bootstrap/route.ts`**
   - Reason: Duplicate bootstrap entry point
   - Action: DELETE

8. **`app/api/onboarding/complete/route.ts`**
   - Reason: Duplicate completion entry point
   - Action: DELETE

9. **`app/api/internal/ensure-tenant/route.ts`**
   - Reason: Internal endpoint, not needed in V1
   - Action: DELETE

### PRESERVE

1. **`lib/auth/ensure-workspace.ts`**
   - Reason: Core workspace ensure logic, needed for auth flow
   - Action: PRESERVE

2. **`app/api/webhooks/clerk/route.ts`**
   - Reason: Verified OAuth callback infrastructure
   - Action: PRESERVE

3. **`app/api/profile/complete/route.ts`**
   - Reason: Profile completion, part of auth flow
   - Action: PRESERVE

4. **`lib/runtime/bootstrap/*`**
   - Reason: Runtime bootstrap, not onboarding
   - Action: PRESERVE

### REWRITE

1. **RPC `bootstrap_tenant_for_user`**
   - Reason: Called from multiple entry points, needs centralization
   - Action: REWRITE as part of new onboarding

2. **RPC `complete_onboarding`**
   - Reason: Called from multiple entry points, needs centralization
   - Action: REWRITE as part of new onboarding

---

## D. DANGEROUS HIDDEN SIDE-EFFECTS IDENTIFIED

### Side Effect #1: Automatic Tenant Creation
- **Location:** `bootstrap_tenant_for_user` RPC
- **Trigger:** Called from webhook (user.created)
- **Risk:** Creates tenant without user consent
- **Impact:** Can create orphaned tenants

### Side Effect #2: Automatic Workspace Creation
- **Location:** `bootstrap_tenant_for_user` RPC
- **Trigger:** Called from any bootstrap entry point
- **Risk:** Can create duplicate workspaces
- **Impact:** Data inconsistency

### Side Effect #3: Automatic Profile Linkage
- **Location:** `bootstrap_tenant_for_user` RPC
- **Trigger:** Called from any bootstrap entry point
- **Risk:** Can overwrite existing tenant_id
- **Impact:** User data corruption

### Side Effect #4: Multiple Bootstrap Entry Points
- **Location:** 4 different files
- **Trigger:** Various user actions
- **Risk:** Race conditions, duplicate creation
- **Impact:** System instability

### Side Effect #5: Multiple Completion Entry Points
- **Location:** 2 different files
- **Trigger:** Various user actions
- **Risk:** Data inconsistency
- **Impact:** Onboarding state corruption

---

## E. SCHEDULE INITIALIZATION CONFLICTS IDENTIFIED

### Current State
- **No automatic schedule creation in onboarding**
- **CronExecutionService.createSchedule()** - Manual schedule creation only
- **No schedule initialization in any onboarding flow**

### Conflicts
- **NONE IDENTIFIED**
- **Risk:** Future onboarding must own schedule creation centrally
- **Recommendation:** Add schedule creation to new onboarding

---

## F. EXECUTION BOOTSTRAP CONFLICTS IDENTIFIED

### Current State
- **No first-run execution triggers in onboarding**
- **No automatic agent execution on tenant creation**
- **No welcome flows**

### Conflicts
- **NONE IDENTIFIED**
- **Risk:** Future onboarding must own first execution centrally
- **Recommendation:** Add first execution to new onboarding

---

## G. DASHBOARD INITIALIZATION CONFLICTS IDENTIFIED

### Current State
- **No dashboard seed/init logic in onboarding**
- **No automatic dashboard data population**
- **Dashboard relies on real data from persistence**

### Conflicts
- **NONE IDENTIFIED**
- **Risk:** Future onboarding must own dashboard initialization centrally
- **Recommendation:** Add dashboard initialization to new onboarding

---

## H. COMMAND CENTRE INIT CONFLICTS IDENTIFIED

### Current State
- **No task bootstrap systems in onboarding**
- **Task creation scattered across agent services**
- **No automatic task creation on tenant creation**

### Conflicts
- **NONE IDENTIFIED**
- **Risk:** Future onboarding must own task initialization centrally
- **Recommendation:** Add task initialization to new onboarding

---

## I. ONBOARDING STATE AUDIT

### Current State
- **No onboarding_status field found**
- **No activation_status field found**
- **No bootstrap_status field found**
- **No deprecated states found**
- **No duplicate readiness fields found**

### Conflicts
- **NONE IDENTIFIED**
- **Note:** Onboarding state not tracked in database
- **Recommendation:** Add onboarding state tracking to new onboarding

---

## SUMMARY

### Files to Delete: 9
1. `lib/onboarding/bootstrap.ts`
2. `lib/onboarding/activation/tenant-activation-pipeline.ts`
3. `lib/onboarding/orchestration.ts`
4. `lib/onboarding/credentials.ts`
5. `lib/onboarding/ingestion.ts`
6. `lib/onboarding/validation.ts`
7. `app/api/onboarding/bootstrap/route.ts`
8. `app/api/onboarding/complete/route.ts`
9. `app/api/internal/ensure-tenant/route.ts`

### Files to Preserve: 4
1. `lib/auth/ensure-workspace.ts`
2. `app/api/webhooks/clerk/route.ts`
3. `app/api/profile/complete/route.ts`
4. `lib/runtime/bootstrap/*`

### RPCs to Rewrite: 2
1. `bootstrap_tenant_for_user`
2. `complete_onboarding`

### Dangerous Side Effects: 5
1. Automatic tenant creation
2. Automatic workspace creation
3. Automatic profile linkage
4. Multiple bootstrap entry points
5. Multiple completion entry points

### Schedule/Execution/Dashboard/Task Conflicts: 0
- No automatic initialization found
- Future onboarding must own these centrally

---

**NEXT STEPS:**
1. Delete identified files
2. Rewrite RPCs as part of new onboarding
3. Build new centralized onboarding architecture
4. Add schedule, execution, dashboard, task initialization
