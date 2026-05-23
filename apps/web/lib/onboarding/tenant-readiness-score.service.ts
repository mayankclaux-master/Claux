/**
 * Tenant Readiness Score Service
 * 
 * Canonical tenant readiness scoring service for CLAUX V1 onboarding.
 * Score based on connector health, domain health, successful executions, keyword baseline completeness, dashboard readiness, command centre readiness.
 * Exposes dashboard-ready readiness object.
 * 
 * CRITICAL: This is the ONLY tenant readiness scoring service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { domainVerificationService } from './domain-verification.service';

/**
 * Tenant readiness score
 */
export interface TenantReadinessScore {
  overallScore: number; // 0-100
  connectorHealthScore: number; // 0-100
  domainHealthScore: number; // 0-100
  executionHealthScore: number; // 0-100
  keywordBaselineScore: number; // 0-100
  dashboardReadinessScore: number; // 0-100
  commandCentreReadinessScore: number; // 0-100
  readyForProduction: boolean;
  recommendations: string[];
}

/**
 * Tenant readiness score service
 */
export class TenantReadinessScoreService {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Calculate tenant readiness score
   */
  async calculateReadinessScore(tenantId: UUID, websiteUrl: string, token: string): Promise<TenantReadinessScore> {
    this.logger.info('Calculating tenant readiness score', { tenantId });

    const recommendations: string[] = [];

    // Calculate connector health score
    const connectorHealthScore = await this.calculateConnectorHealthScore(tenantId, token);
    if (connectorHealthScore < 80) {
      recommendations.push('Improve connector health by validating OAuth tokens');
    }

    // Calculate domain health score
    const domainHealthScore = await this.calculateDomainHealthScore(websiteUrl);
    if (domainHealthScore < 80) {
      recommendations.push('Improve domain health by fixing SSL, robots.txt, or sitemap');
    }

    // Calculate execution health score
    const executionHealthScore = await this.calculateExecutionHealthScore(tenantId, token);
    if (executionHealthScore < 80) {
      recommendations.push('Improve execution health by resolving agent execution failures');
    }

    // Calculate keyword baseline score
    const keywordBaselineScore = await this.calculateKeywordBaselineScore(tenantId, token);
    if (keywordBaselineScore < 80) {
      recommendations.push('Improve keyword baseline by completing keyword bootstrap');
    }

    // Calculate dashboard readiness score
    const dashboardReadinessScore = await this.calculateDashboardReadinessScore(tenantId, token);
    if (dashboardReadinessScore < 80) {
      recommendations.push('Improve dashboard readiness by completing execution bootstrap');
    }

    // Calculate command centre readiness score
    const commandCentreReadinessScore = await this.calculateCommandCentreReadinessScore(tenantId, token);
    if (commandCentreReadinessScore < 80) {
      recommendations.push('Improve command centre readiness by completing task bootstrap');
    }

    // Calculate overall score
    const overallScore = Math.round(
      (connectorHealthScore +
        domainHealthScore +
        executionHealthScore +
        keywordBaselineScore +
        dashboardReadinessScore +
        commandCentreReadinessScore) / 6
    );

    const readyForProduction = overallScore >= 80;

    this.logger.info('Tenant readiness score calculated', { tenantId, overallScore, readyForProduction });

    return {
      overallScore,
      connectorHealthScore,
      domainHealthScore,
      executionHealthScore,
      keywordBaselineScore,
      dashboardReadinessScore,
      commandCentreReadinessScore,
      readyForProduction,
      recommendations,
    };
  }

  /**
   * Calculate connector health score
   */
  private async calculateConnectorHealthScore(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    const { data: connectors } = await supabase
      .from('connector_credentials')
      .select('health_status')
      .eq('tenant_id', tenantId);

    if (!connectors || connectors.length === 0) {
      return 0;
    }

    const healthyCount = connectors.filter((c) => c.health_status === 'healthy').length;
    return Math.round((healthyCount / connectors.length) * 100);
  }

  /**
   * Calculate domain health score
   */
  private async calculateDomainHealthScore(websiteUrl: string): Promise<number> {
    const result = await domainVerificationService.verifyDomain(websiteUrl);
    return result.overallHealth;
  }

  /**
   * Calculate execution health score
   */
  private async calculateExecutionHealthScore(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    const { data: executions } = await supabase
      .from('agent_executions')
      .select('success')
      .eq('tenant_id', tenantId);

    if (!executions || executions.length === 0) {
      return 0;
    }

    const successCount = executions.filter((e) => e.success).length;
    return Math.round((successCount / executions.length) * 100);
  }

  /**
   * Calculate keyword baseline score
   */
  private async calculateKeywordBaselineScore(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    // Check if keyword universe exists
    const { data: keywordUniverse } = await supabase
      .from('keyword_universe')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // Check if ranking history exists
    const { data: rankingHistory } = await supabase
      .from('ranking_history')
      .select('id')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    let score = 0;
    if (keywordUniverse) score += 50;
    if (rankingHistory) score += 50;

    return score;
  }

  /**
   * Calculate dashboard readiness score
   */
  private async calculateDashboardReadinessScore(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    // Check if executions exist for dashboard metrics
    const { count: executionCount } = await supabase
      .from('agent_executions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Check if trends exist
    const { count: trendCount } = await supabase
      .from('trends')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    let score = 0;
    if (executionCount && executionCount > 0) score += 50;
    if (trendCount && trendCount > 0) score += 50;

    return score;
  }

  /**
   * Calculate command centre readiness score
   */
  private async calculateCommandCentreReadinessScore(tenantId: UUID, token: string): Promise<number> {
    const supabase = createClerkSupabaseClient(token);

    // Check if tasks exist
    const { count: taskCount } = await supabase
      .from('command_center_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Minimum 14 tasks for full readiness (2 per type, 7 types)
    if (!taskCount || taskCount === 0) {
      return 0;
    }

    return Math.min(100, Math.round((taskCount / 14) * 100));
  }

  /**
   * Get readiness summary for dashboard
   */
  async getReadinessSummary(tenantId: UUID, websiteUrl: string, token: string): Promise<{
    ready: boolean;
    score: number;
    blockers: string[];
    nextSteps: string[];
  }> {
    const readiness = await this.calculateReadinessScore(tenantId, websiteUrl, token);

    const blockers = readiness.recommendations.filter((r) => readiness.overallScore < 50);
    const nextSteps = readiness.recommendations.filter((r) => readiness.overallScore >= 50 && readiness.overallScore < 80);

    return {
      ready: readiness.readyForProduction,
      score: readiness.overallScore,
      blockers,
      nextSteps,
    };
  }
}

/**
 * Singleton instance
 */
export const tenantReadinessScoreService = new TenantReadinessScoreService();
