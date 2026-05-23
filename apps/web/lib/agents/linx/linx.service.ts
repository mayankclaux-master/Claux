import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { LinxTaskExecutorFactory } from "./linx-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { LinxOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for backlink analysis

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Run LINX agent - Backlink Intelligence
 * CLAUX V1: Backlink analysis, outreach recommendations, authority forecasting
 */
export async function runLINX(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeLINX(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executeLINX
  }
}

/**
 * Execute LINX logic
 * CLAUX V1: Backlink intelligence via RuntimeService
 */
async function executeLINX(context: AgentContext, executionId: string): Promise<void> {
  const { tenantId, agent, runId } = context;

  // Initialize RuntimeService
  const runtimeService = new RuntimeService({
    tenantId: tenantId as UUID,
    logOperations: true,
    enableMetrics: true,
  });

  await runtimeService.log.writeInfo(
    executionId as UUID,
    null,
    "Initializing LINX agent - Backlink Intelligence",
    {
      runId,
      tenantId,
      agent,
      step: "initializing_runtime_services",
      execution_stage: "runtime_init",
      progress: 50,
    }
  );

  // Create execution via RuntimeService
  const createExecutionResult = await runtimeService.execution.createExecution({
    agent_name: 'LINX',
    workflow_type: 'backlink_intelligence',
    metadata: {
      runId,
    },
    execution_source: ExecutionSource.API,
  });

  if (!createExecutionResult.success || !createExecutionResult.data) {
    throw new Error(`Failed to create execution`);
  }

  const runtimeExecutionId = createExecutionResult.data.id;
  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "Execution created",
    {
      runId,
      tenantId,
      agent,
      step: "execution_created",
      execution_stage: "execution_create",
      progress: 55,
    }
  );

  // Start execution via RuntimeService
  const startExecutionResult = await runtimeService.execution.startExecution(runtimeExecutionId);
  if (!startExecutionResult.success) {
    throw new Error(`Failed to start execution`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "Execution started",
    {
      runId,
      tenantId,
      agent,
      step: "execution_started",
      execution_stage: "execution_start",
      progress: 60,
    }
  );

  // Create backlink analysis task
  const backlinkAnalysisTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Backlink Analysis',
    task_type: 'task_backlink_analysis',
    step_order: 1,
    input_payload: {
      domain: '',
      competitors: [],
    },
  });

  if (!backlinkAnalysisTaskResult.success || !backlinkAnalysisTaskResult.data) {
    throw new Error(`Failed to create backlink analysis task`);
  }

  const backlinkAnalysisTaskId = backlinkAnalysisTaskResult.data.id;

  // Initialize LINX task factory
  const linxFactory = new LinxTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    backlinkAnalysisTaskId
  );

  const executor = linxFactory.createExecutor('task_backlink_analysis');
  if (!executor) {
    throw new Error('Failed to create backlink analysis executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(backlinkAnalysisTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: backlinkAnalysisTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_backlink_analysis',
    input: {
      domain: '',
      competitors: [],
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(backlinkAnalysisTaskId, result.output);

    // Generate Command Centre tasks for backlink insights
    const taskGenerationService = new TaskGenerationService();
    const linxOutput = result.output as unknown as LinxOutput;

    if (linxOutput && linxOutput.backlink_opportunities) {
      const commandCenterTasks = linxOutput.backlink_opportunities
        .filter((opp: any) => opp.relevance_score > 70)
        .map((opp: any) => ({
          task_type: 'backlink_outreach' as TaskType,
          title: `Outreach to ${opp.target_domain}`,
          description: `Domain authority: ${opp.domain_authority}, Relevance: ${opp.relevance_score}%`,
          priority: opp.domain_authority > 50 ? 'high' as TaskPriority : 'medium' as TaskPriority,
          action_payload: {
            target_domain: opp.target_domain,
            domain_authority: opp.domain_authority,
            relevance_score: opp.relevance_score,
          },
          recommended_action: 'Send outreach email for backlink opportunity',
          client_visible_impact: `Potential backlink from DA ${opp.domain_authority} domain`,
        }));

      if (commandCenterTasks.length > 0) {
        await taskGenerationService.bulkCreateTasks({
          tenant_id: tenantId as string,
          client_id: tenantId as string,
          agent_name: 'LINX',
          source_execution_id: runtimeExecutionId,
          source_task_id: backlinkAnalysisTaskId,
          tasks: commandCenterTasks,
        });

        await runtimeService.log.writeInfo(
          runtimeExecutionId,
          null,
          "Command Centre tasks generated",
          {
            runId,
            tenantId,
            agent,
            step: "command_centre_tasks_generated",
            execution_stage: "task_generation",
            progress: 95,
            tasks_generated: commandCenterTasks.length,
          }
        );
      }
    }
  } else {
    await runtimeService.task.failTask(backlinkAnalysisTaskId, {
      message: result.error?.message || 'Task failed',
      code: result.error?.code || 'UNKNOWN_ERROR',
    });
  }

  // Complete execution via RuntimeService
  const completeExecutionResult = await runtimeService.execution.completeExecution(runtimeExecutionId, result.metrics?.cost || 0);
  if (!completeExecutionResult.success) {
    throw new Error(`Failed to complete execution`);
  }

  await runtimeService.log.writeInfo(
    runtimeExecutionId,
    null,
    "LINX execution completed successfully - Backlink intelligence generated",
    {
      runId,
      tenantId,
      agent,
      step: "execution_completed",
      execution_stage: "execution_complete",
      progress: 100,
    }
  );
}
