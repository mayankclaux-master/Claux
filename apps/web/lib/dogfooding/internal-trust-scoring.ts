/**
 * Internal Trust Scoring
 * 
 * Creates trust scoring for:
 * - Each agent
 * - Each connector
 * - Onboarding system
 * - Dashboard system
 * - Recommendation engine
 * - Task engine
 * 
 * Trust score considers:
 * - Correctness
 * - Usefulness
 * - Reliability
 * - Operator acceptance
 * - Operator rejection
 * - Retry frequency
 * - Failure frequency
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { recommendationAcceptanceTracking } from './recommendation-acceptance-tracking';
import { taskActionabilityVerification } from './task-actionability-verification';
import { operatorFeedbackLoop } from './operator-feedback-loop';
import { executionValueVerification } from './execution-value-verification';
import { alertFatigueDetection } from './alert-fatigue-detection';

/**
 * Trust target
 */
export enum TrustTarget {
  AGENT = 'agent',
  CONNECTOR = 'connector',
  ONBOARDING_SYSTEM = 'onboarding_system',
  DASHBOARD_SYSTEM = 'dashboard_system',
  RECOMMENDATION_ENGINE = 'recommendation_engine',
  TASK_ENGINE = 'task_engine',
}

/**
 * Trust score
 */
export interface TrustScore {
  target: TrustTarget;
  targetId: string;
  overallScore: number; // 0-100
  correctness: number; // 0-100
  usefulness: number; // 0-100
  reliability: number; // 0-100
  operatorAcceptance: number; // 0-100
  operatorRejection: number; // 0-100 (higher = more rejection)
  retryFrequency: number; // 0-100 (higher = more retries)
  failureFrequency: number; // 0-100 (higher = more failures)
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: number;
}

/**
 * Internal trust scoring
 */
