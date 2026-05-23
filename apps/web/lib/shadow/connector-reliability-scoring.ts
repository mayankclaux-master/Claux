/**
 * Connector Reliability Scoring
 * 
 * Tracks:
 * - Uptime
 * - Average latency
 * - Failure rate
 * - Retry frequency
 * - Timeout frequency
 * - Malformed payload frequency
 * 
 * Creates reliability score per connector.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Reliability metrics
 */
export interface ReliabilityMetrics {
  connector: string;
  uptime: number; // percentage
  averageLatency: number; // milliseconds
  failureRate: number; // percentage
  retryFrequency: number; // retries per 100 requests
  timeoutFrequency: number; // timeouts per 100 requests
  malformedPayloadFrequency: number; // malformed payloads per 100 requests
  reliabilityScore: number; // 0-100
  lastUpdated: number;
}

/**
 * Execution record for reliability tracking
 */
export interface ExecutionRecord {
  id: string;
  timestamp: number;
  connector: string;
  success: boolean;
  latency: number;
  retried: boolean;
  timedOut: boolean;
  malformedPayload: boolean;
}

/**
 * Connector reliability scoring service
 */
export class ConnectorReliabilityScoring {
  private logger: Logger;
  private executionRecords: ExecutionRecord[] = [];
  private reliabilityScores: Map<string, ReliabilityMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Record execution for reliability tracking
   */
  recordExecution(params: {
    connector: string;
    success: boolean;
    latency: number;
    retried: boolean;
    timedOut: boolean;
    malformedPayload: boolean;
  }): string {
    const record: ExecutionRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.executionRecords.push(record);
    this.updateReliabilityScore(params.connector);

    this.logger.info('Execution recorded for reliability', { record });

    return record.id;
  }

  /**
   * Update reliability score for a connector
   */
  private updateReliabilityScore(connector: string): void {
    const connectorRecords = this.executionRecords.filter(r => r.connector === connector);
    
    if (connectorRecords.length === 0) {
      return;
    }

    // Calculate metrics
    const totalRequests = connectorRecords.length;
    const successfulRequests = connectorRecords.filter(r => r.success).length;
    const uptime = (successfulRequests / totalRequests) * 100;

    const totalLatency = connectorRecords.reduce((sum, r) => sum + r.latency, 0);
    const averageLatency = totalLatency / totalRequests;

    const failureRate = 100 - uptime;

    const retriedRequests = connectorRecords.filter(r => r.retried).length;
    const retryFrequency = (retriedRequests / totalRequests) * 100;

    const timedOutRequests = connectorRecords.filter(r => r.timedOut).length;
    const timeoutFrequency = (timedOutRequests / totalRequests) * 100;

    const malformedPayloadRequests = connectorRecords.filter(r => r.malformedPayload).length;
    const malformedPayloadFrequency = (malformedPayloadRequests / totalRequests) * 100;

    // Calculate reliability score (0-100)
    // Weighted: uptime (40%), latency (20%), failure rate (20%), retry frequency (10%), timeout frequency (5%), malformed payload (5%)
    const uptimeScore = uptime;
    const latencyScore = Math.max(0, 100 - (averageLatency / 100)); // 100ms = 0 score
    const failureScore = 100 - failureRate;
    const retryScore = Math.max(0, 100 - retryFrequency);
    const timeoutScore = Math.max(0, 100 - timeoutFrequency);
    const malformedScore = Math.max(0, 100 - malformedPayloadFrequency);

    const reliabilityScore = Math.round(
      (uptimeScore * 0.4) +
      (latencyScore * 0.2) +
      (failureScore * 0.2) +
      (retryScore * 0.1) +
      (timeoutScore * 0.05) +
      (malformedScore * 0.05)
    );

    const metrics: ReliabilityMetrics = {
      connector,
      uptime: Math.round(uptime),
      averageLatency: Math.round(averageLatency),
      failureRate: Math.round(failureRate),
      retryFrequency: Math.round(retryFrequency),
      timeoutFrequency: Math.round(timeoutFrequency),
      malformedPayloadFrequency: Math.round(malformedPayloadFrequency),
      reliabilityScore,
      lastUpdated: Date.now(),
    };

    this.reliabilityScores.set(connector, metrics);
  }

  /**
   * Get reliability score for a connector
   */
  getReliabilityScore(connector: string): ReliabilityMetrics | undefined {
    return this.reliabilityScores.get(connector);
  }

