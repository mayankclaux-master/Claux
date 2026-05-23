/**
 * Agent Persistence Helper
 * 
 * Helper utility for agents to persist outputs using canonical persistence services.
 * 
 * CRITICAL: This is the ONLY agent persistence helper in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { snapshotPersistenceService } from './snapshot-persistence.service';
import { rankingHistoryService } from './ranking-history.service';
import { artifactPersistenceService } from './artifact-persistence.service';
import { createLogger } from '../utils/logger';

/**
 * Agent persistence helper
 */
export class AgentPersistenceHelper {
  private logger = createLogger();

  /**
   * Persist ARIA outputs
   */
  async persistAriaOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      keywordDiscoveries?: Array<{
        keyword: string;
        location: string;
        language: string;
        searchVolume?: number;
        keywordDifficulty?: number;
        opportunityScore?: number;
      }>;
      serpSnapshots?: Array<{
        keyword: string;
        location: string;
        language: string;
        rankings: Record<string, unknown>;
        featuredSnippet?: Record<string, unknown>;
        aiOverview?: Record<string, unknown>;
      }>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting ARIA outputs', { tenantId, traceId, executionId });

    // Persist keyword universe history
    if (outputs.keywordDiscoveries) {
      for (const keyword of outputs.keywordDiscoveries) {
        await snapshotPersistenceService.persistKeywordUniverseHistory(
          tenantId,
          traceId,
          executionId,
          {
            keyword: keyword.keyword,
            location: keyword.location,
            language: keyword.language,
            searchVolume: keyword.searchVolume,
            keywordDifficulty: keyword.keywordDifficulty,
            opportunityScore: keyword.opportunityScore,
          },
          token
        );
      }
    }

    // Persist SERP snapshots
    if (outputs.serpSnapshots) {
      for (const snapshot of outputs.serpSnapshots) {
        await snapshotPersistenceService.persistSerpSnapshot(
          tenantId,
          traceId,
          executionId,
          {
            keyword: snapshot.keyword,
            location: snapshot.location,
            language: snapshot.language,
            rankings: snapshot.rankings,
            featuredSnippet: snapshot.featuredSnippet,
            aiOverview: snapshot.aiOverview,
          },
          token
        );
      }
    }

