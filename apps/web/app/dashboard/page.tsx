import { createSupabaseServerClient } from "@/lib/supabase/server";
import MissionControl from "@/components/dashboard/MissionControl";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let orgName = "your organization";
  let isWordPress = false;
  let orgId: string | null = null;

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();

    if (profile?.org_id) {
      orgId = profile.org_id;
      const { data: organization } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", profile.org_id)
        .maybeSingle();

      const { data: connection } = await supabase
        .from("connections")
        .select("tech_stack")
        .eq("org_id", profile.org_id)
        .maybeSingle();

      if (organization?.name) {
        orgName = organization.name;
      }

      const techStack = (connection?.tech_stack ?? "").toLowerCase();
      isWordPress = techStack.includes("wordpress");
    }
  }

  return <MissionControl organizationName={orgName} isWordPress={isWordPress} orgId={orgId} />;
}
