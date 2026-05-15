# CLAUX N8N INTEGRATION AUDIT

**Principal Staff Engineer - Production Readiness Investigation**
**Date**: January 9, 2025
**Investigation Type**: Forensic Engineering Audit

---

## EXECUTIVE SUMMARY

**N8N READINESS**: **30%**

**CRITICAL FINDINGS**:
1. **N8N integration is DOCUMENTED but NOT VERIFIED** - Integration guide exists but implementation not verified
2. **Callback endpoint documented but not inspected** - Unknown if callback handler works
3. **Dispatch routes exist but not verified** - Unknown if dispatch calls n8n
4. **No n8n workflow definitions found** - Unknown if n8n workflows exist
5. **Feature flags control all n8n execution** - Can disable entire integration

---

## N8N INTEGRATION OVERVIEW

### Expected Architecture

**Expected Flow**:
```
Agent Runtime → IntegrationDispatcher → /api/integrations/dispatch/{provider} → n8n Workflow → Provider API
Provider API → n8n Callback → /api/v1/orchestrator/n8n-callback → Execution State Update
```

**Actual Status**: **DOCUMENTED BUT NOT VERIFIED**

---

## N8N CONTRACTS AUDIT

### Schema Definitions

**File**: `apps/web/lib/integrations/mesh/contracts/n8n-schemas.ts` (233 lines)

**Implemented Schemas**:

#### OpenAI Schema
- `OpenAIRequest` - prompt, executionId, tenantId, traceId, model, temperature, etc.
- `OpenAIResponse` - result, usage (tokens), error
- `validateOpenAIRequest()` - Validation function

#### DataForSEO Schema
- `DataForSEOKeywordRequest` - keywords, executionId, tenantId, traceId, location, language
- `DataForSEOSERPRequest` - keyword, executionId, tenantId, traceId, depth
- `DataForSEOBacklinkRequest` - targetDomain, executionId, tenantId, traceId, limit
- `DataForSEOResponse` - result, error
- `validateDataForSEORequest()` - Validation function

#### GBP Schema
- `GBPSyncRequest` - locationId, executionId, tenantId, traceId, syncType
- `GBPReviewRequest` - locationId, executionId, tenantId, traceId, limit
- `GBPLocalRankingRequest` - locationId, keyword, executionId, tenantId, traceId
- `GBPResponse` - result, error
- `validateGBPRequest()` - Validation function

#### CMS Schema
- `CMSPublishRequest` - platform, contentId, executionId, tenantId, traceId, publishType
- `CMSRollbackRequest` - platform, contentId, executionId, tenantId, traceId, rollbackToVersion
- `CMSScheduledPublishRequest` - platform, contentId, executionId, tenantId, traceId, scheduledAt
- `CMSResponse` - result, error
- `validateCMSRequest()` - Validation function

#### GSC Schema
- `GSCAnalyticsRequest` - propertyUrl, startDate, endDate, dimensions, executionId, tenantId, traceId
- `GSCResponse` - result, error
- `validateGSCRequest()` - Validation function

#### GA4 Schema
- `GA4AnalyticsRequest` - propertyId, startDate, endDate, metrics, dimensions, executionId, tenantId, traceId
- `GA4Response` - result, error
- `validateGA4Request()` - Validation function

**Verdict**: **WELL DEFINED** - All provider schemas are properly defined with validation

**Readiness**: **90%**

---

## N8N INTEGRATION GUIDE AUDIT

### Documentation Status

**File**: `N8N_INTEGRATION_GUIDE.md` (349 lines)

**Documented Topics**:
1. Endpoint + Authentication
2. Contract Rules
3. Event Payload Examples
4. Artifact Mapping
5. Recommended n8n Flow Order
6. Common Errors + Fixes
7. Paste-Ready Base JSON Template

**Endpoint Documentation**:
```
POST /api/v1/orchestrator/n8n-callback
Headers:
  x-claux-secret: <ORG_API_SECRET>
  Content-Type: application/json
```

**Event Types Documented**:
- `task_created`
- `agent_started`
- `heartbeat`
- `agent_completed`
- `agent_failed`

**Agent Names Documented**:
- ARIA, SCRIBE, VISUAL, FORGE, CORE, LINX, LOCL, REPUTE, AMPLI

**Issues**:
1. **VISUAL and FORGE agents not found in code** - Documentation includes agents that don't exist
2. Callback endpoint documented but not inspected
3. No n8n workflow definitions provided
4. No n8n setup instructions
5. No n8n authentication instructions

**Verdict**: **WELL DOCUMENTED** but includes non-existent agents

**Readiness**: **70%**

---

## N8N CALLBACK ENDPOINT AUDIT

### Callback Route

**Documented Endpoint**: `/api/v1/orchestrator/n8n-callback`

