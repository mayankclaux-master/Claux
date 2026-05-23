/**
 * Real User Behavior Analytics
 * 
 * Tracks:
 * - Ignored recommendations
 * - Accepted recommendations
 * - Dashboard usage patterns
 * - Abandoned workflows
 * - Repeated refreshes
 * - Execution trust behavior
 * - Task completion behavior
 * 
 * Separates:
 * - Internal operator behavior
 * - External beta behavior
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * User type
 */
export enum UserType {
  INTERNAL_OPERATOR = 'internal_operator',
  EXTERNAL_BETA = 'external_beta',
}

/**
 * Behavior event
 */
export interface BehaviorEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  userType: UserType;
  userId: string;
  eventType: 'recommendation_ignored' | 'recommendation_accepted' | 'dashboard_view' | 'workflow_abandoned' | 'dashboard_refresh' | 'execution_trusted' | 'execution_distrusted' | 'task_completed' | 'task_ignored';
  metadata?: Record<string, any>;
}

/**
 * User behavior metrics
 */
export interface UserBehaviorMetrics {
  userType: UserType;
  totalEvents: number;
  recommendationsIgnored: number;
  recommendationsAccepted: number;
  dashboardViews: number;
  workflowsAbandoned: number;
  dashboardRefreshes: number;
  executionsTrusted: number;
  executionsDistrusted: number;
  tasksCompleted: number;
  tasksIgnored: number;
  acceptanceRate: number; // 0-100
  abandonmentRate: number; // 0-100
  trustRate: number; // 0-100
}

/**
 * Real user behavior analytics
 */
export class RealUserBehaviorAnalytics {
  private logger: Logger;
  private events: BehaviorEvent[] = [];
  private metrics: Map<UserType, UserBehaviorMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track behavior event
   */
  trackEvent(params: {
    tenantId: string;
    userType: UserType;
    userId: string;
    eventType: BehaviorEvent['eventType'];
    metadata?: Record<string, any>;
  }): void {
    const event: BehaviorEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.events.push(event);
    this.updateMetrics(params.userType);
    this.logger.info('Behavior event tracked', { event });
  }

  /**
   * Update metrics for user type
   */
  private updateMetrics(userType: UserType): void {
    const userTypeEvents = this.events.filter(e => e.userType === userType);
    const total = userTypeEvents.length;

    const recommendationsIgnored = userTypeEvents.filter(e => e.eventType === 'recommendation_ignored').length;
    const recommendationsAccepted = userTypeEvents.filter(e => e.eventType === 'recommendation_accepted').length;
    const dashboardViews = userTypeEvents.filter(e => e.eventType === 'dashboard_view').length;
    const workflowsAbandoned = userTypeEvents.filter(e => e.eventType === 'workflow_abandoned').length;
    const dashboardRefreshes = userTypeEvents.filter(e => e.eventType === 'dashboard_refresh').length;
    const executionsTrusted = userTypeEvents.filter(e => e.eventType === 'execution_trusted').length;
    const executionsDistrusted = userTypeEvents.filter(e => e.eventType === 'execution_distrusted').length;
    const tasksCompleted = userTypeEvents.filter(e => e.eventType === 'task_completed').length;
    const tasksIgnored = userTypeEvents.filter(e => e.eventType === 'task_ignored').length;

    const totalRecommendations = recommendationsIgnored + recommendationsAccepted;
    const acceptanceRate = totalRecommendations > 0 ? Math.round((recommendationsAccepted / totalRecommendations) * 100) : 100;

    const totalWorkflows = dashboardViews; // Approximation
    const abandonmentRate = totalWorkflows > 0 ? Math.round((workflowsAbandoned / totalWorkflows) * 100) : 0;

    const totalExecutions = executionsTrusted + executionsDistrusted;
    const trustRate = totalExecutions > 0 ? Math.round((executionsTrusted / totalExecutions) * 100) : 100;

    this.metrics.set(userType, {
      userType,
      totalEvents: total,
      recommendationsIgnored,
      recommendationsAccepted,
      dashboardViews,
      workflowsAbandoned,
      dashboardRefreshes,
      executionsTrusted,
      executionsDistrusted,
      tasksCompleted,
      tasksIgnored,
      acceptanceRate,
      abandonmentRate,
      trustRate,
    });
  }

