/**
 * Snapshot Persistence Service
 * 
 * Canonical service for persisting snapshot data in CLAUX V1.
 * Validates payloads, validates tenant ownership, attaches trace IDs, appends snapshots.
 * 
 * CRITICAL: This is the ONLY snapshot persistence service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { validateOrThrow } from '@/lib/validation/zod-validator';
import { z } from 'zod';

/**
 * SERP snapshot payload
 */
export interface SerpSnapshotPayload {
  keyword: string;
  location: string;
  language: string;
  rankings: Record<string, unknown>;
  featuredSnippet?: Record<string, unknown>;
  aiOverview?: Record<string, unknown>;
  totalResults?: number;
}

/**
 * Backlink snapshot payload
 */
export interface BacklinkSnapshotPayload {
  targetUrl: string;
  sourceDomain: string;
  sourceUrl: string;
  domainAuthority?: number;
  pageAuthority?: number;
  dofollow: boolean;
  anchorText?: string;
  linkType?: string;
}

/**
 * Technical audit snapshot payload
 */
export interface TechnicalAuditSnapshotPayload {
  url: string;
  crawlId?: string;
  statusCode?: number;
  title?: string;
  metaDescription?: string;
  h1?: string;
  h2?: string;
  canonical?: string;
  indexability?: string;
  technicalHealthScore?: number;
  issues?: Record<string, unknown>;
}

/**
 * GA4 snapshot payload
 */
export interface Ga4SnapshotPayload {
  propertyId: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  sessions?: number;
  users?: number;
  pageviews?: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  conversions?: number;
  trafficSources?: Record<string, unknown>;
  topPages?: Record<string, unknown>;
}

/**
 * GSC snapshot payload
 */
export interface GscSnapshotPayload {
  siteUrl: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  avgPosition?: number;
  queries?: Record<string, unknown>;
  pages?: Record<string, unknown>;
}

/**
 * Review snapshot payload
 */
export interface ReviewSnapshotPayload {
  platform: string;
  locationId?: string;
  locationName?: string;
  totalReviews?: number;
  averageRating?: number;
  ratingDistribution?: Record<string, unknown>;
  recentReviews?: Record<string, unknown>;
  sentimentScore?: number;
}

/**
 * AI visibility snapshot payload
 */
export interface AiVisibilitySnapshotPayload {
  keyword: string;
  location: string;
  aiOverviewPresent: boolean;
  aiOverviewText?: string;
  aiOverviewSources?: Record<string, unknown>;
  featuredSnippetPresent: boolean;
  featuredSnippetText?: string;
  aiVisibilityScore?: number;
}

/**
 * Keyword universe history payload
 */
export interface KeywordUniverseHistoryPayload {
  keyword: string;
  location: string;
  language: string;
  searchVolume?: number;
  keywordDifficulty?: number;
  cpc?: number;
  searchIntent?: string;
  opportunityScore?: number;
  competitionScore?: number;
}

/**
 * Snapshot persistence service
 */
