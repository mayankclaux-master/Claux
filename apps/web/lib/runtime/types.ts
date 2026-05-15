/**
 * Agent Runtime Types
 * Core type definitions for the CLAUX Agent Runtime System
 */

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying',
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum ExecutionSource {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  EVENT = 'event',
  WEBHOOK = 'webhook',
  API = 'api',
}

export type UUID = string;
export type ISODateTime = string;

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export interface AgentExecution {
  id: string;
  tenant_id: string;
  agent_name: string;
  workflow_type: string;
  status: ExecutionStatus;
  started_at?: Date;
  completed_at?: Date;
  failed_at?: Date;
  retry_count: number;
  max_retries: number;
  execution_source: ExecutionSource;
  initiated_by?: string;
  metadata: Record<string, any>;
  total_cost: number;
  total_tokens: number;
  inngest_run_id?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface AgentTask {
  id: string;
  execution_id: string;
  task_name: string;
  task_type: string;
  status: TaskStatus;
  started_at?: Date;
  completed_at?: Date;
  failed_at?: Date;
  retry_count: number;
  max_retries: number;
  input_payload: Record<string, any>;
  output_payload?: Record<string, any>;
  error_payload?: Record<string, any>;
  step_order: number;
  duration_ms?: number;
  created_at: Date;
  updated_at: Date;
}

export interface AgentEvent {
  id: string;
  tenant_id: string;
  execution_id?: string;
  event_name: string;
  event_source: string;
  payload: Record<string, any>;
  event_version: string;
  correlation_id?: string;
  causation_id?: string;
  created_at: Date;
}

export interface AgentLog {
  id: string;
  execution_id: string;
  task_id?: string;
  log_level: LogLevel;
  message: string;
  metadata: Record<string, any>;
  context: Record<string, any>;
  created_at: Date;
}

export interface ExecutionConfig {
  tenant_id: string;
  agent_name: string;
  workflow_type: string;
  execution_source?: ExecutionSource;
  initiated_by?: string;
  max_retries?: number;
  metadata?: Record<string, any>;
}

export interface TaskConfig {
  task_name: string;
  task_type: string;
  input_payload: Record<string, any>;
  step_order: number;
  max_retries?: number;
}

export interface EventConfig {
  tenant_id: string;
  event_name: string;
  event_source: string;
  payload: Record<string, any>;
  execution_id?: string;
  correlation_id?: string;
  causation_id?: string;
  event_version?: string;
}

export interface LogConfig {
  execution_id: string;
  task_id?: string;
  log_level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  context?: Record<string, any>;
}

export interface CostTracking {
  total_cost: number;
  total_tokens: number;
  model_costs?: Record<string, number>;
}

export interface RetryConfig {
  max_retries: number;
  current_retry: number;
  backoff_ms?: number;
  exponential_backoff?: boolean;
}

export interface AgentRuntimeError extends Error {
  code: string;
  execution_id?: string;
  task_id?: string;
  retryable: boolean;
  context?: Record<string, any> | undefined;
}

export interface ExecutionContext {
  execution: AgentExecution;
  tasks: Map<string, AgentTask>;
  events: AgentEvent[];
  cost: CostTracking;
}
