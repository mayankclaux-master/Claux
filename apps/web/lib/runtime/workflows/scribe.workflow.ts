/**
 * SCRIBE Workflow Definition
 * 
 * Production workflow for SCRIBE - Content Generation Agent
 * Integrates with canonical runtime execution engine
 */

import type { WorkflowDefinition } from './types';

/**
 * SCRIBE Workflow Definition
 * Content generation, outline generation, metadata generation, schema generation, artifact generation
 */
export const SCRIBE_WORKFLOW: WorkflowDefinition = {
  workflow_id: 'scribe_content_generation',
  workflow_name: 'SCRIBE Content Generation',
  workflow_type: 'content_generation',
  agent_name: 'SCRIBE',
  version: '1.0.0',
  description: 'Content generation, outline generation, metadata generation, schema generation, and artifact generation',
  
  tasks: [
    {
      task_id: 'fetch_business_profile',
      task_name: 'Fetch Business Profile',
      task_type: 'data_fetch',
      description: 'Fetch business profile and category',
      dependencies: [],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'fetch_content_briefs',
      task_name: 'Fetch Content Briefs',
      task_type: 'data_fetch',
      description: 'Fetch content briefs from ARIA workflow',
      dependencies: ['fetch_business_profile'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'select_keywords',
      task_name: 'Select Keywords',
      task_type: 'data_processing',
      description: 'Select high-intent keywords with diversification',
      dependencies: ['fetch_content_briefs'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 5000,
    },
    {
      task_id: 'generate_outlines',
      task_name: 'Generate Outlines',
      task_type: 'ai_generation',
      description: 'Generate article outlines using OpenAI',
      dependencies: ['select_keywords'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 2000,
      },
      timeout_ms: 120000,
    },
    {
      task_id: 'generate_articles',
      task_name: 'Generate Articles',
      task_type: 'ai_generation',
      description: 'Generate full articles using OpenAI',
      dependencies: ['generate_outlines'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 2000,
      },
      timeout_ms: 180000,
    },
    {
      task_id: 'generate_metadata',
      task_name: 'Generate Metadata',
      task_type: 'data_processing',
      description: 'Generate SEO metadata (title, description, keywords)',
      dependencies: ['generate_articles'],
      retry_policy: {
        max_attempts: 2,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'generate_schema',
      task_name: 'Generate Schema',
      task_type: 'data_processing',
      description: 'Generate structured data schema (JSON-LD)',
      dependencies: ['generate_metadata'],
      retry_policy: {
        max_attempts: 2,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'quality_check',
      task_name: 'Quality Check',
      task_type: 'validation',
      description: 'Validate content quality (word count, readability, SEO score)',
      dependencies: ['generate_schema'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 15000,
    },
    {
      task_id: 'store_content',
      task_name: 'Store Content',
      task_type: 'data_persistence',
      description: 'Store content in database with draft status',
      dependencies: ['quality_check'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'generate_artifacts',
      task_name: 'Generate Artifacts',
      task_type: 'data_processing',
      description: 'Generate publishing artifacts',
      dependencies: ['store_content'],
      retry_policy: {
        max_attempts: 2,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
  ],

  input_schema: {
    type: 'object',
    properties: {
      tenant_id: {
        type: 'string',
        description: 'Tenant ID for multi-tenant isolation',
      },
      workspace_id: {
        type: 'string',
        description: 'Workspace ID',
      },
      content_brief_ids: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Content brief IDs to process',
      },
      trigger: {
        type: 'string',
        enum: ['manual', 'scheduled', 'workflow'],
        description: 'Trigger type',
      },
    },
    required: ['tenant_id', 'workspace_id'],
  },

  output_schema: {
    type: 'object',
    properties: {
      articles_generated: {
        type: 'number',
        description: 'Total articles generated',
      },
      articles_passed_quality: {
        type: 'number',
        description: 'Articles that passed quality check',
      },
      artifacts_generated: {
        type: 'number',
        description: 'Total artifacts generated',
      },
      total_word_count: {
        type: 'number',
        description: 'Total word count across all articles',
      },
    },
  },

  execution_config: {
    max_parallel_tasks: 2,
    checkpoint_interval_ms: 60000,
    enable_replay: true,
    enable_telemetry: true,
    enable_thinking_logs: true,
  },
};
