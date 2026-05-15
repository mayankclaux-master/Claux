/**
 * n8n Workflow Payload Contracts
 * 
 * Strict payload schemas for n8n workflows.
 */

// OpenAI Schema
export interface OpenAIRequest {
  prompt: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
}

export interface OpenAIResponse {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

// DataForSEO Schema
export interface DataForSEOKeywordRequest {
  keywords: string[];
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  locationName?: string;
  languageName?: string;
  metadata?: Record<string, unknown>;
}

export interface DataForSEOSERPRequest {
  keyword: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  locationName?: string;
  languageName?: string;
  depth?: number;
  metadata?: Record<string, unknown>;
}

export interface DataForSEOBacklinkRequest {
  targetDomain: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  limit?: number;
  offset?: number;
  metadata?: Record<string, unknown>;
}

export interface DataForSEOResponse {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: unknown;
  error?: string;
}

// GBP Schema
export interface GBPSyncRequest {
  locationId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  syncType: 'full' | 'incremental';
  metadata?: Record<string, unknown>;
}

export interface GBPReviewRequest {
  locationId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  limit?: number;
  metadata?: Record<string, unknown>;
}

export interface GBPLocalRankingRequest {
  locationId: string;
  keyword: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  locationName?: string;
  metadata?: Record<string, unknown>;
}

export interface GBPResponse {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: unknown;
  error?: string;
}

// CMS Schema
export interface CMSPublishRequest {
  platform: 'wordpress' | 'shopify' | 'webflow' | 'ghost';
  contentId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  publishType: 'immediate' | 'scheduled';
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CMSRollbackRequest {
  platform: 'wordpress' | 'shopify' | 'webflow' | 'ghost';
  contentId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  rollbackToVersion: string;
  metadata?: Record<string, unknown>;
}

export interface CMSScheduledPublishRequest {
  platform: 'wordpress' | 'shopify' | 'webflow' | 'ghost';
  contentId: string;
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  scheduledAt: string;
  metadata?: Record<string, unknown>;
}

export interface CMSResponse {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: unknown;
  error?: string;
}

// GSC Schema
export interface GSCAnalyticsRequest {
  propertyUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  metadata?: Record<string, unknown>;
}

export interface GSCResponse {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: unknown;
  error?: string;
}

// GA4 Schema
export interface GA4AnalyticsRequest {
  propertyId: string;
  startDate: string;
  endDate: string;
  metrics?: string[];
  dimensions?: string[];
  executionId: string;
  tenantId: string;
  traceId: string;
  replayId?: string;
  metadata?: Record<string, unknown>;
}

export interface GA4Response {
  executionId: string;
  tenantId: string;
  traceId: string;
  result: unknown;
  error?: string;
}

// Validation functions
export function validateOpenAIRequest(request: unknown): request is OpenAIRequest {
  const req = request as OpenAIRequest;
  return !!(req.prompt && req.executionId && req.tenantId && req.traceId);
}

export function validateDataForSEORequest(request: unknown): request is DataForSEOKeywordRequest | DataForSEOSERPRequest | DataForSEOBacklinkRequest {
  const req = request as DataForSEOKeywordRequest | DataForSEOSERPRequest | DataForSEOBacklinkRequest;
  return !!(req.executionId && req.tenantId && req.traceId);
}

export function validateGBPRequest(request: unknown): request is GBPSyncRequest | GBPReviewRequest | GBPLocalRankingRequest {
  const req = request as GBPSyncRequest | GBPReviewRequest | GBPLocalRankingRequest;
  return !!(req.executionId && req.tenantId && req.traceId);
}

export function validateCMSRequest(request: unknown): request is CMSPublishRequest | CMSRollbackRequest | CMSScheduledPublishRequest {
  const req = request as CMSPublishRequest | CMSRollbackRequest | CMSScheduledPublishRequest;
  return !!(req.platform && req.contentId && req.executionId && req.tenantId && req.traceId);
}

export function validateGSCRequest(request: unknown): request is GSCAnalyticsRequest {
  const req = request as GSCAnalyticsRequest;
  return !!(req.propertyUrl && req.startDate && req.endDate && req.executionId && req.tenantId && req.traceId);
}

export function validateGA4Request(request: unknown): request is GA4AnalyticsRequest {
  const req = request as GA4AnalyticsRequest;
  return !!(req.propertyId && req.startDate && req.endDate && req.executionId && req.tenantId && req.traceId);
}
