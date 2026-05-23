/**
 * Execution Observability
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getExecutionTimeline(executionId: string, tenantId: string) {
  const supabase = createSupabaseAdminClient();
  // ENFORCED: Added tenant_id filter for tenant isolation (Phase 2B)
  // Updated to use canonical agent_executions and agent_tasks tables (Phase 2A.3)
  const { data: execution } = await supabase.from('agent_executions').select('*').eq('id', executionId).eq('tenant_id', tenantId).single();
  const { data: tasks } = await supabase.from('agent_tasks').select('*').eq('execution_id', executionId).order('created_at');
  return { execution, tasks };
}

export async function getExecutionMetrics(tenantId: string, days = 30) {
  const supabase = createSupabaseAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  // Updated to use canonical agent_executions table (Phase 2A.3)
  const { data: executions } = await supabase.from('agent_executions').select('*').eq('tenant_id', tenantId).gte('created_at', startDate.toISOString());
  return { executions };
}
