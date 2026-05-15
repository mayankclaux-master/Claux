'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getTenantAuditLogs(tenantId: string, limit: number = 50) {
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
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[getTenantAuditLogs] Failed to fetch audit logs:', error);
    return [];
  }

  return data || [];
}
