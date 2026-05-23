/**
 * Dashboard Usage Analytics
 * 
 * Tracks:
 * - Which widgets operators actually use
 * - Ignored widgets
 * - High-friction workflows
 * - Dashboard abandonment points
 * - Excessive clicks
 * - Repeated refresh behavior
 * 
 * Generates dashboard usability scoring.
 */

import { createLogger, Logger } from '@/lib/utils/logger';

/**
 * Widget type
 */
export enum WidgetType {
  RANKINGS = 'rankings',
  REPORTS = 'reports',
  TASKS = 'tasks',
  AGENTS = 'agents',
  BILLING = 'billing',
  SETTINGS = 'settings',
  INTEGRATIONS = 'integrations',
  PUBLISHING = 'publishing',
  TEAM = 'team',
}

/**
 * Usage event
 */
export interface UsageEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  operatorId: string;
  widget: WidgetType;
  action: 'view' | 'click' | 'refresh' | 'abandon';
  duration?: number;
  clickCount?: number;
}

/**
 * Widget usage metrics
 */
export interface WidgetUsageMetrics {
  widget: WidgetType;
  totalViews: number;
  totalClicks: number;
  totalRefreshes: number;
  abandonments: number;
  averageDuration: number;
  usabilityScore: number; // 0-100
  frictionScore: number; // 0-100 (higher = more friction)
}

/**
 * Dashboard usage analytics
 */
export class DashboardUsageAnalytics {
  private logger: Logger;
  private events: UsageEvent[] = [];
  private widgetMetrics: Map<WidgetType, WidgetUsageMetrics> = new Map();

  constructor() {
    this.logger = createLogger();
  }

  /**
   * Track usage event
   */
  trackEvent(params: {
    tenantId: string;
    operatorId: string;
    widget: WidgetType;
    action: 'view' | 'click' | 'refresh' | 'abandon';
    duration?: number;
    clickCount?: number;
  }): void {
    const event: UsageEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };

