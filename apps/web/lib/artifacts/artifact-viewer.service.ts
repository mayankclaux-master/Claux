/**
 * Artifact Viewer Service
 * 
 * Canonical artifact viewer service for CLAUX V1.
 * Views execution payloads, generated packages, audit snapshots, SERP snapshots, recommendations, EEAT reports.
 * Searchable by tenant, execution, traceId, agent.
 * 
 * CRITICAL: This is the ONLY artifact viewer service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { artifactPersistenceService } from '../persistence/artifact-persistence.service';

/**
 * Artifact filter
 */
export interface ArtifactFilter {
  tenantId: UUID;
  executionId?: UUID;
  traceId?: UUID;
  agentName?: string;
  artifactType?: string;
  limit?: number;
  offset?: number;
}

/**
 * Artifact viewer service
 */
export class ArtifactViewerService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Query artifacts with filters
   */
  async queryArtifacts(filter: ArtifactFilter, token: string): Promise<unknown[]> {
    this.logger.info('Querying artifacts', { filter });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', filter.tenantId);

    if (filter.executionId) {
      query = query.eq('execution_id', filter.executionId);
    }

    if (filter.traceId) {
      query = query.eq('trace_id', filter.traceId);
    }

    if (filter.agentName) {
      query = query.eq('agent_name', filter.agentName);
    }

    if (filter.artifactType) {
      query = query.eq('artifact_type', filter.artifactType);
    }

    query = query.order('created_at', { ascending: false });

    if (filter.limit) {
      query = query.limit(filter.limit);
    }

    if (filter.offset) {
      query = query.range(filter.offset, filter.offset + (filter.limit || 100) - 1);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to query artifacts', { error, filter });
      throw new Error(`Failed to query artifacts: ${error.message}`);
    }

    this.logger.info('Artifacts queried successfully', { count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(tenantId: UUID, artifactId: UUID, token: string): Promise<unknown | null> {
    this.logger.info('Getting artifact', { tenantId, artifactId });

    return await artifactPersistenceService.getArtifact(tenantId, artifactId, token);
  }

  /**
   * Get artifacts by execution ID
   */
  async getArtifactsByExecution(tenantId: UUID, executionId: UUID, token: string): Promise<unknown[]> {
    this.logger.info('Getting artifacts by execution', { tenantId, executionId });

    return await artifactPersistenceService.queryArtifacts(tenantId, executionId, token);
  }

  /**
   * Get artifacts by trace ID
   */
  async getArtifactsByTrace(tenantId: UUID, traceId: UUID, token: string): Promise<unknown[]> {
    this.logger.info('Getting artifacts by trace', { tenantId, traceId });

    return await artifactPersistenceService.queryArtifactsByTraceId(tenantId, traceId, token);
  }

  /**
   * Get artifacts by agent
   */
  async getArtifactsByAgent(
    tenantId: UUID,
    agentName: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting artifacts by agent', { tenantId, agentName, limit });

    return await artifactPersistenceService.queryArtifactsByAgent(tenantId, agentName, token, limit);
  }

  /**
   * Get SERP snapshots
   */
  async getSerpSnapshots(
    tenantId: UUID,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting SERP snapshots', { tenantId, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('serp_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to get SERP snapshots', { error, tenantId });
      throw new Error(`Failed to get SERP snapshots: ${error.message}`);
    }

    this.logger.info('SERP snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get technical audit snapshots
   */
  async getTechnicalAuditSnapshots(
    tenantId: UUID,
    token: string,
    url?: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting technical audit snapshots', { tenantId, url, limit });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('technical_audit_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (url) {
      query = query.eq('url', url);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to get technical audit snapshots', { error, tenantId });
      throw new Error(`Failed to get technical audit snapshots: ${error.message}`);
    }

    this.logger.info('Technical audit snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get backlink snapshots
   */
  async getBacklinkSnapshots(
    tenantId: UUID,
    token: string,
    targetUrl?: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting backlink snapshots', { tenantId, targetUrl, limit });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('backlink_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (targetUrl) {
      query = query.eq('target_url', targetUrl);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to get backlink snapshots', { error, tenantId });
      throw new Error(`Failed to get backlink snapshots: ${error.message}`);
    }

    this.logger.info('Backlink snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get review snapshots
   */
  async getReviewSnapshots(
    tenantId: UUID,
    token: string,
    platform?: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting review snapshots', { tenantId, platform, limit });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('review_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to get review snapshots', { error, tenantId });
      throw new Error(`Failed to get review snapshots: ${error.message}`);
    }

    this.logger.info('Review snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get GA4 snapshots
   */
  async getGa4Snapshots(
    tenantId: UUID,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting GA4 snapshots', { tenantId, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('ga4_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to get GA4 snapshots', { error, tenantId });
      throw new Error(`Failed to get GA4 snapshots: ${error.message}`);
    }

    this.logger.info('GA4 snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get GSC snapshots
   */
  async getGscSnapshots(
    tenantId: UUID,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting GSC snapshots', { tenantId, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('gsc_snapshots')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to get GSC snapshots', { error, tenantId });
      throw new Error(`Failed to get GSC snapshots: ${error.message}`);
    }

    this.logger.info('GSC snapshots retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get keyword universe history
   */
  async getKeywordUniverseHistory(
    tenantId: UUID,
    token: string,
    keyword?: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting keyword universe history', { tenantId, keyword, limit });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('keyword_universe_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (keyword) {
      query = query.eq('keyword', keyword);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to get keyword universe history', { error, tenantId });
      throw new Error(`Failed to get keyword universe history: ${error.message}`);
    }

    this.logger.info('Keyword universe history retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get ranking history
   */
  async getRankingHistory(
    tenantId: UUID,
    token: string,
    keyword?: string,
    url?: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Getting ranking history', { tenantId, keyword, url, limit });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('ranking_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (keyword) {
      query = query.eq('keyword', keyword);
    }

    if (url) {
      query = query.eq('url', url);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to get ranking history', { error, tenantId });
      throw new Error(`Failed to get ranking history: ${error.message}`);
    }

    this.logger.info('Ranking history retrieved successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Search artifacts
   */
  async searchArtifacts(
    tenantId: UUID,
    searchTerm: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Searching artifacts', { tenantId, searchTerm, limit });

    const supabase = createClerkSupabaseClient(token);

    // Search in artifact_name and artifact_data
    const { data, error } = await supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`artifact_name.ilike.%${searchTerm}%,artifact_data::text.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to search artifacts', { error, tenantId });
      throw new Error(`Failed to search artifacts: ${error.message}`);
    }

    this.logger.info('Artifacts searched successfully', { tenantId, count: data?.length || 0 });
    return data || [];
  }

  /**
   * Get artifact statistics
   */
  async getArtifactStatistics(tenantId: UUID, token: string): Promise<{
    totalArtifacts: number;
    byAgent: Record<string, number>;
    byType: Record<string, number>;
    totalSizeBytes: number;
  }> {
    this.logger.info('Getting artifact statistics', { tenantId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_artifacts')
      .select('agent_name, artifact_type, artifact_size_bytes')
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error('Failed to get artifact statistics', { error, tenantId });
      throw new Error(`Failed to get artifact statistics: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        totalArtifacts: 0,
        byAgent: {},
        byType: {},
        totalSizeBytes: 0,
      };
    }

    const totalArtifacts = data.length;
    const byAgent: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalSizeBytes = 0;

    for (const artifact of data) {
      const a = artifact as { agent_name: string; artifact_type: string; artifact_size_bytes: number };
      
      byAgent[a.agent_name] = (byAgent[a.agent_name] || 0) + 1;
      byType[a.artifact_type] = (byType[a.artifact_type] || 0) + 1;
      totalSizeBytes += a.artifact_size_bytes;
    }

    this.logger.info('Artifact statistics retrieved successfully', { tenantId, totalArtifacts });
    return {
      totalArtifacts,
      byAgent,
      byType,
      totalSizeBytes,
    };
  }
}

/**
 * Singleton instance
 */
export const artifactViewerService = new ArtifactViewerService();
