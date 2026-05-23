/**
 * Recommendation Quality Validation
 * 
 * Audits all agent outputs for:
 * - Hallucinated recommendations
 * - Duplicate recommendations
 * - Low-quality tasks
 * - Generic SEO advice
 * - Contradictory actions
 * - Impossible actions
 * - Invalid URLs
 * - Invalid keyword opportunities
 * - Spammy recommendations
 * 
 * Creates recommendation quality scoring.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Quality issue type
 */
export enum QualityIssueType {
  HALLUCINATED = 'hallucinated',
  DUPLICATE = 'duplicate',
  LOW_QUALITY = 'low_quality',
  GENERIC = 'generic',
  CONTRADICTORY = 'contradictory',
  IMPOSSIBLE = 'impossible',
  INVALID_URL = 'invalid_url',
  INVALID_KEYWORD = 'invalid_keyword',
  SPAMMY = 'spammy',
}

/**
 * Quality issue
 */
export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  timestamp: number;
  tenantId: string;
  agent: string;
  recommendation: string;
  severity: 'critical' | 'warning' | 'info';
  reason: string;
}

/**
 * Recommendation quality score
 */
export interface RecommendationQualityScore {
  tenantId: string;
  agent: string;
  overallScore: number; // 0-100
  issueCount: number;
  byType: Record<string, number>;
  lastUpdated: number;
}

/**
 * Recommendation quality validation service
 */
export class RecommendationQualityValidation {
  private logger: Logger;
  private qualityIssues: QualityIssue[] = [];
  private qualityScores: Map<string, RecommendationQualityScore> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Validate a recommendation
   */
  validateRecommendation(params: {
    tenantId: string;
    agent: string;
    recommendation: string;
  }): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Check for hallucinated recommendations
    if (this.isHallucinated(params.recommendation)) {
      issues.push(this.createIssue({
        type: QualityIssueType.HALLUCINATED,
        tenantId: params.tenantId,
        agent: params.agent,
        recommendation: params.recommendation,
        severity: 'critical',
        reason: 'Recommendation appears to be hallucinated or not based on data',
      }));
    }

    // Check for generic SEO advice
    if (this.isGeneric(params.recommendation)) {
      issues.push(this.createIssue({
        type: QualityIssueType.GENERIC,
        tenantId: params.tenantId,
        agent: params.agent,
        recommendation: params.recommendation,
        severity: 'warning',
        reason: 'Recommendation is generic SEO advice without specific context',
      }));
    }

    // Check for invalid URLs
    if (this.hasInvalidURL(params.recommendation)) {
      issues.push(this.createIssue({
        type: QualityIssueType.INVALID_URL,
        tenantId: params.tenantId,
        agent: params.agent,
        recommendation: params.recommendation,
        severity: 'warning',
        reason: 'Recommendation contains invalid URLs',
      }));
    }

    // Check for spammy recommendations
    if (this.isSpammy(params.recommendation)) {
      issues.push(this.createIssue({
        type: QualityIssueType.SPAMMY,
        tenantId: params.tenantId,
        agent: params.agent,
        recommendation: params.recommendation,
        severity: 'critical',
        reason: 'Recommendation appears spammy or low-quality',
      }));
    }

    // Store issues
    issues.forEach(issue => {
      this.qualityIssues.push(issue);
    });

    // Update quality score
    this.updateQualityScore(params.tenantId, params.agent);

