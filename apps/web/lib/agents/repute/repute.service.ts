import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { ReputeTaskExecutorFactory } from "./repute-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { ReputeOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for review monitoring

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Run REPUTE agent - Review Intelligence
 * CLAUX V1: Review monitoring, sentiment analysis, reply recommendations
 */
export async function runREPUTE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeREPUTE(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executeREPUTE
  }
}

/**
 * Execute REPUTE logic
 * CLAUX V1: Review intelligence via RuntimeService
 */
async function executeREPUTE(context: AgentContext, executionId: string): Promise<void> {
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
    "Initializing REPUTE agent - Review Intelligence",
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
    agent_name: 'REPUTE',
    workflow_type: 'review_intelligence',
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

  // Create review monitoring task
  const reviewMonitorTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Review Monitoring',
    task_type: 'task_review_monitor',
    step_order: 1,
    input_payload: {
      platform: 'google',
      business_name: '',
    },
  });

  if (!reviewMonitorTaskResult.success || !reviewMonitorTaskResult.data) {
    throw new Error(`Failed to create review monitoring task`);
  }

  const reviewMonitorTaskId = reviewMonitorTaskResult.data.id;

  // Initialize REPUTE task factory
  const reputeFactory = new ReputeTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    reviewMonitorTaskId
  );

  const executor = reputeFactory.createExecutor('task_review_monitor');
  if (!executor) {
    throw new Error('Failed to create review monitoring executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(reviewMonitorTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: reviewMonitorTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_review_monitor',
    input: {
      platform: 'google',
      business_name: '',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(reviewMonitorTaskId, result.output);

    // Generate Command Centre tasks for review insights
    const taskGenerationService = new TaskGenerationService();
    const reputeOutput = result.output as unknown as ReputeOutput;

    if (reputeOutput && reputeOutput.new_reviews) {
      const commandCenterTasks = reputeOutput.new_reviews
        .filter((review: any) => review.sentiment === 'negative' || review.rating <= 3)
        .map((review: any) => ({
          task_type: 'review_reply' as TaskType,
          title: `Reply to ${review.rating}-star review from ${review.author}`,
          description: review.text,
          priority: review.rating <= 2 ? 'high' as TaskPriority : 'medium' as TaskPriority,
          action_payload: {
            review_id: review.id,
            author: review.author,
            rating: review.rating,
            text: review.text,
            suggested_reply: review.suggested_reply,
          },
          recommended_action: 'Respond to review using suggested reply',
          client_visible_impact: `Addressing ${review.rating}-star review improves reputation`,
        }));

      if (commandCenterTasks.length > 0) {
        await taskGenerationService.bulkCreateTasks({
          tenant_id: tenantId as string,
          client_id: tenantId as string,
          agent_name: 'REPUTE',
          source_execution_id: runtimeExecutionId,
          source_task_id: reviewMonitorTaskId,
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
    await runtimeService.task.failTask(reviewMonitorTaskId, {
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
    "REPUTE execution completed successfully - Review intelligence generated",
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
