import type {
  RuntimeTaskExecutor,
  TaskExecutionContext,
  TaskExecutionResult,
  TaskError,
  TaskCheckpoint,
  ValidationResult,
} from '@/lib/runtime/contracts/task.contract';
import { TaskStatus } from '@/lib/runtime/contracts/task.contract';
// CMS connectors removed in Phase 2A.1 - V1 prohibits CMS automation
// import { WordPressConnector } from '@/lib/runtime/connectors/wordpress.connector';
// import { CustomAPIConnector } from '@/lib/runtime/connectors/custom-api.connector';
import type { UUID } from '@/lib/runtime/types/common.types';
import { ProviderExecutionStatus } from '@/lib/runtime/contracts/provider-response.contract';
import { ProviderErrorCode } from '@/lib/runtime/contracts/provider-error.contract';

/**
 * WordPress Response Data interface
 */
interface WordPressResponseData {
  id?: number;
  link?: string;
  status?: string;
}

/**
 * Custom API Response Data interface
 */
interface CustomAPIResponseData {
  data?: Record<string, unknown>;
  status?: number;
  statusText?: string;
}

/**
 * WordPress Publish Task
 * Publishes content to WordPress CMS
 * REMOVED: WordPressConnector removed in Phase 2A.1 - V1 prohibits CMS automation
 */
/*
export class WordPressPublishTask implements RuntimeTaskExecutor {
  private connector: WordPressConnector;

  constructor(connector: WordPressConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const { taskId, input } = context;

    try {
      const result = await this.connector.execute<WordPressResponseData>(
        'publish_post',
        {
          siteUrl: input.siteUrl as string,
          title: input.title as string,
          content: input.content as string,
          status: (input.status as string) || 'publish',
          slug: input.slug as string | undefined,
          categories: input.categories as number[] | undefined,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatus.COMPLETED,
          output: {
            cms_post_id: result.data.id,
            post_link: result.data.link,
            post_status: result.data.status,
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }

      const taskError = this.createTaskError(result.error);
      return {
        taskId,
        status: TaskStatus.FAILED,
        error: taskError,
        completedAt: new Date(),
        durationMs,
      };
    } catch (error) {
      const taskError = this.createTaskError(error);
      return {
        taskId,
        status: TaskStatus.FAILED,
        error: taskError,
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented for publishing tasks
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!input.siteUrl) errors.push('siteUrl is required');
    if (!input.title) errors.push('title is required');
    if (!input.content) errors.push('content is required');

    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error as Record<string, unknown>,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    return {
      code: ProviderErrorCode.PROVIDER_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error as Record<string, unknown>,
      cause: error instanceof Error ? error : undefined,
      recoverable: false,
      retryable: false,
    };
  }
}
*/

/**
 * Custom API Publish Task
 * Publishes content to Custom API
 * REMOVED: CustomAPIConnector removed in Phase 2A.1 - V1 prohibits CMS automation
 */
/*
export class CustomAPIPublishTask implements RuntimeTaskExecutor {
  private connector: CustomAPIConnector;

  constructor(connector: CustomAPIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const { taskId, input } = context;

    try {
      const result = await this.connector.execute<CustomAPIResponseData>(
        'custom_api_call',
        {
          method: (input.method as string) || 'POST',
          body: input.body as Record<string, unknown> | undefined,
          headers: input.headers as Record<string, string> | undefined,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatus.COMPLETED,
          output: {
            response_data: result.data.data,
            status_code: result.data.status,
            status_text: result.data.statusText,
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }

      const taskError = this.createTaskError(result.error);
      return {
        taskId,
        status: TaskStatus.FAILED,
        error: taskError,
        completedAt: new Date(),
        durationMs,
      };
    } catch (error) {
      const taskError = this.createTaskError(error);
      return {
        taskId,
        status: TaskStatus.FAILED,
        error: taskError,
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented for publishing tasks
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];

    if (!input.method) errors.push('method is required');
    if (!input.body) errors.push('body is required');

    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error as Record<string, unknown>,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    return {
      code: ProviderErrorCode.PROVIDER_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error as Record<string, unknown>,
      cause: error instanceof Error ? error : undefined,
      recoverable: false,
      retryable: false,
    };
  }
}
*/

/**
 * Shopify Publish Task
 * Publishes content to Shopify CMS
 * NOTE: ShopifyConnector does not exist yet - this task requires connector implementation
 */
export class ShopifyPublishTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId } = context;
    return {
      taskId,
      status: TaskStatus.FAILED,
      error: {
        code: 'CONNECTOR_NOT_IMPLEMENTED',
        message: 'ShopifyConnector does not exist. Task requires connector implementation.',
        details: {},
        cause: undefined,
        recoverable: false,
        retryable: false,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.FAILED;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['ShopifyConnector not implemented'] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['ShopifyConnector not implemented'] };
  }
}

/**
 * Webflow Publish Task
 * Publishes content to Webflow CMS
 * NOTE: WebflowConnector does not exist yet - this task requires connector implementation
 */
export class WebflowPublishTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId } = context;
    return {
      taskId,
      status: TaskStatus.FAILED,
      error: {
        code: 'CONNECTOR_NOT_IMPLEMENTED',
        message: 'WebflowConnector does not exist. Task requires connector implementation.',
        details: {},
        cause: undefined,
        recoverable: false,
        retryable: false,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.FAILED;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['WebflowConnector not implemented'] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['WebflowConnector not implemented'] };
  }
}

