/**
 * Task Actionability Verification
 * 
 * Tracks:
 * - Tasks completed
 * - Tasks ignored
 * - Tasks reopened
 * - Tasks manually rewritten
 * - Tasks marked confusing
 * - Tasks marked low-value
 * 
 * Detects:
 * - Noisy task generation
 * - Duplicate tasks
 * - Weak task descriptions
 * - Non-actionable tasks
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Task action
 */
export enum TaskAction {
  COMPLETED = 'completed',
  IGNORED = 'ignored',
  REOPENED = 'reopened',
  REWRITTEN = 'rewritten',
  CONFUSING = 'confusing',
  LOW_VALUE = 'low_value',
}

/**
 * Task actionability record
 */
export interface TaskActionabilityRecord {
  id: string;
  timestamp: number;
  tenantId: string;
  agent: string;
  executionId: string;
  task: string;
  action: TaskAction;
  operatorId?: string;
  reason?: string;
  rewrittenVersion?: string;
}

/**
 * Task actionability metrics
 */
export interface TaskActionabilityMetrics {
  agent: string;
  totalTasks: number;
  completed: number;
  ignored: number;
  reopened: number;
  rewritten: number;
  confusing: number;
  lowValue: number;
  actionabilityScore: number; // 0-100
  noiseLevel: number; // 0-100 (higher = more noise)
}

/**
 * Task actionability verification
 */
export class TaskActionabilityVerification {
  private logger: Logger;
  private records: TaskActionabilityRecord[] = [];
  private agentMetrics: Map<string, TaskActionabilityMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track task action
   */
  trackAction(params: {
    tenantId: string;
    agent: string;
    executionId: string;
    task: string;
    action: TaskAction;
    operatorId?: string;
    reason?: string;
    rewrittenVersion?: string;
  }): void {
    const record: TaskActionabilityRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.records.push(record);
    this.updateAgentMetrics(params.agent);
    this.logger.info('Task action tracked', { record });
  }

  /**
   * Update agent metrics
   */
  private updateAgentMetrics(agent: string): void {
    const agentRecords = this.records.filter(r => r.agent === agent);
    const total = agentRecords.length;

    const completed = agentRecords.filter(r => r.action === TaskAction.COMPLETED).length;
    const ignored = agentRecords.filter(r => r.action === TaskAction.IGNORED).length;
    const reopened = agentRecords.filter(r => r.action === TaskAction.REOPENED).length;
    const rewritten = agentRecords.filter(r => r.action === TaskAction.REWRITTEN).length;
    const confusing = agentRecords.filter(r => r.action === TaskAction.CONFUSING).length;
    const lowValue = agentRecords.filter(r => r.action === TaskAction.LOW_VALUE).length;

    // Actionability score: completed + rewritten are actionable
    const actionabilityScore = total > 0 ? Math.round(((completed + rewritten) / total) * 100) : 100;

    // Noise level: ignored + confusing + low value indicate noise
    const noiseLevel = total > 0 ? Math.round(((ignored + confusing + lowValue) / total) * 100) : 0;

    this.agentMetrics.set(agent, {
      agent,
      totalTasks: total,
      completed,
      ignored,
      reopened,
      rewritten,
      confusing,
      lowValue,
      actionabilityScore,
      noiseLevel,
    });
  }

  /**
   * Detect noisy task generation
   */
  detectNoisyTaskGeneration(tenantId: string, taskCount: number): boolean {
    // More than 50 tasks in a single execution is considered noisy
    return taskCount > 50;
  }

  /**
   * Detect duplicate tasks
   */
  detectDuplicateTasks(tasks: string[]): string[] {
    const seen = new Set<string>();
    const duplicates: string[] = [];

    tasks.forEach(task => {
      const normalized = task.toLowerCase().trim();
      if (seen.has(normalized)) {
        duplicates.push(task);
      }
      seen.add(normalized);
    });

    return duplicates;
  }

  /**
   * Detect weak task descriptions
   */
  detectWeakTaskDescriptions(tasks: string[]): string[] {
    const weak: string[] = [];
    const weakKeywords = ['fix', 'check', 'update', 'improve', 'optimize'];

    tasks.forEach(task => {
      const words = task.split(' ');
      if (words.length < 5) {
        weak.push(task);
      } else if (weakKeywords.some(k => task.toLowerCase().startsWith(k))) {
        weak.push(task);
      }
    });

    return weak;
  }

  /**
   * Detect non-actionable tasks
   */
  detectNonActionableTasks(tasks: string[]): string[] {
    const nonActionable: string[] = [];
    const actionVerbs = ['add', 'create', 'update', 'fix', 'remove', 'check', 'verify', 'optimize', 'improve', 'implement', 'configure', 'setup'];

    tasks.forEach(task => {
      const firstWord = task.split(' ')[0].toLowerCase();
      if (!actionVerbs.includes(firstWord)) {
        nonActionable.push(task);
      }
    });

    return nonActionable;
  }

  /**
   * Get agent metrics
   */
  getAgentMetrics(agent: string): TaskActionabilityMetrics | undefined {
    return this.agentMetrics.get(agent);
  }

  /**
   * Get all agent metrics
   */
  getAllAgentMetrics(): TaskActionabilityMetrics[] {
    return Array.from(this.agentMetrics.values()).sort((a, b) => b.actionabilityScore - a.actionabilityScore);
  }

  /**
   * Get records by tenant
   */
  getRecordsByTenant(tenantId: string): TaskActionabilityRecord[] {
    return this.records.filter(r => r.tenantId === tenantId);
  }

  /**
   * Get records by agent
   */
  getRecordsByAgent(agent: string): TaskActionabilityRecord[] {
    return this.records.filter(r => r.agent === agent);
  }

  /**
   * Generate actionability report
   */
  generateActionabilityReport(): string {
    const metrics = this.getAllAgentMetrics();

    let report = '=== Task Actionability Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Records: ${this.records.length}\n\n`;

    report += '--- Agent Actionability Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.agent}:\n`;
      report += `  Total Tasks: ${m.totalTasks}\n`;
      report += `  Completed: ${m.completed}\n`;
      report += `  Ignored: ${m.ignored}\n`;
      report += `  Reopened: ${m.reopened}\n`;
      report += `  Rewritten: ${m.rewritten}\n`;
      report += `  Confusing: ${m.confusing}\n`;
      report += `  Low Value: ${m.lowValue}\n`;
      report += `  Actionability Score: ${m.actionabilityScore}%\n`;
      report += `  Noise Level: ${m.noiseLevel}%\n`;
    });

    return report;
  }

  /**
   * Clear records (for testing only)
   */
  clearRecords(): void {
    this.logger.warn('Task actionability records cleared');
    this.records = [];
    this.agentMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const taskActionabilityVerification = new TaskActionabilityVerification();
