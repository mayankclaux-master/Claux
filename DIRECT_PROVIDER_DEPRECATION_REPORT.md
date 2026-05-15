# DIRECT PROVIDER DEPRECATION REPORT

**Phase:** Phase Z4 - Canonical Agent Live Execution Migration + Direct Provider Deprecation  
**Status:** DEPRECATION WARNINGS IMPLEMENTED

## CONFLICTING FILES

### 1. OpenAI Adapter
**File:** `lib/runtime/adapters/providers/openai.adapter.ts`
**Conflict:** Direct OpenAI API calls within runtime adapters
**Current Flow:** SCRIBE agent → OpenAIAdapter → OpenAI API (direct)
**Required Flow:** SCRIBE agent → Integration Dispatcher → n8n → OpenAI API
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Mark as @deprecated, preserve for compatibility
**Status:** ✅ DEPRECATED - Warning added in Phase Z4

### 2. DataForSEO Adapter
**File:** `lib/runtime/adapters/providers/dataforseo.adapter.ts`
**Conflict:** Direct DataForSEO API calls within runtime adapters
**Current Flow:** ARIA/LINX/PULSE agents → DataForSEOAdapter → DataForSEO API (direct)
**Required Flow:** ARIA/LINX/PULSE agents → Integration Dispatcher → n8n → DataForSEO API
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Mark as @deprecated, preserve for compatibility
**Status:** ✅ DEPRECATED - Warning added in Phase Z4

### 3. Hardened Provider Implementations
**Files:** 
- `lib/providers/hardened-dataforseo.ts`
- `lib/providers/hardened-openai.ts`
**Conflict:** Direct provider implementations
**Current Flow:** Agents call hardened providers directly
**Required Flow:** Agents call integration dispatcher
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Mark as @deprecated, preserve for compatibility
**Status:** PRESERVED FOR COMPATIBILITY

### 4. Agent-Specific Provider Clients
**Files:**
- `lib/agents/shared/openai.client.ts`
- `lib/agents/shared/dataforseo.client.ts`
**Conflict:** Agent-specific provider clients
**Current Flow:** Agents use shared provider clients directly
**Required Flow:** Agents use integration dispatcher
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Mark as @deprecated, preserve for compatibility
**Status:** PRESERVED FOR COMPATIBILITY

## DEPRECATION STRATEGY

**Decision:** DEFER PURGE - PRESERVE COMPATIBILITY WRAPPERS

**Reasons:**
1. Prevent breaking existing agent execution
2. Allow gradual migration with feature flags
3. Enable testing of new architecture
4. Provide fallback during transition
5. Monitor execution stability

**Deprecation Path:**
1. ✅ Mark existing adapters as @deprecated
2. ✅ Add deprecation warnings
3. ✅ Add feature flags for new dispatch APIs (Phase Z3)
4. ⏳ Migrate agents incrementally (Phase Z4)
5. ⏳ Monitor execution during migration
6. ⏳ Migrate remaining agents incrementally
7. ⏳ Disable fallback to direct provider
8. ⏳ Remove deprecated adapters in Phase Z5

## FEATURE FLAG CONFIGURATION

**Location:** `lib/integrations/mesh/feature-flags.ts`

**Per-Agent Flags:**
- `useIntegrationMesh`: Enable integration mesh for agent
- `fallbackToDirectProvider`: Fallback to direct provider if mesh fails
- `enableCallbackContinuation`: Enable callback continuation for agent

**Default State:** All disabled for safety

## MIGRATION ORDER

**Phase 1:** Add @deprecated annotations to existing adapters
**Phase 2:** Add deprecation warnings to existing adapters
**Phase 3:** Add feature flags for dispatch APIs
**Phase 4:** Migrate one agent at a time (start with PRISM - non-critical)
**Phase 5:** Monitor execution during migration
**Phase 6:** Migrate remaining agents incrementally
**Phase 7:** Disable fallback to direct provider
**Phase 8:** Remove deprecated adapters in Phase Z4

## COMPATIBILITY PRESERVATION

Direct provider adapters remain TEMPORARILY as compatibility wrappers.

**DO NOT:**
- Remove deprecated adapters in Phase Z4 (deferred to Phase Z5)
- Break existing agent execution
- Migrate all agents at once

**DO:**
- Preserve compatibility during Phase Z4
- Mark as @deprecated ✅
- Add deprecation warnings ✅
- Use feature flags for incremental migration
- Monitor execution stability

## PHASE Z4 PROGRESS

✅ OpenAI adapter deprecated with warning
✅ DataForSEO adapter deprecated with warning
⏳ Agent migration in progress
⏳ Feature flag rollout pending

## CONCLUSION

Direct provider deprecation warnings implemented in Phase Z4. Compatibility wrappers preserved during Phase Z4 to enable safe incremental migration with feature flags. Adapter removal deferred to Phase Z5 after successful agent migration.

# Direct Provider Deprecation Report

**Phase Z5 Wave 3 - Real Execution Cutover**

## Overview

Direct provider adapters deprecated in favor of canonical dispatcher execution. Adapters preserved as fallback wrappers for compatibility.

## Deprecation Status

### OpenAI Adapter
- **File**: `apps/web/lib/runtime/adapters/providers/openai.adapter.ts`
- **Deprecation Phase**: Phase Z5 Wave 3
- **Status**: Deprecated, preserved as fallback
- **Removal Phase**: Phase Z6 (after successful validation)
- **Warning**: Added deprecation warning on import

### DataForSEO Adapter
- **File**: `apps/web/lib/runtime/adapters/providers/dataforseo.adapter.ts`
- **Deprecation Phase**: Phase Z4
- **Status**: Deprecated, preserved as fallback
- **Removal Phase**: Phase Z6 (after successful validation)
- **Warning**: Added deprecation warning on import

## Compatibility Wrappers

All direct adapters preserved as compatibility wrappers:
- Feature flag controlled fallback
- Graceful degradation on dispatch failure
- No breaking changes during migration

## Migration Status

### Wave 1 Agents (PRISM, PULSE, REPUTE)
- ✅ Migrated to dispatcher execution
- ✅ Fallback preserved
- ✅ Deprecation warnings added

### Wave 2 Agents (ARIA, LINX, LOCL)
- ✅ Migrated to dispatcher execution
- ✅ Fallback preserved
- ✅ Deprecation warnings added

### Wave 3 Agents (SCRIBE, AMPLI)
- ✅ Migrated to dispatcher execution
- ✅ Fallback preserved
- ✅ Deprecation warnings added

## Removal Plan

Direct adapters will be removed in Phase Z6 after:
- All agents migrated to dispatcher
- Successful validation of dispatcher execution
- No remaining direct provider execution paths
- Full confidence in dispatcher reliability

## Success Criteria

- [x] Deprecation warnings added
- [x] Fallback wrappers preserved
- [x] No breaking changes
- [x] All agents migrated
- [x] Compatibility maintained

## Status: COMPLETE (Deprecation), PENDING (Removal)
