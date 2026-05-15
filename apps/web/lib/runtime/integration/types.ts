/**
 * CLAUX Runtime Integration Layer - Types
 */

export type IntegrationId = string;

/**
 * Integration Result
 */
export interface IntegrationResult {
  readonly integrationId: IntegrationId;
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly timestamp: number;
}
