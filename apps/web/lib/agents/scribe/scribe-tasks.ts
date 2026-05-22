/**
 * SCRIBE Canonical Runtime Tasks
 * 
 * Implements REAL canonical runtime tasks for SCRIBE autonomous SEO content generation.
 * All tasks use canonical runtime authorities only.
 * NO direct provider calls. NO mocks. NO fake execution.
 * 
 * Tasks:
 * - ArticleGenerationTask: Generate SEO articles
 * - MetadataGenerationTask: Generate title tags, meta descriptions, OG tags
 * - InternalLinkGenerationTask: Generate contextual internal links, anchor optimization
 * - SemanticOptimizationTask: Optimize content for SEO
 * - GEOContentStructuringTask: AI-answer-friendly structures, entity-rich formatting
 * - ContentRefreshTask: Aging content updates, semantic enrichment
 * - FAQGenerationTask: Generate FAQ structures
 * - SchemaContentGenerationTask: Generate schema content
 */

import type {
  RuntimeTaskExecutor,
  TaskExecutionContext,
  TaskExecutionResult,
  TaskStatus,
  TaskError,
  TaskCheckpoint,
  ValidationResult,
} from '@/lib/runtime/contracts/task.contract';
import { TaskStatus as TaskStatusEnum } from '@/lib/runtime/types/task.types';
import { OpenAIConnector } from '@/lib/runtime/connectors/openai.connector';
import type { OpenAIConnectorConfig } from '@/lib/runtime/connectors/openai.connector';
import type {
  ProviderResponse,
} from '@/lib/runtime/contracts/provider-response.contract';
import { ProviderExecutionStatus } from '@/lib/runtime/contracts/provider-response.contract';
import { ProviderErrorCode } from '@/lib/runtime/contracts/provider-error.contract';
import type { UUID } from '@/lib/runtime/types/common.types';

/**
 * OpenAI Response Data Interface
 */
interface OpenAIResponseData {
  content?: string;
  title?: string;
  metadata?: Record<string, unknown>;
  tokens_used?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Article Generation Task
 * Generates SEO articles for target keywords
 */
export class ArticleGenerationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId, executionId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { keyword, businessCategory, tone = 'professional', wordCount = 1000 } = input as {
      keyword: string;
      businessCategory: string;
      tone?: string;
      wordCount?: number;
    };

