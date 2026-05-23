import type { AgentContext } from "../base/agent.types";
import { RuntimeService } from "@/lib/runtime/services/runtime.service";
import { PublishTaskExecutorFactory } from "./publish-tasks";
import type { UUID } from "@/lib/runtime/types/common.types";
import { ExecutionStatus, ExecutionSource } from "@/lib/runtime/types/execution.types";
import { TaskStatus } from "@/lib/runtime/types/task.types";
import { TaskGenerationService } from "@/lib/command-center/task-generation.service";
import type { TaskType, TaskPriority } from "@/lib/command-center/types";
import type { PublishOutput } from "../shared/agent-output.types";

const EXECUTION_TIMEOUT_MS = 60000; // 60 seconds for publishing package generation

/**
 * Generate execution correlation ID
 */
function generateExecutionId(runId: string): string {
  return `${runId}:${Date.now()}`;
}

/**
 * Generate URL-friendly slug from title
 */
function generateSlug(title: string): string {
  let slug = title.toLowerCase();
  slug = slug.replace(/\s+/g, '-');
  slug = slug.replace(/[^a-z0-9-]/g, '');
  slug = slug.replace(/-+/g, '-');
  slug = slug.replace(/^-|-$/g, '');
  return slug;
}

/**
 * Run PUBLISH agent - Publishing Package Generation
 * CLAUX V1: PUBLISH DOES NOT PUBLISH. Only generates publishing packages.
 */
export async function runPUBLISH(context: AgentContext): Promise<void> {
  const { tenantId, agent, runId } = context;
  const executionId = generateExecutionId(runId);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Execution timeout exceeded")), EXECUTION_TIMEOUT_MS);
  });

  try {
    await Promise.race([
      executePUBLISH(context, executionId),
      timeoutPromise
    ]);
  } catch (error) {
    // Error logging handled in executePUBLISH
  }
}

/**
 * Execute PUBLISH logic
 * CLAUX V1: Generate publishing packages only, NO CMS automation
 */
async function executePUBLISH(context: AgentContext, executionId: string): Promise<void> {
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
    "Initializing PUBLISH agent - Publishing Package Generation",
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
    agent_name: 'PUBLISH',
    workflow_type: 'publishing_package_generation',
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

  // Create publishing package generation task
  const packageTaskResult = await runtimeService.task.createTask({
    execution_id: runtimeExecutionId,
    task_name: 'Publishing Package Generation',
    task_type: 'task_generate_publishing_package',
    step_order: 1,
    input_payload: {
      contentId: 'placeholder-content-id',
      contentType: 'article',
    },
  });

  if (!packageTaskResult.success || !packageTaskResult.data) {
    throw new Error(`Failed to create publishing package task`);
  }

  const packageTaskId = packageTaskResult.data.id;

  // Initialize PUBLISH task factory
  const publishFactory = new PublishTaskExecutorFactory(
    tenantId as UUID,
    runtimeExecutionId,
    packageTaskId
  );

  const executor = publishFactory.createExecutor('task_generate_publishing_package');
  if (!executor) {
    throw new Error('Failed to create publishing package executor');
  }

  // Start task via RuntimeService
  await runtimeService.task.startTask(packageTaskId);

  // Execute task
  const result = await executor.execute({
    taskId: packageTaskId,
    executionId: runtimeExecutionId,
    taskType: 'task_generate_publishing_package',
    input: {
      contentId: 'placeholder-content-id',
      contentType: 'article',
    },
    retryCount: 0,
  });

  // Complete or fail task based on result
  if (result.status === TaskStatus.COMPLETED) {
    await runtimeService.task.completeTask(packageTaskId, result.output);

    // Generate Command Centre tasks for publishing workflow
    const taskGenerationService = new TaskGenerationService();
    const publishPackage = result.output as unknown as PublishOutput;

    if (publishPackage && publishPackage.publishing_package) {
      const pkg = publishPackage.publishing_package;
      const commandCenterTasks = [
        {
          task_type: 'publishing_package' as TaskType,
          title: `Upload article: ${pkg.title}`,
          description: `Upload the article "${pkg.title}" to CMS with slug: ${pkg.slug}`,
          priority: 'high' as TaskPriority,
          action_payload: {
            slug: pkg.slug,
            title: pkg.title,
            meta_title: pkg.meta_title,
          },
          recommended_action: 'Upload article to CMS and add featured image',
          client_visible_impact: 'Article ready for publishing',
        },
        {
          task_type: 'internal_linking' as TaskType,
          title: 'Add internal links',
          description: `Add ${pkg.internal_links.length} internal links to the article`,
          priority: 'medium' as TaskPriority,
          action_payload: {
            internal_links: pkg.internal_links,
          },
          recommended_action: 'Add internal links to improve SEO',
          client_visible_impact: 'Improved internal linking structure',
        },
        {
          task_type: 'schema_implementation' as TaskType,
          title: 'Implement schema markup',
          description: `Add ${pkg.schema_json['@type'] || 'Article'} schema markup to the article`,
          priority: 'medium' as TaskPriority,
          action_payload: {
            schema_type: pkg.schema_json['@type'] || 'Article',
            schema_json: pkg.schema_json,
          },
          recommended_action: 'Add schema markup for rich snippets',
          client_visible_impact: 'Improved search result appearance',
        },
      ];

      await taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId as string,
        client_id: tenantId as string,
        agent_name: 'PUBLISH',
        source_execution_id: runtimeExecutionId,
        source_task_id: packageTaskId,
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
  } else {
    await runtimeService.task.failTask(packageTaskId, {
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
    "PUBLISH execution completed successfully - Publishing package generated",
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
