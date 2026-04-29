'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type AuditAction = 'create' | 'update' | 'delete';

export async function logAuditEntry(params: {
  tenant_id: string;
  actor_id: string;
  action: AuditAction;
  table_name: string;
  record_id: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.tenant_id || profile.tenant_id !== params.tenant_id) {
    return { success: false, error: 'Forbidden tenant access' };
  }

  const { error } = await supabase
    .from('audit_log')
    .insert({
      tenant_id: params.tenant_id,
      actor_id: params.actor_id,
      action: params.action,
      table_name: params.table_name,
      record_id: params.record_id,
      old_values: params.old_values || null,
      new_values: params.new_values || null,
      metadata: params.metadata || null,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('[logAuditEntry] Failed to log audit entry:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
