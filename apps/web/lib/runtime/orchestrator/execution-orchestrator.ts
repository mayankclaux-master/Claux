/**
 * Execution Orchestrator (V1 Minimal Stub)
 * 
 * Simplified orchestrator for V1 - over-engineered orchestration removed in Phase 2A
 * This is a minimal stub to maintain API compatibility while V1 agents use direct execution
 * TODO: Agents should use direct RuntimeService instead of orchestrator in V1
 */

import type { UUID } from '../types/common.types';

interface OrchestratorConfig {
  tenantId: UUID;
}

/**
 * Execution orchestrator (minimal V1 stub)
 * NOTE: This is a temporary stub for API compatibility
 * V1 agents should use RuntimeService directly
 */
export class ExecutionOrchestrator {
  private config: OrchestratorConfig;

  constructor(_runtime: unknown, config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Create execution - stub for V1
   * TODO: Use RuntimeService directly
   */
  async createExecution(_agentName: string, _inputPayload: Record<string, unknown>): Promise<UUID> {
    // Stub - returns mock UUID
    return '00000000-0000-0000-0000-000000000000' as UUID;
  }

  /**
   * Start execution - stub for V1
   * TODO: Use RuntimeService directly
   */
  async startExecution(_executionId: UUID): Promise<void> {
    // Stub - no-op
  }

  /**
   * Complete execution - stub for V1
   * TODO: Use RuntimeService directly
   */
  async completeExecution(_executionId: UUID): Promise<void> {
    // Stub - no-op
  }
}
