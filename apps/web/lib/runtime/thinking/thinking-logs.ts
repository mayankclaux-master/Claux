/**
 * Thinking Log System
 * 
 * Production thinking log system for agent execution
 * Integrates with canonical runtime log repository
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface ThinkingLog {
  execution_id: string;
  tenant_id: string;
  agent_name: string;
  task_id?: string;
  phase?: string;
  step: string;
  thought: string;
  reasoning: string;
  reasoning_summary?: string;
  confidence?: number;
  artifact_id?: string;
  artifact_type?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Write thinking log
 */
export async function writeThinkingLog(log: ThinkingLog): Promise<void> {
  const supabase = createSupabaseAdminClient();
  
  const { error } = await supabase.from('runtime_thinking_logs').insert({
    execution_id: log.execution_id,
    tenant_id: log.tenant_id,
    agent_name: log.agent_name,
    task_id: log.task_id,
    phase: log.phase,
    step: log.step,
    thought: log.thought,
    reasoning: log.reasoning,
    reasoning_summary: log.reasoning_summary,
    confidence: log.confidence,
    artifact_id: log.artifact_id,
    artifact_type: log.artifact_type,
    metadata: log.metadata,
    timestamp: log.timestamp || new Date().toISOString(),
  });

  if (error) {
    console.error('Failed to write thinking log:', error);
    throw new Error(`Failed to write thinking log: ${error.message}`);
  }
}

/**
 * Get thinking logs for execution
 */
export async function getThinkingLogs(executionId: string): Promise<ThinkingLog[]> {
  const supabase = createSupabaseAdminClient();
  
  const { data, error } = await supabase
    .from('runtime_thinking_logs')
    .select('*')
    .eq('execution_id', executionId)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Failed to get thinking logs:', error);
    throw new Error(`Failed to get thinking logs: ${error.message}`);
  }

  return data || [];
}

/**
 * Create thinking log helper
 */
export function createThinkingLog(context: {
  execution_id: string;
  tenant_id: string;
  agent_name: string;
  task_id?: string;
  phase?: string;
  step: string;
  thought: string;
  reasoning: string;
  reasoning_summary?: string;
  confidence?: number;
  artifact_id?: string;
  artifact_type?: string;
  metadata?: Record<string, unknown>;
}): ThinkingLog {
  return {
    execution_id: context.execution_id,
    tenant_id: context.tenant_id,
    agent_name: context.agent_name,
    task_id: context.task_id,
    phase: context.phase,
    step: context.step,
    thought: context.thought,
    reasoning: context.reasoning,
    reasoning_summary: context.reasoning_summary,
    confidence: context.confidence,
    artifact_id: context.artifact_id,
    artifact_type: context.artifact_type,
    metadata: context.metadata,
    timestamp: new Date().toISOString(),
  };
}
