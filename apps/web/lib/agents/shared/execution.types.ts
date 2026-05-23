/**
 * CLAUX V1 Canonical Agent Execution Types
 * Simple, deterministic types for agent execution
 * NO abstractions, NO enterprise patterns
 */

import type { UUID } from '@/lib/runtime/types/common.types';

/**
 * Agent Context
 * Passed to all agent execution functions
 */
export interface AgentContext {
  tenantId: string;
  agent: string;
  runId: string;
}

/**
 * Execution Input
 * Input payload for agent execution
 */
export interface ExecutionInput {
  [key: string]: unknown;
}

/**
 * Execution Output
 * Output from agent execution
 */
export interface ExecutionOutput {
  success: boolean;
  data?: Record<string, unknown>;
  error?: {
    message: string;
    code: string;
  };
  metrics?: {
    durationMs: number;
    cost: number;
    tokens: number;
  };
}

/**
 * Execution Metadata
 * Metadata stored with execution record
 */
export interface ExecutionMetadata {
  domain?: string;
  category?: string;
  runId?: string;
  [key: string]: unknown;
}
