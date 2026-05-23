/**
 * Alert Fatigue Detection
 * 
 * Detects:
 * - Ignored alerts
 * - Repeated alerts
 * - Low-value alerts
 * - Noisy connectors
 * - Alert storms
 * - Retry spam
 * - Execution spam
 * 
 * Generates:
 * - Alert usefulness scoring
 * - Alert fatigue reports
 * - Connector noise ranking
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Alert type
 */
export enum AlertType {
  CONNECTOR_FAILURE = 'connector_failure',
  EXECUTION_FAILURE = 'execution_failure',
  OAUTH_EXPIRY = 'oauth_expiry',
  RATE_LIMIT = 'rate_limit',
  TASK_GENERATION = 'task_generation',
  RECOMMENDATION_GENERATION = 'recommendation_generation',
  SYSTEM = 'system',
}

/**
 * Alert action
 */
export enum AlertAction {
  ACKNOWLEDGED = 'acknowledged',
  IGNORED = 'ignored',
  DISMISSED = 'dismissed',
  ACTED_ON = 'acted_on',
}

/**
 * Alert record
 */
export interface AlertRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  connector?: string;
  type: AlertType;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  action?: AlertAction;
  operatorId?: string;
  actionTimestamp?: number;
}

/**
 * Alert fatigue metrics
 */
export interface AlertFatigueMetrics {
  connector?: string;
  totalAlerts: number;
  ignored: number;
  acknowledged: number;
  dismissed: number;
  actedOn: number;
  usefulnessScore: number; // 0-100
  fatigueScore: number; // 0-100 (higher = more fatigue)
  noiseLevel: number; // 0-100 (higher = more noise)
}

/**
 * Alert fatigue detection
 */
export class AlertFatigueDetection {
  private logger: Logger;
  private alerts: AlertRecord[] = [];
  private connectorMetrics: Map<string, AlertFatigueMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Create alert
   */
  createAlert(params: {
    tenantId: string;
    connector?: string;
    type: AlertType;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }): void {
    const alert: AlertRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.alerts.push(alert);
    this.updateConnectorMetrics(params.connector);
    this.logger.info('Alert created', { alert });
  }

