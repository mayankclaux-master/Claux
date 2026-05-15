/**
 * CLAUX Runtime Fixtures Layer - Failure Fixtures
 */

import type { Fixture, FixtureId } from './types';

/**
 * Failure Fixtures Manager
 */
export class FailureFixturesManager {
  private fixtures: Map<string, Fixture> = new Map();

  /**
   * Create failure fixture
   */
  create(name: string): Fixture {
    const fixtureId = this.generateFixtureId();
    const fixture: Fixture = {
      fixtureId,
      type: 'failure',
      data: {
        name,
        failureType: 'worker-crash',
        timestamp: Date.now(),
      },
      deterministic: true,
    };

    this.fixtures.set(fixtureId, fixture);
    return fixture;
  }

  /**
   * Get fixture
   */
  get(fixtureId: string): Fixture | undefined {
    return this.fixtures.get(fixtureId);
  }

  /**
   * List fixtures
   */
  list(): readonly Fixture[] {
    return Array.from(this.fixtures.values());
  }

  /**
   * Clear
   */
  clear(): void {
    this.fixtures.clear();
  }

  /**
   * Generate fixture ID
   */
  private generateFixtureId(): FixtureId {
    return `fixture_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
