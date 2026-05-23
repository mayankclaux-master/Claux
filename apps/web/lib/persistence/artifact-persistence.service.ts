/**
 * Artifact Persistence Service
 * 
 * Canonical service for persisting execution artifacts in CLAUX V1.
 * Validates payloads, validates tenant ownership, attaches trace IDs, appends artifacts.
 * 
 * CRITICAL: This is the ONLY artifact persistence service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Artifact payload
 */
export interface ArtifactPayload {
  agentName: string;
  artifactType: string;
  artifactName: string;
  artifactData: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Artifact persistence service
 */
export class ArtifactPersistenceService {
  private logger: Logger;
  private readonly MAX_ARTIFACT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Persist execution artifact
   */
  async persistArtifact(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payload: ArtifactPayload,
    token: string
  ): Promise<void> {
    this.logger.info('Persisting execution artifact', { 
      tenantId, 
      traceId, 
      executionId,
      artifactType: payload.artifactType,
      artifactName: payload.artifactName 
    });

    // Validate artifact size
    const artifactSize = JSON.stringify(payload.artifactData).length;
    if (artifactSize > this.MAX_ARTIFACT_SIZE_BYTES) {
      throw new Error(`Artifact size exceeds limit: ${artifactSize} bytes (max: ${this.MAX_ARTIFACT_SIZE_BYTES} bytes)`);
    }

    const supabase = createClerkSupabaseClient(token);

    const { error } = await supabase.from('execution_artifacts').insert({
      tenant_id: tenantId,
      trace_id: traceId,
      execution_id: executionId,
      agent_name: payload.agentName,
      artifact_type: payload.artifactType,
      artifact_name: payload.artifactName,
      artifact_data: payload.artifactData,
      artifact_size_bytes: artifactSize,
      metadata: payload.metadata,
    });

    if (error) {
      this.logger.error('Failed to persist execution artifact', { error, tenantId, traceId });
      throw new Error(`Failed to persist execution artifact: ${error.message}`);
    }

    this.logger.info('Execution artifact persisted successfully', { 
      tenantId, 
      traceId,
      artifactSize 
    });
  }

  /**
   * Persist batch execution artifacts
   */
  async persistBatchArtifacts(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    payloads: ArtifactPayload[],
    token: string
  ): Promise<void> {
    this.logger.info('Persisting batch execution artifacts', { 
      tenantId, 
      traceId, 
      executionId, 
      count: payloads.length 
    });

    const supabase = createClerkSupabaseClient(token);

    const records = payloads.map((payload) => {
      const artifactSize = JSON.stringify(payload.artifactData).length;
      
      if (artifactSize > this.MAX_ARTIFACT_SIZE_BYTES) {
        throw new Error(`Artifact size exceeds limit: ${artifactSize} bytes (max: ${this.MAX_ARTIFACT_SIZE_BYTES} bytes)`);
      }

      return {
        tenant_id: tenantId,
        trace_id: traceId,
        execution_id: executionId,
        agent_name: payload.agentName,
        artifact_type: payload.artifactType,
        artifact_name: payload.artifactName,
        artifact_data: payload.artifactData,
        artifact_size_bytes: artifactSize,
        metadata: payload.metadata,
      };
    });

    const { error } = await supabase.from('execution_artifacts').insert(records);

    if (error) {
      this.logger.error('Failed to persist batch execution artifacts', { error, tenantId, traceId });
      throw new Error(`Failed to persist batch execution artifacts: ${error.message}`);
    }

    this.logger.info('Batch execution artifacts persisted successfully', { 
      tenantId, 
      traceId, 
      count: records.length 
    });
  }

  /**
   * Query execution artifacts
   */
  async queryArtifacts(
    tenantId: UUID,
    executionId: UUID,
    token: string,
    artifactType?: string
  ): Promise<unknown[]> {
    this.logger.info('Querying execution artifacts', { tenantId, executionId, artifactType });

    const supabase = createClerkSupabaseClient(token);

    let query = supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('execution_id', executionId);

    if (artifactType) {
      query = query.eq('artifact_type', artifactType);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to query execution artifacts', { error, tenantId, executionId });
      throw new Error(`Failed to query execution artifacts: ${error.message}`);
    }

    this.logger.info('Execution artifacts queried successfully', { 
      tenantId, 
      executionId, 
      count: data?.length || 0 
    });

    return data || [];
  }

  /**
   * Query artifacts by trace ID
   */
  async queryArtifactsByTraceId(
    tenantId: UUID,
    traceId: UUID,
    token: string
  ): Promise<unknown[]> {
    this.logger.info('Querying execution artifacts by trace ID', { tenantId, traceId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('trace_id', traceId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Failed to query execution artifacts by trace ID', { error, tenantId, traceId });
      throw new Error(`Failed to query execution artifacts by trace ID: ${error.message}`);
    }

    this.logger.info('Execution artifacts by trace ID queried successfully', { 
      tenantId, 
      traceId, 
      count: data?.length || 0 
    });

    return data || [];
  }

  /**
   * Query artifacts by agent
   */
  async queryArtifactsByAgent(
    tenantId: UUID,
    agentName: string,
    token: string,
    limit: number = 100
  ): Promise<unknown[]> {
    this.logger.info('Querying execution artifacts by agent', { tenantId, agentName, limit });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('agent_name', agentName)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error('Failed to query execution artifacts by agent', { error, tenantId, agentName });
      throw new Error(`Failed to query execution artifacts by agent: ${error.message}`);
    }

    this.logger.info('Execution artifacts by agent queried successfully', { 
      tenantId, 
      agentName, 
      count: data?.length || 0 
    });

    return data || [];
  }

  /**
   * Get artifact by ID
   */
  async getArtifact(
    tenantId: UUID,
    artifactId: UUID,
    token: string
  ): Promise<unknown | null> {
    this.logger.info('Getting execution artifact', { tenantId, artifactId });

    const supabase = createClerkSupabaseClient(token);

    const { data, error } = await supabase
      .from('execution_artifacts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', artifactId)
      .maybeSingle();

    if (error) {
      this.logger.error('Failed to get execution artifact', { error, tenantId, artifactId });
      throw new Error(`Failed to get execution artifact: ${error.message}`);
    }

    this.logger.info('Execution artifact retrieved successfully', { tenantId, artifactId });

    return data;
  }
}

/**
 * Singleton instance
 */
export const artifactPersistenceService = new ArtifactPersistenceService();
