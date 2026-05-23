import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { PrismTaskExecutorFactory } from "./prism-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { PrismOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for analytics review

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Run PRISM agent - Analytics Intelligence
 * CLAUX V1: GA4 interpretation, Search Console analysis, traffic trend analysis
 */
export async function runPRISM(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePRISM(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executePRISM
  }
}

/**
 * Execute PRISM logic
 * CLAUX V1: Analytics intelligence via RuntimeService
 */
async function executePRISM(context: AgentContext, executionId: string): Promise<void> {
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
    "Initializing PRISM agent - Analytics Intelligence",
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
    agent_name: 'PRISM',
    workflow_type: 'analytics_intelligence',
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

  // Create analytics review task
  const analyticsReviewTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Analytics Review',
    task_type: 'task_analytics_review',
    step_order: 1,
    input_payload: {
      property_id: '',
      date_range: '30d',
    },
  });

  if (!analyticsReviewTaskResult.success || !analyticsReviewTaskResult.data) {
    throw new Error(`Failed to create analytics review task`);
  }

  const analyticsReviewTaskId = analyticsReviewTaskResult.data.id;

  // Initialize PRISM task factory
  const prismFactory = new PrismTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    analyticsReviewTaskId
  );

  const executor = prismFactory.createExecutor('task_analytics_review');
  if (!executor) {
    throw new Error('Failed to create analytics review executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(analyticsReviewTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: analyticsReviewTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_analytics_review',
    input: {
      property_id: '',
      date_range: '30d',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(analyticsReviewTaskId, result.output);

    // Generate Command Centre tasks for analytics insights
    const taskGenerationService = new TaskGenerationService();
    const prismOutput = result.output as unknown as PrismOutput;

    if (prismOutput && prismOutput.traffic_anomalies) {
      const commandCenterTasks = prismOutput.traffic_anomalies
        .filter((anomaly: any) => anomaly.severity === 'high')
        .map((anomaly: any) => ({
          task_type: 'content_audit' as TaskType,
          title: `Investigate traffic ${anomaly.type} for ${anomaly.page}`,
          description: anomaly.description,
          priority: 'high' as TaskPriority,
          action_payload: {
            page: anomaly.page,
            anomaly_type: anomaly.type,
            change_percentage: anomaly.change_percentage,
          },
          recommended_action: 'Review page performance and content',
          client_visible_impact: `Traffic ${anomaly.type} by ${anomaly.change_percentage}%`,
        }));

      if (commandCenterTasks.length > 0) {
        await taskGenerationService.bulkCreateTasks({
          tenant_id: tenantId as string,
          client_id: tenantId as string,
          agent_name: 'PRISM',
          source_execution_id: runtimeExecutionId,
          source_task_id: analyticsReviewTaskId,
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
    await runtimeService.task.failTask(analyticsReviewTaskId, {
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
    "PRISM execution completed successfully - Analytics intelligence generated",
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
