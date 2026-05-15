/**
 * ARIA Workflow Definition
 * 
 * Production workflow for ARIA - Keyword Intelligence Agent
 * Integrates with canonical runtime execution engine
 */

import type { WorkflowDefinition } from './types';

/**
 * ARIA Workflow Definition
 * Keyword discovery, SERP analysis, clustering, ranking opportunity analysis, intent analysis, content brief generation
 */
export const ARIA_WORKFLOW: WorkflowDefinition = {
  workflow_id: 'aria_keyword_intelligence',
  workflow_name: 'ARIA Keyword Intelligence',
  workflow_type: 'keyword_discovery',
  agent_name: 'ARIA',
  version: '1.0.0',
  description: 'Keyword discovery, SERP analysis, clustering, ranking opportunity analysis, intent analysis, and content brief generation',
  
  tasks: [
    {
      task_id: 'fetch_business_profile',
      task_name: 'Fetch Business Profile',
      task_type: 'data_fetch',
      description: 'Fetch business profile and website URL',
      dependencies: [],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'fetch_keywords',
      task_name: 'Fetch Keywords',
      task_type: 'external_api',
      description: 'Fetch keywords from DataForSEO',
      dependencies: ['fetch_business_profile'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 2000,
      },
      timeout_ms: 60000,
    },
    {
      task_id: 'normalize_keywords',
      task_name: 'Normalize Keywords',
      task_type: 'data_processing',
      description: 'Normalize and validate keywords',
      dependencies: ['fetch_keywords'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 10000,
    },
    {
      task_id: 'classify_intent',
      task_name: 'Classify Intent',
      task_type: 'data_processing',
      description: 'Classify keyword intent (transactional, informational, commercial)',
      dependencies: ['normalize_keywords'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 10000,
    },
    {
      task_id: 'quality_filter',
      task_name: 'Quality Filter',
      task_type: 'data_processing',
      description: 'Filter keywords by quality (volume > 50, difficulty < 80)',
      dependencies: ['classify_intent'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 5000,
    },
    {
      task_id: 'cluster_keywords',
      task_name: 'Cluster Keywords',
      task_type: 'data_processing',
      description: 'Cluster keywords by semantic similarity',
      dependencies: ['quality_filter'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 15000,
    },
    {
      task_id: 'analyze_opportunities',
      task_name: 'Analyze Opportunities',
      task_type: 'data_processing',
      description: 'Analyze ranking opportunities',
      dependencies: ['cluster_keywords'],
      retry_policy: {
        max_attempts: 1,
        backoff_ms: 0,
      },
      timeout_ms: 15000,
    },
    {
      task_id: 'store_keywords',
      task_name: 'Store Keywords',
      task_type: 'data_persistence',
      description: 'Store keywords in database with deduplication',
      dependencies: ['analyze_opportunities'],
      retry_policy: {
        max_attempts: 3,
        backoff_ms: 1000,
      },
      timeout_ms: 30000,
    },
    {
      task_id: 'generate_briefs',
      task_name: 'Generate Content Briefs',
      task_type: 'data_processing',
      description: 'Generate content briefs for high-priority keywords',
      dependencies: ['store_keywords'],
      retry_policy: {
        max_attempts: 2,
        backoff_ms: 1000,
      },
      timeout_ms: 60000,
    },
    {
      task_id: 'publish_workflow',
      task_name: 'Publish Workflow',
      task_type: 'workflow_publication',
      description: 'Publish workflow for SCRIBE agent',
      dependencies: ['generate_briefs'],
      retry_policy: {
        max_attempts: 3,
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
      trigger: {
        type: 'string',
        enum: ['manual', 'scheduled', 'webhook'],
        description: 'Trigger type',
      },
    },
    required: ['tenant_id', 'workspace_id'],
  },

  output_schema: {
    type: 'object',
    properties: {
      total_keywords: {
        type: 'number',
        description: 'Total keywords discovered',
      },
      total_clusters: {
        type: 'number',
        description: 'Total keyword clusters',
      },
      total_opportunities: {
        type: 'number',
        description: 'Total ranking opportunities',
      },
      content_briefs_generated: {
        type: 'number',
        description: 'Number of content briefs generated',
      },
      workflow_published: {
        type: 'boolean',
        description: 'Whether workflow was published for SCRIBE',
      },
    },
  },

  execution_config: {
    max_parallel_tasks: 3,
    checkpoint_interval_ms: 30000,
    enable_replay: true,
    enable_telemetry: true,
    enable_thinking_logs: true,
  },
};
