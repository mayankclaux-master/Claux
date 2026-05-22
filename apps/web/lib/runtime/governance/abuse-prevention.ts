import { RuntimeService } from '@/lib/runtime/services/runtime.service';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export class AbusePrevention {
  private runtime: RuntimeService;
  private supabase;

  constructor() {
    this.runtime = new RuntimeService({ tenantId: 'system', logOperations: true, enableMetrics: true });
    this.supabase = createSupabaseAdminClient();
  }

  async preventExecutionSpam(tenantId: string): Promise<boolean> {
    const { count } = await this.supabase.from('agent_executions').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).gte('created_at', new Date(Date.now() - 60000).toISOString());
    return (count || 0) < 100;
  }

  async preventCallbackFlooding(tenantId: string): Promise<boolean> {
    // ENFORCED: Added tenant_id filter for tenant isolation (Phase 2B)
    const { count } = await this.supabase.from('agent_events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('event_name', 'integration_callback').gte('created_at', new Date(Date.now() - 60000).toISOString());
    return (count || 0) < 50;
  }

  async preventTenantStarvation(): Promise<void> {
    await this.runtime.event.publishEvent({ tenant_id: 'system', execution_id: 'abuse-prevention', event_name: 'tenant_starvation_check', event_source: 'abuse_prevention', payload: {} });
  }
}