  /**
   * Track alert action
   */
  trackAlertAction(alertId: string, action: AlertAction, operatorId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.action = action;
      alert.operatorId = operatorId;
      alert.actionTimestamp = Date.now();
      this.updateConnectorMetrics(alert.connector);
      this.logger.info('Alert action tracked', { alertId, action });
    }
  }

  /**
   * Update connector metrics
   */
  private updateConnectorMetrics(connector?: string): void {
    if (!connector) return;

    const connectorAlerts = this.alerts.filter(a => a.connector === connector);
    const total = connectorAlerts.length;

    const ignored = connectorAlerts.filter(a => a.action === AlertAction.IGNORED).length;
    const acknowledged = connectorAlerts.filter(a => a.action === AlertAction.ACKNOWLEDGED).length;
    const dismissed = connectorAlerts.filter(a => a.action === AlertAction.DISMISSED).length;
    const actedOn = connectorAlerts.filter(a => a.action === AlertAction.ACTED_ON).length;

    // Usefulness score: acknowledged + acted on are useful
    const usefulnessScore = total > 0 ? Math.round(((acknowledged + actedOn) / total) * 100) : 100;

    // Fatigue score: ignored + dismissed indicate fatigue
    const fatigueScore = total > 0 ? Math.round(((ignored + dismissed) / total) * 100) : 0;

    // Noise level: based on alert frequency
    const recentAlerts = connectorAlerts.filter(a => Date.now() - a.timestamp < 3600000); // Last hour
    const noiseLevel = Math.min(100, recentAlerts.length * 10);

    this.connectorMetrics.set(connector, {
      connector,
      totalAlerts: total,
      ignored,
      acknowledged,
      dismissed,
      actedOn,
      usefulnessScore,
      fatigueScore,
      noiseLevel,
    });
  }

  /**
   * Detect ignored alerts
   */
  detectIgnoredAlerts(tenantId: string): AlertRecord[] {
    return this.alerts.filter(a => 
      a.tenantId === tenantId && 
      a.action === AlertAction.IGNORED
    );
  }

  /**
   * Detect repeated alerts
   */
  detectRepeatedAlerts(tenantId: string, threshold: number = 3): Array<{ message: string; count: number }> {
    const messageCounts: Record<string, number> = {};

    this.alerts
      .filter(a => a.tenantId === tenantId)
      .forEach(a => {
        messageCounts[a.message] = (messageCounts[a.message] || 0) + 1;
      });

    return Object.entries(messageCounts)
      .filter(([_, count]) => count >= threshold)
      .map(([message, count]) => ({ message, count }));
  }

  /**
   * Detect low-value alerts
   */
  detectLowValueAlerts(tenantId: string): AlertRecord[] {
    // Low-value alerts are those that are mostly ignored
    const messageMetrics: Record<string, { total: number; ignored: number }> = {};

    this.alerts
      .filter(a => a.tenantId === tenantId)
      .forEach(a => {
        if (!messageMetrics[a.message]) {
          messageMetrics[a.message] = { total: 0, ignored: 0 };
        }
        messageMetrics[a.message].total++;
        if (a.action === AlertAction.IGNORED) {
          messageMetrics[a.message].ignored++;
        }
      });

    const lowValueMessages = Object.entries(messageMetrics)
      .filter(([_, metrics]) => metrics.ignored / metrics.total > 0.7)
      .map(([message]) => message);

    return this.alerts.filter(a => 
      a.tenantId === tenantId && 
      lowValueMessages.includes(a.message)
    );
  }

  /**
   * Detect noisy connectors
   */
  detectNoisyConnectors(): string[] {
    return Array.from(this.connectorMetrics.values())
      .filter(m => m.noiseLevel > 50)
      .map(m => m.connector!);
  }

  /**
   * Detect alert storms
   */
  detectAlertStorms(tenantId: string, threshold: number = 10): boolean {
    const recentAlerts = this.alerts.filter(a => 
      a.tenantId === tenantId && 
      Date.now() - a.timestamp < 300000 // Last 5 minutes
    );

    return recentAlerts.length >= threshold;
  }

  /**
   * Detect retry spam
   */
  detectRetrySpam(tenantId: string): boolean {
    const retryAlerts = this.alerts.filter(a => 
      a.tenantId === tenantId && 
      a.type === AlertType.EXECUTION_FAILURE &&
      a.message.toLowerCase().includes('retry')
    );

    const recentRetries = retryAlerts.filter(a => Date.now() - a.timestamp < 60000); // Last minute
    return recentRetries.length > 5;
  }

  /**
   * Detect execution spam
   */
  detectExecutionSpam(tenantId: string): boolean {
    const executionAlerts = this.alerts.filter(a => 
      a.tenantId === tenantId && 
      a.type === AlertType.EXECUTION_FAILURE
    );

    const recentExecutions = executionAlerts.filter(a => Date.now() - a.timestamp < 60000); // Last minute
    return recentExecutions.length > 10;
  }

  /**
   * Get connector metrics
   */
  getConnectorMetrics(connector: string): AlertFatigueMetrics | undefined {
    return this.connectorMetrics.get(connector);
  }

  /**
   * Get all connector metrics
   */
  getAllConnectorMetrics(): AlertFatigueMetrics[] {
    return Array.from(this.connectorMetrics.values()).sort((a, b) => b.noiseLevel - a.noiseLevel);
  }

  /**
   * Get connector noise ranking
   */
  getConnectorNoiseRanking(): Array<{ connector: string; noiseLevel: number; fatigueScore: number }> {
    return this.getAllConnectorMetrics()
      .filter(m => m.connector)
      .map(m => ({
        connector: m.connector!,
        noiseLevel: m.noiseLevel,
        fatigueScore: m.fatigueScore,
      }))
      .sort((a, b) => b.noiseLevel - a.noiseLevel);
  }

  /**
   * Generate fatigue report
   */
  generateFatigueReport(): string {
    const metrics = this.getAllConnectorMetrics();
    const noisyConnectors = this.detectNoisyConnectors();
    const noiseRanking = this.getConnectorNoiseRanking();

    let report = '=== Alert Fatigue Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Alerts: ${this.alerts.length}\n\n`;

    report += '--- Connector Alert Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.connector || 'System'}:\n`;
      report += `  Total Alerts: ${m.totalAlerts}\n`;
      report += `  Ignored: ${m.ignored}\n`;
      report += `  Acknowledged: ${m.acknowledged}\n`;
      report += `  Dismissed: ${m.dismissed}\n`;
      report += `  Acted On: ${m.actedOn}\n`;
      report += `  Usefulness: ${m.usefulnessScore}%\n`;
      report += `  Fatigue: ${m.fatigueScore}%\n`;
      report += `  Noise: ${m.noiseLevel}%\n`;
    });

    if (noisyConnectors.length > 0) {
      report += '\n--- Noisy Connectors ---\n';
      noisyConnectors.forEach(connector => {
        report += `${connector}\n`;
      });
    }

    report += '\n--- Connector Noise Ranking ---\n';
    noiseRanking.forEach((r, index) => {
      report += `${index + 1}. ${r.connector}\n`;
      report += `   Noise Level: ${r.noiseLevel}%\n`;
      report += `   Fatigue Score: ${r.fatigueScore}%\n`;
    });

    return report;
  }

  /**
   * Clear alerts (for testing only)
   */
  clearAlerts(): void {
    this.logger.warn('Alerts cleared');
    this.alerts = [];
    this.connectorMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const alertFatigueDetection = new AlertFatigueDetection();
