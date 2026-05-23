import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { PulseTaskExecutorFactory } from "./pulse-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { PulseOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for ranking checks

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Run PULSE agent - Ranking Intelligence
 * CLAUX V1: Track rankings, detect movement, generate insights
 */
export async function runPULSE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePULSE(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executePULSE
  }
}

/**
 * Execute PULSE logic
 * CLAUX V1: Ranking intelligence via RuntimeService
 */
async function executePULSE(context: AgentContext, executionId: string): Promise<void> {
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
    "Initializing PULSE agent - Ranking Intelligence",
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
    agent_name: 'PULSE',
    workflow_type: 'ranking_intelligence',
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

  // Create ranking check task
  const rankingTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Ranking Check',
    task_type: 'task_ranking_check',
    step_order: 1,
    input_payload: {
      keywords: [],
      location: 'United States',
      device: 'desktop',
    },
  });

  if (!rankingTaskResult.success || !rankingTaskResult.data) {
    throw new Error(`Failed to create ranking check task`);
  }

  const rankingTaskId = rankingTaskResult.data.id;

  // Initialize PULSE task factory
  const pulseFactory = new PulseTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    rankingTaskId
  );

  const executor = pulseFactory.createExecutor('task_ranking_check');
  if (!executor) {
    throw new Error('Failed to create ranking check executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(rankingTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: rankingTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_ranking_check',
    input: {
      keywords: [],
      location: 'United States',
      device: 'desktop',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(rankingTaskId, result.output);

    // Generate Command Centre tasks for ranking insights
    const taskGenerationService = new TaskGenerationService();
    const pulseOutput = result.output as unknown as PulseOutput;

    if (pulseOutput && pulseOutput.ranking_changes) {
      const commandCenterTasks = pulseOutput.ranking_changes
        .filter(change => change.change < -5) // Significant drops only
        .map(change => ({
          task_type: 'keyword_review' as TaskType,
          title: `Investigate ranking drop for "${change.keyword}"`,
          description: `Keyword dropped from position ${change.previous_position} to ${change.current_position}`,
          priority: 'high' as TaskPriority,
          action_payload: {
            keyword: change.keyword,
            current_position: change.current_position,
            previous_position: change.previous_position,
            change: change.change,
          },
          recommended_action: 'Review content and backlinks for this keyword',
          client_visible_impact: `Ranking dropped by ${Math.abs(change.change)} positions`,
        }));

      if (commandCenterTasks.length > 0) {
        await taskGenerationService.bulkCreateTasks({
          tenant_id: tenantId as string,
          client_id: tenantId as string,
          agent_name: 'PULSE',
          source_execution_id: runtimeExecutionId,
          source_task_id: rankingTaskId,
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
    await runtimeService.task.failTask(rankingTaskId, {
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
    "PULSE execution completed successfully - Ranking intelligence generated",
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
