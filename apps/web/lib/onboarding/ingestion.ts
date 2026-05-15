/**
 * Tenant Onboarding Ingestion
 * 
 * Ingests tenant onboarding data into database
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { TenantOnboardingData, GCSCredentials } from './validation';

export interface IngestionResult {
  success: boolean;
  tenant_id?: string;
  workspace_id?: string;
  errors: string[];
}

/**
 * Ingest tenant onboarding data
 */
export async function ingestTenantOnboarding(
  userId: string,
  data: TenantOnboardingData,
  gscCredentials?: GCSCredentials
): Promise<IngestionResult> {
  const supabase = createSupabaseAdminClient();
  const errors: string[] = [];

  try {
    // Check if user already has a tenant
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      errors.push(`Failed to check profile: ${profileError.message}`);
      return { success: false, errors };
    }

    let tenantId: string;

    if (existingProfile?.tenant_id) {
      // Use existing tenant
      tenantId = existingProfile.tenant_id;
    } else {
      // Create new tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.tenant_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (tenantError) {
        errors.push(`Failed to create tenant: ${tenantError.message}`);
        return { success: false, errors };
      }

      tenantId = tenant.id;

      // Update profile with tenant_id
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ tenant_id: tenantId })
        .eq('id', userId);

      if (updateProfileError) {
        errors.push(`Failed to update profile: ${updateProfileError.message}`);
        return { success: false, errors };
      }
    }

    // Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        tenant_id: tenantId,
        name: data.workspace_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (workspaceError) {
      errors.push(`Failed to create workspace: ${workspaceError.message}`);
      return { success: false, errors };
    }

    const workspaceId = workspace.id;

    // Create or update business profile
    const { error: businessError } = await supabase
      .from('business_profiles')
      .upsert({
        tenant_id: tenantId,
        workspace_id: workspaceId,
        website_url: data.website_url,
        category: data.business_category,
        brand_voice: data.brand_voice,
        publishing_preferences: data.publishing_preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'tenant_id',
      });

    if (businessError) {
      errors.push(`Failed to create business profile: ${businessError.message}`);
      return { success: false, errors };
    }

    // Store GSC credentials if provided
    if (gscCredentials) {
      const { error: gscError } = await supabase
        .from('gsc_credentials')
        .upsert({
          tenant_id: tenantId,
          workspace_id: workspaceId,
          site_url: gscCredentials.site_url,
          property_id: gscCredentials.property_id,
          api_key: gscCredentials.api_key,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id',
        });

      if (gscError) {
        errors.push(`Failed to store GSC credentials: ${gscError.message}`);
        // Continue anyway as GSC is optional
      }
    }

    return {
      success: true,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during ingestion');
    return { success: false, errors };
  }
}

/**
 * Update tenant onboarding data
 */
export async function updateTenantOnboarding(
  tenantId: string,
  workspaceId: string,
  data: Partial<TenantOnboardingData>,
  gscCredentials?: GCSCredentials
): Promise<IngestionResult> {
  const supabase = createSupabaseAdminClient();
  const errors: string[] = [];

  try {
    // Update business profile
    if (data.website_url || data.business_category || data.brand_voice || data.publishing_preferences) {
      const { error: businessError } = await supabase
        .from('business_profiles')
        .update({
          website_url: data.website_url,
          category: data.business_category,
          brand_voice: data.brand_voice,
          publishing_preferences: data.publishing_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId);

      if (businessError) {
        errors.push(`Failed to update business profile: ${businessError.message}`);
        return { success: false, errors };
      }
    }

    // Update GSC credentials if provided
    if (gscCredentials) {
      const { error: gscError } = await supabase
        .from('gsc_credentials')
        .upsert({
          tenant_id: tenantId,
          workspace_id: workspaceId,
          site_url: gscCredentials.site_url,
          property_id: gscCredentials.property_id,
          api_key: gscCredentials.api_key,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tenant_id',
        });

      if (gscError) {
        errors.push(`Failed to update GSC credentials: ${gscError.message}`);
        return { success: false, errors };
      }
    }

    return {
      success: true,
      tenant_id: tenantId,
      workspace_id: workspaceId,
      errors,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during update');
    return { success: false, errors };
  }
}
