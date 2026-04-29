'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

type CmsType = 'wordpress' | 'shopify' | 'laravel' | 'wix' | 'squarespace';

type SaveCmsCredentialsInput = {
  tenant_id: string;
  cms_type: CmsType;
  site_url: string;
  encrypted_credentials: Record<string, unknown>;
  notes?: string | null;
};

export async function saveCmsCredentials(input: SaveCmsCredentialsInput) {
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

  if (!profile?.tenant_id) {
    return { success: false, error: 'Tenant not found' };
  }

  if (profile.tenant_id !== input.tenant_id) {
    return { success: false, error: 'Forbidden tenant access' };
  }

  const { error } = await supabase
    .from('cms_credentials')
    .upsert({
      tenant_id: input.tenant_id,
      cms_type: input.cms_type,
      site_url: input.site_url,
      encrypted_credentials: input.encrypted_credentials,
      notes: input.notes || null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id,cms_type'
    });

  if (error) {
    console.error('[saveCmsCredentials] Failed to save CMS credentials:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
