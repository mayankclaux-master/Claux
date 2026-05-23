/**
 * CLAUX Phase 3B — Command Centre Page
 * World-class employee operational dashboard
 * Dark tactical UI, real DB data only
 */

import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/admin';
import { CommandCenterShell } from '@/components/command-center/CommandCenterShell';
import type { CommandCenterTask } from '@/lib/command-center/types';

export default async function CommandCenterPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    return null;
  }

  const token = await getToken({ template: 'supabase' });

  if (!token) {
    return null;
  }

  const supabase = createClerkSupabaseClient(token);

  // Get tenant from profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    return null;
  }

  const tenantId = profile.tenant_id;

  // Fetch initial tasks
  const { data: tasks } = await supabase
    .from('command_center_tasks')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate stats
  const allTasks = tasks as CommandCenterTask[] || [];
  const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
  const completedToday = allTasks.filter(t => 
    t.status === 'completed' && 
    new Date(t.completed_at || '').toDateString() === new Date().toDateString()
  ).length;
  const criticalTasks = allTasks.filter(t => t.priority === 'critical' && t.status !== 'completed').length;
  
  // Simple deterministic client health score
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
  const clientHealthScore = Math.round(completionRate - (criticalTasks * 5));

  return (
    <CommandCenterShell
      tenantId={tenantId}
      initialTasks={allTasks}
      stats={{
        pendingTasks,
        completedToday,
        criticalTasks,
        clientHealthScore: Math.max(0, Math.min(100, clientHealthScore)),
      }}
    />
  );
}
