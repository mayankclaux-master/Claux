/**
 * Trend Computation Service
 * 
 * Canonical trend computation service for CLAUX V1.
 * Calculates ranking deltas, traffic deltas, backlink growth, technical health trends, sentiment changes, AI visibility trends.
 * Stores computed trend summaries.
 * 
 * CRITICAL: This is the ONLY trend computation service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { trendStorageService } from '../persistence/trend-storage.service';

/**
 * Trend summary
 */
export interface TrendSummary {
  tenantId: UUID;
  trendType: string;
  entity: string;
  currentValue: number;
  previousValue: number;
  delta: number;
  deltaPercent: number;
  trend: 'up' | 'down' | 'stable';
  period: string;
  computedAt: string;
}

/**
 * Trend computation service
 */
export class TrendComputationService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Calculate ranking delta
   */
  async calculateRankingDelta(
    tenantId: UUID,
    keyword: string,
    token: string,
    days: number = 30
  ): Promise<TrendSummary> {
    this.logger.info('Calculating ranking delta', { tenantId, keyword, days });

    const trend = await trendStorageService.calculateRankingTrend(tenantId, keyword, token, days);

    const summary: TrendSummary = {
      tenantId,
      trendType: 'ranking',
      entity: keyword,
      currentValue: trend.average,
      previousValue: trend.min,
      delta: trend.average - trend.min,
      deltaPercent: trend.min > 0 ? ((trend.average - trend.min) / trend.min) * 100 : 0,
      trend: trend.trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('Ranking delta calculated', { tenantId, keyword, summary });
    return summary;
  }

  /**
   * Calculate traffic delta
   */
  async calculateTrafficDelta(
    tenantId: UUID,
    token: string,
    days: number = 30
  ): Promise<TrendSummary> {
    this.logger.info('Calculating traffic delta', { tenantId, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ga4_snapshots')
      .select('sessions, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to calculate traffic delta', { error, tenantId });
      throw new Error(`Failed to calculate traffic delta: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        tenantId,
        trendType: 'traffic',
        entity: 'all',
        currentValue: 0,
        previousValue: 0,
        delta: 0,
        deltaPercent: 0,
        trend: 'stable',
        period: `${days}d`,
        computedAt: new Date().toISOString(),
      };
    }

    const sessions = data.map((r: unknown) => (r as { sessions: number | null }).sessions || 0);
    const currentValue = sessions[sessions.length - 1];
    const previousValue = sessions[0];
    const delta = currentValue - previousValue;
    const deltaPercent = previousValue > 0 ? (delta / previousValue) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (delta > 5) trend = 'up';
    else if (delta < -5) trend = 'down';

    const summary: TrendSummary = {
      tenantId,
      trendType: 'traffic',
      entity: 'all',
      currentValue,
      previousValue,
      delta,
      deltaPercent,
      trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('Traffic delta calculated', { tenantId, summary });
    return summary;
  }

  /**
   * Calculate backlink growth
   */
  async calculateBacklinkGrowth(
    tenantId: UUID,
    targetUrl: string,
    token: string,
    days: number = 30
  ): Promise<TrendSummary> {
    this.logger.info('Calculating backlink growth', { tenantId, targetUrl, days });

    const trend = await trendStorageService.calculateBacklinkGrowthTrend(tenantId, targetUrl, token, days);

    const summary: TrendSummary = {
      tenantId,
      trendType: 'backlink',
      entity: targetUrl,
      currentValue: trend.average,
      previousValue: trend.min,
      delta: trend.average - trend.min,
      deltaPercent: trend.min > 0 ? ((trend.average - trend.min) / trend.min) * 100 : 0,
      trend: trend.trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('Backlink growth calculated', { tenantId, targetUrl, summary });
    return summary;
  }

  /**
   * Calculate technical health trend
   */
  async calculateTechnicalHealthTrend(
    tenantId: UUID,
    url: string,
    token: string,
    days: number = 30
  ): Promise<TrendSummary> {
    this.logger.info('Calculating technical health trend', { tenantId, url, days });

    const trend = await trendStorageService.calculateTechnicalHealthTrend(tenantId, url, token, days);

    const summary: TrendSummary = {
      tenantId,
      trendType: 'technical_health',
      entity: url,
      currentValue: trend.average,
      previousValue: trend.min,
      delta: trend.average - trend.min,
      deltaPercent: trend.min > 0 ? ((trend.average - trend.min) / trend.min) * 100 : 0,
      trend: trend.trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('Technical health trend calculated', { tenantId, url, summary });
    return summary;
  }

  /**
   * Calculate sentiment change
   */
  async calculateSentimentChange(
    tenantId: UUID,
    platform: string,
    token: string,
    days: number = 30,
    locationId?: string
  ): Promise<TrendSummary> {
    this.logger.info('Calculating sentiment change', { tenantId, platform, days });

    const trend = await trendStorageService.calculateReviewSentimentTrend(tenantId, platform, token, days, locationId);

    const summary: TrendSummary = {
      tenantId,
      trendType: 'sentiment',
      entity: platform,
      currentValue: trend.average,
      previousValue: trend.min,
      delta: trend.average - trend.min,
      deltaPercent: trend.min > 0 ? ((trend.average - trend.min) / trend.min) * 100 : 0,
      trend: trend.trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('Sentiment change calculated', { tenantId, platform, summary });
    return summary;
  }

  /**
   * Calculate AI visibility trend
   */
  async calculateAiVisibilityTrend(
    tenantId: UUID,
    keyword: string,
    token: string,
    days: number = 30
  ): Promise<TrendSummary> {
    this.logger.info('Calculating AI visibility trend', { tenantId, keyword, days });

    const trend = await trendStorageService.calculateAiVisibilityTrend(tenantId, keyword, token, days);

    const summary: TrendSummary = {
      tenantId,
      trendType: 'ai_visibility',
      entity: keyword,
      currentValue: trend.average,
      previousValue: trend.min,
      delta: trend.average - trend.min,
      deltaPercent: trend.min > 0 ? ((trend.average - trend.min) / trend.min) * 100 : 0,
      trend: trend.trend,
      period: `${days}d`,
      computedAt: new Date().toISOString(),
    };

    this.logger.info('AI visibility trend calculated', { tenantId, keyword, summary });
    return summary;
  }

  /**
   * Calculate all trends for tenant
   */
  async calculateAllTrendsForTenant(
    tenantId: UUID,
    token: string,
    days: number = 30
  ): Promise<TrendSummary[]> {
    this.logger.info('Calculating all trends for tenant', { tenantId, days });

    const summaries: TrendSummary[] = [];

    // Calculate traffic delta
    try {
      const trafficTrend = await this.calculateTrafficDelta(tenantId, token, days);
      summaries.push(trafficTrend);
    } catch (error) {
      this.logger.error('Failed to calculate traffic delta', { error });
    }

    // Calculate technical health trends (for all URLs)
    try {
      const supabase = createClerkSupabaseClient(token);
      const { data: urls } = await supabase
        .from('technical_audit_snapshots')
        .select('url')
        .eq('tenant_id', tenantId)
        .limit(10);

      if (urls) {
        for (const urlRecord of urls) {
          const url = (urlRecord as { url: string }).url;
          try {
            const techTrend = await this.calculateTechnicalHealthTrend(tenantId, url, token, days);
            summaries.push(techTrend);
          } catch (error) {
            this.logger.error('Failed to calculate technical health trend', { error, url });
          }
        }
      }
    } catch (error) {
      this.logger.error('Failed to get URLs for technical health trends', { error });
    }

    this.logger.info('All trends calculated for tenant', { tenantId, count: summaries.length });
    return summaries;
  }

  /**
   * Store trend summary
   */
  async storeTrendSummary(summary: TrendSummary, token: string): Promise<void> {
    this.logger.info('Storing trend summary', { tenantId: summary.tenantId, trendType: summary.trendType });

    const supabase = createClerkSupabaseClient(token);

    // Store in a trend_summaries table (would need to be created in migration)
    // For now, this is a placeholder
    this.logger.info('Trend summary stored (placeholder)', { summary });
  }

  /**
   * Get trend summaries for tenant
   */
  async getTrendSummaries(
    tenantId: UUID,
    token: string,
    trendType?: string
  ): Promise<TrendSummary[]> {
    this.logger.info('Getting trend summaries', { tenantId, trendType });

    // Placeholder - would query from trend_summaries table
    return [];
  }
}

/**
 * Singleton instance
 */
export const trendComputationService = new TrendComputationService();
