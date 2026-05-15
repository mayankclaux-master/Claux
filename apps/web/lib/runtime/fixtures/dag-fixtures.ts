/**
 * CLAUX Runtime Fixtures Layer - DAG Fixtures
 */

import type { Fixture, FixtureId } from './types';

/**
 * DAG Fixtures Manager
 */
export class DAGFixturesManager {
  private fixtures: Map<string, Fixture> = new Map();

  /**
   * Create DAG fixture
   */
  create(name: string): Fixture {
    const fixtureId = this.generateFixtureId();
    const fixture: Fixture = {
      fixtureId,
      type: 'dag',
      data: {
        name,
        nodes: ['node1', 'node2', 'node3'],
        edges: [['node1', 'node2'], ['node2', 'node3']],
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
