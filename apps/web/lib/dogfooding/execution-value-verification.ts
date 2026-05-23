/**
 * Execution Value Verification
 * 
 * Measures:
 * - Executions producing useful outputs
 * - Executions producing no actionable insight
 * - Executions producing repetitive outputs
 * - Executions producing contradictory outputs
 * 
 * Generates:
 * - Execution usefulness scoring
 * - Agent value ranking
 * - Low-value execution detection
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Execution value rating
 */
export enum ExecutionValueRating {
  HIGH_VALUE = 'high_value',
  MEDIUM_VALUE = 'medium_value',
  LOW_VALUE = 'low_value',
  NO_VALUE = 'no_value',
}

/**
 * Execution value record
 */
export interface ExecutionValueRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  agent: string;
  executionId: string;
  rating: ExecutionValueRating;
  reason?: string;
  operatorId?: string;
  actionableInsights: number;
  repetitive: boolean;
  contradictory: boolean;
}

/**
 * Agent value metrics
 */
export interface AgentValueMetrics {
  agent: string;
  totalExecutions: number;
  highValue: number;
  mediumValue: number;
  lowValue: number;
  noValue: number;
  usefulnessScore: number; // 0-100
  averageActionableInsights: number;
  repetitiveRate: number; // 0-100
  contradictoryRate: number; // 0-100
}

/**
 * Execution value verification
 */
export class ExecutionValueVerification {
  private logger: Logger;
  private records: ExecutionValueRecord[] = [];
  private agentMetrics: Map<string, AgentValueMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record execution value
   */
  recordValue(params: {
    tenantId: string;
    agent: string;
    executionId: string;
    rating: ExecutionValueRating;
    reason?: string;
    operatorId?: string;
    actionableInsights: number;
    repetitive: boolean;
    contradictory: boolean;
  }): void {
    const record: ExecutionValueRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.records.push(record);
    this.updateAgentMetrics(params.agent);
    this.logger.info('Execution value recorded', { record });
  }

  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agent: string): void {
    const agentRecords = this.records.filter(r => r.agent === agent);
    const total = agentRecords.length;

    const highValue = agentRecords.filter(r => r.rating === ExecutionValueRating.HIGH_VALUE).length;
    const mediumValue = agentRecords.filter(r => r.rating === ExecutionValueRating.MEDIUM_VALUE).length;
    const lowValue = agentRecords.filter(r => r.rating === ExecutionValueRating.LOW_VALUE).length;
    const noValue = agentRecords.filter(r => r.rating === ExecutionValueRating.NO_VALUE).length;

    const totalActionableInsights = agentRecords.reduce((sum, r) => sum + r.actionableInsights, 0);
    const averageActionableInsights = total > 0 ? Math.round(totalActionableInsights / total) : 0;

    const repetitiveCount = agentRecords.filter(r => r.repetitive).length;
    const repetitiveRate = total > 0 ? Math.round((repetitiveCount / total) * 100) : 0;

    const contradictoryCount = agentRecords.filter(r => r.contradictory).length;
    const contradictoryRate = total > 0 ? Math.round((contradictoryCount / total) * 100) : 0;

    // Usefulness score: weighted by value rating
    const valueWeights = {
      [ExecutionValueRating.HIGH_VALUE]: 100,
      [ExecutionValueRating.MEDIUM_VALUE]: 75,
      [ExecutionValueRating.LOW_VALUE]: 25,
      [ExecutionValueRating.NO_VALUE]: 0,
    };

    const weightedSum = agentRecords.reduce((sum, r) => sum + valueWeights[r.rating], 0);
    const usefulnessScore = total > 0 ? Math.round(weightedSum / total) : 100;

    this.agentMetrics.set(agent, {
      agent,
      totalExecutions: total,
      highValue,
      mediumValue,
      lowValue,
      noValue,
      usefulnessScore,
      averageActionableInsights,
      repetitiveRate,
      contradictoryRate,
    });
  }

  /**
   * Detect low-value executions
   */
  detectLowValueExecutions(tenantId: string): ExecutionValueRecord[] {
    return this.records.filter(r => 
      r.tenantId === tenantId && 
      (r.rating === ExecutionValueRating.LOW_VALUE || r.rating === ExecutionValueRating.NO_VALUE)
    );
  }

  /**
   * Detect executions with no actionable insight
   */
  detectNoActionableInsightExecutions(tenantId: string): ExecutionValueRecord[] {
    return this.records.filter(r => 
      r.tenantId === tenantId && 
      r.actionableInsights === 0
    );
  }

  /**
   * Detect repetitive executions
   */
  detectRepetitiveExecutions(tenantId: string): ExecutionValueRecord[] {
    return this.records.filter(r => 
      r.tenantId === tenantId && 
      r.repetitive
    );
  }

  /**
   * Detect contradictory executions
   */
  detectContradictoryExecutions(tenantId: string): ExecutionValueRecord[] {
    return this.records.filter(r => 
      r.tenantId === tenantId && 
      r.contradictory
    );
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agent: string): AgentValueMetrics | undefined {
    return this.agentMetrics.get(agent);
  }

  /**
   * Get all agent metrics
   */
  getAllAgentMetrics(): AgentValueMetrics[] {
    return Array.from(this.agentMetrics.values()).sort((a, b) => b.usefulnessScore - a.usefulnessScore);
  }

  /**
   * Get agent value ranking
   */
  getAgentValueRanking(): Array<{ agent: string; usefulnessScore: number; averageActionableInsights: number }> {
    return this.getAllAgentMetrics().map(m => ({
      agent: m.agent,
      usefulnessScore: m.usefulnessScore,
      averageActionableInsights: m.averageActionableInsights,
    })).sort((a, b) => b.usefulnessScore - a.usefulnessScore);
  }

  /**
   * Generate value report
   */
  generateValueReport(): string {
    const metrics = this.getAllAgentMetrics();
    const ranking = this.getAgentValueRanking();

    let report = '=== Execution Value Verification Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Records: ${this.records.length}\n\n`;

    report += '--- Agent Value Ranking ---\n';
    ranking.forEach((r, index) => {
      report += `${index + 1}. ${r.agent}\n`;
      report += `   Usefulness: ${r.usefulnessScore}%\n`;
      report += `   Avg Actionable Insights: ${r.averageActionableInsights}\n`;
    });

    report += '\n--- Detailed Agent Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.agent}:\n`;
      report += `  Total Executions: ${m.totalExecutions}\n`;
      report += `  High Value: ${m.highValue}\n`;
      report += `  Medium Value: ${m.mediumValue}\n`;
      report += `  Low Value: ${m.lowValue}\n`;
      report += `  No Value: ${m.noValue}\n`;
      report += `  Usefulness: ${m.usefulnessScore}%\n`;
      report += `  Avg Actionable Insights: ${m.averageActionableInsights}\n`;
      report += `  Repetitive Rate: ${m.repetitiveRate}%\n`;
      report += `  Contradictory Rate: ${m.contradictoryRate}%\n`;
    });

    return report;
  }

  /**
   * Clear records (for testing only)
   */
  clearRecords(): void {
    this.logger.warn('Execution value records cleared');
    this.records = [];
    this.agentMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const executionValueVerification = new ExecutionValueVerification();