  /**
   * Get metrics by user type
   */
  getMetrics(userType: UserType): UserBehaviorMetrics | undefined {
    return this.metrics.get(userType);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): UserBehaviorMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get events by tenant
   */
  getEventsByTenant(tenantId: string): BehaviorEvent[] {
    return this.events.filter(e => e.tenantId === tenantId);
  }

  /**
   * Get events by user type
   */
  getEventsByUserType(userType: UserType): BehaviorEvent[] {
    return this.events.filter(e => e.userType === userType);
  }

  /**
   * Detect repeated refresh behavior
   */
  detectRepeatedRefreshes(tenantId: string, threshold: number = 5): boolean {
    const tenantEvents = this.getEventsByTenant(tenantId);
    const refreshEvents = tenantEvents.filter(e => e.eventType === 'dashboard_refresh');
    const recentRefreshes = refreshEvents.filter(e => Date.now() - e.timestamp < 60000); // Last minute
    return recentRefreshes.length >= threshold;
  }

  /**
   * Detect abandoned workflows
   */
  detectAbandonedWorkflows(tenantId: string): BehaviorEvent[] {
    const tenantEvents = this.getEventsByTenant(tenantId);
    return tenantEvents.filter(e => e.eventType === 'workflow_abandoned');
  }

  /**
   * Generate behavior report
   */
  generateBehaviorReport(): string {
    const metrics = this.getAllMetrics();

    let report = '=== Real User Behavior Analytics Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Events: ${this.events.length}\n\n`;

    report += '--- Metrics by User Type ---\n';
    metrics.forEach(m => {
      report += `${m.userType}:\n`;
      report += `  Total Events: ${m.totalEvents}\n`;
      report += `  Recommendations Ignored: ${m.recommendationsIgnored}\n`;
      report += `  Recommendations Accepted: ${m.recommendationsAccepted}\n`;
      report += `  Acceptance Rate: ${m.acceptanceRate}%\n`;
      report += `  Workflows Abandoned: ${m.workflowsAbandoned}\n`;
      report += `  Abandonment Rate: ${m.abandonmentRate}%\n`;
      report += `  Executions Trusted: ${m.executionsTrusted}\n`;
      report += `  Executions Distrusted: ${m.executionsDistrusted}\n`;
      report += `  Trust Rate: ${m.trustRate}%\n`;
      report += `  Tasks Completed: ${m.tasksCompleted}\n`;
      report += `  Tasks Ignored: ${m.tasksIgnored}\n`;
    });

    return report;
  }

  /**
   * Generate internal vs external comparison
   */
  generateComparisonReport(): string {
    const internal = this.getMetrics(UserType.INTERNAL_OPERATOR);
    const external = this.getMetrics(UserType.EXTERNAL_BETA);

    let report = '=== Internal vs External Behavior Comparison ===\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    if (internal && external) {
      report += '--- Acceptance Rate ---\n';
      report += `Internal: ${internal.acceptanceRate}%\n`;
      report += `External: ${external.acceptanceRate}%\n`;
      report += `Delta: ${external.acceptanceRate - internal.acceptanceRate}%\n\n`;

      report += '--- Abandonment Rate ---\n';
      report += `Internal: ${internal.abandonmentRate}%\n`;
      report += `External: ${external.abandonmentRate}%\n`;
      report += `Delta: ${external.abandonmentRate - internal.abandonmentRate}%\n\n`;

      report += '--- Trust Rate ---\n';
      report += `Internal: ${internal.trustRate}%\n`;
      report += `External: ${external.trustRate}%\n`;
      report += `Delta: ${external.trustRate - internal.trustRate}%\n\n`;
    } else {
      report += 'Insufficient data for comparison\n';
    }

    return report;
  }

  /**
   * Clear events (for testing only)
   */
  clearEvents(): void {
    this.logger.warn('Behavior events cleared');
    this.events = [];
    this.metrics.clear();
  }
}

/**
 * Singleton instance
 */
export const realUserBehaviorAnalytics = new RealUserBehaviorAnalytics();
