/**
 * LINX Agent Runtime Integration
 * 
 * *** DEPRECATED - DO NOT USE ***
 * This file contains the LinxAgentRuntime wrapper which has been deprecated
 * in favor of direct ExecutionOrchestrator usage (see canonical execution path)
 * All new LINX execution should use ExecutionOrchestrator directly via API routes
 * This file is preserved for rollback capability only
 * *** DEPRECATED - DO NOT USE ***
 * 
 * LINX responsibilities:
 * - backlink discovery
 * - backlink quality scoring
 * - toxic backlink detection
 * - internal linking analysis
 * - orphan page detection
 * - link opportunity discovery
 * - anchor text analysis
 * - authority flow analysis
 * - competitor backlink comparison
 * - internal link recommendation generation
 * 
 * Executes ONLY through canonical runtime (RuntimeService, ExecutionOrchestrator, Runtime Kernel)
 * Persists ONLY through canonical tables (agent_executions, agent_tasks, agent_events, agent_logs)
 * Reuses existing table: linx_backlinks
 */

import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import { Execution } from "@/lib/runtime/types/execution.types";
import type { ExecutionPlan, TaskPlan } from "@/lib/runtime/orchestrator/types";

export interface LinxExecutionConfig {
  tenantId: string;
  workspaceId: string;
  domain: string;
  enableCompetitorAnalysis: boolean;
  competitorDomains?: string[];
  enableInternalLinkAnalysis: boolean;
}

export class LinxAgentRuntime {
  private runtime: RuntimeService;
  private orchestrator: ExecutionOrchestrator;

  constructor(tenantId: string) {
    this.runtime = new RuntimeService({
      tenantId,
      logOperations: true,
      enableMetrics: true,
    });

    this.orchestrator = new ExecutionOrchestrator(this.runtime, {
      tenantId,
      enableAutoEvents: true,
      enableAutoLogging: true,
      stallDetectionTimeoutMs: 3600000,
    });
  }

  /**
   * Execute LINX backlink analysis workflow
   */
  async executeBacklinkAnalysis(config: LinxExecutionConfig) {
    const tasks: TaskPlan[] = [
      {
        taskName: "fetch_backlinks",
        taskType: "dataforseo_backlinks_fetch",
        stepOrder: 1,
        inputPayload: {
          domain: config.domain,
          tenantId: config.tenantId,
        },
      },
    ];

    const result = await this.orchestrator.createExecution({
      agentName: 'LINX',
      workflowType: 'backlink_analysis',
      inputPayload: {
        domain: config.domain,
        workspaceId: config.workspaceId,
        enableCompetitorAnalysis: config.enableCompetitorAnalysis,
        competitorDomains: config.competitorDomains,
        enableInternalLinkAnalysis: config.enableInternalLinkAnalysis,
      },
      tasks,
      metadata: {
        tenantId: config.tenantId,
        initiatedBy: 'tenant',
      },
    });
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const startResult = await this.orchestrator.startExecution(result.data);
    return startResult;
  }

  /**
   * Retry LINX execution
   */
  async retryExecution(executionId: string) {
    return await this.orchestrator.retryExecution(executionId);
  }

  /**
   * Cancel LINX execution
   */
  async cancelExecution(executionId: string) {
    return await this.orchestrator.cancelExecution(executionId);
  }
}
