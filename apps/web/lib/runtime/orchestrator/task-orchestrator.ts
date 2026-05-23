/**
 * Task Orchestrator (V1 Minimal Stub)
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
 * Task orchestrator (minimal V1 stub)
 * NOTE: This is a temporary stub for API compatibility
 * V1 agents should use RuntimeService directly
 */
export class TaskOrchestrator {
  private config: OrchestratorConfig;

  constructor(_runtime: unknown, config: OrchestratorConfig) {
    this.config = config;
  }

  /**
   * Create task - stub for V1
   * TODO: Use RuntimeService directly
   */
  async createTask(_taskName: string, _inputPayload: Record<string, unknown>): Promise<UUID> {
    // Stub - returns mock UUID
    return '00000000-0000-0000-0000-000000000000' as UUID;
  }

  /**
   * Start task - stub for V1
   * TODO: Use RuntimeService directly
   */
  async startTask(_taskId: UUID): Promise<void> {
    // Stub - no-op
  }

  /**
   * Complete task - stub for V1
   * TODO: Use RuntimeService directly
   */
  async completeTask(_taskId: UUID): Promise<void> {
    // Stub - no-op
  }
}
