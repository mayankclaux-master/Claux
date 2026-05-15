# AMPLI Publishing Migration Report

**Phase Z5 Wave 3 - Real Execution Cutover**

## Overview

AMPLI (Distribution + Publishing Agent) migrated from direct CMS adapter execution to canonical dispatcher flow with approval gate enforcement.

## Migration Strategy

### Execution Flow (Before)
```
AMPLI → CMS Adapter → WordPress/Shopify/Webflow/Ghost
```

### Execution Flow (After)
```
AMPLI → RuntimeService → ExecutionOrchestrator → IntegrationDispatcher → n8n → CMS → Callback → Runtime Continuation
```

## Tasks Migrated

### task_validate_approval_gate
- **Purpose**: Enforce approval gate before publishing
- **Table**: `publishing_approvals`
- **Status**: Only approved drafts proceed to publishing

### task_publish_wordpress
- **Provider**: WordPress
- **Dispatch Route**: `/api/integrations/dispatch/cms`
- **Feature Flag**: `ENABLE_AMPLI_DISPATCH_EXECUTION`
- **Fallback**: Direct adapter preserved

### task_publish_shopify
- **Provider**: Shopify
- **Dispatch Route**: `/api/integrations/dispatch/cms`
- **Feature Flag**: `ENABLE_AMPLI_DISPATCH_EXECUTION`
- **Fallback**: Direct adapter preserved

### task_publish_webflow
- **Provider**: Webflow
- **Dispatch Route**: `/api/integrations/dispatch/cms`
- **Feature Flag**: `ENABLE_AMPLI_DISPATCH_EXECUTION`
- **Fallback**: Direct adapter preserved

### task_publish_ghost
- **Provider**: Ghost
- **Dispatch Route**: `/api/integrations/dispatch/cms`
- **Feature Flag**: `ENABLE_AMPLI_DISPATCH_EXECUTION`
- **Fallback**: Direct adapter preserved

### task_schedule_publishing
- **Purpose**: Schedule publishing for later execution
- **Table**: `publishing_schedule`

### task_rollback_publishing
- **Purpose**: Rollback failed or erroneous publishes
- **Dispatch Route**: `/api/integrations/dispatch/cms`
- **Action**: rollback

### task_update_publishing_status
- **Purpose**: Update draft status after publishing
- **Table**: `seo_drafts`

## Files Created

- `apps/web/lib/runtime/tasks/ampli.tasks.ts`
  - All publishing tasks migrated to dispatcher
  - Approval gate enforcement
  - Rollback support
  - Status tracking

## Files Modified

- `apps/web/lib/integrations/mesh/feature-flags.ts`
  - Added `ENABLE_AMPLI_DISPATCH_EXECUTION` flag
  - Updated `getAgentFeatureFlags` for AMPLI
  - Updated `isDispatchExecutionEnabled` for AMPLI

## Validation

✅ Dispatcher execution enabled with feature flag
✅ Approval gate enforced before publishing
✅ Fallback to direct adapter preserved
✅ Callback continuation validated
✅ Tenant isolation enforced
✅ Rollback checkpoints enforced
✅ CORE governance active
✅ CMS response persistence
✅ Replay-safe publishing continuation

## Remaining Direct Execution

None. All CMS calls in AMPLI now route through dispatcher when feature flag is enabled.

## Success Criteria

- [x] AMPLI uses dispatcher execution
- [x] CMS publishing no longer executes directly (when flag enabled)
- [x] Approval workflows enforced
- [x] Rollback checkpoints enforced
- [x] Publishing replay-safe
- [x] Callback continuation validated
- [x] Tenant-safe publishing validated

## Status: COMPLETE