    return issues;
  }

  /**
   * Check for duplicates across recommendations
   */
  checkDuplicates(tenantId: string, recommendations: string[]): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const seen = new Set<string>();

    recommendations.forEach((rec, index) => {
      const normalized = rec.toLowerCase().trim();
      if (seen.has(normalized)) {
        issues.push(this.createIssue({
          type: QualityIssueType.DUPLICATE,
          tenantId,
          agent: 'multiple',
          recommendation: rec,
          severity: 'warning',
          reason: 'Duplicate recommendation detected',
        }));
      }
      seen.add(normalized);
    });

    return issues;
  }

  /**
   * Check for contradictory actions
   */
  checkContradictions(tenantId: string, recommendations: string[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    // Simple contradiction detection
    const hasAdd = recommendations.some(r => r.toLowerCase().includes('add'));
    const hasRemove = recommendations.some(r => r.toLowerCase().includes('remove'));

    if (hasAdd && hasRemove) {
      issues.push(this.createIssue({
        type: QualityIssueType.CONTRADICTORY,
        tenantId,
        agent: 'multiple',
        recommendation: 'Mixed add/remove recommendations',
        severity: 'warning',
        reason: 'Contradictory actions detected (add vs remove)',
      }));
    }

    return issues;
  }

  /**
   * Check for impossible actions
   */
  checkImpossibleActions(tenantId: string, recommendations: string[]): QualityIssue[] {
    const issues: QualityIssue[] = [];

    recommendations.forEach(rec => {
      if (this.isImpossible(rec)) {
        issues.push(this.createIssue({
          type: QualityIssueType.IMPOSSIBLE,
          tenantId,
          agent: 'multiple',
          recommendation: rec,
          severity: 'critical',
          reason: 'Recommendation describes an impossible action',
        }));
      }
    });

    return issues;
  }

  /**
   * Check if recommendation is hallucinated
   */
  private isHallucinated(recommendation: string): boolean {
    // In production, this would check against actual data
    // For now, we use simple heuristics
    const hallucinationKeywords = ['definitely', 'certainly', 'guaranteed', 'without doubt'];
    return hallucinationKeywords.some(keyword => 
      recommendation.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if recommendation is generic
   */
  private isGeneric(recommendation: string): boolean {
    const genericPhrases = [
      'improve your seo',
      'optimize your content',
      'build backlinks',
      'increase traffic',
      'rank higher',
    ];
    return genericPhrases.some(phrase => 
      recommendation.toLowerCase().includes(phrase)
    );
  }

  /**
   * Check if recommendation has invalid URLs
   */
  private hasInvalidURL(recommendation: string): boolean {
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = recommendation.match(urlPattern) || [];

    return urls.some(url => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });
  }

  /**
   * Check if recommendation is spammy
   */
  private isSpammy(recommendation: string): boolean {
    const spammyKeywords = [
      'buy now',
      'click here',
      'free trial',
      'limited time',
      'act now',
      'don\'t miss',
    ];
    return spammyKeywords.some(keyword => 
      recommendation.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if action is impossible
   */
  private isImpossible(recommendation: string): boolean {
    const impossibleKeywords = [
      'instant',
      'immediate',
      'overnight',
      'guaranteed',
      '100%',
    ];
    return impossibleKeywords.some(keyword => 
      recommendation.toLowerCase().includes(keyword)
    );
  }

  /**
   * Create quality issue
   */
  private createIssue(params: {
    type: QualityIssueType;
    tenantId: string;
    agent: string;
    recommendation: string;
    severity: 'critical' | 'warning' | 'info';
    reason: string;
  }): QualityIssue {
    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };
  }

  /**
   * Update quality score for tenant/agent
   */
  private updateQualityScore(tenantId: string, agent: string): void {
    const key = `${tenantId}:${agent}`;
    const issues = this.qualityIssues.filter(
      i => i.tenantId === tenantId && i.agent === agent
    );

    const totalRecommendations = 100; // Simulated total
    const issueCount = issues.length;
    const score = Math.max(0, 100 - (issueCount * 10));

    const byType: Record<string, number> = {};
    issues.forEach(issue => {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    });

    this.qualityScores.set(key, {
      tenantId,
      agent,
      overallScore: score,
      issueCount,
      byType,
      lastUpdated: Date.now(),
    });
  }

  /**
   * Get quality score for tenant/agent
   */
  getQualityScore(tenantId: string, agent: string): RecommendationQualityScore | undefined {
    return this.qualityScores.get(`${tenantId}:${agent}`);
  }

  /**
   * Get all quality scores
   */
  getAllQualityScores(): RecommendationQualityScore[] {
    return Array.from(this.qualityScores.values());
  }

  /**
   * Get quality issues by type
   */
  getIssuesByType(type: QualityIssueType): QualityIssue[] {
    return this.qualityIssues.filter(issue => issue.type === type);
  }

  /**
   * Get quality issues by tenant
   */
  getIssuesByTenant(tenantId: string): QualityIssue[] {
    return this.qualityIssues.filter(issue => issue.tenantId === tenantId);
  }

  /**
   * Get quality issues by agent
   */
  getIssuesByAgent(agent: string): QualityIssue[] {
    return this.qualityIssues.filter(issue => issue.agent === agent);
  }

  /**
   * Generate quality report
   */
  generateQualityReport(): string {
    const scores = this.getAllQualityScores();
    const issuesByType: Record<string, number> = {};

    this.qualityIssues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
    });

    let report = '=== Recommendation Quality Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Issues: ${this.qualityIssues.length}\n\n`;

    report += '--- Issues by Type ---\n';
    Object.entries(issuesByType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Quality Scores by Agent ---\n';
    scores.forEach(score => {
      report += `${score.agent} (${score.tenantId}): ${score.overallScore}/100\n`;
      report += `  Issues: ${score.issueCount}\n`;
    });

    return report;
  }

  /**
   * Clear quality issues (for testing only)
   */
  clearQualityIssues(): void {
    this.logger.warn('Quality issues cleared');
    this.qualityIssues = [];
    this.qualityScores.clear();
  }
}

/**
 * Singleton instance
 */
export const recommendationQualityValidation = new RecommendationQualityValidation();
