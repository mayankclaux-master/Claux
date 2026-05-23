import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { CoreTaskExecutorFactory } from "./core-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { CoreOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 120000; // 2 minutes for technical audit

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Run CORE agent - Technical SEO Intelligence
 * CLAUX V1: Technical audit, CWV recommendations, schema validation
 */
export async function runCORE(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executeCORE(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executeCORE
  }
}

/**
 * Execute CORE logic
 * CLAUX V1: Technical SEO intelligence via RuntimeService
 */
async function executeCORE(context: AgentContext, executionId: string): Promise<void> {
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
    "Initializing CORE agent - Technical SEO Intelligence",
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
    agent_name: 'CORE',
    workflow_type: 'technical_seo_intelligence',
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

  // Create technical audit task
  const technicalAuditTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Technical Audit',
    task_type: 'task_technical_audit',
    step_order: 1,
    input_payload: {
      domain: '',
      crawl_depth: 'medium',
    },
  });

  if (!technicalAuditTaskResult.success || !technicalAuditTaskResult.data) {
    throw new Error(`Failed to create technical audit task`);
  }

  const technicalAuditTaskId = technicalAuditTaskResult.data.id;

  // Initialize CORE task factory
  const coreFactory = new CoreTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    technicalAuditTaskId
  );

  const executor = coreFactory.createExecutor('task_technical_audit');
  if (!executor) {
    throw new Error('Failed to create technical audit executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(technicalAuditTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: technicalAuditTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_technical_audit',
    input: {
      domain: '',
      crawl_depth: 'medium',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(technicalAuditTaskId, result.output);

    // Generate Command Centre tasks for technical SEO insights
    const taskGenerationService = new TaskGenerationService();
    const coreOutput = result.output as unknown as CoreOutput;

    if (coreOutput && coreOutput.schema_issues) {
      const commandCenterTasks = coreOutput.schema_issues
        .filter((issue: any) => issue.severity === 'critical')
        .map((issue: any) => ({
          task_type: 'schema_fix' as TaskType,
          title: `Fix schema issue on ${issue.url}`,
          description: issue.issue_type,
          priority: 'high' as TaskPriority,
          action_payload: {
            url: issue.url,
            issue_type: issue.issue_type,
            recommended_fix: issue.recommended_fix,
          },
          recommended_action: 'Implement schema fix as recommended',
          client_visible_impact: 'Critical schema issue affecting rich snippets',
        }));

      if (commandCenterTasks.length > 0) {
        await taskGenerationService.bulkCreateTasks({
          tenant_id: tenantId as string,
          client_id: tenantId as string,
          agent_name: 'CORE',
          source_execution_id: runtimeExecutionId,
          source_task_id: technicalAuditTaskId,
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
    await runtimeService.task.failTask(technicalAuditTaskId, {
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
    "CORE execution completed successfully - Technical SEO intelligence generated",
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
