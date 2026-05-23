/**
 * CLAUX Phase 2B — Keyword Universe Repository
 * Canonical repository for tenant-isolated keyword intelligence
 * Tenant-safe queries only
 */

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type {
  KeywordUniverseEntry,
  KeywordUniverseEntryInsert,
  KeywordUniverseEntryUpdate,
} from './types';

/**
 * Keyword Universe Repository
 * Handles all keyword universe operations with tenant isolation
 * CRITICAL: NO SHARED KEYWORD TABLES - EVERYTHING TENANT ISOLATED
 */
export class KeywordUniverseRepository {
  private supabase = createSupabaseBrowserClient();

  /**
   * Create a new keyword entry
   */
  async createKeyword(keyword: KeywordUniverseEntryInsert): Promise<KeywordUniverseEntry> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .insert({
        ...keyword,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create keyword entry: ${error.message}`);
    }

    return data as KeywordUniverseEntry;
  }

  /**
   * Bulk create keyword entries
   */
  async bulkCreateKeywords(keywords: KeywordUniverseEntryInsert[]): Promise<KeywordUniverseEntry[]> {
    const keywordsWithTimestamps = keywords.map(keyword => ({
      ...keyword,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .insert(keywordsWithTimestamps)
      .select();

    if (error) {
      throw new Error(`Failed to bulk create keywords: ${error.message}`);
    }

    return data as KeywordUniverseEntry[];
  }

  /**
   * Get keyword by ID
   */
  async getKeywordById(keywordId: string, tenantId: string): Promise<KeywordUniverseEntry | null> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .select()
      .eq('id', keywordId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get keyword: ${error.message}`);
    }

    return data as KeywordUniverseEntry;
  }

  /**
   * Get keyword by keyword text for tenant
   */
  async getKeywordByText(keyword: string, tenantId: string): Promise<KeywordUniverseEntry | null> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .select()
      .eq('keyword', keyword)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get keyword by text: ${error.message}`);
    }

    return data as KeywordUniverseEntry;
  }

  /**
   * Get tenant keywords
   */
  async getTenantKeywords(
    tenantId: string,
    clientId?: string,
    limit = 100
  ): Promise<KeywordUniverseEntry[]> {
    let query = this.supabase
      .from('client_keyword_universe')
      .select()
      .eq('tenant_id', tenantId);

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    query = query
      .order('opportunity_score', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get tenant keywords: ${error.message}`);
    }

    return data as KeywordUniverseEntry[];
  }

  /**
   * Get keywords by opportunity score threshold
   */
  async getHighOpportunityKeywords(
    tenantId: string,
    minOpportunityScore = 50,
    limit = 50
  ): Promise<KeywordUniverseEntry[]> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .select()
      .eq('tenant_id', tenantId)
      .gte('opportunity_score', minOpportunityScore)
      .order('opportunity_score', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get high opportunity keywords: ${error.message}`);
    }

    return data as KeywordUniverseEntry[];
  }

  /**
   * Get keywords by ranking position
   */
  async getKeywordsByRanking(
    tenantId: string,
    maxPosition = 10,
    limit = 50
  ): Promise<KeywordUniverseEntry[]> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .select()
      .eq('tenant_id', tenantId)
      .lte('ranking_position', maxPosition)
      .not('ranking_position', 'is', null)
      .order('ranking_position', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get keywords by ranking: ${error.message}`);
    }

    return data as KeywordUniverseEntry[];
  }

  /**
   * Update keyword
   */
  async updateKeyword(
    keywordId: string,
    tenantId: string,
    updates: KeywordUniverseEntryUpdate
  ): Promise<KeywordUniverseEntry> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keywordId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update keyword: ${error.message}`);
    }

    return data as KeywordUniverseEntry;
  }

  /**
   * Upsert keyword (create or update)
   */
  async upsertKeyword(
    keyword: KeywordUniverseEntryInsert
  ): Promise<KeywordUniverseEntry> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .upsert({
        ...keyword,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert keyword: ${error.message}`);
    }

    return data as KeywordUniverseEntry;
  }

  /**
   * Delete keyword
   */
  async deleteKeyword(keywordId: string, tenantId: string): Promise<void> {
    const { error } = await this.supabase
      .from('client_keyword_universe')
      .delete()
      .eq('id', keywordId)
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to delete keyword: ${error.message}`);
    }
  }

  /**
   * Get keyword statistics for tenant
   */
  async getKeywordStatistics(tenantId: string): Promise<{
    total: number;
    with_rankings: number;
    high_opportunity: number;
    avg_opportunity_score: number;
    avg_ranking_position: number;
  }> {
    const { data, error } = await this.supabase
      .from('client_keyword_universe')
      .select('opportunity_score, ranking_position')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Failed to get keyword statistics: ${error.message}`);
    }

    const keywords = data as { opportunity_score: number; ranking_position: number | null }[];

    const withRankings = keywords.filter(k => k.ranking_position !== null);
    const highOpportunity = keywords.filter(k => k.opportunity_score >= 50);
    const avgOpportunityScore = keywords.length > 0
      ? keywords.reduce((sum, k) => sum + k.opportunity_score, 0) / keywords.length
      : 0;
    const avgRankingPosition = withRankings.length > 0
      ? withRankings.reduce((sum, k) => sum + (k.ranking_position || 0), 0) / withRankings.length
      : 0;

    return {
      total: keywords.length,
      with_rankings: withRankings.length,
      high_opportunity: highOpportunity.length,
      avg_opportunity_score: avgOpportunityScore,
      avg_ranking_position: avgRankingPosition,
    };
  }
}