  /**
   * Get all reliability scores
   */
  getAllReliabilityScores(): ReliabilityMetrics[] {
    return Array.from(this.reliabilityScores.values());
  }

  /**
   * Get execution records by connector
   */
  getExecutionRecords(connector: string): ExecutionRecord[] {
    return this.executionRecords.filter(r => r.connector === connector);
  }

  /**
   * Get execution statistics for a connector
   */
  getExecutionStatistics(connector: string): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    retriedRequests: number;
    timedOutRequests: number;
    malformedPayloadRequests: number;
  } {
    const records = this.getExecutionRecords(connector);

    if (records.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        retriedRequests: 0,
        timedOutRequests: 0,
        malformedPayloadRequests: 0,
      };
    }

    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageLatency = records.reduce((sum, r) => sum + r.latency, 0) / totalRequests;
    const retriedRequests = records.filter(r => r.retried).length;
    const timedOutRequests = records.filter(r => r.timedOut).length;
    const malformedPayloadRequests = records.filter(r => r.malformedPayload).length;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency: Math.round(averageLatency),
      retriedRequests,
      timedOutRequests,
      malformedPayloadRequests,
    };
  }

  /**
   * Get connector ranking by reliability
   */
  getConnectorRanking(): Array<{ connector: string; score: number; rank: number }> {
    const scores = this.getAllReliabilityScores();
    const ranked = scores
      .sort((a, b) => b.reliabilityScore - a.reliabilityScore)
      .map((metrics, index) => ({
        connector: metrics.connector,
        score: metrics.reliabilityScore,
        rank: index + 1,
      }));

    return ranked;
  }

  /**
   * Get low reliability connectors (score < 70)
   */
  getLowReliabilityConnectors(): ReliabilityMetrics[] {
    return this.getAllReliabilityScores().filter(m => m.reliabilityScore < 70);
  }

  /**
   * Get high reliability connectors (score >= 90)
   */
  getHighReliabilityConnectors(): ReliabilityMetrics[] {
    return this.getAllReliabilityScores().filter(m => m.reliabilityScore >= 90);
  }

  /**
   * Generate reliability report
   */
  generateReliabilityReport(): string {
    const scores = this.getAllReliabilityScores();
    const ranking = this.getConnectorRanking();
    const lowReliability = this.getLowReliabilityConnectors();
    const highReliability = this.getHighReliabilityConnectors();

    let report = '=== Connector Reliability Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    report += '--- Connector Ranking ---\n';
    ranking.forEach(entry => {
      report += `${entry.rank}. ${entry.connector}: ${entry.score}/100\n`;
    });

    report += '\n--- Detailed Metrics ---\n';
    scores.forEach(metrics => {
      report += `${metrics.connector}:\n`;
      report += `  Reliability Score: ${metrics.reliabilityScore}/100\n`;
      report += `  Uptime: ${metrics.uptime}%\n`;
      report += `  Average Latency: ${metrics.averageLatency}ms\n`;
      report += `  Failure Rate: ${metrics.failureRate}%\n`;
      report += `  Retry Frequency: ${metrics.retryFrequency}%\n`;
      report += `  Timeout Frequency: ${metrics.timeoutFrequency}%\n`;
      report += `  Malformed Payload Frequency: ${metrics.malformedPayloadFrequency}%\n`;
      report += `  Last Updated: ${new Date(metrics.lastUpdated).toISOString()}\n\n`;
    });

    if (highReliability.length > 0) {
      report += '--- High Reliability Connectors (>= 90) ---\n';
      highReliability.forEach(metrics => {
        report += `${metrics.connector}: ${metrics.reliabilityScore}/100\n`;
      });
      report += '\n';
    }

    if (lowReliability.length > 0) {
      report += '--- Low Reliability Connectors (< 70) ---\n';
      lowReliability.forEach(metrics => {
        report += `${metrics.connector}: ${metrics.reliabilityScore}/100\n`;
      });
      report += '\n';
    }

    return report;
  }

  /**
   * Clear execution records (for testing only)
   */
  clearExecutionRecords(): void {
    this.logger.warn('Execution records cleared');
    this.executionRecords = [];
    this.reliabilityScores.clear();
  }
}

/**
 * Singleton instance
 */
export const connectorReliabilityScoring = new ConnectorReliabilityScoring();
