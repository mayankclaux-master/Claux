/**
 * Command Centre Bootstrap Service
 * 
 * Canonical command centre bootstrap service for CLAUX V1 onboarding.
 * Generates first actionable tasks: schema recommendations, indexing tasks, content opportunities, backlink opportunities, GMB optimizations, technical fixes, review reply tasks.
 * All linked to execution_id + traceId.
 * 
 * CRITICAL: This is the ONLY command centre bootstrap service in CLAUX.
 */

import type { UUID } from '../runtime/types/common.types';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { createLogger, Logger } from '@/lib/utils/logger';
import { TaskGenerationService } from '../command-center/task-generation.service';
import type { TaskType, TaskPriority } from '../command-center/types';

/**
 * Command centre bootstrap result
 */
export interface CommandCentreBootstrapResult {
  success: boolean;
  tasksGenerated: number;
  taskTypes: Record<string, number>;
  errors: string[];
}

/**
 * Command centre bootstrap service
 */
export class CommandCentreBootstrapService {
  private logger: Logger;
  private taskGenerationService: TaskGenerationService;

  constructor() {
    this.logger = createLogger();
    this.taskGenerationService = new TaskGenerationService();
  }

  /**
   * Bootstrap command centre for tenant
   */
  async bootstrapCommandCentre(
    tenantId: UUID,
    websiteUrl: string,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<CommandCentreBootstrapResult> {
    this.logger.info('Starting command centre bootstrap', { tenantId });

    const taskTypes: Record<string, number> = {};
    const errors: string[] = [];

    // Generate schema recommendations
    const schemaTasks = await this.generateSchemaTasks(tenantId, websiteUrl, executionId, traceId, token);
    taskTypes['schema'] = schemaTasks;
    if (schemaTasks === 0) errors.push('Failed to generate schema tasks');

    // Generate indexing tasks
    const indexingTasks = await this.generateIndexingTasks(tenantId, websiteUrl, executionId, traceId, token);
    taskTypes['indexing'] = indexingTasks;
    if (indexingTasks === 0) errors.push('Failed to generate indexing tasks');

    // Generate content opportunities
    const contentTasks = await this.generateContentOpportunities(tenantId, executionId, traceId, token);
    taskTypes['content'] = contentTasks;
    if (contentTasks === 0) errors.push('Failed to generate content tasks');

    // Generate backlink opportunities
    const backlinkTasks = await this.generateBacklinkOpportunities(tenantId, executionId, traceId, token);
    taskTypes['backlink'] = backlinkTasks;
    if (backlinkTasks === 0) errors.push('Failed to generate backlink tasks');

    // Generate GMB optimizations
    const gmbTasks = await this.generateGMBOptimizations(tenantId, executionId, traceId, token);
    taskTypes['gmb'] = gmbTasks;
    if (gmbTasks === 0) errors.push('Failed to generate GMB tasks');

    // Generate technical fixes
    const technicalTasks = await this.generateTechnicalFixes(tenantId, websiteUrl, executionId, traceId, token);
    taskTypes['technical'] = technicalTasks;
    if (technicalTasks === 0) errors.push('Failed to generate technical tasks');

    // Generate review reply tasks
    const reviewTasks = await this.generateReviewReplyTasks(tenantId, executionId, traceId, token);
    taskTypes['review'] = reviewTasks;
    if (reviewTasks === 0) errors.push('Failed to generate review tasks');

    const tasksGenerated = Object.values(taskTypes).reduce((sum, count) => sum + count, 0);
    const success = errors.length === 0;

    this.logger.info('Command centre bootstrap complete', { tenantId, tasksGenerated, taskTypes, errors });

    return {
      success,
      tasksGenerated,
      taskTypes,
      errors,
    };
  }

  /**
   * Generate schema tasks
   */
  private async generateSchemaTasks(
    tenantId: UUID,
    websiteUrl: string,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating schema tasks', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'schema_implementation' as TaskType,
          title: 'Add Organization Schema',
          description: 'Implement organization schema markup to homepage',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
        {
          task_type: 'schema_implementation' as TaskType,
          title: 'Add LocalBusiness Schema',
          description: 'Implement LocalBusiness schema markup',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate schema tasks', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate indexing tasks
   */
  private async generateIndexingTasks(
    tenantId: UUID,
    websiteUrl: string,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating indexing tasks', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'url_indexing' as TaskType,
          title: 'Submit Sitemap to Google Search Console',
          description: 'Submit XML sitemap to GSC for indexing',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
        {
          task_type: 'url_indexing' as TaskType,
          title: 'Request Indexing for Key Pages',
          description: 'Request indexing for top 10 priority pages',
          priority: 'medium' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate indexing tasks', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate content opportunities
   */
  private async generateContentOpportunities(
    tenantId: UUID,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating content opportunities', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'content_audit' as TaskType,
          title: 'Create Content Calendar',
          description: 'Develop monthly content calendar based on keyword opportunities',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
        {
          task_type: 'content_audit' as TaskType,
          title: 'Optimize Top 5 Pages',
          description: 'Optimize top 5 pages for target keywords',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate content opportunities', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate backlink opportunities
   */
  private async generateBacklinkOpportunities(
    tenantId: UUID,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating backlink opportunities', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'backlink_outreach' as TaskType,
          title: 'Identify Backlink Opportunities',
          description: 'Analyze competitor backlinks and identify opportunities',
          priority: 'medium' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
        {
          task_type: 'backlink_outreach' as TaskType,
          title: 'Create Outreach List',
          description: 'Build list of target sites for backlink outreach',
          priority: 'medium' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate backlink opportunities', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate GMB optimizations
   */
  private async generateGMBOptimizations(
    tenantId: UUID,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating GMB optimizations', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'gmb_optimization' as TaskType,
          title: 'Optimize GMB Description',
          description: 'Update Google Business Profile description with keywords',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
        {
          task_type: 'gmb_optimization' as TaskType,
          title: 'Add GMB Photos',
          description: 'Upload high-quality photos to Google Business Profile',
          priority: 'medium' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate GMB optimizations', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate technical fixes
   */
  private async generateTechnicalFixes(
    tenantId: UUID,
    websiteUrl: string,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating technical fixes', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'technical_audit' as TaskType,
          title: 'Fix Broken Links',
          description: 'Identify and fix broken internal and external links',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
        {
          task_type: 'cwv_optimization' as TaskType,
          title: 'Optimize Page Speed',
          description: 'Improve Core Web Vitals and page load speed',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
            website_url: websiteUrl,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate technical fixes', { tenantId, error });
      return 0;
    }
  }

  /**
   * Generate review reply tasks
   */
  private async generateReviewReplyTasks(
    tenantId: UUID,
    executionId: UUID,
    traceId: UUID,
    token: string
  ): Promise<number> {
    this.logger.info('Generating review reply tasks', { tenantId });

    try {
      const tasks = [
        {
          task_type: 'review_reply' as TaskType,
          title: 'Reply to Pending Reviews',
          description: 'Respond to all pending Google reviews',
          priority: 'high' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
        {
          task_type: 'sentiment_analysis' as TaskType,
          title: 'Monitor Review Sentiment',
          description: 'Regularly monitor and analyze review sentiment',
          priority: 'medium' as TaskPriority,
          action_payload: {
            execution_id: executionId,
            trace_id: traceId,
          },
        },
      ];

      await this.taskGenerationService.bulkCreateTasks({
        tenant_id: tenantId,
        client_id: tenantId,
        agent_name: 'ONBOARDING',
        source_execution_id: executionId,
        source_task_id: undefined,
        tasks,
      });
      return tasks.length;
    } catch (error) {
      this.logger.error('Failed to generate review reply tasks', { tenantId, error });
      return 0;
    }
  }

  /**
   * Get command centre bootstrap status
   */
  async getCommandCentreBootstrapStatus(tenantId: UUID, token: string): Promise<{
    completed: boolean;
    taskCount: number;
  }> {
    const supabase = createClerkSupabaseClient(token);

    const { count } = await supabase
      .from('command_center_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    const taskCount = count || 0;
    const completed = taskCount >= 14; // 2 tasks per type, 7 types

    return { completed, taskCount };
  }
}

/**
 * Singleton instance
 */
export const commandCentreBootstrapService = new CommandCentreBootstrapService();
