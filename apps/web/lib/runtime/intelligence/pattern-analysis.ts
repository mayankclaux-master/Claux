/**
 * CLAUX Runtime Intelligence Layer - Pattern Analysis
 * 
 * Execution pattern analysis.
 * No ML providers - pure semantic intelligence.
 */

import type { ExecutionPattern } from './types';
import { PatternAnalysisError } from './errors';
import { PATTERN_DETECTION_WINDOWS } from './constants';

/**
 * Pattern Analysis Manager
 */
export class PatternAnalysisManager {
  private patterns: Map<string, ExecutionPattern> = new Map();
  private executionBuffer: Map<string, ExecutionRecord[]> = new Map();

  /**
   * Analyze execution
   */
  analyzeExecution(executionType: string, characteristics: Record<string, unknown>): ExecutionPattern | null {
    const patternId = this.generatePatternId(characteristics);
    const existingPattern = this.patterns.get(patternId);

    if (existingPattern) {
      // Update existing pattern
      const updatedPattern: ExecutionPattern = {
        ...existingPattern,
        frequency: existingPattern.frequency + 1,
        lastSeen: Date.now(),
      };
      this.patterns.set(patternId, updatedPattern);
      return updatedPattern;
    }

    // Check if this forms a new pattern
    const records = this.executionBuffer.get(executionType) || [];
    records.push({ characteristics, timestamp: Date.now() });

    if (records.length >= 5) {
      const newPattern = this.extractPattern(executionType, records);
      if (newPattern) {
        this.patterns.set(newPattern.patternId, newPattern);
        return newPattern;
      }
    }

    return null;
  }

  /**
   * Generate pattern ID
   */
  private generatePatternId(characteristics: Record<string, unknown>): string {
    const sorted = Object.entries(characteristics)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
    return `pattern_${Buffer.from(sorted).toString('base64').substring(0, 16)}`;
  }

  /**
   * Extract pattern
   */
  private extractPattern(executionType: string, records: readonly ExecutionRecord[]): ExecutionPattern | null {
    // Simple pattern detection based on common characteristics
    const commonChars = this.findCommonCharacteristics(records);
    if (commonChars.size === 0) return null;

    const patternId = this.generatePatternId(Object.fromEntries(commonChars));

    return {
      patternId,
      patternType: executionType,
      characteristics: Object.fromEntries(commonChars),
      frequency: records.length,
      lastSeen: Date.now(),
    };
  }

  /**
   * Find common characteristics
   */
  private findCommonCharacteristics(records: readonly ExecutionRecord[]): Map<string, unknown> {
    if (records.length === 0) return new Map();

    const first = records[0].characteristics;
    const common = new Map<string, unknown>();

    for (const [key, value] of Object.entries(first)) {
      if (records.every(r => r.characteristics[key] === value)) {
        common.set(key, value);
      }
    }

    return common;
  }

  /**
   * Get pattern
   */
  getPattern(patternId: string): ExecutionPattern | undefined {
    return this.patterns.get(patternId);
  }

  /**
   * Get patterns by type
   */
  getPatternsByType(patternType: string): readonly ExecutionPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.patternType === patternType);
  }

  /**
   * Clear pattern
   */
  clearPattern(patternId: string): void {
    this.patterns.delete(patternId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.patterns.clear();
    this.executionBuffer.clear();
  }
}

/**
 * Execution Record
 */
interface ExecutionRecord {
  readonly characteristics: Record<string, unknown>;
  readonly timestamp: number;
}
