/**
 * Keyword Bootstrap Service
 * 
 * Canonical keyword bootstrap pipeline for CLAUX V1 onboarding.
 * ARIA bootstrap: seed keyword universe, competitor baseline, first SERP snapshot, keyword opportunity discovery, initial ranking baseline.
 * Persist immediately.
 * 
 * CRITICAL: This is the ONLY keyword bootstrap service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { AgentExecutionRegistry } from '../execution/agent-execution-registry';

/**
 * Keyword bootstrap result
 */
export interface KeywordBootstrapResult {
  success: boolean;
  keywordUniverseSeeded: boolean;
  competitorBaseline: boolean;
  serpSnapshot: boolean;
  opportunityDiscovery: boolean;
  rankingBaseline: boolean;
  errors: string[];
}

/**
 * Keyword bootstrap service
 */
export class KeywordBootstrapService {
  private logger: Logger;
  private agentExecutionRegistry: AgentExecutionRegistry;

  constructor() {
    this.logger = createLogger();
    this.agentExecutionRegistry = new AgentExecutionRegistry();
  }

  /**
   * Bootstrap keywords for tenant
   */
  async bootstrapKeywords(
    tenantId: UUID,
    websiteUrl: string,
    competitors: string[],
    token: string
  ): Promise<KeywordBootstrapResult> {
    this.logger.info('Starting keyword bootstrap', { tenantId, websiteUrl });

    const errors: string[] = [];
    const traceId = crypto.randomUUID() as UUID;

    // Seed keyword universe
    const keywordUniverseSeeded = await this.seedKeywordUniverse(tenantId, websiteUrl, traceId, token);
    if (!keywordUniverseSeeded) {
      errors.push('Failed to seed keyword universe');
    }

    // Competitor baseline
    const competitorBaseline = await this.establishCompetitorBaseline(tenantId, competitors, traceId, token);
    if (!competitorBaseline) {
      errors.push('Failed to establish competitor baseline');
    }

    // First SERP snapshot
    const serpSnapshot = await this.captureSERPSnapshot(tenantId, websiteUrl, traceId, token);
    if (!serpSnapshot) {
      errors.push('Failed to capture SERP snapshot');
    }

    // Keyword opportunity discovery
    const opportunityDiscovery = await this.discoverOpportunities(tenantId, traceId, token);
    if (!opportunityDiscovery) {
      errors.push('Failed to discover opportunities');
    }

    // Initial ranking baseline
    const rankingBaseline = await this.establishRankingBaseline(tenantId, websiteUrl, traceId, token);
    if (!rankingBaseline) {
      errors.push('Failed to establish ranking baseline');
    }

    const success = errors.length === 0;

    this.logger.info('Keyword bootstrap complete', { tenantId, success, errors });

    return {
      success,
      keywordUniverseSeeded,
      competitorBaseline,
      serpSnapshot,
      opportunityDiscovery,
      rankingBaseline,
      errors,
    };
  }

  /**
   * Seed keyword universe
   */
  private async seedKeywordUniverse(
    tenantId: UUID,
    websiteUrl: string,
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info('Seeding keyword universe', { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName: 'ARIA',
        executionId,
        traceId,
        token,
        payload: {
          operation: 'seed_keyword_universe',
          websiteUrl,
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to seed keyword universe', { tenantId, error });
      return false;
    }
  }

  /**
   * Establish competitor baseline
   */
  private async establishCompetitorBaseline(
    tenantId: UUID,
    competitors: string[],
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info('Establishing competitor baseline', { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName: 'ARIA',
        executionId,
        traceId,
        token,
        payload: {
          operation: 'competitor_baseline',
          competitors,
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to establish competitor baseline', { tenantId, error });
      return false;
    }
  }

  /**
   * Capture SERP snapshot
   */
  private async captureSERPSnapshot(
    tenantId: UUID,
    websiteUrl: string,
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info('Capturing SERP snapshot', { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName: 'ARIA',
        executionId,
        traceId,
        token,
        payload: {
          operation: 'serp_snapshot',
          websiteUrl,
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to capture SERP snapshot', { tenantId, error });
      return false;
    }
  }

  /**
   * Discover opportunities
   */
  private async discoverOpportunities(
    tenantId: UUID,
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info('Discovering opportunities', { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName: 'ARIA',
        executionId,
        traceId,
        token,
        payload: {
          operation: 'opportunity_discovery',
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to discover opportunities', { tenantId, error });
      return false;
    }
  }

  /**
   * Establish ranking baseline
   */
  private async establishRankingBaseline(
    tenantId: UUID,
    websiteUrl: string,
    traceId: UUID,
    token: string
  ): Promise<boolean> {
    this.logger.info('Establishing ranking baseline', { tenantId });

    try {
      const executionId = crypto.randomUUID() as UUID;

      const result = await this.agentExecutionRegistry.executeAgent({
        tenantId,
        agentName: 'PULSE',
        executionId,
        traceId,
        token,
        payload: {
          operation: 'ranking_baseline',
          websiteUrl,
        },
      });

      return result.success;
    } catch (error) {
      this.logger.error('Failed to establish ranking baseline', { tenantId, error });
      return false;
    }
  }

  /**
   * Get keyword bootstrap status
   */
  async getKeywordBootstrapStatus(tenantId: UUID, token: string): Promise<{
    completed: boolean;
    stages: Record<string, boolean>;
  }> {
    const supabase = createClerkSupabaseClient(token);

    // Check if keyword universe exists
    const { data: keywordUniverse } = await supabase
      .from('keyword_universe')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Check if competitor baseline exists
    const { data: competitorBaseline } = await supabase
      .from('competitor_analysis')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Check if SERP snapshot exists
    const { data: serpSnapshot } = await supabase
      .from('serp_snapshots')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Check if ranking history exists
    const { data: rankingHistory } = await supabase
      .from('ranking_history')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const stages = {
      keywordUniverseSeeded: !!keywordUniverse,
      competitorBaseline: !!competitorBaseline,
      serpSnapshot: !!serpSnapshot,
      opportunityDiscovery: !!keywordUniverse, // Reuse keyword universe as proxy
      rankingBaseline: !!rankingHistory,
    };

    const completed = Object.values(stages).every((v) => v === true);

    return { completed, stages };
  }
}

/**
 * Singleton instance
 */
export const keywordBootstrapService = new KeywordBootstrapService();
