/**
 * CLAUX V1 Canonical Task Payload Types
 * Simple, deterministic types for task payloads
 * NO abstractions, NO enterprise patterns
 */

/**
 * ARIA Task Payloads
 */
export interface AriaKeywordResearchPayload {
  domain: string;
  location: string;
  language: string;
}

/**
 * SCRIBE Task Payloads
 */
export interface ScribeArticleGenerationPayload {
  keyword: string;
  businessCategory: string;
  tone: string;
  wordCount: number;
}

/**
 * PUBLISH Task Payloads
 */
export interface PublishPackageGenerationPayload {
  contentId: string;
  contentType: 'article' | 'page' | 'product';
  targetUrl?: string;
}

/**
 * PULSE Task Payloads
 */
export interface PulseRankingCheckPayload {
  keywords: string[];
  location: string;
  device: 'desktop' | 'mobile';
}

/**
 * LOCL Task Payloads
 */
export interface LoclGmbAuditPayload {
  locationId: string;
  businessName: string;
  address: string;
}

/**
 * REPUTE Task Payloads
 */
export interface ReputeReviewMonitorPayload {
  platform: 'google' | 'yelp' | 'tripadvisor';
  locationId: string;
  daysToMonitor: number;
}

/**
 * LINX Task Payloads
 */
export interface LinxBacklinkAnalysisPayload {
  targetUrl: string;
  competitorUrls: string[];
}

/**
 * PRISM Task Payloads
 */
export interface PrismAnalyticsReviewPayload {
  dateRange: string;
  metrics: string[];
}

/**
 * CORE Task Payloads
 */
export interface CoreTechnicalAuditPayload {
  url: string;
  auditType: 'full' | 'quick' | 'schema';
}
