/**
 * Trend Storage Service
 * 
 * Canonical service for trend data foundation in CLAUX V1.
 * Prepares data model for trend graphs, ensures data structure supports trend analysis.
 * 
 * CRITICAL: This is the ONLY trend storage service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Trend data point
 */
export interface TrendDataPoint {
  date: string;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * Trend aggregation result
 */
export interface TrendAggregation {
  dataPoints: TrendDataPoint[];
  average: number;
  min: number;
  max: number;
  trend: 'up' | 'down' | 'stable';
  growthRate?: number;
}

/**
 * Trend storage service
 */
export class TrendStorageService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Calculate ranking trend from ranking history
   */
  async calculateRankingTrend(
    tenantId: UUID,
    keyword: string,
    token: string,
    days: number = 30
  ): Promise<TrendAggregation> {
    this.logger.info('Calculating ranking trend', { tenantId, keyword, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ranking_history')
      .select('position, created_at')
      .eq('tenant_id', tenantId)
      .eq('keyword', keyword)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to calculate ranking trend', { error, tenantId, keyword });
      throw new Error(`Failed to calculate ranking trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const dataPoints: TrendDataPoint[] = data.map((r: unknown) => {
      const record = r as { position: number; created_at: string };
      return {
        date: record.created_at.split('T')[0],
        value: record.position,
      };
    });

    const values = dataPoints.map((dp) => dp.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let growthRate: number | undefined;

    if (lastValue < firstValue - 5) {
      trend = 'up';
      growthRate = ((firstValue - lastValue) / firstValue) * 100;
    } else if (lastValue > firstValue + 5) {
      trend = 'down';
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    }

    this.logger.info('Ranking trend calculated successfully', { 
      tenantId, 
      keyword, 
      average,
      trend 
    });

    return {
      dataPoints,
      average,
      min,
      max,
      trend,
      growthRate,
    };
  }

  /**
   * Calculate backlink growth trend
   */
  async calculateBacklinkGrowthTrend(
    tenantId: UUID,
    targetUrl: string,
    token: string,
    days: number = 30
  ): Promise<TrendAggregation> {
    this.logger.info('Calculating backlink growth trend', { tenantId, targetUrl, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('backlink_snapshots')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .eq('target_url', targetUrl)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to calculate backlink growth trend', { error, tenantId, targetUrl });
      throw new Error(`Failed to calculate backlink growth trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    // Group by date and count
    const dateCounts = new Map<string, number>();
    data.forEach((r: unknown) => {
      const record = r as { created_at: string };
      const date = record.created_at.split('T')[0];
      dateCounts.set(date, (dateCounts.get(date) || 0) + 1);
    });

    const dataPoints: TrendDataPoint[] = Array.from(dateCounts.entries())
      .map(([date, count]) => ({ date, value: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const values = dataPoints.map((dp) => dp.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let growthRate: number | undefined;

    if (lastValue > firstValue) {
      trend = 'up';
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    } else if (lastValue < firstValue) {
      trend = 'down';
      growthRate = ((firstValue - lastValue) / firstValue) * 100;
    }

    this.logger.info('Backlink growth trend calculated successfully', { 
      tenantId, 
      targetUrl, 
      average,
      trend 
    });

    return {
      dataPoints,
      average,
      min,
      max,
      trend,
      growthRate,
    };
  }

  /**
   * Calculate technical health trend
   */
  async calculateTechnicalHealthTrend(
    tenantId: UUID,
    url: string,
    token: string,
    days: number = 30
  ): Promise<TrendAggregation> {
    this.logger.info('Calculating technical health trend', { tenantId, url, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('technical_audit_snapshots')
      .select('technical_health_score, created_at')
      .eq('tenant_id', tenantId)
      .eq('url', url)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to calculate technical health trend', { error, tenantId, url });
      throw new Error(`Failed to calculate technical health trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const dataPoints: TrendDataPoint[] = data
      .filter((r: unknown) => {
        const record = r as { technical_health_score: number | null };
        return record.technical_health_score !== null;
      })
      .map((r: unknown) => {
        const record = r as { technical_health_score: number; created_at: string };
        return {
          date: record.created_at.split('T')[0],
          value: record.technical_health_score,
        };
      });

    if (dataPoints.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const values = dataPoints.map((dp) => dp.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let growthRate: number | undefined;

    if (lastValue > firstValue + 5) {
      trend = 'up';
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    } else if (lastValue < firstValue - 5) {
      trend = 'down';
      growthRate = ((firstValue - lastValue) / firstValue) * 100;
    }

    this.logger.info('Technical health trend calculated successfully', { 
      tenantId, 
      url, 
      average,
      trend 
    });

    return {
      dataPoints,
      average,
      min,
      max,
      trend,
      growthRate,
    };
  }

  /**
   * Calculate AI visibility trend
   */
  async calculateAiVisibilityTrend(
    tenantId: UUID,
    keyword: string,
    token: string,
    days: number = 30
  ): Promise<TrendAggregation> {
    this.logger.info('Calculating AI visibility trend', { tenantId, keyword, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ai_visibility_snapshots')
      .select('ai_visibility_score, created_at')
      .eq('tenant_id', tenantId)
      .eq('keyword', keyword)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to calculate AI visibility trend', { error, tenantId, keyword });
      throw new Error(`Failed to calculate AI visibility trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const dataPoints: TrendDataPoint[] = data
      .filter((r: unknown) => {
        const record = r as { ai_visibility_score: number | null };
        return record.ai_visibility_score !== null;
      })
      .map((r: unknown) => {
        const record = r as { ai_visibility_score: number; created_at: string };
        return {
          date: record.created_at.split('T')[0],
          value: record.ai_visibility_score,
        };
      });

    if (dataPoints.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const values = dataPoints.map((dp) => dp.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let growthRate: number | undefined;

    if (lastValue > firstValue + 5) {
      trend = 'up';
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    } else if (lastValue < firstValue - 5) {
      trend = 'down';
      growthRate = ((firstValue - lastValue) / firstValue) * 100;
    }

    this.logger.info('AI visibility trend calculated successfully', { 
      tenantId, 
      keyword, 
      average,
      trend 
    });

    return {
      dataPoints,
      average,
      min,
      max,
      trend,
      growthRate,
    };
  }

  /**
   * Calculate review sentiment trend
   */
  async calculateReviewSentimentTrend(
    tenantId: UUID,
    platform: string,
    token: string,
    days: number = 30,
    locationId?: string
  ): Promise<TrendAggregation> {
    this.logger.info('Calculating review sentiment trend', { tenantId, platform, locationId, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('review_snapshots')
      .select('sentiment_score, created_at')
      .eq('tenant_id', tenantId)
      .eq('platform', platform)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (locationId) {
      query = query.eq('location_id', locationId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to calculate review sentiment trend', { error, tenantId, platform });
      throw new Error(`Failed to calculate review sentiment trend: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const dataPoints: TrendDataPoint[] = data
      .filter((r: unknown) => {
        const record = r as { sentiment_score: number | null };
        return record.sentiment_score !== null;
      })
      .map((r: unknown) => {
        const record = r as { sentiment_score: number; created_at: string };
        return {
          date: record.created_at.split('T')[0],
          value: record.sentiment_score,
        };
      });

    if (dataPoints.length === 0) {
      return {
        dataPoints: [],
        average: 0,
        min: 0,
        max: 0,
        trend: 'stable',
      };
    }

    const values = dataPoints.map((dp) => dp.value);
    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Calculate trend
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let growthRate: number | undefined;

    if (lastValue > firstValue + 0.1) {
      trend = 'up';
      growthRate = ((lastValue - firstValue) / firstValue) * 100;
    } else if (lastValue < firstValue - 0.1) {
      trend = 'down';
      growthRate = ((firstValue - lastValue) / firstValue) * 100;
    }

    this.logger.info('Review sentiment trend calculated successfully', { 
      tenantId, 
      platform, 
      average,
      trend 
    });

    return {
      dataPoints,
      average,
      min,
      max,
      trend,
      growthRate,
    };
  }
}

/**
 * Singleton instance
 */
export const trendStorageService = new TrendStorageService();
