# n8n Workflow Deployment Report

**Phase Z6 - Production Activation**

## Overview

Production-ready n8n workflows deployed for all providers. n8n serves as connector middleware only - no business logic, agent logic, or planning systems in n8n.

## Workflows Deployed

### 1. OPENAI_EXECUTION_WORKFLOW

**Purpose**: Execute OpenAI API requests for SCRIBE content generation

**Input**:
- IntegrationRequest with OpenAI-specific payload
- type: outline_generation | article_generation
- keyword
- businessCategory
- executionId
- tenantId
- traceId
- correlationId
- causationId
- idempotencyKey

**Validation**:
- Signature validation
- Tenant metadata validation
- Idempotency key validation

**Execution**:
- Call OpenAI API with validated request
- Preserve all execution metadata
- Return canonical response

**Callback**:
- Emit canonical callback to CLAUX
- Include all preserved metadata
- Callback URL from IntegrationRequest

**DO NOT**:
- No business logic
- No retry logic
- No planning systems

### 2. DATAFORSEO_EXECUTION_WORKFLOW

**Purpose**: Execute DataForSEO API requests for ARIA, LINX, LOCL, PULSE

**Input**:
- IntegrationRequest with DataForSEO-specific payload
- type: keywords | backlinks | rankings
- target
- executionId
- tenantId
- traceId
- correlationId
- causationId
- idempotencyKey

**Validation**:
- Signature validation
- Tenant metadata validation
- Idempotency key validation

**Execution**:
- Call DataForSEO API with validated request
- Preserve all execution metadata
- Return canonical response

**Callback**:
- Emit canonical callback to CLAUX
- Include all preserved metadata
- Callback URL from IntegrationRequest

### 3. GBP_EXECUTION_WORKFLOW

**Purpose**: Execute Google Business Profile API requests for LOCL, REPUTE

**Input**:
- IntegrationRequest with GBP-specific payload
- type: sync | reviews | rankings
- locationId
- executionId
- tenantId
- traceId
- correlationId
- causationId
- idempotencyKey

**Validation**:
- Signature validation
- Tenant metadata validation
- Idempotency key validation

**Execution**:
- Call GBP API with validated request
- Preserve all execution metadata
- Return canonical response

**Callback**:
- Emit canonical callback to CLAUX
- Include all preserved metadata

### 4. GSC_EXECUTION_WORKFLOW

**Purpose**: Execute Google Search Console API requests for ARIA, PRISM

**Input**:
- IntegrationRequest with GSC-specific payload
- type: analytics | rankings | search_analytics
- siteUrl
- executionId
- tenantId
- traceId
- correlationId
- causationId
- idempotencyKey

**Validation**:
- Signature validation
- Tenant metadata validation
- Idempotency key validation

**Execution**:
- Call GSC API with validated request
- Preserve all execution metadata
- Return canonical response

**Callback**:
- Emit canonical callback to CLAUX
- Include all preserved metadata

### 5. CMS_EXECUTION_WORKFLOW

**Purpose**: Execute CMS API requests for AMPLI publishing

**Input**:
- IntegrationRequest with CMS-specific payload
- cmsType: wordpress | shopify | webflow | ghost
- action: publish | rollback
- content
- executionId
- tenantId
- traceId
- correlationId
- causationId
- idempotencyKey

**Validation**:
- Signature validation
- Tenant metadata validation
- Idempotency key validation

**Execution**:
- Call CMS API with validated request
- Preserve all execution metadata
- Return canonical response

**Callback**:
- Emit canonical callback to CLAUX
- Include all preserved metadata

## Metadata Preservation

All workflows preserve:
- executionId
- taskId
- tenantId
- replayMetadata
- correlationId
- causationId
- idempotencyKey

## Deployment Status

- [x] OPENAI_EXECUTION_WORKFLOW deployed
- [x] DATAFORSEO_EXECUTION_WORKFLOW deployed
- [x] GBP_EXECUTION_WORKFLOW deployed
- [x] GSC_EXECUTION_WORKFLOW deployed
- [x] CMS_EXECUTION_WORKFLOW deployed

## Architecture Compliance

- [x] No business logic in n8n
- [x] No agent logic in n8n
- [x] No retry logic in n8n
- [x] No planning systems in n8n
- [x] n8n is connector middleware only

## Status: COMPLETE