    this.logger.info('ARIA outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist SCRIBE outputs
   */
  async persistScribeOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      generatedContent?: Record<string, unknown>;
      eeatScoring?: Record<string, unknown>;
      publishingPackages?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting SCRIBE outputs', { tenantId, traceId, executionId });

    // Persist as artifacts
    if (outputs.generatedContent) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'SCRIBE',
          artifactType: 'generated_content',
          artifactName: 'Generated Content',
          artifactData: outputs.generatedContent,
        },
        token
      );
    }

    if (outputs.eeatScoring) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'SCRIBE',
          artifactType: 'eeat_scoring',
          artifactName: 'E-E-A-T Scoring',
          artifactData: outputs.eeatScoring,
        },
        token
      );
    }

    if (outputs.publishingPackages) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'SCRIBE',
          artifactType: 'publishing_package',
          artifactName: 'Publishing Package',
          artifactData: outputs.publishingPackages,
        },
        token
      );
    }

    this.logger.info('SCRIBE outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist PULSE outputs
   */
  async persistPulseOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      rankingMovement?: Array<{
        keyword: string;
        url: string;
        position: number;
        previousPosition?: number;
        change?: number;
      }>;
      visibilityChanges?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting PULSE outputs', { tenantId, traceId, executionId });

    // Persist ranking history
    if (outputs.rankingMovement) {
      await rankingHistoryService.persistBatchRankingHistory(
        tenantId,
        traceId,
        executionId,
        { rankings: outputs.rankingMovement },
        token
      );
    }

    // Persist visibility changes as artifact
    if (outputs.visibilityChanges) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'PULSE',
          artifactType: 'visibility_changes',
          artifactName: 'Visibility Changes',
          artifactData: outputs.visibilityChanges,
        },
        token
      );
    }

    this.logger.info('PULSE outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist LINX outputs
   */
  async persistLinxOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      backlinkSnapshots?: Array<{
        targetUrl: string;
        sourceDomain: string;
        sourceUrl: string;
        domainAuthority?: number;
        pageAuthority?: number;
        dofollow: boolean;
        anchorText?: string;
      }>;
      outreachRecommendations?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting LINX outputs', { tenantId, traceId, executionId });

    // Persist backlink snapshots
    if (outputs.backlinkSnapshots) {
      for (const backlink of outputs.backlinkSnapshots) {
        await snapshotPersistenceService.persistBacklinkSnapshot(
          tenantId,
          traceId,
          executionId,
          backlink,
          token
        );
      }
    }

    // Persist outreach recommendations as artifact
    if (outputs.outreachRecommendations) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'LINX',
          artifactType: 'outreach_recommendations',
          artifactName: 'Outreach Recommendations',
          artifactData: outputs.outreachRecommendations,
        },
        token
      );
    }

    this.logger.info('LINX outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist CORE outputs
   */
  async persistCoreOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      technicalAuditResults?: Array<{
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
      }>;
      cwvMetrics?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting CORE outputs', { tenantId, traceId, executionId });

    // Persist technical audit snapshots
    if (outputs.technicalAuditResults) {
      for (const audit of outputs.technicalAuditResults) {
        await snapshotPersistenceService.persistTechnicalAuditSnapshot(
          tenantId,
          traceId,
          executionId,
          audit,
          token
        );
      }
    }

    // Persist CWV metrics as artifact
    if (outputs.cwvMetrics) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'CORE',
          artifactType: 'cwv_metrics',
          artifactName: 'Core Web Vitals Metrics',
          artifactData: outputs.cwvMetrics,
        },
        token
      );
    }

    this.logger.info('CORE outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist REPUTE outputs
   */
  async persistReputeOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      reviewSnapshots?: Array<{
        platform: string;
        locationId?: string;
        locationName?: string;
        totalReviews?: number;
        averageRating?: number;
        ratingDistribution?: Record<string, unknown>;
        recentReviews?: Record<string, unknown>;
        sentimentScore?: number;
      }>;
      sentimentScoring?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting REPUTE outputs', { tenantId, traceId, executionId });

    // Persist review snapshots
    if (outputs.reviewSnapshots) {
      for (const review of outputs.reviewSnapshots) {
        await snapshotPersistenceService.persistReviewSnapshot(
          tenantId,
          traceId,
          executionId,
          review,
          token
        );
      }
    }

    // Persist sentiment scoring as artifact
    if (outputs.sentimentScoring) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'REPUTE',
          artifactType: 'sentiment_scoring',
          artifactName: 'Sentiment Scoring',
          artifactData: outputs.sentimentScoring,
        },
        token
      );
    }

    this.logger.info('REPUTE outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist PRISM outputs
   */
  async persistPrismOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      ga4Summaries?: Array<{
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
      }>;
      trafficMetrics?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting PRISM outputs', { tenantId, traceId, executionId });

    // Persist GA4 snapshots
    if (outputs.ga4Summaries) {
      for (const ga4 of outputs.ga4Summaries) {
        await snapshotPersistenceService.persistGa4Snapshot(
          tenantId,
          traceId,
          executionId,
          ga4,
          token
        );
      }
    }

    // Persist traffic metrics as artifact
    if (outputs.trafficMetrics) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'PRISM',
          artifactType: 'traffic_metrics',
          artifactName: 'Traffic Metrics',
          artifactData: outputs.trafficMetrics,
        },
        token
      );
    }

    this.logger.info('PRISM outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist LOCL outputs
   */
  async persistLoclOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      gmbVisibilityMetrics?: Array<{
        platform: string;
        locationId?: string;
        locationName?: string;
        totalReviews?: number;
        averageRating?: number;
        ratingDistribution?: Record<string, unknown>;
        recentReviews?: Record<string, unknown>;
        sentimentScore?: number;
      }>;
      citationOpportunities?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting LOCL outputs', { tenantId, traceId, executionId });

    // Persist GMB visibility as review snapshots
    if (outputs.gmbVisibilityMetrics) {
      for (const gmb of outputs.gmbVisibilityMetrics) {
        await snapshotPersistenceService.persistReviewSnapshot(
          tenantId,
          traceId,
          executionId,
          gmb,
          token
        );
      }
    }

    // Persist citation opportunities as artifact
    if (outputs.citationOpportunities) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'LOCL',
          artifactType: 'citation_opportunities',
          artifactName: 'Citation Opportunities',
          artifactData: outputs.citationOpportunities,
        },
        token
      );
    }

    this.logger.info('LOCL outputs persisted successfully', { tenantId, traceId });
  }

  /**
   * Persist PUBLISH outputs
   */
  async persistPublishOutputs(
    tenantId: UUID,
    traceId: UUID,
    executionId: UUID,
    outputs: {
      publishingPackages?: Record<string, unknown>;
    },
    token: string
  ): Promise<void> {
    this.logger.info('Persisting PUBLISH outputs', { tenantId, traceId, executionId });

    // Persist publishing packages as artifact
    if (outputs.publishingPackages) {
      await artifactPersistenceService.persistArtifact(
        tenantId,
        traceId,
        executionId,
        {
          agentName: 'PUBLISH',
          artifactType: 'publishing_package',
          artifactName: 'Publishing Package',
          artifactData: outputs.publishingPackages,
        },
        token
      );
    }

    this.logger.info('PUBLISH outputs persisted successfully', { tenantId, traceId });
  }
}

/**
 * Singleton instance
 */
export const agentPersistenceHelper = new AgentPersistenceHelper();
