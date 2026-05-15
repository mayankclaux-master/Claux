/**
 * PULSE Agent Runtime Integration
 * 
 * *** DEPRECATED - DO NOT USE ***
 * This file contains the PulseAgentRuntime wrapper which has been deprecated
 * in favor of direct ExecutionOrchestrator usage (see canonical execution path)
 * All new PULSE execution should use ExecutionOrchestrator directly via API routes
 * This file is preserved for rollback capability only
 * *** DEPRECATED - DO NOT USE ***
 * 
 * PULSE responsibilities:
 * - keyword rank tracking
 * - SERP movement tracking
 * - volatility monitoring
 * - ranking decay detection
 * - ranking opportunity detection
 * - keyword clustering
 * - intent grouping
 * - topical gap identification
 * - cannibalization detection
 * - competitor SERP comparison
 * - historical ranking intelligence
 * 
 * Executes ONLY through canonical runtime (RuntimeService, ExecutionOrchestrator, Runtime Kernel)
 * Persists ONLY through canonical tables (agent_executions, agent_tasks, agent_events, agent_logs)
 * Reuses existing table: pulse_rankings
 */

import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import type { ExecutionPlan, TaskPlan } from "@/lib/runtime/orchestrator/types";

export interface PulseExecutionConfig {
  tenantId: string;
  workspaceId: string;
  keywordIds: string[];
  competitorDomains?: string[];
  enableClustering: boolean;
  enableVolatilityDetection: boolean;
  enableCompetitorAnalysis: boolean;
}

export class PulseAgentRuntime {
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
   * Execute PULSE ranking analysis workflow
   */
  async executeRankingAnalysis(config: PulseExecutionConfig) {
    const executionPlan = this.createRankingExecutionPlan(config);
    const result = await this.orchestrator.createExecution(executionPlan);
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const startResult = await this.orchestrator.startExecution(result.data);
    return startResult;
  }

  /**
   * Create PULSE execution plan
   */
  private createRankingExecutionPlan(config: PulseExecutionConfig): ExecutionPlan {
    const tasks: TaskPlan[] = [];

    // Task 1: Fetch current rankings from DataForSEO
    tasks.push({
      taskName: "fetch_serp_rankings",
      taskType: "dataforseo_rankings_fetch",
      stepOrder: 1,
      inputPayload: {
        keywordIds: config.keywordIds,
        tenantId: config.tenantId,
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMs: 2000,
        strategy: 'exponential',
      },
    });

    // Task 2: Calculate ranking movements
    tasks.push({
      taskName: "calculate_ranking_movements",
      taskType: "ranking_movement_calculation",
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

    // Task 3: Detect volatility
    if (config.enableVolatilityDetection) {
      tasks.push({
        taskName: "detect_volatility",
        taskType: "volatility_detection",
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
    }

    // Task 4: Keyword clustering
    if (config.enableClustering) {
      tasks.push({
        taskName: "cluster_keywords",
        taskType: "keyword_clustering",
        stepOrder: 4,
        inputPayload: {
          executionId: "${execution.id}",
        },
        retryPolicy: {
          maxRetries: 2,
          backoffMs: 2000,
          strategy: 'exponential',
        },
      });
    }

    // Task 5: Competitor SERP analysis
    if (config.enableCompetitorAnalysis && config.competitorDomains) {
      tasks.push({
        taskName: "analyze_competitor_serp",
        taskType: "competitor_serp_analysis",
        stepOrder: 5,
        inputPayload: {
          executionId: "${execution.id}",
          competitorDomains: config.competitorDomains,
        },
        retryPolicy: {
          maxRetries: 3,
          backoffMs: 2000,
          strategy: 'exponential',
        },
      });
    }

    // Task 6: Detect ranking opportunities
    tasks.push({
      taskName: "detect_ranking_opportunities",
      taskType: "opportunity_detection",
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

    // Task 7: Detect cannibalization
    tasks.push({
        taskName: "detect_cannibalization",
        taskType: "cannibalization_detection",
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

    // Task 8: Generate ranking intelligence summary
    tasks.push({
      taskName: "generate_ranking_intelligence",
      taskType: "intelligence_summary",
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

    return {
      agentName: "PULSE",
      workflowType: "ranking_analysis",
      inputPayload: {
        tenantId: config.tenantId,
        workspaceId: config.workspaceId,
        keywordIds: config.keywordIds,
        competitorDomains: config.competitorDomains,
        enableClustering: config.enableClustering,
        enableVolatilityDetection: config.enableVolatilityDetection,
        enableCompetitorAnalysis: config.enableCompetitorAnalysis,
      },
      metadata: {
        initiatedBy: "tenant",
      },
      tasks,
    };
  }

  /**
   * Retry PULSE execution
   */
  async retryExecution(executionId: string) {
    return await this.orchestrator.retryExecution(executionId);
  }

  /**
   * Cancel PULSE execution
   */
  async cancelExecution(executionId: string) {
    return await this.orchestrator.cancelExecution(executionId);
  }
}
