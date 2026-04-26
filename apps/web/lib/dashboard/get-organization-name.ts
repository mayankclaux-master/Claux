import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getOrganizationNameForDashboard(): Promise<string> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return 'your organization';
  }

  const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).maybeSingle();

  if (!profile?.org_id) {
    return 'your organization';
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.org_id)
    .maybeSingle();

  return organization?.name ?? 'your organization';
}
