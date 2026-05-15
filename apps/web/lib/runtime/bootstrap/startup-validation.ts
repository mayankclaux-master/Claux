/**
 * CLAUX Runtime Bootstrap Layer - Startup Validation
 */

import { StartupValidationError } from './errors';

/**
 * Startup Validation Manager
 */
export class StartupValidationManager {
  private checks: Map<string, () => boolean> = new Map();
  private results: Map<string, boolean> = new Map();

  /**
   * Add check
   */
  addCheck(name: string, check: () => boolean): void {
    this.checks.set(name, check);
  }

  /**
   * Run all checks
   */
  runChecks(): { valid: boolean; failures: string[] } {
    const failures: string[] = [];

    for (const [name, check] of this.checks) {
      const result = check();
      this.results.set(name, result);

      if (!result) {
        failures.push(name);
      }
    }

    return { valid: failures.length === 0, failures };
  }

  /**
   * Run specific check
   */
  runCheck(name: string): boolean {
    const check = this.checks.get(name);
    if (!check) {
      throw new StartupValidationError(`Check ${name} not found`);
    }

    const result = check();
    this.results.set(name, result);
    return result;
  }

  /**
   * Get check result
   */
  getResult(name: string): boolean | undefined {
    return this.results.get(name);
  }

  /**
   * Clear
   */
  clear(): void {
    this.checks.clear();
    this.results.clear();
  }
}
