/**
 * Workflow Types
 * 
 * Type definitions for workflow configuration
 */

export interface WorkflowTask {
  task_id: string;
  task_name: string;
  task_type: string;
  description: string;
  dependencies: string[];
  retry_policy: {
    max_attempts: number;
    backoff_ms: number;
  };
  timeout_ms: number;
}

export interface WorkflowDefinition {
  workflow_id: string;
  workflow_name: string;
  workflow_type: string;
  agent_name: string;
  version: string;
  description: string;
  tasks: WorkflowTask[];
  input_schema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
  output_schema: {
    type: string;
    properties: Record<string, unknown>;
  };
  execution_config: {
    max_parallel_tasks: number;
    checkpoint_interval_ms: number;
    enable_replay: boolean;
    enable_telemetry: boolean;
    enable_thinking_logs: boolean;
  };
}
