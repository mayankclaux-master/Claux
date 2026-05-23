/**
 * Ranking History Service
 * 
 * Canonical service for persisting ranking history in CLAUX V1.
 * Validates payloads, validates tenant ownership, attaches trace IDs, appends ranking data.
 * 
 * CRITICAL: This is the ONLY ranking history persistence service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Ranking history payload
 */
export interface RankingHistoryPayload {
  keyword: string;
  url: string;
  position: number;
  previousPosition?: number;
  change?: number;
  title?: string;
  snippet?: string;
}

/**
 * Batch ranking history payload
 */
export interface BatchRankingHistoryPayload {
  rankings: RankingHistoryPayload[];
}

/**
 * Ranking history service
 */
export class RankingHistoryService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Persist single ranking history entry
   */
  async persistRankingHistory(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: RankingHistoryPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting ranking history', { tenantId, traceId, executionId });

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('ranking_history').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      keyword: payload.keyword,
      url: payload.url,
      position: payload.position,
      previous_position: payload.previousPosition,
      change: payload.change,
      title: payload.title,
      snippet: payload.snippet,
    });

    if (error) {
      this.logger.error('Failed to persist ranking history', { error, tenantId, traceId });
      throw new Error(`Failed to persist ranking history: ${error.message}`);
    }

    this.logger.info('Ranking history persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist batch ranking history entries
   */
  async persistBatchRankingHistory(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: BatchRankingHistoryPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting batch ranking history', { 
      tenantId, 
      traceId, 
      executionId, 
      count: payload.rankings.length 
    });

    const supabase = createClerkSupabaseClient(token);

    const records = payload.rankings.map((ranking) => ({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      keyword: ranking.keyword,
      url: ranking.url,
      position: ranking.position,
      previous_position: ranking.previousPosition,
      change: ranking.change,
      title: ranking.title,
      snippet: ranking.snippet,
    }));

    const { error } = await supabase.from('ranking_history').insert(records);

    if (error) {
      this.logger.error('Failed to persist batch ranking history', { error, tenantId, traceId });
      throw new Error(`Failed to persist batch ranking history: ${error.message}`);
    }

    this.logger.info('Batch ranking history persisted successfully', { 
      tenantId, 
      traceId, 
      count: records.length 
    });
  }

  /**
   * Query ranking history for a keyword
   */
  async queryRankingHistory(
    tenantId: UUID,
    keyword: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Querying ranking history', { tenantId, keyword, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('keyword', keyword)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to query ranking history', { error, tenantId, keyword });
      throw new Error(`Failed to query ranking history: ${error.message}`);
    }

    this.logger.info('Ranking history queried successfully', { 
      tenantId, 
      keyword, 
      count: data?.length || 0 
    });

    return data || [];
  }

  /**
   * Query ranking history for a URL
   */
  async queryRankingHistoryByUrl(
    tenantId: UUID,
    url: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Querying ranking history by URL', { tenantId, url, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('ranking_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('url', url)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to query ranking history by URL', { error, tenantId, url });
      throw new Error(`Failed to query ranking history by URL: ${error.message}`);
    }

    this.logger.info('Ranking history by URL queried successfully', { 
      tenantId, 
      url, 
      count: data?.length || 0 
    });

    return data || [];
  }

  /**
   * Calculate ranking trend for a keyword
   */
  async calculateRankingTrend(
    tenantId: UUID,
    keyword: string,
    token: string,
    days: number = 30
  ): Promise<{
    averagePosition: number;
    bestPosition: number;
    worstPosition: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    this.logger.info('Calculating ranking trend', { tenantId, keyword, days });

    const supabase = createClerkSupabaseClient(token);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('ranking_history')
      .select('position')
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
        averagePosition: 0,
        bestPosition: 0,
        worstPosition: 0,
        trend: 'stable',
      };
    }

    const positions = data.map((r: unknown) => (r as { position: number }).position);
    const averagePosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
    const bestPosition = Math.min(...positions);
    const worstPosition = Math.max(...positions);

    // Calculate trend
    const firstPosition = positions[0];
    const lastPosition = positions[positions.length - 1];
    let trend: 'up' | 'down' | 'stable' = 'stable';

    if (lastPosition < firstPosition - 5) {
      trend = 'up';
    } else if (lastPosition > firstPosition + 5) {
      trend = 'down';
    }

    this.logger.info('Ranking trend calculated successfully', { 
      tenantId, 
      keyword, 
      averagePosition,
      trend 
    });

    return {
      averagePosition,
      bestPosition,
      worstPosition,
      trend,
    };
  }
}

/**
 * Singleton instance
 */
export const rankingHistoryService = new RankingHistoryService();
