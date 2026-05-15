# N8N WORKFLOW CONTRACT REPORT

**Phase:** Phase Z3 - Live Agent Migration + n8n Workflow Convergence  
**Status:** COMPLETED

## N8N PAYLOAD CONTRACTS

**Location:** `lib/integrations/mesh/contracts/n8n-schemas.ts`

## SCHEMAS DEFINED

### OpenAI Schema
**Request:**
- prompt
- executionId
- tenantId
- traceId
- replayId (optional)
- model (optional)
- temperature (optional)
- maxTokens (optional)
- systemPrompt (optional)
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- usage (optional)
- error (optional)

**Validation:** `validateOpenAIRequest()`

### DataForSEO Schema
**Keyword Request:**
- keywords
- executionId
- tenantId
- traceId
- replayId (optional)
- locationName (optional)
- languageName (optional)
- metadata (optional)

**SERP Request:**
- keyword
- executionId
- tenantId
- traceId
- replayId (optional)
- locationName (optional)
- languageName (optional)
- depth (optional)
- metadata (optional)

**Backlink Request:**
- targetDomain
- executionId
- tenantId
- traceId
- replayId (optional)
- limit (optional)
- offset (optional)
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- error (optional)

**Validation:** `validateDataForSEORequest()`

### GBP Schema
**Sync Request:**
- locationId
- executionId
- tenantId
- traceId
- replayId (optional)
- syncType (full/incremental)
- metadata (optional)

**Review Request:**
- locationId
- executionId
- tenantId
- traceId
- replayId (optional)
- limit (optional)
- metadata (optional)

**Local Ranking Request:**
- locationId
- keyword
- executionId
- tenantId
- traceId
- replayId (optional)
- locationName (optional)
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- error (optional)

**Validation:** `validateGBPRequest()`

### CMS Schema
**Publish Request:**
- platform (wordpress/shopify/webflow/ghost)
- contentId
- executionId
- tenantId
- traceId
- replayId (optional)
- publishType (immediate/scheduled)
- scheduledAt (optional)
- metadata (optional)

**Rollback Request:**
- platform (wordpress/shopify/webflow/ghost)
- contentId
- executionId
- tenantId
- traceId
- replayId (optional)
- rollbackToVersion
- metadata (optional)

**Scheduled Publish Request:**
- platform (wordpress/shopify/webflow/ghost)
- contentId
- executionId
- tenantId
- traceId
- replayId (optional)
- scheduledAt
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- error (optional)

**Validation:** `validateCMSRequest()`

### GSC Schema
**Analytics Request:**
- propertyUrl
- startDate
- endDate
- dimensions (optional)
- executionId
- tenantId
- traceId
- replayId (optional)
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- error (optional)

**Validation:** `validateGSCRequest()`

### GA4 Schema
**Analytics Request:**
- propertyId
- startDate
- endDate
- metrics (optional)
- dimensions (optional)
- executionId
- tenantId
- traceId
- replayId (optional)
- metadata (optional)

**Response:**
- executionId
- tenantId
- traceId
- result
- error (optional)

**Validation:** `validateGA4Request()`

## SUCCESS CRITERIA

✅ Strict payload schemas defined
✅ Validation functions implemented
✅ All providers covered
✅ Execution metadata included
✅ Replay metadata included
✅ Trace IDs included
✅ Error handling defined
