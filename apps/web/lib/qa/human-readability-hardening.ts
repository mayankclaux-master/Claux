/**
 * Human Readability Hardening
 * 
 * Ensures:
 * - Errors are understandable
 * - Connector failures are understandable
 * - Onboarding blockers are understandable
 * - Recommendations are understandable
 * - Tasks are actionable
 * - Execution summaries are readable
 * 
 * NO developer-only language.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Readability check result
 */
export interface ReadabilityCheck {
  original: string;
  improved: string;
  issues: string[];
  score: number; // 0-100
}

/**
 * Human readability hardening service
 */
export class HumanReadabilityHardening {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Harden error message for human readability
   */
  hardenErrorMessage(error: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = error;

    // Remove developer jargon
    const jargonMap: Record<string, string> = {
      'null pointer exception': 'Something went wrong - a required piece of information was missing',
      'timeout exceeded': 'The operation took too long to complete',
      'rate limit exceeded': 'Too many requests - please wait a moment',
      'authentication failed': 'Your login credentials are incorrect or expired',
      'connection refused': 'Cannot connect to the service - please check your internet',
      'internal server error': 'Something went wrong on our end - please try again',
      'database error': 'Could not save your changes - please try again',
      'validation error': 'Some information is incorrect - please check your inputs',
    };

    Object.entries(jargonMap).forEach(([jargon, replacement]) => {
      if (improved.toLowerCase().includes(jargon)) {
        improved = improved.replace(new RegExp(jargon, 'gi'), replacement);
        issues.push(`Replaced developer jargon: ${jargon}`);
      }
    });

    // Add helpful context
    if (!improved.includes('please')) {
      improved += '. Please try again or contact support if the issue persists.';
    }

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: error,
      improved,
      issues,
      score,
    };
  }

  /**
   * Harden connector failure message
   */
  hardenConnectorFailure(connector: string, error: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = error;

    // Make connector name more readable
    const connectorNames: Record<string, string> = {
      'google_search_console': 'Google Search Console',
      'google_analytics': 'Google Analytics',
      'google_business_profile': 'Google Business Profile',
      'dataforseo': 'DataForSEO',
      'serpapi': 'SerpAPI',
    };

    const readableConnector = connectorNames[connector] || connector;
    improved = improved.replace(new RegExp(connector, 'gi'), readableConnector);

    // Add context about what the connector does
    if (!improved.includes('connector')) {
      improved = `The ${readableConnector} connector encountered an issue: ${improved}`;
    }

    // Add recovery suggestion
    if (!improved.includes('check')) {
      improved += ' Please check your connector settings and try again.';
    }

    issues.push('Added connector context');
    issues.push('Added recovery suggestion');

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: error,
      improved,
      issues,
      score,
    };
  }

  /**
   * Harden onboarding blocker message
   */
  hardenOnboardingBlocker(blocker: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = blocker;

    // Make blocker more actionable
    if (improved.includes('missing')) {
      improved = improved.replace('missing', 'you need to add');
      issues.push('Changed "missing" to actionable language');
    }

    if (improved.includes('failed')) {
      improved = improved.replace('failed', 'could not complete');
      issues.push('Softened failure language');
    }

    // Add next steps
    if (!improved.includes('to fix')) {
      improved += ' To fix this, please complete the required step and try again.';
      issues.push('Added next steps');
    }

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: blocker,
      improved,
      issues,
      score,
    };
  }

  /**
   * Harden recommendation for readability
   */
  hardenRecommendation(recommendation: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = recommendation;

    // Remove technical jargon
    const jargonMap: Record<string, string> = {
      'canonical tag': 'canonical link',
      'meta description': 'page description',
      'title tag': 'page title',
      'schema markup': 'structured data',
      '301 redirect': 'permanent redirect',
      '404 error': 'broken link',
      'backlink': 'link from another site',
      'domain authority': 'website authority',
    };

    Object.entries(jargonMap).forEach(([jargon, replacement]) => {
      if (improved.toLowerCase().includes(jargon)) {
        improved = improved.replace(new RegExp(jargon, 'gi'), replacement);
        issues.push(`Replaced technical term: ${jargon} -> ${replacement}`);
      }
    });

    // Make it more specific
    if (improved.length < 50) {
      improved += ' This will help improve your search engine rankings.';
      issues.push('Added context about benefit');
    }

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: recommendation,
      improved,
      issues,
      score,
    };
  }

  /**
   * Harden task for actionability
   */
  hardenTask(task: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = task;

    // Ensure task starts with action verb
    const actionVerbs = ['add', 'create', 'update', 'fix', 'remove', 'check', 'verify', 'optimize', 'improve'];
    const firstWord = improved.split(' ')[0].toLowerCase();

    if (!actionVerbs.includes(firstWord)) {
      improved = `Complete this task: ${improved}`;
      issues.push('Added action verb prefix');
    }

    // Make it specific
    if (!improved.includes('by') && !improved.includes('to')) {
      improved += ' by following the recommended steps.';
      issues.push('Added specificity');
    }

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: task,
      improved,
      issues,
      score,
    };
  }

  /**
   * Harden execution summary for readability
   */
  hardenExecutionSummary(summary: string): ReadabilityCheck {
    const issues: string[] = [];
    let improved = summary;

    // Split into sentences if too long
    if (improved.length > 200 && !improved.includes('.')) {
      improved = improved.replace(/, /g, '. ');
      issues.push('Split long text into sentences');
    }

    // Add status indicator
    if (!improved.startsWith('Success') && !improved.startsWith('Failed') && !improved.startsWith('Partial')) {
      improved = `Execution completed. ${improved}`;
      issues.push('Added status indicator');
    }

    // Add next steps if failed
    if (improved.toLowerCase().includes('fail') && !improved.includes('next')) {
      improved += ' See the detailed logs for next steps.';
      issues.push('Added next steps for failures');
    }

    const score = this.calculateReadabilityScore(improved, issues);

    return {
      original: summary,
      improved,
      issues,
      score,
    };
  }

  /**
   * Calculate readability score
   */
  private calculateReadabilityScore(text: string, issues: string[]): number {
    let score = 100;

    // Penalize for issues
    score -= issues.length * 5;

    // Penalize for very long sentences
    const sentences = text.split(/[.!?]/);
    sentences.forEach(sentence => {
      if (sentence.length > 100) {
        score -= 10;
      }
    });

    // Penalize for complex words
    const complexWords = ['implementation', 'configuration', 'authentication', 'authorization', 'optimization'];
    complexWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score -= 5;
      }
    });

    return Math.max(0, score);
  }

  /**
   * Generate readability report
   */
  generateReadabilityReport(checks: ReadabilityCheck[]): string {
    let report = '=== Human Readability Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Checks: ${checks.length}\n\n`;

    const averageScore = checks.reduce((sum, check) => sum + check.score, 0) / checks.length;

    report += `Average Readability Score: ${Math.round(averageScore)}/100\n\n`;

    report += '--- Individual Checks ---\n';
    checks.forEach((check, index) => {
      report += `Check ${index + 1}:\n`;
      report += `  Score: ${check.score}/100\n`;
      report += `  Original: ${check.original}\n`;
      report += `  Improved: ${check.improved}\n`;
      if (check.issues.length > 0) {
        report += `  Issues: ${check.issues.join(', ')}\n`;
      }
    });

    return report;
  }
}

/**
 * Singleton instance
 */
export const humanReadabilityHardening = new HumanReadabilityHardening();