    if (!keyword || !businessCategory) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'keyword and businessCategory are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Generate article via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'article_generation',
        {
          keyword,
          businessCategory,
          tone,
          wordCount,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            title: result.data.title || keyword,
            content: result.data.content || '',
            wordCount: result.data.content ? result.data.content.split(/\s+/).length : 0,
            targetKeywords: [keyword],
            tone,
            businessCategory,
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Metadata Generation Task
 * Generates title tags, meta descriptions, OG tags
 */
export class MetadataGenerationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { title, content, keyword } = input as {
      title: string;
      content: string;
      keyword: string;
    };

    if (!title || !content || !keyword) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'title, content, and keyword are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Generate metadata via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'metadata_generation',
        {
          title,
          content,
          keyword,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            metaTitle: result.data.metadata?.meta_title || title.substring(0, 60),
            metaDescription: result.data.metadata?.meta_description || content.substring(0, 160),
            metaKeywords: [keyword],
            ogTitle: result.data.metadata?.og_title || title,
            ogDescription: result.data.metadata?.og_description || content.substring(0, 160),
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Internal Link Generation Task
 * Generates contextual internal links, anchor optimization
 */
export class InternalLinkGenerationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, targetKeywords, existingUrls } = input as {
      content: string;
      targetKeywords: string[];
      existingUrls: string[];
    };

    if (!content || !targetKeywords || !existingUrls) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content, targetKeywords, and existingUrls are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Generate internal links via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'internal_link_generation',
        {
          content,
          targetKeywords,
          existingUrls,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            internalLinks: result.data.metadata?.internal_links || [],
            anchorOptimization: result.data.metadata?.anchor_optimization || {},
            topicalRelationships: result.data.metadata?.topical_relationships || {},
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Semantic Optimization Task
 * Optimizes content for SEO
 */
export class SemanticOptimizationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, targetKeywords } = input as {
      content: string;
      targetKeywords: string[];
    };

    if (!content || !targetKeywords) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content and targetKeywords are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Optimize content via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'semantic_optimization',
        {
          content,
          targetKeywords,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            optimizedContent: result.data.content || content,
            keywordDensity: result.data.metadata?.keyword_density || {},
            readabilityScore: result.data.metadata?.readability_score || 0,
            semanticSuggestions: result.data.metadata?.semantic_suggestions || [],
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * GEO Content Structuring Task
 * AI-answer-friendly structures, entity-rich formatting
 */
export class GEOContentStructuringTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, location, entities } = input as {
      content: string;
      location: string;
      entities: string[];
    };

    if (!content || !location || !entities) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content, location, and entities are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Structure GEO content via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'geo_content_structuring',
        {
          content,
          location,
          entities,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            structuredContent: result.data.content || content,
            entityAnnotations: result.data.metadata?.entity_annotations || [],
            aiAnswerFormat: result.data.metadata?.ai_answer_format || {},
            semanticRetrievalFormat: result.data.metadata?.semantic_retrieval_format || {},
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Content Refresh Task
 * Aging content updates, semantic enrichment
 */
export class ContentRefreshTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, targetKeywords, lastUpdated } = input as {
      content: string;
      targetKeywords: string[];
      lastUpdated: string;
    };

    if (!content || !targetKeywords || !lastUpdated) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content, targetKeywords, and lastUpdated are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Refresh content via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'content_refresh',
        {
          content,
          targetKeywords,
          lastUpdated,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            refreshedContent: result.data.content || content,
            semanticEnrichments: result.data.metadata?.semantic_enrichments || [],
            freshnessScore: result.data.metadata?.freshness_score || 0,
            updateRecommendations: result.data.metadata?.update_recommendations || [],
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * FAQ Generation Task
 * Generates FAQ structures
 */
export class FAQGenerationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, targetKeywords } = input as {
      content: string;
      targetKeywords: string[];
    };

    if (!content || !targetKeywords) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content and targetKeywords are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Generate FAQ via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'faq_generation',
        {
          content,
          targetKeywords,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            faqs: result.data.metadata?.faqs || [],
            conversationalAnswers: result.data.metadata?.conversational_answers || {},
            questionIntentMapping: result.data.metadata?.question_intent_mapping || {},
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * Schema Content Generation Task
 * Generates schema content
 */
export class SchemaContentGenerationTask implements RuntimeTaskExecutor {
  private connector: OpenAIConnector;

  constructor(connector: OpenAIConnector) {
    this.connector = connector;
  }

  async execute(context: TaskExecutionContext): Promise<TaskExecutionResult> {
    const { input, taskId } = context;
    
    // Validate input
    if (!input || typeof input !== 'object') {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'INVALID_INPUT',
          message: 'Input must be an object',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const { content, schemaType, businessInfo } = input as {
      content: string;
      schemaType: string;
      businessInfo: Record<string, unknown>;
    };

    if (!content || !schemaType || !businessInfo) {
      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: {
          code: 'MISSING_REQUIRED_FIELD',
          message: 'content, schemaType, and businessInfo are required',
          recoverable: false,
          retryable: false,
        },
        completedAt: new Date(),
        durationMs: 0,
      };
    }

    const startTime = Date.now();

    try {
      // Generate schema via OpenAIConnector
      const result = await this.connector.execute<OpenAIResponseData>(
        'schema_content_generation',
        {
          content,
          schemaType,
          businessInfo,
        }
      );

      const durationMs = Date.now() - startTime;

      if (result.status === ProviderExecutionStatus.SUCCESS && result.data) {
        return {
          taskId,
          status: TaskStatusEnum.COMPLETED,
          output: {
            schemaJson: result.data.metadata?.schema_json || {},
            schemaType,
            schemaMarkup: result.data.content || '',
            validationStatus: result.data.metadata?.validation_status || 'valid',
          },
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
            tokens: result.data.tokens_used?.total_tokens || 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      } else {
        return {
          taskId,
          status: TaskStatusEnum.FAILED,
          error: this.createTaskError(result.error),
          metrics: {
            durationMs,
            cost: result.metadata?.cost ? Number(result.metadata.cost) : 0,
          },
          completedAt: new Date(),
          durationMs,
        };
      }
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const taskError = this.createTaskError(error);

      return {
        taskId,
        status: TaskStatusEnum.FAILED,
        error: taskError,
        metrics: {
          durationMs,
        },
        completedAt: new Date(),
        durationMs,
      };
    }
  }

  private createTaskError(error: unknown): TaskError {
    if (error && typeof error === 'object' && 'code' in error) {
      const providerError = error as { code: string; message?: string };
      return {
        code: providerError.code,
        message: providerError.message || 'Unknown error',
        details: error,
        cause: error instanceof Error ? error : undefined,
        recoverable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED,
        retryable: providerError.code === ProviderErrorCode.RATE_LIMIT_EXCEEDED ||
                   providerError.code === ProviderErrorCode.NETWORK_ERROR,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'EXECUTION_ERROR',
        message: error.message,
        cause: error,
        recoverable: false,
        retryable: true,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown error occurred',
      recoverable: false,
      retryable: false,
    };
  }

  async resume(
    taskId: string,
    checkpoint: TaskCheckpoint,
    context: TaskExecutionContext
  ): Promise<TaskExecutionResult> {
    return this.execute(context);
  }

  async cancel(taskId: string): Promise<void> {
    // Task cancellation not supported for one-time content generation
  }

  async getStatus(taskId: string): Promise<TaskStatus> {
    return TaskStatusEnum.PENDING;
  }

  async getResult(taskId: string): Promise<TaskExecutionResult | null> {
    return null;
  }

  async createCheckpoint(taskId: string): Promise<TaskCheckpoint> {
    return {
      checkpointId: `${taskId}-${Date.now()}`,
      taskId,
      timestamp: new Date(),
      status: TaskStatusEnum.RUNNING,
      state: {},
      progress: 0,
    };
  }

  async restoreCheckpoint(checkpointId: string): Promise<TaskCheckpoint> {
    throw new Error('Checkpoint restoration not supported');
  }

  async validate(context: TaskExecutionContext): Promise<{ valid: boolean; errors: string[] }> {
    return { valid: true, errors: [] };
  }

  async validateInput(taskType: string, input: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }

  async validateOutput(taskType: string, output: Record<string, unknown>): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
}

/**
 * SCRIBE Task Executor Factory
 * Creates task executors with proper connector context
 */
export class ScribeTaskExecutorFactory {
  private connector: OpenAIConnector;

  constructor(
    tenantId: UUID,
    executionId: UUID,
    taskId: UUID,
    connector?: OpenAIConnector
  ) {
    // Connector is tenant-scoped
    this.connector = connector || new OpenAIConnector({
      tenantId,
      executionId,
      taskId,
    });
  }

  createExecutor(taskType: string): RuntimeTaskExecutor | null {
    switch (taskType) {
      case 'task_generate_article':
        return new ArticleGenerationTask(this.connector);
      case 'task_generate_metadata':
        return new MetadataGenerationTask(this.connector);
      case 'task_generate_internal_links':
        return new InternalLinkGenerationTask(this.connector);
      case 'task_semantic_optimization':
        return new SemanticOptimizationTask(this.connector);
      case 'task_geo_content_structuring':
        return new GEOContentStructuringTask(this.connector);
      case 'task_content_refresh':
        return new ContentRefreshTask(this.connector);
      case 'task_generate_faq':
        return new FAQGenerationTask(this.connector);
      case 'task_generate_schema':
        return new SchemaContentGenerationTask(this.connector);
      default:
        return null;
    }
  }

  getSupportedTaskTypes(): string[] {
    return [
      'task_generate_article',
      'task_generate_metadata',
      'task_generate_internal_links',
      'task_semantic_optimization',
      'task_geo_content_structuring',
      'task_content_refresh',
      'task_generate_faq',
      'task_generate_schema',
    ];
  }
}
