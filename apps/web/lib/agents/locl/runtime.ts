/**
 * LOCL Agent Runtime Integration
 * 
 * *** DEPRECATED - DO NOT USE ***
 * This file contains the LoclAgentRuntime wrapper which has been deprecated
 * in favor of direct ExecutionOrchestrator usage (see canonical execution path)
 * All new LOCL execution should use ExecutionOrchestrator directly via API routes
 * This file is preserved for rollback capability only
 * *** DEPRECATED - DO NOT USE ***
 * 
 * LOCL responsibilities:
 * - Google Business Profile sync
 * - local citation monitoring
 * - NAP consistency validation
 * - local ranking monitoring
 * - GBP post recommendations
 * - local competitor tracking
 * - map pack analysis
 * - local SEO health scoring
 * - location-level SEO intelligence
 * 
 * Executes ONLY through canonical runtime (RuntimeService, ExecutionOrchestrator, Runtime Kernel)
 * Persists ONLY through canonical tables (agent_executions, agent_tasks, agent_events, agent_logs)
 */

import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import type { ExecutionPlan, TaskPlan } from "@/lib/runtime/orchestrator/types";

export interface LoclExecutionConfig {
  tenantId: string;
  workspaceId: string;
  businessProfileId: string;
  enableLocalRanking: boolean;
  enableCitationMonitoring: boolean;
}

export class LoclAgentRuntime {
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
   * Execute LOCL local SEO workflow
   */
  async executeLocalSEO(config: LoclExecutionConfig) {
    const executionPlan = this.createLocalSEOExecutionPlan(config);
    const result = await this.orchestrator.createExecution(executionPlan);
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const startResult = await this.orchestrator.startExecution(result.data);
    return startResult;
  }

  /**
   * Create LOCL execution plan
   */
  private createLocalSEOExecutionPlan(config: LoclExecutionConfig): ExecutionPlan {
    const tasks: TaskPlan[] = [];

    // Task 1: Sync GBP
    tasks.push({
      taskName: "sync_gbp",
      taskType: "gbp_sync",
      stepOrder: 1,
      inputPayload: {
        businessProfileId: config.businessProfileId,
        tenantId: config.tenantId,
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 2000,
        strategy: 'exponential',
      },
    });

    // Task 2: Monitor local citations
    if (config.enableCitationMonitoring) {
      tasks.push({
        taskName: "monitor_citations",
        taskType: "citation_monitoring",
        stepOrder: 2,
        inputPayload: {
          executionId: "${execution.id}",
        },
        retryPolicy: {
          maxRetries: 2,
          backoffMs: 1000,
          strategy: 'exponential',
        },
      });
    }

    // Task 3: Validate NAP consistency
    tasks.push({
      taskName: "validate_nap_consistency",
      taskType: "nap_validation",
      stepOrder: 3,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 4: Monitor local rankings
    if (config.enableLocalRanking) {
      tasks.push({
        taskName: "monitor_local_rankings",
        taskType: "local_ranking_monitoring",
        stepOrder: 4,
        inputPayload: {
          executionId: "${execution.id}",
        },
        retryPolicy: {
          maxRetries: 2,
          backoffMs: 1000,
          strategy: 'exponential',
        },
      });
    }

    // Task 5: Generate GBP post recommendations
    tasks.push({
      taskName: "generate_gbp_post_recommendations",
      taskType: "gbp_post_recommendation",
      stepOrder: 5,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 6: Track local competitors
    tasks.push({
      taskName: "track_local_competitors",
      taskType: "local_competitor_tracking",
      stepOrder: 6,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 7: Analyze map pack
    tasks.push({
      taskName: "analyze_map_pack",
      taskType: "map_pack_analysis",
      stepOrder: 7,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 8: Score local SEO health
    tasks.push({
      taskName: "score_local_seo_health",
      taskType: "local_seo_health_scoring",
      stepOrder: 8,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 9: Generate location-level SEO intelligence
    tasks.push({
      taskName: "generate_local_intelligence",
      taskType: "intelligence_summary",
      stepOrder: 9,
      inputPayload: {
        executionId: "${execution.id}",
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    return {
      agentName: "LOCL",
      workflowType: "local_seo",
      inputPayload: {
        tenantId: config.tenantId,
        workspaceId: config.workspaceId,
        businessProfileId: config.businessProfileId,
        enableLocalRanking: config.enableLocalRanking,
        enableCitationMonitoring: config.enableCitationMonitoring,
      },
      metadata: {
        initiatedBy: "tenant",
      },
      tasks,
    };
  }

  /**
   * Retry LOCL execution
   */
  async retryExecution(executionId: string) {
    return await this.orchestrator.retryExecution(executionId);
  }

  /**
   * Cancel LOCL execution
   */
  async cancelExecution(executionId: string) {
    return await this.orchestrator.cancelExecution(executionId);
  }
}
