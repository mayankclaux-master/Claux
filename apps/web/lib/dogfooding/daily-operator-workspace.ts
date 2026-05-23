/**
 * Daily Operator Workspace
 * 
 * Creates internal operator workspace supporting:
 * - Daily review queue
 * - Onboarding review queue
 * - Execution review queue
 * - Connector issue queue
 * - Recommendation review queue
 * - Task review queue
 * - Tenant health queue
 * 
 * Prioritizes by: severity, business impact, onboarding risk, connector instability, execution failures
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Queue type
 */
export enum QueueType {
  DAILY_REVIEW = 'daily_review',
  ONBOARDING_REVIEW = 'onboarding_review',
  EXECUTION_REVIEW = 'execution_review',
  CONNECTOR_ISSUE = 'connector_issue',
  RECOMMENDATION_REVIEW = 'recommendation_review',
  TASK_REVIEW = 'task_review',
  TENANT_HEALTH = 'tenant_health',
}

/**
 * Priority level
 */
export enum PriorityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

/**
 * Queue item
 */
export interface QueueItem {
  id: string;
  type: QueueType;
  tenantId: string;
  priority: PriorityLevel;
  title: string;
  description: string;
  timestamp: number;
  severity: 'critical' | 'warning' | 'info';
  businessImpact: 'high' | 'medium' | 'low';
  onboardingRisk: 'high' | 'medium' | 'low' | 'none';
  connectorInstability: 'high' | 'medium' | 'low' | 'none';
  executionFailure: boolean;
  metadata?: Record<string, any>;
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
}

/**
 * Daily operator workspace
 */
export class DailyOperatorWorkspace {
  private logger: Logger;
  private queues: Map<QueueType, QueueItem[]> = new Map();

  constructor() {
    this.logger = createLogger();
    this.initializeQueues();
  }

  /**
   * Initialize queues
   */
  private initializeQueues(): void {
    this.queues.set(QueueType.DAILY_REVIEW, []);
    this.queues.set(QueueType.ONBOARDING_REVIEW, []);
    this.queues.set(QueueType.EXECUTION_REVIEW, []);
    this.queues.set(QueueType.CONNECTOR_ISSUE, []);
    this.queues.set(QueueType.RECOMMENDATION_REVIEW, []);
    this.queues.set(QueueType.TASK_REVIEW, []);
    this.queues.set(QueueType.TENANT_HEALTH, []);
  }

  /**
   * Add item to queue
   */
  addToQueue(item: QueueItem): void {
    const queue = this.queues.get(item.type);
    if (queue) {
      queue.push(item);
      this.sortQueue(item.type);
      this.logger.info('Item added to queue', { type: item.type, id: item.id });
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(type: QueueType): void {
    const queue = this.queues.get(type);
    if (queue) {
      const priorityOrder = { [PriorityLevel.CRITICAL]: 0, [PriorityLevel.HIGH]: 1, [PriorityLevel.MEDIUM]: 2, [PriorityLevel.LOW]: 3 };
      queue.sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.timestamp - a.timestamp;
      });
    }
  }

  /**
   * Get queue items
   */
  getQueue(type: QueueType): QueueItem[] {
    return this.queues.get(type) || [];
  }

  /**
   * Get all queues
   */
  getAllQueues(): Map<QueueType, QueueItem[]> {
    return new Map(this.queues);
  }

  /**
   * Get high-priority items across all queues
   */
  getHighPriorityItems(): QueueItem[] {
    const highPriority: QueueItem[] = [];
    this.queues.forEach(queue => {
      queue.forEach(item => {
        if (item.priority === PriorityLevel.CRITICAL || item.priority === PriorityLevel.HIGH) {
          highPriority.push(item);
        }
      });
    });
    return highPriority.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get items by tenant
   */
  getItemsByTenant(tenantId: string): QueueItem[] {
    const items: QueueItem[] = [];
    this.queues.forEach(queue => {
      queue.forEach(item => {
        if (item.tenantId === tenantId) {
          items.push(item);
        }
      });
    });
    return items.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Update item status
   */
  updateItemStatus(type: QueueType, itemId: string, status: QueueItem['status']): void {
    const queue = this.queues.get(type);
    if (queue) {
      const item = queue.find(i => i.id === itemId);
      if (item) {
        item.status = status;
        this.logger.info('Item status updated', { type, itemId, status });
      }
    }
  }

  /**
   * Assign item to operator
   */
  assignItem(type: QueueType, itemId: string, operatorId: string): void {
    const queue = this.queues.get(type);
    if (queue) {
      const item = queue.find(i => i.id === itemId);
      if (item) {
        item.assignedTo = operatorId;
        item.status = 'in_progress';
        this.logger.info('Item assigned', { type, itemId, operatorId });
      }
    }
  }

  /**
   * Remove completed items
   */
  removeCompletedItems(type: QueueType): void {
    const queue = this.queues.get(type);
    if (queue) {
      const initialLength = queue.length;
      const filtered = queue.filter(item => item.status !== 'completed');
      this.queues.set(type, filtered);
      this.logger.info('Completed items removed', { type, count: initialLength - filtered.length });
    }
  }

  /**
   * Get queue statistics
   */
  getQueueStatistics(): {
    totalItems: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byStatus: Record<string, number>;
    highPriorityCount: number;
  } {
    let totalItems = 0;
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    this.queues.forEach((queue, type) => {
      byType[type] = queue.length;
      totalItems += queue.length;

      queue.forEach(item => {
        byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
        byStatus[item.status] = (byStatus[item.status] || 0) + 1;
      });
    });

    const highPriorityCount = this.getHighPriorityItems().length;

    return {
      totalItems,
      byType,
      byPriority,
      byStatus,
      highPriorityCount,
    };
  }

  /**
   * Generate workspace report
   */
  generateWorkspaceReport(): string {
    const stats = this.getQueueStatistics();
    const highPriority = this.getHighPriorityItems();

    let report = '=== Daily Operator Workspace Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Items: ${stats.totalItems}\n`;
    report += `High Priority: ${stats.highPriorityCount}\n\n`;

    report += '--- Items by Queue Type ---\n';
    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `${type}: ${count}\n`;
    });

    report += '\n--- Items by Priority ---\n';
    Object.entries(stats.byPriority).forEach(([priority, count]) => {
      report += `${priority}: ${count}\n`;
    });

    report += '\n--- Items by Status ---\n';
    Object.entries(stats.byStatus).forEach(([status, count]) => {
      report += `${status}: ${count}\n`;
    });

    if (highPriority.length > 0) {
      report += '\n--- High Priority Items ---\n';
      highPriority.slice(0, 10).forEach(item => {
        report += `${item.type} - ${item.title}\n`;
        report += `  Tenant: ${item.tenantId}\n`;
        report += `  Priority: ${item.priority}\n`;
        report += `  Severity: ${item.severity}\n`;
      });
    }

    return report;
  }

  /**
   * Clear queues (for testing only)
   */
  clearQueues(): void {
    this.logger.warn('All queues cleared');
    this.initializeQueues();
  }
}

/**
 * Singleton instance
 */
export const dailyOperatorWorkspace = new DailyOperatorWorkspace();
