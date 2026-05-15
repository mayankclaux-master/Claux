/**
 * CLAUX Runtime Fixtures Layer - Replay Fixtures
 */

import type { Fixture, FixtureId } from './types';

/**
 * Replay Fixtures Manager
 */
export class ReplayFixturesManager {
  private fixtures: Map<string, Fixture> = new Map();

  /**
   * Create replay fixture
   */
  create(name: string): Fixture {
    const fixtureId = this.generateFixtureId();
    const fixture: Fixture = {
      fixtureId,
      type: 'replay',
      data: {
        name,
        originalExecutionId: `exec_${Date.now()}`,
        replayHistory: ['event1', 'event2', 'event3'],
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