**Implementation Status**: **NOT INSPECTED**

**Expected Behavior**:
- Receive n8n callbacks
- Validate x-claux-secret header
- Update execution state based on event type
- Update task status based on event type
- Publish events
- Write logs

**Issues**:
1. Callback route implementation not inspected
2. Unknown if callback handler exists
3. Unknown if callback validation works
4. Unknown if callback updates execution state
5. Unknown if callback triggers task continuation

**Verdict**: **NOT VERIFIED**

**Readiness**: **0%**

---

## N8N DISPATCH ROUTES AUDIT

### Dispatch Routes

**Route Structure**: `/api/integrations/dispatch/{provider}`

**Providers**:
- `/api/integrations/dispatch/openai`
- `/api/integrations/dispatch/dataforseo`
- `/api/integrations/dispatch/gsc`
- `/api/integrations/dispatch/gbp`
- `/api/integrations/dispatch/cms`

**Implementation Status**: **NOT INSPECTED**

**Expected Behavior**:
- Validate request payload
- Call n8n webhook
- Return n8n response
- Handle errors
- Log dispatch events

**Issues**:
1. Dispatch route implementation not inspected
2. Unknown if dispatch calls n8n
3. Unknown if dispatch validates payloads
4. Unknown if dispatch handles errors
5. Unknown if dispatch logs events

**Verdict**: **NOT VERIFIED**

**Readiness**: **0%**

---

## N8N WORKFLOW DEFINITIONS AUDIT

### Workflow Status

**Expected**: n8n workflow definitions for each provider

**Actual**: **NOT FOUND**

**Search Results**:
- No n8n workflow JSON files found
- No n8n workflow definitions in code
- No n8n workflow documentation beyond guide

**Issues**:
1. **NO N8N WORKFLOWS FOUND**
2. Integration guide references workflows but doesn't provide them
3. Unknown if n8n workflows exist in n8n instance
4. Unknown if n8n workflows are configured correctly

**Verdict**: **NOT FOUND**

**Readiness**: **0%**

---

## N8N FEATURE FLAGS AUDIT

### Feature Flag Control

**Environment Variables**:
- `ENABLE_ARIA_DISPATCH_EXECUTION`
- `ENABLE_SCRIBE_DISPATCH_EXECUTION`
- `ENABLE_LINX_DISPATCH_EXECUTION`
- `ENABLE_LOCL_DISPATCH_EXECUTION`
- `ENABLE_REPUTE_DISPATCH_EXECUTION`
- `ENABLE_PRISM_DISPATCH_EXECUTION`
- `ENABLE_PULSE_DISPATCH_EXECUTION`
- `ENABLE_AMPLI_DISPATCH_EXECUTION`

**Implementation**: `lib/integrations/mesh/feature-flags.ts`

**Function**: `isDispatchExecutionEnabled(agentName)`

**Issues**:
1. Feature flags not documented in .env.example
2. Unknown default behavior (true or false)
3. Can disable entire n8n integration by setting all flags to false
4. No granular control per provider

**Verdict**: **IMPLEMENTED** but not documented

**Readiness**: **50%**

---

## N8N ARTIFACT MAPPING AUDIT

### Artifact Persistence

**Documented in Integration Guide**:

#### SCRIBE Artifacts
- Payload key: `scribe_artifact`
- Target table: `agent_artifacts_scribe_content`
- Fields: title, slug, keyword, language, content_markdown, content_html, seo_meta, publish_target, publish_status, external_url

#### VISUAL Artifacts
- Payload key: `visual_artifact`
- Target table: `agent_artifacts_visual_images`
- Fields: prompt, style, generation_model, image_url, storage_path, width, height, mime_type, alt_text, og_image_for_url, status

**Issues**:
1. VISUAL agent not found in code (documentation includes non-existent agent)
2. Artifact tables may not exist in database
3. Artifact insertion logic not verified
4. Unknown if callback handler inserts artifacts

**Verdict**: **DOCUMENTED** but references non-existent agent

**Readiness**: **30%**

---

## N8N AGENT COVERAGE AUDIT

### Agent Integration Status

| Agent | Dispatch Integration | Callback Support | Artifact Support | Overall Status |
|-------|---------------------|-----------------|-----------------|----------------|
| ARIA | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| SCRIBE | ✓ (feature flag) | ✓ (documented) | ✓ (documented) | PARTIAL |
| VISUAL | ✗ (not in code) | ✓ (documented) | ✓ (documented) | N/A |
| FORGE | ✗ (not in code) | ✓ (documented) | ✗ | N/A |
| CORE | ✗ (not in code) | ✓ (documented) | ✗ | N/A |
| LINX | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| LOCL | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| REPUTE | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| AMPLI | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| PRISM | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |
| PULSE | ✓ (feature flag) | ✓ (documented) | ✗ | PARTIAL |