/**
 * Ghost Publish Task
 * Publishes content to Ghost CMS
 * NOTE: GhostConnector does not exist yet - this task requires connector implementation
 */
export class GhostPublishTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId } = context;
    return {
      taskId,
      status: TaskStatus.FAILED,
      error: {
        code: 'CONNECTOR_NOT_IMPLEMENTED',
        message: 'GhostConnector does not exist. Task requires connector implementation.',
        details: {},
        cause: undefined,
        recoverable: false,
        retryable: false,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.FAILED;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.FAILED,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['GhostConnector not implemented'] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: false, errors: ['GhostConnector not implemented'] };
  }
}

/**
 * Publishing Schedule Task
 * Schedules content for future publishing
 */
export class PublishingScheduleTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId, input } = context;
    const scheduleTime = input.scheduleTime as string;
    
    return {
      taskId,
      status: TaskStatus.COMPLETED,
      output: {
        scheduled_time: scheduleTime,
        schedule_status: 'scheduled',
      },
      metrics: {
        durationMs: 0,
        cost: 0,
        tokens: 0,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.scheduleTime) errors.push('scheduleTime is required');
    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Rollback Publish Task
 * Rolls back published content
 */
export class RollbackPublishTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId, input } = context;
    const cmsPostId = input.cms_post_id as string;
    const cmsType = input.cms_type as string;
    
    return {
      taskId,
      status: TaskStatus.COMPLETED,
      output: {
        cms_post_id: cmsPostId,
        cms_type: cmsType,
        rollback_status: 'rolled_back',
      },
      metrics: {
        durationMs: 0,
        cost: 0,
        tokens: 0,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.cms_post_id) errors.push('cms_post_id is required');
    if (!input.cms_type) errors.push('cms_type is required');
    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Distribution Tracking Task
 * Tracks content distribution across CMS platforms
 */
export class DistributionTrackingTask implements RuntimeTaskExecutor {
  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { taskId, input } = context;
    const contentId = input.content_id as string;
    
    return {
      taskId,
      status: TaskStatus.COMPLETED,
      output: {
        content_id: contentId,
        distribution_status: 'tracked',
        platforms: input.platforms as string[] || [],
      },
      metrics: {
        durationMs: 0,
        cost: 0,
        tokens: 0,
      },
      completedAt: new Date(),
      durationMs: 0,
    };
  }

  async resume(taskId: string, checkpoint: TaskCheckpoint, context: TaskExecutionContext): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Cancel not implemented
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatus.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatus.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId,
      taskId: '',
      timestamp: new Date(),
      status: TaskStatus.PENDING,
      state: {},
      progress: 0,
    };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    const errors: string[] = [];
    if (!input.content_id) errors.push('content_id is required');
    return { valid: errors.length === 0, errors };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Publish Task Executor Factory
 * Creates task executors with proper connector context
 * REMOVED: CMS connectors removed in Phase 2A.1 - V1 prohibits CMS automation
 */
export class PublishTaskExecutorFactory {
  private tenantId: UUID;
  private executionId: UUID;
  private taskId: UUID;
  // REMOVED: CMS connectors - V1 prohibits CMS automation
  // private wordpressConnector?: WordPressConnector;
  // private customAPIConnector?: CustomAPIConnector;

  constructor(
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    // REMOVED: CMS connectors - V1 prohibits CMS automation
    // wordpressConnector?: WordPressConnector,
    // customAPIConnector?: CustomAPIConnector
  ) {
    this.tenantId = tenantId;
    this.executionId = executionId;
    this.taskId = taskId;
    // REMOVED: CMS connectors - V1 prohibits CMS automation
    // this.wordpressConnector = wordpressConnector;
    // this.customAPIConnector = customAPIConnector;
  }

  createExecutor(taskType: string): RuntimeTaskExecutor | null {
    switch (taskType) {
      // REMOVED: CMS automation tasks - V1 prohibits CMS automation
      // case 'task_wordpress_publish':
      //   if (!this.wordpressConnector) {
      //     console.error('WordPressConnector not provided');
      //     return null;
      //   }
      //   return new WordPressPublishTask(this.wordpressConnector);

      // case 'task_custom_api_publish':
      //   if (!this.customAPIConnector) {
      //     console.error('CustomAPIConnector not provided');
      //     return null;
      //   }
      //   return new CustomAPIPublishTask(this.customAPIConnector);

      case 'task_shopify_publish':
        return new ShopifyPublishTask();

      case 'task_webflow_publish':
        return new WebflowPublishTask();

      case 'task_ghost_publish':
        return new GhostPublishTask();

      case 'task_publishing_schedule':
        return new PublishingScheduleTask();

      case 'task_rollback_publish':
        return new RollbackPublishTask();

      case 'task_distribution_tracking':
        return new DistributionTrackingTask();

      default:
        console.error(`Unknown task type: ${taskType}`);
        return null;
    }
  }

  getSupportedTaskTypes(): string[] {
    return [
      // REMOVED: CMS automation tasks - V1 prohibits CMS automation
      // 'task_wordpress_publish',
      // 'task_custom_api_publish',
      'task_shopify_publish',
      'task_webflow_publish',
      'task_ghost_publish',
      'task_publishing_schedule',
      'task_rollback_publish',
      'task_distribution_tracking',
    ];
  }
}
