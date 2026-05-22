import type { AgentContext } from "@/lib/agents/base/agent.types";
import { runARIA } from "@/lib/agents/aria/aria.service";
import { runSCRIBE } from "@/lib/agents/scribe/scribe.service";
import { runPUBLISH } from "@/lib/agents/publish/publish.service";
import type { UUID } from "@/lib/runtime/types/common.types";

/**
 * Closed Loop Execution Result
 */
export interface ClosedLoopResult {
  readonly success: boolean;
  readonly ariaResult?: ARIAExecutionResult;
  readonly scribeResult?: SCRIBEExecutionResult;
  readonly ampliResult?: AMPLIExecutionResult;
  readonly error?: string;
  readonly totalDurationMs: number;
}

/**
 * ARIA Execution Result
 */
export interface ARIAExecutionResult {
  readonly success: boolean;
  readonly keywordsGenerated?: number;
  readonly executionId?: string;
  readonly durationMs: number;
  readonly error?: string;
}

/**
 * SCRIBE Execution Result
 */
export interface SCRIBEExecutionResult {
  readonly success: boolean;
  readonly articlesGenerated?: number;
  readonly executionId?: string;
  readonly durationMs: number;
  readonly error?: string;
}

/**
 * AMPLI Execution Result
 */
export interface AMPLIExecutionResult {
  readonly success: boolean;
  readonly articlesPublished?: number;
  readonly executionId?: string;
  readonly durationMs: number;
  readonly error?: string;
}

/**
 * Closed Loop Orchestrator
 * 
 * Orchestrates the autonomous SEO execution loop:
 * ARIA (Keyword Intelligence) → SCRIBE (Content Generation) → AMPLI (Publishing)
 * 
 * This is CLAUX's platform-defining milestone: the first real autonomous SEO execution loop.
 */
export class ClosedLoopOrchestrator {
  private tenantId: UUID;

  constructor(tenantId: UUID) {
    this.tenantId = tenantId;
  }

  /**
   * Execute closed loop
   * 
   * The complete autonomous SEO execution pipeline:
   * 1. ARIA discovers keyword opportunities
   * 2. SCRIBE generates content for keywords
   * 3. AMPLI publishes content to CMS
   */
  async execute(context: Omit<AgentContext, 'agent'>): Promise<ClosedLoopResult> {
    const startTime = Date.now();
    const runId = context.runId;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      runId,
      tenantId: this.tenantId,
      step: 'closed_loop_start',
      message: 'Starting CLAUX closed loop execution',
    }));

    try {
      // Phase 1: ARIA - Keyword Intelligence
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'aria_start',
        message: 'Starting ARIA keyword intelligence',
      }));

      const ariaStartTime = Date.now();
      await runARIA({ ...context, agent: 'ARIA' });
      const ariaDurationMs = Date.now() - ariaStartTime;

      const ariaResult: ARIAExecutionResult = {
        success: true,
        executionId: `${runId}:aria`,
        durationMs: ariaDurationMs,
      };

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'aria_complete',
        durationMs: ariaDurationMs,
        message: 'ARIA keyword intelligence completed',
      }));

      // Phase 2: SCRIBE - Content Generation
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'scribe_start',
        message: 'Starting SCRIBE content generation',
      }));

      const scribeStartTime = Date.now();
      await runSCRIBE({ ...context, agent: 'SCRIBE' });
      const scribeDurationMs = Date.now() - scribeStartTime;

      const scribeResult: SCRIBEExecutionResult = {
        success: true,
        executionId: `${runId}:scribe`,
        durationMs: scribeDurationMs,
      };

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'scribe_complete',
        durationMs: scribeDurationMs,
        message: 'SCRIBE content generation completed',
      }));

      // Phase 3: AMPLI - Publishing
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'ampli_start',
        message: 'Starting AMPLI publishing',
      }));

      const ampliStartTime = Date.now();
      await runPUBLISH({ ...context, agent: 'AMPLI' });
      const ampliDurationMs = Date.now() - ampliStartTime;

      const ampliResult: AMPLIExecutionResult = {
        success: true,
        executionId: `${runId}:ampli`,
        durationMs: ampliDurationMs,
      };

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'ampli_complete',
        durationMs: ampliDurationMs,
        message: 'AMPLI publishing completed',
      }));

      // Closed loop complete
      const totalDurationMs = Date.now() - startTime;

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        runId,
        tenantId: this.tenantId,
        step: 'closed_loop_complete',
        totalDurationMs,
        message: 'CLAUX closed loop execution completed successfully',
      }));

      return {
        success: true,
        ariaResult,
        scribeResult,
        ampliResult,
        totalDurationMs,
      };
    } catch (error) {
      const totalDurationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        runId,
        tenantId: this.tenantId,
        step: 'closed_loop_error',
        error: errorMessage,
        totalDurationMs,
        message: 'CLAUX closed loop execution failed',
      }));

      return {
        success: false,
        error: errorMessage,
        totalDurationMs,
      };
    }
  }

  /**
   * Execute closed loop with custom parameters
   */
  async executeWithParams(
    context: Omit<AgentContext, 'agent'>,
    params: {
      keywordTopic?: string;
      businessCategory?: string;
      contentTone?: string;
      wordCount?: number;
      cmsType?: string;
    }
  ): Promise<ClosedLoopResult> {
    // For now, execute the standard closed loop
    // In production, this would pass parameters to each agent
    return this.execute(context);
  }
}

/**
 * Create closed loop orchestrator
 */
export function createClosedLoopOrchestrator(tenantId: UUID): ClosedLoopOrchestrator {
  return new ClosedLoopOrchestrator(tenantId);
}

/**
 * Execute closed loop (convenience function)
 */
export async function executeClosedLoop(
  context: Omit<AgentContext, 'agent'>
): Promise<ClosedLoopResult> {
  const orchestrator = createClosedLoopOrchestrator(context.tenantId as UUID);
  return orchestrator.execute(context);
}