export class SnapshotPersistenceService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Persist SERP snapshot
   */
  async persistSerpSnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: SerpSnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting SERP snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('serp_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      keyword: payload.keyword,
      location: payload.location,
      language: payload.language,
      rankings: payload.rankings,
      featured_snippet: payload.featuredSnippet,
      ai_overview: payload.aiOverview,
      total_results: payload.totalResults,
    });

    if (error) {
      this.logger.error('Failed to persist SERP snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist SERP snapshot: ${error.message}`);
    }

    this.logger.info('SERP snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist backlink snapshot
   */
  async persistBacklinkSnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: BacklinkSnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting backlink snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('backlink_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      target_url: payload.targetUrl,
      source_domain: payload.sourceDomain,
      source_url: payload.sourceUrl,
      domain_authority: payload.domainAuthority,
      page_authority: payload.pageAuthority,
      dofollow: payload.dofollow,
      anchor_text: payload.anchorText,
      link_type: payload.linkType,
    });

    if (error) {
      this.logger.error('Failed to persist backlink snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist backlink snapshot: ${error.message}`);
    }

    this.logger.info('Backlink snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist technical audit snapshot
   */
  async persistTechnicalAuditSnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: TechnicalAuditSnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting technical audit snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('technical_audit_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      url: payload.url,
      crawl_id: payload.crawlId,
      status_code: payload.statusCode,
      title: payload.title,
      meta_description: payload.metaDescription,
      h1: payload.h1,
      h2: payload.h2,
      canonical: payload.canonical,
      indexability: payload.indexability,
      technical_health_score: payload.technicalHealthScore,
      issues: payload.issues,
    });

    if (error) {
      this.logger.error('Failed to persist technical audit snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist technical audit snapshot: ${error.message}`);
    }

    this.logger.info('Technical audit snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist GA4 snapshot
   */
  async persistGa4Snapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: Ga4SnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting GA4 snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('ga4_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      property_id: payload.propertyId,
      date_range_start: payload.dateRangeStart,
      date_range_end: payload.dateRangeEnd,
      sessions: payload.sessions,
      users: payload.users,
      pageviews: payload.pageviews,
      bounce_rate: payload.bounceRate,
      avg_session_duration: payload.avgSessionDuration,
      conversions: payload.conversions,
      traffic_sources: payload.trafficSources,
      top_pages: payload.topPages,
    });

    if (error) {
      this.logger.error('Failed to persist GA4 snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist GA4 snapshot: ${error.message}`);
    }

    this.logger.info('GA4 snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist GSC snapshot
   */
  async persistGscSnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: GscSnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting GSC snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('gsc_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      site_url: payload.siteUrl,
      date_range_start: payload.dateRangeStart,
      date_range_end: payload.dateRangeEnd,
      clicks: payload.clicks,
      impressions: payload.impressions,
      ctr: payload.ctr,
      avg_position: payload.avgPosition,
      queries: payload.queries,
      pages: payload.pages,
    });

    if (error) {
      this.logger.error('Failed to persist GSC snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist GSC snapshot: ${error.message}`);
    }

    this.logger.info('GSC snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist review snapshot
   */
  async persistReviewSnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: ReviewSnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting review snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('review_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      platform: payload.platform,
      location_id: payload.locationId,
      location_name: payload.locationName,
      total_reviews: payload.totalReviews,
      average_rating: payload.averageRating,
      rating_distribution: payload.ratingDistribution,
      recent_reviews: payload.recentReviews,
      sentiment_score: payload.sentimentScore,
    });

    if (error) {
      this.logger.error('Failed to persist review snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist review snapshot: ${error.message}`);
    }

    this.logger.info('Review snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist AI visibility snapshot
   */
  async persistAiVisibilitySnapshot(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: AiVisibilitySnapshotPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting AI visibility snapshot', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('ai_visibility_snapshots').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      keyword: payload.keyword,
      location: payload.location,
      ai_overview_present: payload.aiOverviewPresent,
      ai_overview_text: payload.aiOverviewText,
      ai_overview_sources: payload.aiOverviewSources,
      featured_snippet_present: payload.featuredSnippetPresent,
      featured_snippet_text: payload.featuredSnippetText,
      ai_visibility_score: payload.aiVisibilityScore,
    });

    if (error) {
      this.logger.error('Failed to persist AI visibility snapshot', { error, tenantId, traceId });
      throw new Error(`Failed to persist AI visibility snapshot: ${error.message}`);
    }

    this.logger.info('AI visibility snapshot persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist keyword universe history
   */
  async persistKeywordUniverseHistory(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: KeywordUniverseHistoryPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting keyword universe history', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('keyword_universe_history').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      keyword: payload.keyword,
      location: payload.location,
      language: payload.language,
      search_volume: payload.searchVolume,
      keyword_difficulty: payload.keywordDifficulty,
      cpc: payload.cpc,
      search_intent: payload.searchIntent,
      opportunity_score: payload.opportunityScore,
      competition_score: payload.competitionScore,
    });

    if (error) {
      this.logger.error('Failed to persist keyword universe history', { error, tenantId, traceId });
      throw new Error(`Failed to persist keyword universe history: ${error.message}`);
    }

    this.logger.info('Keyword universe history persisted successfully', { tenantId, traceId });
  }
}

/**
 * Singleton instance
 */
export const snapshotPersistenceService = new SnapshotPersistenceService();
