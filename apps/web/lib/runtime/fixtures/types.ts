/**
 * CLAUX Runtime Fixtures Layer - Types
 */

export type FixtureId = string;

/**
 * Fixture
 */
export interface Fixture {
  readonly fixtureId: FixtureId;
  readonly type: string;
  readonly data: Record<string, unknown>;
  readonly deterministic: boolean;
}