    this.events.push(event);
    this.updateWidgetMetrics(params.widget);
    this.logger.info('Usage event tracked', { event });
  }

  /**
   * Update widget metrics
   */
  private updateWidgetMetrics(widget: WidgetType): void {
    const widgetEvents = this.events.filter(e => e.widget === widget);
    const totalViews = widgetEvents.filter(e => e.action === 'view').length;
    const totalClicks = widgetEvents.filter(e => e.action === 'click').length;
    const totalRefreshes = widgetEvents.filter(e => e.action === 'refresh').length;
    const abandonments = widgetEvents.filter(e => e.action === 'abandon').length;

    const viewEvents = widgetEvents.filter(e => e.action === 'view' && e.duration !== undefined);
    const averageDuration = viewEvents.length > 0
      ? Math.round(viewEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / viewEvents.length)
      : 0;

    // Usability score: based on views vs abandonments
    const usabilityScore = totalViews > 0
      ? Math.round(((totalViews - abandonments) / totalViews) * 100)
      : 100;

    // Friction score: based on refreshes and clicks per view
    const clicksPerView = totalViews > 0 ? totalClicks / totalViews : 0;
    const refreshesPerView = totalViews > 0 ? totalRefreshes / totalViews : 0;
    const frictionScore = Math.min(100, Math.round((clicksPerView * 10) + (refreshesPerView * 20)));

    this.widgetMetrics.set(widget, {
      widget,
      totalViews,
      totalClicks,
      totalRefreshes,
      abandonments,
      averageDuration,
      usabilityScore,
      frictionScore,
    });
  }

  /**
   * Get widget metrics
   */
  getWidgetMetrics(widget: WidgetType): WidgetUsageMetrics | undefined {
    return this.widgetMetrics.get(widget);
  }

  /**
   * Get all widget metrics
   */
  getAllWidgetMetrics(): WidgetUsageMetrics[] {
    return Array.from(this.widgetMetrics.values()).sort((a, b) => b.usabilityScore - a.usabilityScore);
  }

  /**
   * Get ignored widgets (low views, high abandonments)
   */
  getIgnoredWidgets(): WidgetType[] {
    return Array.from(this.widgetMetrics.values())
      .filter(m => m.totalViews < 5 || m.abandonments > m.totalViews * 0.5)
      .map(m => m.widget);
  }

  /**
   * Get high-friction widgets
   */
  getHighFrictionWidgets(): WidgetType[] {
    return Array.from(this.widgetMetrics.values())
      .filter(m => m.frictionScore > 50)
      .map(m => m.widget);
  }

  /**
   * Detect excessive clicks
   */
  detectExcessiveClicks(widget: WidgetType): boolean {
    const metrics = this.widgetMetrics.get(widget);
    if (!metrics) return false;

    const clicksPerView = metrics.totalViews > 0 ? metrics.totalClicks / metrics.totalViews : 0;
    return clicksPerView > 10;
  }

  /**
   * Detect repeated refresh behavior
   */
  detectRepeatedRefreshes(widget: WidgetType): boolean {
    const metrics = this.widgetMetrics.get(widget);
    if (!metrics) return false;

    const refreshesPerView = metrics.totalViews > 0 ? metrics.totalRefreshes / metrics.totalViews : 0;
    return refreshesPerView > 3;
  }

  /**
   * Get dashboard abandonment points
   */
  getAbandonmentPoints(): Array<{ widget: WidgetType; abandonmentRate: number }> {
    return Array.from(this.widgetMetrics.values())
      .map(m => ({
        widget: m.widget,
        abandonmentRate: m.totalViews > 0 ? (m.abandonments / m.totalViews) * 100 : 0,
      }))
      .filter(p => p.abandonmentRate > 30)
      .sort((a, b) => b.abandonmentRate - a.abandonmentRate);
  }

  /**
   * Generate dashboard usability score
   */
  generateDashboardUsabilityScore(): number {
    const metrics = this.getAllWidgetMetrics();
    if (metrics.length === 0) return 100;

    const averageUsability = metrics.reduce((sum, m) => sum + m.usabilityScore, 0) / metrics.length;
    const averageFriction = metrics.reduce((sum, m) => sum + m.frictionScore, 0) / metrics.length;

    return Math.max(0, Math.round(averageUsability - averageFriction));
  }

  /**
   * Generate usage report
   */
  generateUsageReport(): string {
    const metrics = this.getAllWidgetMetrics();
    const ignored = this.getIgnoredWidgets();
    const highFriction = this.getHighFrictionWidgets();
    const abandonmentPoints = this.getAbandonmentPoints();
    const overallScore = this.generateDashboardUsabilityScore();

    let report = '=== Dashboard Usage Analytics Report ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Events: ${this.events.length}\n`;
    report += `Overall Usability Score: ${overallScore}/100\n\n`;

    report += '--- Widget Usage Metrics ---\n';
    metrics.forEach(m => {
      report += `${m.widget}:\n`;
      report += `  Views: ${m.totalViews}\n`;
      report += `  Clicks: ${m.totalClicks}\n`;
      report += `  Refreshes: ${m.totalRefreshes}\n`;
      report += `  Abandonments: ${m.abandonments}\n`;
      report += `  Avg Duration: ${m.averageDuration}ms\n`;
      report += `  Usability: ${m.usabilityScore}%\n`;
      report += `  Friction: ${m.frictionScore}%\n`;
    });

    if (ignored.length > 0) {
      report += '\n--- Ignored Widgets ---\n';
      ignored.forEach(widget => {
        report += `${widget}\n`;
      });
    }

    if (highFriction.length > 0) {
      report += '\n--- High Friction Widgets ---\n';
      highFriction.forEach(widget => {
        report += `${widget}\n`;
      });
    }

    if (abandonmentPoints.length > 0) {
      report += '\n--- Abandonment Points ---\n';
      abandonmentPoints.forEach(p => {
        report += `${p.widget}: ${Math.round(p.abandonmentRate)}% abandonment\n`;
      });
    }

    return report;
  }

  /**
   * Clear events (for testing only)
   */
  clearEvents(): void {
    this.logger.warn('Usage events cleared');
    this.events = [];
    this.widgetMetrics.clear();
  }
}

/**
 * Singleton instance
 */
export const dashboardUsageAnalytics = new DashboardUsageAnalytics();
