/**
 * Beta Onboarding Supervision
 * 
 * Every onboarding must track:
 * - Onboarding duration
 * - User confusion points
 * - Failed connector attempts
 * - OAuth retries
 * - Abandoned onboarding stages
 * - Support interventions
 * - Manual overrides required
 * 
 * Generates onboarding friction reports.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Onboarding stage
 */
export enum OnboardingStage {
  DOMAIN_VERIFICATION = 'domain_verification',
  CONNECTOR_SETUP = 'connector_setup',
  OAUTH_AUTHORIZATION = 'oauth_authorization',
  DATA_SYNC = 'data_sync',
  DASHBOARD_PREVIEW = 'dashboard_preview',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

/**
 * Confusion point
 */
export interface ConfusionPoint {
  stage: OnboardingStage;
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

/**
 * Connector attempt
 */
export interface ConnectorAttempt {
  connector: string;
  timestamp: number;
  success: boolean;
  error?: string;
  retryCount: number;
}

/**
 * Support intervention
 */
export interface SupportIntervention {
  timestamp: number;
  stage: OnboardingStage;
  reason: string;
  interventionType: 'manual_override' | 'clarification' | 'technical_fix';
  supportAgent: string;
}

/**
 * Onboarding supervision record
 */
export interface OnboardingSupervisionRecord {
  tenantId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  currentStage: OnboardingStage;
  completedStages: OnboardingStage[];
  confusionPoints: ConfusionPoint[];
  connectorAttempts: ConnectorAttempt[];
  oauthRetries: number;
  abandonedStage?: OnboardingStage;
  supportInterventions: SupportIntervention[];
  manualOverrides: number;
  frictionScore: number; // 0-100 (higher = more friction)
}

/**
 * Beta onboarding supervision
 */
export class BetaOnboardingSupervision {
  private logger: Logger;
  private records: Map<string, OnboardingSupervisionRecord> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Start onboarding supervision
   */
  startOnboarding(tenantId: string): void {
    const record: OnboardingSupervisionRecord = {
      tenantId,
      startTime: Date.now(),
      currentStage: OnboardingStage.DOMAIN_VERIFICATION,
      completedStages: [],
      confusionPoints: [],
      connectorAttempts: [],
      oauthRetries: 0,
      supportInterventions: [],
      manualOverrides: 0,
      frictionScore: 0,
    };

    this.records.set(tenantId, record);
    this.logger.info('Onboarding supervision started', { tenantId });
  }

  /**
   * Update onboarding stage
   */
  updateStage(tenantId: string, stage: OnboardingStage): void {
    const record = this.records.get(tenantId);
    if (!record) {
      this.logger.warn('Onboarding record not found', { tenantId });
      return;
    }

    // Mark previous stage as completed
    if (record.currentStage !== stage && record.currentStage !== OnboardingStage.ABANDONED) {
      record.completedStages.push(record.currentStage);
    }

    record.currentStage = stage;

    if (stage === OnboardingStage.COMPLETED) {
      record.endTime = Date.now();
      record.duration = record.endTime - record.startTime;
    } else if (stage === OnboardingStage.ABANDONED) {
      record.abandonedStage = record.currentStage;
      record.endTime = Date.now();
      record.duration = record.endTime - record.startTime;
    }

    this.updateFrictionScore(tenantId);
    this.logger.info('Onboarding stage updated', { tenantId, stage });
  }

  /**
   * Record confusion point
   */
  recordConfusionPoint(tenantId: string, description: string, severity: 'low' | 'medium' | 'high'): void {
    const record = this.records.get(tenantId);
    if (!record) {
      this.logger.warn('Onboarding record not found', { tenantId });
      return;
    }

    record.confusionPoints.push({
      stage: record.currentStage,
      timestamp: Date.now(),
      description,
      severity,
    });

    this.updateFrictionScore(tenantId);
    this.logger.info('Confusion point recorded', { tenantId, description, severity });
  }

  /**
   * Record connector attempt
   */
  recordConnectorAttempt(tenantId: string, connector: string, success: boolean, error?: string): void {
    const record = this.records.get(tenantId);
    if (!record) {
      this.logger.warn('Onboarding record not found', { tenantId });
      return;
    }

    const existingAttempt = record.connectorAttempts.find(a => a.connector === connector);
    const retryCount = existingAttempt ? existingAttempt.retryCount + 1 : 0;

    record.connectorAttempts.push({
      connector,
      timestamp: Date.now(),
      success,
      error,
      retryCount,
    });

    this.updateFrictionScore(tenantId);
    this.logger.info('Connector attempt recorded', { tenantId, connector, success, retryCount });
  }

  /**
   * Record OAuth retry
   */
  recordOAuthRetry(tenantId: string): void {
    const record = this.records.get(tenantId);
    if (!record) {
      this.logger.warn('Onboarding record not found', { tenantId });
      return;
    }

    record.oauthRetries++;
    this.updateFrictionScore(tenantId);
    this.logger.info('OAuth retry recorded', { tenantId, count: record.oauthRetries });
  }

