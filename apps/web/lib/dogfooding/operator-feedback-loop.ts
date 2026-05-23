/**
 * Operator Feedback Loop
 * 
 * Creates structured operator feedback:
 * - "useful"
 * - "confusing"
 * - "incorrect"
 * - "too generic"
 * - "too technical"
 * - "spammy"
 * - "missing context"
 * 
 * Feedback links to:
 * - agent
 * - execution
 * - recommendation
 * - task
 * - connector
 * - tenant
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Feedback type
 */
export enum FeedbackType {
  USEFUL = 'useful',
  CONFUSING = 'confusing',
  INCORRECT = 'incorrect',
  TOO_GENERIC = 'too_generic',
  TOO_TECHNICAL = 'too_technical',
  SPAMMY = 'spammy',
  MISSING_CONTEXT = 'missing_context',
}

/**
 * Feedback target
 */
export enum FeedbackTarget {
  AGENT = 'agent',
  EXECUTION = 'execution',
  RECOMMENDATION = 'recommendation',
  TASK = 'task',
  CONNECTOR = 'connector',
  TENANT = 'tenant',
}

/**
 * Operator feedback record
 */
export interface OperatorFeedbackRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  operatorId: string;
  target: FeedbackTarget;
  targetId: string;
  feedbackType: FeedbackType;
  description?: string;
  agent?: string;
  executionId?: string;
  connector?: string;
}

/**
 * Feedback summary
 */
export interface FeedbackSummary {
  target: FeedbackTarget;
  targetId: string;
  totalFeedback: number;
  byType: Record<string, number>;
  positiveCount: number;
  negativeCount: number;
  netScore: number; // positive - negative
}

/**
 * Operator feedback loop
 */
export class OperatorFeedbackLoop {
  private logger: Logger;
  private feedback: OperatorFeedbackRecord[] = [];

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Submit feedback
   */
  submitFeedback(params: {
    tenantId: string;
    operatorId: string;
    target: FeedbackTarget;
    targetId: string;
    feedbackType: FeedbackType;
    description?: string;
    agent?: string;
    executionId?: string;
    connector?: string;
  }): void {
    const record: OperatorFeedbackRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.feedback.push(record);
    this.logger.info('Operator feedback submitted', { record });
  }

  /**
   * Get feedback by target
   */
  getFeedbackByTarget(target: FeedbackTarget, targetId: string): OperatorFeedbackRecord[] {
    return this.feedback.filter(f => f.target === target && f.targetId === targetId);
  }

  /**
   * Get feedback by tenant
   */
  getFeedbackByTenant(tenantId: string): OperatorFeedbackRecord[] {
    return this.feedback.filter(f => f.tenantId === tenantId);
  }

  /**
   * Get feedback by agent
   */
  getFeedbackByAgent(agent: string): OperatorFeedbackRecord[] {
    return this.feedback.filter(f => f.agent === agent);
  }

  /**
   * Get feedback by type
   */
  getFeedbackByType(feedbackType: FeedbackType): OperatorFeedbackRecord[] {
    return this.feedback.filter(f => f.feedbackType === feedbackType);
  }

  /**
   * Get feedback summary for target
   */
  getFeedbackSummary(target: FeedbackTarget, targetId: string): FeedbackSummary {
    const targetFeedback = this.getFeedbackByTarget(target, targetId);

    const byType: Record<string, number> = {};
    targetFeedback.forEach(f => {
      byType[f.feedbackType] = (byType[f.feedbackType] || 0) + 1;
    });

    const positiveCount = targetFeedback.filter(f => f.feedbackType === FeedbackType.USEFUL).length;
    const negativeCount = targetFeedback.filter(f => 
      f.feedbackType !== FeedbackType.USEFUL
    ).length;

    return {
      target,
      targetId,
      totalFeedback: targetFeedback.length,
      byType,
      positiveCount,
      negativeCount,
      netScore: positiveCount - negativeCount,
    };
  }

  /**
   * Get agent feedback ranking
   */
  getAgentFeedbackRanking(): Array<{ agent: string; netScore: number; totalFeedback: number }> {
    const agentFeedback: Map<string, OperatorFeedbackRecord[]> = new Map();

    this.feedback.forEach(f => {
      if (f.agent) {
        const existing = agentFeedback.get(f.agent) || [];
        existing.push(f);
        agentFeedback.set(f.agent, existing);
      }
    });

    return Array.from(agentFeedback.entries()).map(([agent, records]) => {
      const positive = records.filter(r => r.feedbackType === FeedbackType.USEFUL).length;
      const negative = records.filter(r => r.feedbackType !== FeedbackType.USEFUL).length;
      return {
        agent,
        netScore: positive - negative,
        totalFeedback: records.length,
      };
    }).sort((a, b) => b.netScore - a.netScore);
  }

  /**
   * Get overall feedback statistics
   */
  getFeedbackStatistics(): {
    totalFeedback: number;
    byType: Record<string, number>;
    byTarget: Record<string, number>;
    positiveRate: number;
    negativeRate: number;
  } {
    const total = this.feedback.length;

    const byType: Record<string, number> = {};
    const byTarget: Record<string, number> = {};

    this.feedback.forEach(f => {
      byType[f.feedbackType] = (byType[f.feedbackType] || 0) + 1;
      byTarget[f.target] = (byTarget[f.target] || 0) + 1;
    });

    const positiveCount = this.feedback.filter(f => f.feedbackType === FeedbackType.USEFUL).length;
    const negativeCount = this.feedback.filter(f => f.feedbackType !== FeedbackType.USEFUL).length;

    return {
      totalFeedback: total,
      byType,
      byTarget,
      positiveRate: total > 0 ? Math.round((positiveCount / total) * 100) : 100,
      negativeRate: total > 0 ? Math.round((negativeCount / total) * 100) : 0,
    };
  }

  /**
   * Generate feedback report
   */
  generateFeedbackReport(): string {
    const stats = this.getFeedbackStatistics();
    const agentRanking = this.getAgentFeedbackRanking();

    let report = '=== Operator Feedback Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Feedback: ${stats.totalFeedback}\n`;
    report += `Positive Rate: ${stats.positiveRate}%\n`;
    report += `Negative Rate: ${stats.negativeRate}%\n\n`;

    report += '--- Feedback by Type ---\n';
    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Feedback by Target ---\n';
    Object.entries(stats.byTarget).forEach(([target, count]) => {
      report += `${target}: ${count}\n`;
    });

    report += '\n--- Agent Feedback Ranking ---\n';
    agentRanking.forEach((r, index) => {
      report += `${index + 1}. ${r.agent}\n`;
      report += `   Net Score: ${r.netScore}\n`;
      report += `   Total Feedback: ${r.totalFeedback}\n`;
    });

    return report;
  }

  /**
   * Clear feedback (for testing only)
   */
  clearFeedback(): void {
    this.logger.warn('Operator feedback cleared');
    this.feedback = [];
  }
}

/**
 * Singleton instance
 */
export const operatorFeedbackLoop = new OperatorFeedbackLoop();
