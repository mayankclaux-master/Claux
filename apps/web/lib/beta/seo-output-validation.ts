/**
 * SEO Output Validation
 * 
 * Audits REAL outputs for:
 * - Recommendation quality
 * - Keyword usefulness
 * - Ranking accuracy
 * - Backlink relevance
 * - Technical audit usefulness
 * - Local SEO usefulness
 * - Review analysis usefulness
 * 
 * Creates per-agent real-world usefulness scoring.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Agent name
 */
export enum AgentName {
  ARIA = 'ARIA',
  SCRIBE = 'SCRIBE',
  PUBLISH = 'PUBLISH',
  PULSE = 'PULSE',
  LOCL = 'LOCL',
  REPUTE = 'REPUTE',
  LINX = 'LINX',
  PRISM = 'PRISM',
  CORE = 'CORE',
}

/**
 * Output type
 */
export enum OutputType {
  RECOMMENDATION = 'recommendation',
  KEYWORD = 'keyword',
  RANKING = 'ranking',
  BACKLINK = 'backlink',
  TECHNICAL_AUDIT = 'technical_audit',
  LOCAL_SEO = 'local_seo',
  REVIEW_ANALYSIS = 'review_analysis',
}

/**
 * Output validation record
 */
export interface OutputValidationRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  agent: AgentName;
  outputType: OutputType;
  output: string;
  qualityScore: number; // 0-100
  usefulnessScore: number; // 0-100
  accuracyScore: number; // 0-100
  issues: string[];
  feedback?: string;
}

/**
 * Agent real-world usefulness metrics
 */
export interface AgentRealWorldMetrics {
  agent: AgentName;
  totalOutputs: number;
  averageQuality: number;
  averageUsefulness: number;
  averageAccuracy: number;
  overallScore: number; // 0-100
  byType: Record<string, { count: number; avgQuality: number; avgUsefulness: number }>;
}

/**
 * SEO output validation
 */
export class SEOOutputValidation {
  private logger: Logger;
  private records: OutputValidationRecord[] = [];
  private agentMetrics: Map<AgentName, AgentRealWorldMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Validate output
   */
  validateOutput(params: {
    tenantId: string;
    agent: AgentName;
    outputType: OutputType;
    output: string;
    feedback?: string;
  }): OutputValidationRecord {
    const qualityScore = this.assessQuality(params.output, params.outputType);
    const usefulnessScore = this.assessUsefulness(params.output, params.outputType);
    const accuracyScore = this.assessAccuracy(params.output, params.outputType);
    const issues = this.detectIssues(params.output, params.outputType);

    const record: OutputValidationRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
      qualityScore,
      usefulnessScore,
      accuracyScore,
      issues,
    };

    this.records.push(record);
    this.updateAgentMetrics(params.agent);
    this.logger.info('Output validated', { record });

