# INTEGRATION CONFLICT REPORT

**Phase:** Phase Z1 - Integration Mesh Foundation + Canonical API Topology  
**Status:** CONFLICTS IDENTIFIED

## ARCHITECTURAL CONFLICT

**New Canonical Flow Required:**
Agent → RuntimeService → ExecutionOrchestrator → Integration Adapter → Integration Dispatcher → n8n Webhook → External Provider → Callback/Webhook → Runtime Event → Task Completion

**Existing Direct Provider Calls:**
Agents → RuntimeService → Provider Adapter → External Provider (DIRECT CALL)

## CONFLICTING FILES

### 1. OpenAI Adapter
**File:** `lib/runtime/adapters/providers/openai.adapter.ts`
**Conflict:** Direct OpenAI API calls within runtime adapters
**Current Flow:** SCRIBE agent → OpenAIAdapter → OpenAI API (direct)
**Required Flow:** SCRIBE agent → RuntimeService → Integration Dispatcher → n8n → OpenAI API
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Refactor to use integration dispatcher

### 2. DataForSEO Adapter
**File:** `lib/runtime/adapters/providers/dataforseo.adapter.ts`
**Conflict:** Direct DataForSEO API calls within runtime adapters
**Current Flow:** ARIA/LINX/PULSE agents → DataForSEOAdapter → DataForSEO API (direct)
**Required Flow:** ARIA/LINX/PULSE agents → RuntimeService → Integration Dispatcher → n8n → DataForSEO API
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Refactor to use integration dispatcher

### 3. Hardened Provider Implementations
**Files:** 
- `lib/providers/hardened-dataforseo.ts`
- `lib/providers/hardened-openai.ts`
**Conflict:** Direct provider implementations
**Current Flow:** Agents call hardened providers directly
**Required Flow:** Agents call integration dispatcher
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Refactor to use integration dispatcher

### 4. Agent-Specific Provider Clients
**Files:**
- `lib/agents/shared/openai.client.ts`
- `lib/agents/shared/dataforseo.client.ts`
**Conflict:** Agent-specific provider clients
**Current Flow:** Agents use shared provider clients directly
**Required Flow:** Agents use integration dispatcher
**Impact:** Violates canonical execution flow, bypasses integration mesh
**Action Required:** Refactor to use integration dispatcher

## RESOLUTION STRATEGY

### Phase 1: Preserve Existing Functionality
- Keep existing provider adapters as fallback/compatibility layer
- Mark as @deprecated with migration path
- Maintain backward compatibility during transition

### Phase 2: Build Canonical Integration Mesh
- Create new integration mesh layer in `lib/integrations/mesh/`
- Build integration dispatcher as canonical execution bridge
- Build callback ingestion system
- Build tenant-safe webhook system

### Phase 3: Migrate Agents
- Update agent runtime implementations to use integration dispatcher
- Remove direct provider calls from agents
- Update provider adapters to integrate with mesh

### Phase 4: Deprecate Old Pattern
- Remove @deprecated adapters after migration complete
- Clean up direct provider calls
- Ensure all execution flows through canonical mesh

## RECOMMENDATION

**Do NOT silently replace existing code.**
**Build canonical mesh first, then migrate incrementally.**

This ensures:
- No breaking changes to existing functionality
- Gradual migration path
- Ability to test new architecture before deprecation
- Preserves runtime stability during transition
