/**
 * Execution Observability
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function getExecutionTimeline(executionId: string, tenantId: string) {
  const supabase = createSupabaseAdminClient();
  // ENFORCED: Added tenant_id filter for tenant isolation (Phase 2B)
  const { data: execution } = await supabase.from('runtime_executions').select('*').eq('id', executionId).eq('tenant_id', tenantId).single();
  const { data: tasks } = await supabase.from('runtime_tasks').select('*').eq('execution_id', executionId).order('step_order');
  return { execution, tasks };
}

export async function getExecutionMetrics(tenantId: string, days = 30) {
  const supabase = createSupabaseAdminClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const { data: executions } = await supabase.from('runtime_executions').select('*').eq('tenant_id', tenantId).gte('created_at', startDate.toISOString());
  return { executions };
}
