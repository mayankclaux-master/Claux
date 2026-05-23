/**
 * Recommendation Acceptance Tracking
 * 
 * Tracks:
 * - Recommendations accepted
 * - Recommendations ignored
 * - Recommendations rejected
 * - Recommendations edited manually
 * - Recommendations marked low-quality
 * 
 * Generates:
 * - Usefulness scoring
 * - Trust scoring
 * - Agent usefulness ranking
 * - Recommendation fatigue metrics
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Recommendation action
 */
export enum RecommendationAction {
  ACCEPTED = 'accepted',
  IGNORED = 'ignored',
  REJECTED = 'rejected',
  EDITED = 'edited',
  LOW_QUALITY = 'low_quality',
}

/**
 * Recommendation acceptance record
 */
export interface RecommendationAcceptanceRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  agent: string;
  executionId: string;
  recommendation: string;
  action: RecommendationAction;
  operatorId?: string;
  reason?: string;
  editedVersion?: string;
}

/**
 * Agent usefulness metrics
 */
export interface AgentUsefulnessMetrics {
  agent: string;
  totalRecommendations: number;
  accepted: number;
  ignored: number;
  rejected: number;
  edited: number;
  lowQuality: number;
  usefulnessScore: number; // 0-100
  trustScore: number; // 0-100
  fatigueScore: number; // 0-100 (higher = more fatigue)
}

/**
 * Recommendation acceptance tracking
 */
export class RecommendationAcceptanceTracking {
  private logger: Logger;
  private records: RecommendationAcceptanceRecord[] = [];
  private agentMetrics: Map<string, AgentUsefulnessMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track recommendation action
   */
  trackAction(params: {
    tenantId: string;
    agent: string;
    executionId: string;
    recommendation: string;
    action: RecommendationAction;
    operatorId?: string;
    reason?: string;
    editedVersion?: string;
  }): void {
    const record: RecommendationAcceptanceRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.records.push(record);
    this.updateAgentMetrics(params.agent);
    this.logger.info('Recommendation action tracked', { record });
  }

  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agent: string): void {
    const agentRecords = this.records.filter(r => r.agent === agent);
    const total = agentRecords.length;

    const accepted = agentRecords.filter(r => r.action === RecommendationAction.ACCEPTED).length;
    const ignored = agentRecords.filter(r => r.action === RecommendationAction.IGNORED).length;
    const rejected = agentRecords.filter(r => r.action === RecommendationAction.REJECTED).length;
    const edited = agentRecords.filter(r => r.action === RecommendationAction.EDITED).length;
    const lowQuality = agentRecords.filter(r => r.action === RecommendationAction.LOW_QUALITY).length;

    // Usefulness score: accepted + edited are useful
    const usefulnessScore = total > 0 ? Math.round(((accepted + edited) / total) * 100) : 100;

    // Trust score: accepted + edited - rejected - low quality
    const positive = accepted + edited;
    const negative = rejected + lowQuality;
    const trustScore = total > 0 ? Math.max(0, Math.round(((positive - negative) / total) * 100 + 50)) : 100;

    // Fatigue score: ignored + rejected indicate fatigue
    const fatigueScore = total > 0 ? Math.round(((ignored + rejected) / total) * 100) : 0;

    this.agentMetrics.set(agent, {
      agent,
      totalRecommendations: total,
      accepted,
      ignored,
      rejected,
      edited,
      lowQuality,
      usefulnessScore,
      trustScore,
      fatigueScore,
    });
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agent: string): AgentUsefulnessMetrics | undefined {
    return this.agentMetrics.get(agent);
  }

  /**
   * Get all agent metrics
   */
  getAllAgentMetrics(): AgentUsefulnessMetrics[] {
    return Array.from(this.agentMetrics.values()).sort((a, b) => b.usefulnessScore - a.usefulnessScore);
  }

  /**
   * Get records by tenant
   */
  getRecordsByTenant(tenantId: string): RecommendationAcceptanceRecord[] {
    return this.records.filter(r => r.tenantId === tenantId);
  }

  /**
   * Get records by agent
   */
  getRecordsByAgent(agent: string): RecommendationAcceptanceRecord[] {
    return this.records.filter(r => r.agent === agent);
  }

  /**
   * Get records by action
   */
  getRecordsByAction(action: RecommendationAction): RecommendationAcceptanceRecord[] {
    return this.records.filter(r => r.action === action);
  }

  /**
   * Get agent ranking by usefulness
   */
  getAgentRanking(): Array<{ agent: string; usefulnessScore: number; trustScore: number }> {
    return this.getAllAgentMetrics().map(m => ({
      agent: m.agent,
      usefulnessScore: m.usefulnessScore,
      trustScore: m.trustScore,
    })).sort((a, b) => b.usefulnessScore - a.usefulnessScore);
  }

  /**
   * Get fatigue metrics
   */
  getFatigueMetrics(): {
    overallFatigue: number;
    byAgent: Record<string, number>;
    highFatigueAgents: string[];
  } {
    const metrics = this.getAllAgentMetrics();
    const overallFatigue = metrics.length > 0 
      ? Math.round(metrics.reduce((sum, m) => sum + m.fatigueScore, 0) / metrics.length)
      : 0;

    const byAgent: Record<string, number> = {};
    metrics.forEach(m => {
      byAgent[m.agent] = m.fatigueScore;
    });

    const highFatigueAgents = metrics
      .filter(m => m.fatigueScore > 60)
      .map(m => m.agent);

    return {
      overallFatigue,
      byAgent,
      highFatigueAgents,
    };
  }

  /**
   * Generate acceptance report
   */
  generateAcceptanceReport(): string {
    const metrics = this.getAllAgentMetrics();
    const ranking = this.getAgentRanking();
    const fatigue = this.getFatigueMetrics();

    let report = '=== Recommendation Acceptance Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Records: ${this.records.length}\n\n`;

    report += '--- Agent Usefulness Ranking ---\n';
    ranking.forEach((r, index) => {
      report += `${index + 1}. ${r.agent}\n`;
      report += `   Usefulness: ${r.usefulnessScore}%\n`;
      report += `   Trust: ${r.trustScore}%\n`;
    });

    report += '\n--- Fatigue Metrics ---\n';
    report += `Overall Fatigue: ${fatigue.overallFatigue}%\n`;
    if (fatigue.highFatigueAgents.length > 0) {
      report += `High Fatigue Agents: ${fatigue.highFatigueAgents.join(', ')}\n`;
    }

    report += '\n--- Detailed Agent Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.agent}:\n`;
      report += `  Total: ${m.totalRecommendations}\n`;
      report += `  Accepted: ${m.accepted}\n`;
      report += `  Ignored: ${m.ignored}\n`;
      report += `  Rejected: ${m.rejected}\n`;
      report += `  Edited: ${m.edited}\n`;
      report += `  Low Quality: ${m.lowQuality}\n`;
      report += `  Usefulness: ${m.usefulnessScore}%\n`;
      report += `  Trust: ${m.trustScore}%\n`;
      report += `  Fatigue: ${m.fatigueScore}%\n`;
    });

    return report;
  }

  /**
   * Clear records (for testing only)
   */
  clearRecords(): void {
    this.logger.warn('Recommendation acceptance records cleared');
    this.records = [];
    this.agentMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const recommendationAcceptanceTracking = new RecommendationAcceptanceTracking();
