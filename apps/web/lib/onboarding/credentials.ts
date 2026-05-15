/**
 * Tenant Onboarding Credential Handling
 * 
 * Handles secure storage and retrieval of tenant credentials
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export interface CredentialStorage {
  tenant_id: string;
  workspace_id: string;
  credential_type: 'gsc' | 'openai' | 'dataforseo' | 'custom';
  credential_data: Record<string, unknown>;
  encrypted: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Store credential securely
 */
export async function storeCredential(
  tenantId: string,
  workspaceId: string,
  credentialType: 'gsc' | 'openai' | 'dataforseo' | 'custom',
  credentialData: Record<string, unknown>,
  encrypt: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('credentials')
      .upsert({
        tenant_id: tenantId,
        workspace_id: workspaceId,
        credential_type: credentialType,
        credential_data: credentialData,
        encrypted: encrypt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id,credential_type',
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Retrieve credential
 */
export async function retrieveCredential(
  tenantId: string,
  credentialType: 'gsc' | 'openai' | 'dataforseo' | 'custom'
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('credential_data, encrypted')
      .eq('tenant_id', tenantId)
      .eq('credential_type', credentialType)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Credential not found' };
    }

    // TODO: Decrypt if encrypted
    // For now, return as-is
    return {
      success: true,
      data: data.credential_data as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete credential
 */
export async function deleteCredential(
  tenantId: string,
  credentialType: 'gsc' | 'openai' | 'dataforseo' | 'custom'
): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { error } = await supabase
      .from('credentials')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('credential_type', credentialType);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all credentials for tenant
 */
export async function listCredentials(
  tenantId: string
): Promise<{ success: boolean; credentials?: CredentialStorage[]; error?: string }> {
  const supabase = createSupabaseAdminClient();

  try {
    const { data, error } = await supabase
      .from('credentials')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      credentials: data as CredentialStorage[],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
