/**
 * Real-World Reliability Report
 * 
 * Generates:
 * - Connector stability report
 * - API cost report
 * - OAuth reliability report
 * - Payload anomaly report
 * - Execution success report
 * - Shadow readiness score
 */

import { createLogger, Logger } from '@/lib/utils/logger';
import { connectorReliabilityScoring } from './connector-reliability-scoring';
import { costTracking } from './cost-tracking';
import { realPayloadValidation } from './real-payload-validation';
import { shadowModeSystem, ExecutionMode } from './shadow-mode-system';

/**
 * Reliability report
 */
export interface ReliabilityReport {
  timestamp: number;
  executionMode: ExecutionMode;
  shadowReadinessScore: number;
  connectorStability: {
    overallScore: number;
    byConnector: Record<string, { score: number; uptime: number; failureRate: number }>;
  };
  apiCosts: {
    totalCost: number;
    totalCredits: number;
    totalApiCalls: number;
    byConnector: Record<string, { cost: number; credits: number; calls: number }>;
  };
  oauthReliability: {
    oauthExpiryCount: number;
    permissionFailureCount: number;
    byConnector: Record<string, { expiryCount: number; permissionCount: number }>;
  };
  payloadAnomalies: {
    totalAnomalies: number;
    byType: Record<string, number>;
    byConnector: Record<string, number>;
  };
  executionSuccess: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  };
}

/**
 * Real-world reliability report service
 */
export class RealWorldReliabilityReport {
  private logger: Logger;

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Generate comprehensive reliability report
   */
  generateReliabilityReport(): ReliabilityReport {
    this.logger.info('Generating real-world reliability report');

    const report: ReliabilityReport = {
      timestamp: Date.now(),
      executionMode: shadowModeSystem.getExecutionMode(),
      shadowReadinessScore: 0,
      connectorStability: {
        overallScore: 0,
        byConnector: {},
      },
      apiCosts: {
        totalCost: 0,
        totalCredits: 0,
        totalApiCalls: 0,
        byConnector: {},
      },
      oauthReliability: {
        oauthExpiryCount: 0,
        permissionFailureCount: 0,
        byConnector: {},
      },
      payloadAnomalies: {
        totalAnomalies: 0,
        byType: {},
        byConnector: {},
      },
      executionSuccess: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
      },
    };

    // Generate connector stability report
    report.connectorStability = this.generateConnectorStability();

    // Generate API cost report
    report.apiCosts = this.generateAPICostReport();

    // Generate OAuth reliability report
    report.oauthReliability = this.generateOAuthReliabilityReport();

    // Generate payload anomaly report
    report.payloadAnomalies = this.generatePayloadAnomalyReport();

    // Generate execution success report
    report.executionSuccess = this.generateExecutionSuccessReport();

    // Calculate shadow readiness score
    report.shadowReadinessScore = this.calculateShadowReadinessScore(report);

    this.logger.info('Reliability report generated', { report });