  /**
   * Record support intervention
   */
  recordSupportIntervention(tenantId: string, reason: string, interventionType: 'manual_override' | 'clarification' | 'technical_fix', supportAgent: string): void {
    const record = this.records.get(tenantId);
    if (!record) {
      this.logger.warn('Onboarding record not found', { tenantId });
      return;
    }

    record.supportInterventions.push({
      timestamp: Date.now(),
      stage: record.currentStage,
      reason,
      interventionType,
      supportAgent,
    });

    if (interventionType === 'manual_override') {
      record.manualOverrides++;
    }

    this.updateFrictionScore(tenantId);
    this.logger.info('Support intervention recorded', { tenantId, reason, interventionType, supportAgent });
  }

  /**
   * Update friction score
   */
  private updateFrictionScore(tenantId: string): void {
    const record = this.records.get(tenantId);
    if (!record) return;

    let frictionScore = 0;

    // Confusion points contribute to friction
    const confusionSeverityWeights = { low: 5, medium: 10, high: 20 };
    record.confusionPoints.forEach(cp => {
      frictionScore += confusionSeverityWeights[cp.severity];
    });

    // Failed connector attempts contribute to friction
    const failedAttempts = record.connectorAttempts.filter(a => !a.success).length;
    frictionScore += failedAttempts * 15;

    // OAuth retries contribute to friction
    frictionScore += record.oauthRetries * 10;

    // Support interventions contribute to friction
    record.supportInterventions.forEach(si => {
      if (si.interventionType === 'manual_override') {
        frictionScore += 25;
      } else {
        frictionScore += 10;
      }
    });

    // Duration contributes to friction (more than 30 minutes)
    const currentDuration = Date.now() - record.startTime;
    if (currentDuration > 1800000) {
      frictionScore += Math.floor((currentDuration - 1800000) / 60000) * 5;
    }

    record.frictionScore = Math.min(100, frictionScore);
  }

  /**
   * Get onboarding record
   */
  getRecord(tenantId: string): OnboardingSupervisionRecord | undefined {
    return this.records.get(tenantId);
  }

  /**
   * Get all records
   */
  getAllRecords(): OnboardingSupervisionRecord[] {
    return Array.from(this.records.values());
  }

  /**
   * Get high-friction onboardings
   */
  getHighFrictionOnboardings(threshold: number = 50): OnboardingSupervisionRecord[] {
    return Array.from(this.records.values()).filter(r => r.frictionScore >= threshold);
  }

  /**
   * Get abandoned onboardings
   */
  getAbandonedOnboardings(): OnboardingSupervisionRecord[] {
    return Array.from(this.records.values()).filter(r => r.currentStage === OnboardingStage.ABANDONED);
  }

  /**
   * Get support-heavy onboardings
   */
  getSupportHeavyOnboardings(threshold: number = 3): OnboardingSupervisionRecord[] {
    return Array.from(this.records.values()).filter(r => r.supportInterventions.length >= threshold);
  }

  /**
   * Generate friction report
   */
  generateFrictionReport(): string {
    const records = this.getAllRecords();
    const highFriction = this.getHighFrictionOnboardings();
    const abandoned = this.getAbandonedOnboardings();
    const supportHeavy = this.getSupportHeavyOnboardings();

    let report = '=== Beta Onboarding Friction Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Onboardings: ${records.length}\n\n`;

    report += '--- High Friction Onboardings (>=50) ---\n';
    highFriction.forEach(r => {
      report += `${r.tenantId}: ${r.frictionScore}\n`;
      report += `  Duration: ${r.duration ? Math.round(r.duration / 1000) + 's' : 'In progress'}\n`;
      report += `  Confusion Points: ${r.confusionPoints.length}\n`;
      report += `  Failed Connectors: ${r.connectorAttempts.filter(a => !a.success).length}\n`;
      report += `  OAuth Retries: ${r.oauthRetries}\n`;
      report += `  Support Interventions: ${r.supportInterventions.length}\n`;
    });

    if (abandoned.length > 0) {
      report += '\n--- Abandoned Onboardings ---\n';
      abandoned.forEach(r => {
        report += `${r.tenantId}: abandoned at ${r.abandonedStage}\n`;
        report += `  Duration: ${r.duration ? Math.round(r.duration / 1000) + 's' : 'N/A'}\n`;
        report += `  Friction Score: ${r.frictionScore}\n`;
      });
    }

    if (supportHeavy.length > 0) {
      report += '\n--- Support-Heavy Onboardings (>=3 interventions) ---\n';
      supportHeavy.forEach(r => {
        report += `${r.tenantId}: ${r.supportInterventions.length} interventions\n`;
        report += `  Friction Score: ${r.frictionScore}\n`;
      });
    }

    return report;
  }

  /**
   * Clear records (for testing only)
   */
  clearRecords(): void {
    this.logger.warn('Onboarding supervision records cleared');
    this.records.clear();
  }
}

/**
 * Singleton instance
 */
export const betaOnboardingSupervision = new BetaOnboardingSupervision();
