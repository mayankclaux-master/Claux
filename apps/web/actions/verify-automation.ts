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

    // Check agent_states count
    const { data: agentStates, error: agentStatesError } = await adminClient
      .from('agent_states')
      .select('id')
      .eq('tenant_id', tenantId);

    if (agentStatesError) {
      return {
        success: false,
        profileExists: true,
        agentStatesCount: 0,
        error: `Agent states lookup failed: ${agentStatesError.message}`
      };
    }

    const agentStatesCount = agentStates?.length || 0;

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
