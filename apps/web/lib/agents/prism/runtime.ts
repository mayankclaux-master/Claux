/**
 * PRISM Agent Runtime Integration
 * 
 * *** DEPRECATED - DO NOT USE ***
 * This file contains the PrismAgentRuntime wrapper which has been deprecated
 * in favor of direct ExecutionOrchestrator usage (see canonical execution path)
 * All new PRISM execution should use ExecutionOrchestrator directly via API routes
 * This file is preserved for rollback capability only
 * *** DEPRECATED - DO NOT USE ***
 * 
 * PRISM responsibilities (CORRECTED):
 * - analytics aggregation
 * - SEO KPI analysis
 * - attribution
 * - campaign reporting
 * - dashboard summaries
 * - executive summaries
 * - performance analytics
 * - trend analysis
 * 
 * Media generation REMOVED - PRISM is now Analytics + Reporting agent only
 * 
 * Executes ONLY through canonical runtime (RuntimeService, ExecutionOrchestrator, Runtime Kernel)
 * Persists ONLY through canonical tables (agent_executions, agent_tasks, agent_events, agent_logs)
 */

import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ExecutionOrchestrator } from "@/lib/runtime/orchestrator/execution-orchestrator";
import type { ExecutionPlan, TaskPlan } from "@/lib/runtime/orchestrator/types";

export interface PrismExecutionConfig {
  tenantId: string;
  workspaceId: string;
  reportType: 'kpi_analysis' | 'campaign_report' | 'executive_summary' | 'performance_analytics';
  dateRange?: { start: string; end: string };
}

export class PrismAgentRuntime {
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
   * Execute PRISM analytics workflow
   */
  async executeAnalytics(config: PrismExecutionConfig) {
    const executionPlan = this.createAnalyticsExecutionPlan(config);
    const result = await this.orchestrator.createExecution(executionPlan);
    
    if (!result.success || !result.data) {
      return result;
    }
    
    const startResult = await this.orchestrator.startExecution(result.data);
    return startResult;
  }

  /**
   * Create PRISM execution plan
   */
  private createAnalyticsExecutionPlan(config: PrismExecutionConfig): ExecutionPlan {
    const tasks: TaskPlan[] = [];

    // Task 1: Aggregate analytics data
    tasks.push({
      taskName: "aggregate_analytics",
      taskType: "analytics_aggregation",
      stepOrder: 1,
      inputPayload: {
        tenantId: config.tenantId,
        dateRange: config.dateRange,
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMs: 1000,
        strategy: 'exponential',
      },
    });

    // Task 2: Analyze SEO KPIs
    tasks.push({
      taskName: "analyze_seo_kpis",
      taskType: "kpi_analysis",
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

    // Task 3: Perform attribution analysis
    tasks.push({
      taskName: "perform_attribution",
      taskType: "attribution_analysis",
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

    // Task 4: Generate campaign report
    if (config.reportType === 'campaign_report') {
      tasks.push({
        taskName: "generate_campaign_report",
        taskType: "campaign_reporting",
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

    // Task 5: Generate dashboard summary
    tasks.push({
      taskName: "generate_dashboard_summary",
      taskType: "dashboard_summarization",
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

    // Task 6: Generate executive summary
    if (config.reportType === 'executive_summary') {
      tasks.push({
        taskName: "generate_executive_summary",
        taskType: "executive_summarization",
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
    }

    // Task 7: Analyze performance trends
    tasks.push({
      taskName: "analyze_performance_trends",
      taskType: "performance_analytics",
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

    // Task 8: Generate analytics intelligence
    tasks.push({
      taskName: "generate_analytics_intelligence",
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
      agentName: "PRISM",
      workflowType: "analytics_reporting",
      inputPayload: {
        tenantId: config.tenantId,
        workspaceId: config.workspaceId,
        reportType: config.reportType,
        dateRange: config.dateRange,
      },
      metadata: {
        initiatedBy: "tenant",
      },
      tasks,
    };
  }

  /**
   * Retry PRISM execution
   */
  async retryExecution(executionId: string) {
    return await this.orchestrator.retryExecution(executionId);
  }

  /**
   * Cancel PRISM execution
   */
  async cancelExecution(executionId: string) {
    return await this.orchestrator.cancelExecution(executionId);
  }
}