**Issues**:
1. Documentation includes 3 agents that don't exist (VISUAL, FORGE, CORE)
2. Only SCRIBE has artifact support documented
3. Callback support documented for all but not verified

**Verdict**: **PARTIAL** - 6 of 9 actual agents have dispatch integration

**Readiness**: **50%**

---

## N8N ENVIRONMENT VARIABLES AUDIT

### Required Variables

**From Integration Guide**:
- `N8N_WEBHOOK_URL` - n8n webhook URL (not in .env.example)
- `N8N_API_KEY` - n8n API key (not in .env.example)
- `ORG_API_SECRET` - Organization API secret for callback validation (not in .env.example)

**Issues**:
1. N8N variables not documented in .env.example
2. ORG_API_SECRET not documented in .env.example
3. Unknown how to obtain n8n webhook URL
4. Unknown how to obtain n8n API key
5. Unknown how to generate ORG_API_SECRET

**Verdict**: **NOT DOCUMENTED**

**Readiness**: **0%**

---

## N8N ERROR HANDLING AUDIT

### Error Handling

**Documented Errors** (from Integration Guide):
- `401 Missing X-Claux-Secret header` - Header not set in n8n node
- `401 Invalid secret` - Secret does not match organizations.api_secret
- `400 task_id is required` - Missing task_id for certain events
- `400 Invalid or missing agent_name` - Agent name not in allowed list

**Implementation Status**: **NOT VERIFIED**

**Issues**:
1. Error handling not inspected in code
2. Unknown if errors are actually returned
3. Unknown if error messages match documentation
4. Unknown if error logging works

**Verdict**: **DOCUMENTED** but not verified

**Readiness**: **30%**

---

## N8N TESTING STATUS

### Test Coverage

**Unit Tests**: NOT FOUND
- No unit tests for n8n integration found
- No mock tests for n8n callbacks found

**Integration Tests**: NOT FOUND
- No integration tests with actual n8n instance found
- No end-to-end tests found

**Manual Testing**: NOT VERIFIED
- No evidence of manual testing
- No test reports found

**Verdict**: **NO TEST COVERAGE**

**Readiness**: **0%**

---

## N8N READINESS SUMMARY

### By Category

**Schema Definitions**: 90% (all schemas defined with validation)

**Documentation**: 70% (comprehensive guide but includes non-existent agents)

**Callback Implementation**: 0% (not inspected)

**Dispatch Implementation**: 0% (not inspected)

**Workflow Definitions**: 0% (not found)

**Feature Flags**: 50% (implemented but not documented)

**Environment Variables**: 0% (not documented)

**Error Handling**: 30% (documented but not verified)

**Test Coverage**: 0% (no tests)

**Overall N8N Readiness**: **30%**

---

## CRITICAL N8N ISSUES

### Blocking Issues

1. **No n8n Workflows Found** (CRITICAL)
   - Issue: No n8n workflow definitions exist
   - Impact: n8n cannot execute provider calls
   - Fix: Create n8n workflows for each provider
   - Time to Fix: 1-2 weeks

2. **Callback Not Verified** (HIGH)
   - Issue: Callback endpoint not inspected
   - Impact: Unknown if callbacks update execution state
   - Fix: Inspect and verify callback implementation
   - Time to Fix: 1-2 days

3. **Dispatch Not Verified** (HIGH)
   - Issue: Dispatch routes not inspected
   - Impact: Unknown if dispatch calls n8n
   - Fix: Inspect and verify dispatch implementation
   - Time to Fix: 1-2 days

4. **Missing Environment Variables** (HIGH)
   - Issue: N8N variables not documented
   - Impact: Deployment configuration errors
   - Fix: Document all required n8n env vars
   - Time to Fix: 30 minutes

5. **Documentation Includes Non-Existent Agents** (MEDIUM)
   - Issue: VISUAL, FORGE, CORE documented but don't exist
   - Impact: Confusion, misleading documentation
   - Fix: Remove or correct documentation
   - Time to Fix: 1 hour

---

## CONCLUSION

**N8N INTEGRATION REALITY**: **30% READY**

**Key Findings**:
1. Schemas are well-defined with validation
2. Integration guide is comprehensive but includes non-existent agents
3. Callback and dispatch routes not verified
4. No n8n workflow definitions found
5. Feature flags implemented but not documented
6. No test coverage
7. Environment variables not documented

**Recommendation**:
1. Create n8n workflows for each provider (1-2 weeks)
2. Inspect and verify callback implementation (1-2 days)
3. Inspect and verify dispatch implementation (1-2 days)
4. Document all required environment variables (30 minutes)
5. Correct documentation to remove non-existent agents (1 hour)
6. Add integration tests (1 week)

**Timeline to N8N Readiness**: 2-3 weeks of focused development