    return record;
  }

  /**
   * Assess quality
   */
  private assessQuality(output: string, outputType: OutputType): number {
    let score = 100;

    // Check for generic content
    const genericPhrases = ['improve your', 'optimize your', 'increase your', 'boost your'];
    if (genericPhrases.some(phrase => output.toLowerCase().includes(phrase))) {
      score -= 20;
    }

    // Check for specificity
    if (output.length < 50) {
      score -= 30;
    }

    // Check for actionable content
    const actionVerbs = ['add', 'create', 'update', 'fix', 'remove', 'check', 'verify'];
    if (!actionVerbs.some(verb => output.toLowerCase().startsWith(verb))) {
      score -= 15;
    }

    return Math.max(0, score);
  }

  /**
   * Assess usefulness
   */
  private assessUsefulness(output: string, outputType: OutputType): number {
    let score = 100;

    // Check for actionable insights
    if (outputType === OutputType.RECOMMENDATION) {
      if (!output.includes('should') && !output.includes('recommend')) {
        score -= 25;
      }
    }

    // Check for data-backed insights
    if (outputType === OutputType.KEYWORD) {
      if (!output.includes('volume') && !output.includes('difficulty')) {
        score -= 20;
      }
    }

    // Check for specific metrics
    if (outputType === OutputType.RANKING) {
      if (!output.includes('position') && !output.includes('rank')) {
        score -= 20;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Assess accuracy
   */
  private assessAccuracy(output: string, outputType: OutputType): number {
    // In production, this would validate against actual data
    // For now, we use heuristics
    let score = 85; // Baseline

    // Penalize for claims that seem exaggerated
    const exaggeratedPhrases = ['guaranteed', 'instant', 'overnight', '100%'];
    if (exaggeratedPhrases.some(phrase => output.toLowerCase().includes(phrase))) {
      score -= 30;
    }

    return Math.max(0, score);
  }

  /**
   * Detect issues
   */
  private detectIssues(output: string, outputType: OutputType): string[] {
    const issues: string[] = [];

    if (output.length < 30) {
      issues.push('Output too short');
    }

    if (output.length > 500) {
      issues.push('Output too long');
    }

    if (output.includes('TODO') || output.includes('FIXME')) {
      issues.push('Contains placeholder text');
    }

    if (outputType === OutputType.KEYWORD && !output.includes('search')) {
      issues.push('Missing search context');
    }

    if (outputType === OutputType.BACKLINK && !output.includes('link')) {
      issues.push('Missing link reference');
    }

    return issues;
  }

  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agent: AgentName): void {
    const agentRecords = this.records.filter(r => r.agent === agent);
    const total = agentRecords.length;

    const averageQuality = total > 0
      ? Math.round(agentRecords.reduce((sum, r) => sum + r.qualityScore, 0) / total)
      : 100;

    const averageUsefulness = total > 0
      ? Math.round(agentRecords.reduce((sum, r) => sum + r.usefulnessScore, 0) / total)
      : 100;

    const averageAccuracy = total > 0
      ? Math.round(agentRecords.reduce((sum, r) => sum + r.accuracyScore, 0) / total)
      : 100;

    const overallScore = Math.round((averageQuality + averageUsefulness + averageAccuracy) / 3);

    // Calculate metrics by output type
    const byType: Record<string, { count: number; avgQuality: number; avgUsefulness: number }> = {};

    agentRecords.forEach(record => {
      if (!byType[record.outputType]) {
        byType[record.outputType] = { count: 0, avgQuality: 0, avgUsefulness: 0 };
      }
      byType[record.outputType].count++;
      byType[record.outputType].avgQuality += record.qualityScore;
      byType[record.outputType].avgUsefulness += record.usefulnessScore;
    });

    Object.keys(byType).forEach(type => {
      byType[type].avgQuality = Math.round(byType[type].avgQuality / byType[type].count);
      byType[type].avgUsefulness = Math.round(byType[type].avgUsefulness / byType[type].count);
    });

    this.agentMetrics.set(agent, {
      agent,
      totalOutputs: total,
      averageQuality,
      averageUsefulness,
      averageAccuracy,
      overallScore,
      byType,
    });
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agent: AgentName): AgentRealWorldMetrics | undefined {
    return this.agentMetrics.get(agent);
  }

  /**
   * Get all agent metrics
   */
  getAllAgentMetrics(): AgentRealWorldMetrics[] {
    return Array.from(this.agentMetrics.values()).sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Get records by tenant
   */
  getRecordsByTenant(tenantId: string): OutputValidationRecord[] {
    return this.records.filter(r => r.tenantId === tenantId);
  }

  /**
   * Get records by agent
   */
  getRecordsByAgent(agent: AgentName): OutputValidationRecord[] {
    return this.records.filter(r => r.agent === agent);
  }

  /**
   * Generate validation report
   */
  generateValidationReport(): string {
    const metrics = this.getAllAgentMetrics();

    let report = '=== SEO Output Validation Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Validations: ${this.records.length}\n\n`;

    report += '--- Agent Real-World Usefulness Ranking ---\n';
    metrics.forEach((m, index) => {
      report += `${index + 1}. ${m.agent}\n`;
      report += `   Overall Score: ${m.overallScore}/100\n`;
      report += `   Quality: ${m.averageQuality}/100\n`;
      report += `   Usefulness: ${m.averageUsefulness}/100\n`;
      report += `   Accuracy: ${m.averageAccuracy}/100\n`;
      report += `   Total Outputs: ${m.totalOutputs}\n`;
    });

    report += '\n--- Detailed Agent Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.agent}:\n`;
      report += `  By Type:\n`;
      Object.entries(m.byType).forEach(([type, data]) => {
        report += `    ${type}: ${data.count} outputs, quality ${data.avgQuality}, usefulness ${data.avgUsefulness}\n`;
      });
    });

    return report;
  }

  /**
   * Clear records (for testing only)
   */
  clearRecords(): void {
    this.logger.warn('Output validation records cleared');
    this.records = [];
    this.agentMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const seoOutputValidation = new SEOOutputValidation();
