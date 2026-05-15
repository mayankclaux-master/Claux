/**
 * CLAUX Runtime Telemetry Layer - Bottleneck Detection
 */

import type { Bottleneck } from './types';
import { BOTTLENECK_THRESHOLDS } from './constants';

/**
 * Bottleneck Detection Manager
 */
export class BottleneckDetectionManager {
  private bottlenecks: Bottleneck[] = [];

  /**
   * Detect bottlenecks
   */
  detectBottlenecks(metrics: Record<string, number>): readonly Bottleneck[] {
    const detected: Bottleneck[] = [];

    if (metrics.latency > BOTTLENECK_THRESHOLDS.LATENCY_MS) {
      detected.push({
        component: 'execution',
        severity: 'high',
        description: 'High latency detected',
        metrics: { latency: metrics.latency },
      });
    }

    if (metrics.errorRate > BOTTLENECK_THRESHOLDS.ERROR_RATE) {
      detected.push({
        component: 'error_handling',
        severity: 'high',
        description: 'High error rate detected',
        metrics: { errorRate: metrics.errorRate },
      });
    }

    if (metrics.resourceUtilization > BOTTLENECK_THRESHOLDS.UTILIZATION) {
      detected.push({
        component: 'resources',
        severity: 'medium',
        description: 'High resource utilization',
        metrics: { resourceUtilization: metrics.resourceUtilization },
      });
    }

    this.bottlenecks = detected;
    return detected;
  }

  /**
   * Get bottlenecks
   */
  getBottlenecks(): readonly Bottleneck[] {
    return this.bottlenecks;
  }

  /**
   * Clear
   */
  clear(): void {
    this.bottlenecks = [];
  }
}
