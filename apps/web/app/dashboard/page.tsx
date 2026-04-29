import { createSupabaseServerClient } from "@/lib/supabase/server";
import MissionControl from "@/components/dashboard/MissionControl";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let isWordPress = false;
  let tenantId: string | null = null;

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();

    if (profile?.tenant_id) {
      tenantId = profile.tenant_id;
    }
  }

  return <MissionControl isWordPress={isWordPress} orgId={tenantId} />;
}
