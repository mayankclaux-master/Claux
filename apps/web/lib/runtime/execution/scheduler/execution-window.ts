/**
 * CLAUX Runtime Execution Engine - Execution Window
 * 
 * Manages execution windows for time-based scheduling.
 * No external dependencies - pure window management logic.
 */

import type { ExecutionWindow, ResourceLimits } from '../types';

/**
 * Execution Window
 * 
 * Defines time-based execution windows.
 */
export interface TimeWindow {
  readonly start: Date;
  readonly end: Date;
  readonly allowed: boolean;
}

/**
 * Execution Window Manager
 * 
 * Manages execution windows for time-based scheduling constraints.
 */
export class ExecutionWindowManager {
  private windows: TimeWindow[] = [];
  private resourceLimits: ResourceLimits;

  constructor(resourceLimits?: ResourceLimits) {
    this.resourceLimits = resourceLimits || {
      maxCpu: 100,
      maxMemory: 1073741824,
      maxBandwidth: 104857600,
    };
  }

  /**
   * Add a time window
   */
  addWindow(start: Date, end: Date, allowed: boolean = true): void {
    if (start >= end) {
      throw new Error('Start time must be before end time');
    }

    this.windows.push({ start, end, allowed });
  }

  /**
   * Remove all windows
   */
  clearWindows(): void {
    this.windows = [];
  }

  /**
   * Check if current time is within an allowed window
   */
  isWithinAllowedWindow(timestamp: Date = new Date()): boolean {
    if (this.windows.length === 0) {
      return true; // No windows configured, always allowed
    }

    for (const window of this.windows) {
      if (timestamp >= window.start && timestamp < window.end) {
        return window.allowed;
      }
    }

    return false; // Outside all windows, default to not allowed
  }

  /**
   * Get next allowed window start time
   */
  getNextAllowedWindowStart(from: Date = new Date()): Date | undefined {
    for (const window of this.windows) {
      if (window.allowed && window.start > from) {
        return window.start;
      }
    }

    return undefined;
  }

  /**
   * Get current execution window
   */
  getCurrentExecutionWindow(timestamp: Date = new Date()): ExecutionWindow {
    return {
      maxConcurrency: this.calculateMaxConcurrency(timestamp),
      currentConcurrency: 0, // This would be set by the concurrency controller
      availableSlots: this.calculateAvailableSlots(timestamp),
      resourceLimits: this.resourceLimits,
    };
  }

  /**
   * Calculate max concurrency based on time window
   */
  private calculateMaxConcurrency(timestamp: Date): number {
    if (!this.isWithinAllowedWindow(timestamp)) {
      return 0;
    }

    // Default max concurrency if within allowed window
    return 10;
  }

  /**
   * Calculate available slots based on time window
   */
  private calculateAvailableSlots(timestamp: Date): number {
    const maxConcurrency = this.calculateMaxConcurrency(timestamp);
    return maxConcurrency; // This would be adjusted by current concurrency
  }

  /**
   * Set resource limits for execution window
   */
  setResourceLimits(limits: ResourceLimits): void {
    this.resourceLimits = { ...this.resourceLimits, ...limits };
  }

  /**
   * Get resource limits
   */
  getResourceLimits(): ResourceLimits {
    return { ...this.resourceLimits };
  }

  /**
   * Check if execution is allowed at given timestamp
   */
  isExecutionAllowed(timestamp: Date = new Date()): boolean {
    return this.isWithinAllowedWindow(timestamp);
  }

  /**
   * Wait until next allowed window
   */
  async waitForAllowedWindow(checkIntervalMs: number = 1000): Promise<boolean> {
    while (!this.isWithinAllowedWindow()) {
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }

    return true;
  }

  /**
   * Get time until next allowed window
   */
  getTimeUntilNextAllowedWindow(from: Date = new Date()): number | undefined {
    const nextStart = this.getNextAllowedWindowStart(from);

    if (!nextStart) {
      return undefined;
    }

    return nextStart.getTime() - from.getTime();
  }

  /**
   * Add daily recurring window
   */
  addDailyWindow(hour: number, minute: number, durationMinutes: number): void {
    const start = new Date();
    start.setHours(hour, minute, 0, 0);

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    this.addWindow(start, end, true);
  }

  /**
   * Add weekly recurring window
   */
  addWeeklyWindow(dayOfWeek: number, hour: number, minute: number, durationMinutes: number): void {
    const now = new Date();
    const start = new Date(now);
    
    // Find next occurrence of the day
    const currentDay = start.getDay();
    const daysUntil = (dayOfWeek - currentDay + 7) % 7;
    
    start.setDate(start.getDate() + daysUntil);
    start.setHours(hour, minute, 0, 0);

    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    this.addWindow(start, end, true);
  }

  /**
   * Add business hours window (Mon-Fri, 9am-5pm)
   */
  addBusinessHoursWindow(): void {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    // Set to 9am
    start.setHours(9, 0, 0, 0);

    // Set to 5pm
    end.setHours(17, 0, 0, 0);

    this.addWindow(start, end, true);
  }

  /**
   * Add after-hours window (Mon-Fri, 5pm-9am)
   */
  addAfterHoursWindow(): void {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    // Set to 5pm
    start.setHours(17, 0, 0, 0);

    // Set to 9am next day
    end.setDate(end.getDate() + 1);
    end.setHours(9, 0, 0, 0);

    this.addWindow(start, end, true);
  }

  /**
   * Add weekend window (Sat-Sun, all day)
   */
  addWeekendWindow(): void {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    // Find next Saturday
    const currentDay = start.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7;
    start.setDate(start.getDate() + daysUntilSaturday);
    start.setHours(0, 0, 0, 0);

    // Set to end of Sunday
    end.setDate(start.getDate() + 2);
    end.setHours(0, 0, 0, 0);

    this.addWindow(start, end, true);
  }

  /**
   * Validate windows don't overlap
   */
  validateWindows(): boolean {
    const sortedWindows = [...this.windows].sort((a, b) => a.start.getTime() - b.start.getTime());

    for (let i = 0; i < sortedWindows.length - 1; i++) {
      const current = sortedWindows[i];
      const next = sortedWindows[i + 1];

      if (current.end > next.start) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all windows
   */
  getWindows(): readonly TimeWindow[] {
    return [...this.windows];
  }
}