    return report;
  }

  /**
   * Generate connector stability report
   */
  private generateConnectorStability(): {
    overallScore: number;
    byConnector: Record<string, { score: number; uptime: number; failureRate: number }>;
  } {
    const scores = connectorReliabilityScoring.getAllReliabilityScores();
    const byConnector: Record<string, { score: number; uptime: number; failureRate: number }> = {};

    let totalScore = 0;

    scores.forEach(metrics => {
      byConnector[metrics.connector] = {
        score: metrics.reliabilityScore,
        uptime: metrics.uptime,
        failureRate: metrics.failureRate,
      };
      totalScore += metrics.reliabilityScore;
    });

    const overallScore = scores.length > 0 ? totalScore / scores.length : 0;

    return {
      overallScore: Math.round(overallScore),
      byConnector,
    };
  }

  /**
   * Generate API cost report
   */
  private generateAPICostReport(): {
    totalCost: number;
    totalCredits: number;
    totalApiCalls: number;
    byConnector: Record<string, { cost: number; credits: number; calls: number }>;
  } {
    const stats = costTracking.getCostStatistics();

    const byConnector: Record<string, { cost: number; credits: number; calls: number }> = {};

    Object.entries(stats.byConnector).forEach(([connector, data]) => {
      byConnector[connector] = {
        cost: data.cost,
        credits: data.credits,
        calls: data.apiCalls,
      };
    });

    return {
      totalCost: stats.totalCost,
      totalCredits: stats.totalCredits,
      totalApiCalls: stats.totalApiCalls,
      byConnector,
    };
  }

  /**
   * Generate OAuth reliability report
   */
  private generateOAuthReliabilityReport(): {
    oauthExpiryCount: number;
    permissionFailureCount: number;
    byConnector: Record<string, { expiryCount: number; permissionCount: number }>;
  } {
    const oauthExpiryAnomalies = realPayloadValidation.getAnomaliesByType('oauth_expiry' as any);
    const permissionFailureAnomalies = realPayloadValidation.getAnomaliesByType('permission_failure' as any);
    const byConnector: Record<string, { expiryCount: number; permissionCount: number }> = {};

    let oauthExpiryCount = oauthExpiryAnomalies.length;
    let permissionFailureCount = permissionFailureAnomalies.length;

    oauthExpiryAnomalies.forEach((anomaly: any) => {
      if (!byConnector[anomaly.connector]) {
        byConnector[anomaly.connector] = { expiryCount: 0, permissionCount: 0 };
      }
      byConnector[anomaly.connector].expiryCount++;
    });

    permissionFailureAnomalies.forEach((anomaly: any) => {
      if (!byConnector[anomaly.connector]) {
        byConnector[anomaly.connector] = { expiryCount: 0, permissionCount: 0 };
      }
      byConnector[anomaly.connector].permissionCount++;
    });

    return {
      oauthExpiryCount,
      permissionFailureCount,
      byConnector,
    };
  }

  /**
   * Generate payload anomaly report
   */
  private generatePayloadAnomalyReport(): {
    totalAnomalies: number;
    byType: Record<string, number>;
    byConnector: Record<string, number>;
  } {
    const stats = realPayloadValidation.getAnomalyStatistics();

    return {
      totalAnomalies: stats.totalAnomalies,
      byType: stats.byType,
      byConnector: stats.byConnector,
    };
  }

  /**
   * Generate execution success report
   */
  private generateExecutionSuccessReport(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
  } {
    const stats = shadowModeSystem.getExecutionStatistics();

    return {
      totalExecutions: stats.totalExecutions,
      successfulExecutions: stats.successfulExecutions,
      failedExecutions: stats.failedExecutions,
      successRate: stats.totalExecutions > 0 
        ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100) 
        : 0,
    };
  }

  /**
   * Calculate shadow readiness score
   */
  private calculateShadowReadinessScore(report: ReliabilityReport): number {
    // Weighted score:
    // - Connector stability: 30%
    // - Execution success: 30%
    // - OAuth reliability: 20%
    // - Payload anomalies: 10%
    // - Cost efficiency: 10%

    const stabilityScore = report.connectorStability.overallScore;
    const successScore = report.executionSuccess.successRate;
    
    // OAuth reliability: fewer issues = higher score
    const oauthIssues = report.oauthReliability.oauthExpiryCount + report.oauthReliability.permissionFailureCount;
    const oauthScore = Math.max(0, 100 - (oauthIssues * 10));
    
    // Payload anomalies: fewer anomalies = higher score
    const anomalyScore = report.payloadAnomalies.totalAnomalies > 0
      ? Math.max(0, 100 - (report.payloadAnomalies.totalAnomalies * 5))
      : 100;
    
    // Cost efficiency: assume good if not excessive
    const costScore = 100; // Placeholder for cost efficiency

    const shadowReadinessScore = Math.round(
      (stabilityScore * 0.3) +
      (successScore * 0.3) +
      (oauthScore * 0.2) +
      (anomalyScore * 0.1) +
      (costScore * 0.1)
    );

    return shadowReadinessScore;
  }

  /**
   * Generate formatted report
   */
  generateFormattedReport(): string {
    const report = this.generateReliabilityReport();

    let output = '=== Real-World Reliability Report ===\n';
    output += `Generated: ${new Date(report.timestamp).toISOString()}\n`;
    output += `Execution Mode: ${report.executionMode}\n`;
    output += `Shadow Readiness Score: ${report.shadowReadinessScore}/100\n\n`;

    output += '--- Connector Stability ---\n';
    output += `Overall Score: ${report.connectorStability.overallScore}/100\n`;
    Object.entries(report.connectorStability.byConnector).forEach(([connector, data]) => {
      output += `${connector}:\n`;
      output += `  Score: ${data.score}/100\n`;
      output += `  Uptime: ${data.uptime}%\n`;
      output += `  Failure Rate: ${data.failureRate}%\n`;
    });

    output += '\n--- API Costs ---\n';
    output += `Total Cost: $${report.apiCosts.totalCost.toFixed(4)}\n`;
    output += `Total Credits: ${report.apiCosts.totalCredits}\n`;
    output += `Total API Calls: ${report.apiCosts.totalApiCalls}\n`;
    Object.entries(report.apiCosts.byConnector).forEach(([connector, data]) => {
      output += `${connector}: $${data.cost.toFixed(4)} (${data.calls} calls)\n`;
    });

    output += '\n--- OAuth Reliability ---\n';
    output += `OAuth Expiry Count: ${report.oauthReliability.oauthExpiryCount}\n`;
    output += `Permission Failure Count: ${report.oauthReliability.permissionFailureCount}\n`;
    Object.entries(report.oauthReliability.byConnector).forEach(([connector, data]) => {
      output += `${connector}: ${data.expiryCount} expiry, ${data.permissionCount} permission failures\n`;
    });

    output += '\n--- Payload Anomalies ---\n';
    output += `Total Anomalies: ${report.payloadAnomalies.totalAnomalies}\n`;
    Object.entries(report.payloadAnomalies.byType).forEach(([type, count]) => {
      output += `${type}: ${count}\n`;
    });
    Object.entries(report.payloadAnomalies.byConnector).forEach(([connector, count]) => {
      output += `${connector}: ${count}\n`;
    });

    output += '\n--- Execution Success ---\n';
    output += `Total Executions: ${report.executionSuccess.totalExecutions}\n`;
    output += `Successful: ${report.executionSuccess.successfulExecutions}\n`;
    output += `Failed: ${report.executionSuccess.failedExecutions}\n`;
    output += `Success Rate: ${report.executionSuccess.successRate}%\n`;

    output += '\n--- Shadow Readiness Assessment ---\n';
    if (report.shadowReadinessScore >= 90) {
      output += 'Status: READY FOR PRODUCTION\n';
    } else if (report.shadowReadinessScore >= 70) {
      output += 'Status: READY FOR STAGING\n';
    } else {
      output += 'Status: NOT READY - NEEDS IMPROVEMENT\n';
    }

    return output;
  }
}

/**
 * Singleton instance
 */
export const realWorldReliabilityReport = new RealWorldReliabilityReport();
