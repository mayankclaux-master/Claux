'use server';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type VerificationResult = {
  success: boolean;
  profileExists: boolean;
  agentStatesCount: number;
  tenantId?: string;
  error?: string;
};

export async function verifyTriggerAutomation(userId: string): Promise<VerificationResult> {
  const adminClient = createSupabaseAdminClient();

  try {
    // Get the user's profile
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      return {
        success: false,
        profileExists: false,
        agentStatesCount: 0,
        error: `Profile lookup failed: ${profileError.message}`
      };
    }

    if (!profile) {
      return {
        success: false,
        profileExists: false,
        agentStatesCount: 0,
        error: 'Profile does not exist'
      };
    }

    const tenantId = profile.tenant_id;

    // REMOVED: Check agent_states count (Phase 2B)
    // Using canonical agent_executions table instead
    const { data: executions, error: executionsError } = await adminClient
      .from('agent_executions')
      .select('agent_name')
      .eq('tenant_id', tenantId);

    if (executionsError) {
      return {
        success: false,
        profileExists: true,
        agentStatesCount: 0,
        error: `Agent executions lookup failed: ${executionsError.message}`
      };
    }

    // Count unique agents from executions
    const uniqueAgents = new Set(executions?.map((e: { agent_name: string }) => e.agent_name));
    const agentStatesCount = uniqueAgents.size;

    return {
      success: agentStatesCount === 9,
      profileExists: true,
      agentStatesCount,
      tenantId
    };
  } catch (error) {
    return {
      success: false,
      profileExists: false,
      agentStatesCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
