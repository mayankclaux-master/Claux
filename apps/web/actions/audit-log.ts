'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getAgentAuditLogs(tenantId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tenant_id || profile.tenant_id !== tenantId) {
    return [];
  }

  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('actor_type', 'agent')
    .in('table_name', ['agent_runs', 'agent_states', 'aria_keywords', 'scribe_content', 'pulse_rankings', 'repute_reviews', 'linx_backlinks'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[getAgentAuditLogs] Failed to fetch audit logs:', error);
    return [];
  }

  return data || [];
}