export class InternalTrustScoring {
  private logger: Logger;
  private trustScores: Map<string, TrustScore> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Calculate agent trust score
   */
  calculateAgentTrustScore(agent: string): TrustScore {
    const recMetrics = recommendationAcceptanceTracking.getAgentMetrics(agent);
    const taskMetrics = taskActionabilityVerification.getAgentMetrics(agent);
    const execMetrics = executionValueVerification.getAgentMetrics(agent);
    const feedbackRanking = operatorFeedbackLoop.getAgentFeedbackRanking();
    const agentFeedback = feedbackRanking.find(r => r.agent === agent);

    // Correctness: based on execution value
    const correctness = execMetrics?.usefulnessScore || 100;

    // Usefulness: based on recommendation acceptance and task actionability
    const recUsefulness = recMetrics?.usefulnessScore || 100;
    const taskUsefulness = taskMetrics?.actionabilityScore || 100;
    const usefulness = Math.round((recUsefulness + taskUsefulness) / 2);

    // Reliability: inverse of fatigue and noise
    const recFatigue = recMetrics?.fatigueScore || 0;
    const taskNoise = taskMetrics?.noiseLevel || 0;
    const reliability = Math.max(0, 100 - Math.round((recFatigue + taskNoise) / 2));

    // Operator acceptance: based on feedback
    const operatorAcceptance = agentFeedback ? Math.max(0, Math.min(100, 50 + agentFeedback.netScore * 10)) : 100;

    // Operator rejection: inverse of acceptance
    const operatorRejection = 100 - operatorAcceptance;

    // Retry frequency: based on execution repetition
    const execRepetitive = execMetrics?.repetitiveRate || 0;
    const retryFrequency = execRepetitive;

    // Failure frequency: based on low-value executions
    const execLowValue = execMetrics?.lowValue || 0;
    const failureFrequency = execLowValue;

    // Overall score: weighted average
    const overallScore = Math.round(
      (correctness * 0.25) +
      (usefulness * 0.25) +
      (reliability * 0.2) +
      (operatorAcceptance * 0.2) +
      (100 - retryFrequency * 0.05) +
      (100 - failureFrequency * 0.05)
    );

    const trustScore: TrustScore = {
      target: TrustTarget.AGENT,
      targetId: agent,
      overallScore,
      correctness,
      usefulness,
      reliability,
      operatorAcceptance,
      operatorRejection,
      retryFrequency,
      failureFrequency,
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    this.trustScores.set(`agent:${agent}`, trustScore);
    return trustScore;
  }

  /**
   * Calculate connector trust score
   */
  calculateConnectorTrustScore(connector: string): TrustScore {
    const alertMetrics = alertFatigueDetection.getConnectorMetrics(connector);

    // Correctness: based on alert usefulness
    const correctness = alertMetrics?.usefulnessScore || 100;

    // Usefulness: based on alert usefulness
    const usefulness = alertMetrics?.usefulnessScore || 100;

    // Reliability: inverse of noise and fatigue
    const noise = alertMetrics?.noiseLevel || 0;
    const fatigue = alertMetrics?.fatigueScore || 0;
    const reliability = Math.max(0, 100 - Math.round((noise + fatigue) / 2));

    // Operator acceptance: based on alert acknowledgment
    const totalAlerts = alertMetrics?.totalAlerts || 0;
    const acknowledged = alertMetrics?.acknowledged || 0;
    const operatorAcceptance = totalAlerts > 0 ? Math.round((acknowledged / totalAlerts) * 100) : 100;

    // Operator rejection: based on ignored alerts
    const ignored = alertMetrics?.ignored || 0;
    const operatorRejection = totalAlerts > 0 ? Math.round((ignored / totalAlerts) * 100) : 0;

    // Retry frequency: based on alert frequency
    const retryFrequency = noise;

    // Failure frequency: based on total alerts
    const failureFrequency = Math.min(100, totalAlerts * 2);

    // Overall score
    const overallScore = Math.round(
      (correctness * 0.3) +
      (usefulness * 0.2) +
      (reliability * 0.2) +
      (operatorAcceptance * 0.2) +
      (100 - retryFrequency * 0.05) +
      (100 - failureFrequency * 0.05)
    );

    const trustScore: TrustScore = {
      target: TrustTarget.CONNECTOR,
      targetId: connector,
      overallScore,
      correctness,
      usefulness,
      reliability,
      operatorAcceptance,
      operatorRejection,
      retryFrequency,
      failureFrequency,
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    this.trustScores.set(`connector:${connector}`, trustScore);
    return trustScore;
  }

  /**
   * Calculate system trust score
   */
  calculateSystemTrustScore(system: TrustTarget): TrustScore {
    // For systems, we use aggregate metrics from all related components
    let overallScore = 85; // Default baseline
    let correctness = 85;
    let usefulness = 85;
    let reliability = 85;
    let operatorAcceptance = 85;
    let operatorRejection = 15;
    let retryFrequency = 10;
    let failureFrequency = 10;

    if (system === TrustTarget.RECOMMENDATION_ENGINE) {
      const allRecMetrics = recommendationAcceptanceTracking.getAllAgentMetrics();
      if (allRecMetrics.length > 0) {
        overallScore = Math.round(allRecMetrics.reduce((sum, m) => sum + m.usefulnessScore, 0) / allRecMetrics.length);
        usefulness = overallScore;
        operatorAcceptance = Math.round(allRecMetrics.reduce((sum, m) => sum + m.trustScore, 0) / allRecMetrics.length);
        operatorRejection = 100 - operatorAcceptance;
      }
    }

    if (system === TrustTarget.TASK_ENGINE) {
      const allTaskMetrics = taskActionabilityVerification.getAllAgentMetrics();
      if (allTaskMetrics.length > 0) {
        overallScore = Math.round(allTaskMetrics.reduce((sum, m) => sum + m.actionabilityScore, 0) / allTaskMetrics.length);
        usefulness = overallScore;
        reliability = 100 - Math.round(allTaskMetrics.reduce((sum, m) => sum + m.noiseLevel, 0) / allTaskMetrics.length);
      }
    }

    const trustScore: TrustScore = {
      target: system,
      targetId: system,
      overallScore,
      correctness,
      usefulness,
      reliability,
      operatorAcceptance,
      operatorRejection,
      retryFrequency,
      failureFrequency,
      trend: 'stable',
      lastUpdated: Date.now(),
    };

    this.trustScores.set(`system:${system}`, trustScore);
    return trustScore;
  }

  /**
   * Get trust score
   */
  getTrustScore(target: TrustTarget, targetId: string): TrustScore | undefined {
    return this.trustScores.get(`${target}:${targetId}`);
  }

  /**
   * Get all trust scores
   */
  getAllTrustScores(): TrustScore[] {
    return Array.from(this.trustScores.values()).sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get trust scores by target type
   */
  getTrustScoresByTarget(target: TrustTarget): TrustScore[] {
    return Array.from(this.trustScores.values())
      .filter(s => s.target === target)
      .sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get low trust targets
   */
  getLowTrustTargets(threshold: number = 60): TrustScore[] {
    return Array.from(this.trustScores.values())
      .filter(s => s.overallScore < threshold)
      .sort((a, b) => a.overallScore - b.overallScore);
  }

  /**
   * Generate trust report
   */
  generateTrustReport(): string {
    const scores = this.getAllTrustScores();
    const lowTrust = this.getLowTrustTargets();

    let report = '=== Internal Trust Scoring Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Scores: ${scores.length}\n\n`;

    report += '--- Trust Scores ---\n';
    scores.forEach(s => {
      report += `${s.target} - ${s.targetId}:\n`;
      report += `  Overall: ${s.overallScore}/100\n`;
      report += `  Correctness: ${s.correctness}/100\n`;
      report += `  Usefulness: ${s.usefulness}/100\n`;
      report += `  Reliability: ${s.reliability}/100\n`;
      report += `  Operator Acceptance: ${s.operatorAcceptance}/100\n`;
      report += `  Operator Rejection: ${s.operatorRejection}/100\n`;
      report += `  Retry Frequency: ${s.retryFrequency}/100\n`;
      report += `  Failure Frequency: ${s.failureFrequency}/100\n`;
      report += `  Trend: ${s.trend}\n`;
    });

    if (lowTrust.length > 0) {
      report += '\n--- Low Trust Targets (<60) ---\n';
      lowTrust.forEach(s => {
        report += `${s.target} - ${s.targetId}: ${s.overallScore}/100\n`;
      });
    }

    return report;
  }

  /**
   * Clear trust scores (for testing only)
   */
  clearTrustScores(): void {
    this.logger.warn('Trust scores cleared');
    this.trustScores.clear();
  }
}

/**
 * Singleton instance
 */
export const internalTrustScoring = new InternalTrustScoring();
