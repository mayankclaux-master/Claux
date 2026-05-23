/**
 * CLAUX Phase 3A — Priority Engine
 * Deterministic priority scoring for Command Centre tasks
 * NO AI scoring - simple deterministic logic only
 */

import type { TaskPriority } from './types';

/**
 * Priority Score Factors
 */
export interface PriorityFactors {
  keyword_opportunity?: number; // 0-100
  traffic_potential?: number; // 0-100
  ranking_drop?: number; // 0-100
  technical_severity?: number; // 0-100
  review_urgency?: number; // 0-100
  publish_urgency?: number; // 0-100
}

/**
 * Priority Engine
 * Deterministic scoring based on defined factors
 */
export class PriorityEngine {
  /**
   * Calculate priority from factors
   * Returns deterministic priority level
   */
  static calculatePriority(factors: PriorityFactors): TaskPriority {
    const score = this.calculateScore(factors);
    
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  /**
   * Calculate raw score (0-100)
   */
  private static calculateScore(factors: PriorityFactors): number {
    let score = 0;
    let factorCount = 0;

    if (factors.keyword_opportunity !== undefined) {
      score += factors.keyword_opportunity * 0.2;
      factorCount++;
    }
    if (factors.traffic_potential !== undefined) {
      score += factors.traffic_potential * 0.2;
      factorCount++;
    }
    if (factors.ranking_drop !== undefined) {
      score += factors.ranking_drop * 0.2;
      factorCount++;
    }
    if (factors.technical_severity !== undefined) {
      score += factors.technical_severity * 0.2;
      factorCount++;
    }
    if (factors.review_urgency !== undefined) {
      score += factors.review_urgency * 0.1;
      factorCount++;
    }
    if (factors.publish_urgency !== undefined) {
      score += factors.publish_urgency * 0.1;
      factorCount++;
    }

    // Normalize if no factors provided
    if (factorCount === 0) return 50;

    return Math.min(100, Math.round(score));
  }

  /**
   * Validate priority value
   */
  static isValidPriority(priority: string): priority is TaskPriority {
    return ['critical', 'high', 'medium', 'low'].includes(priority);
  }

  /**
   * Get priority weight for sorting
   * Higher number = higher priority
   */
  static getPriorityWeight(priority: TaskPriority): number {
    const weights: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[priority];
  }

  /**
   * Sort tasks by priority
   */
  static sortByPriority<T extends { priority: TaskPriority }>(tasks: T[]): T[] {
    return [...tasks].sort((a, b) => {
      const weightA = this.getPriorityWeight(a.priority);
      const weightB = this.getPriorityWeight(b.priority);
      return weightB - weightA; // Descending
    });
  }
}
