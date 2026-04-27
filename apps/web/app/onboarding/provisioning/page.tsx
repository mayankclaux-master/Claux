import { redirect } from "next/navigation";

import { ensureWorkspaceForUser } from "@/lib/auth/ensure-workspace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingProvisioningPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: initialProfile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();

  let profile = initialProfile;

  if (!profile?.org_id) {
    const adminClient = createSupabaseAdminClient();
    const fullName = String(user.user_metadata?.full_name ?? "").trim() || null;
    const businessName =
      String(user.user_metadata?.business_name ?? "").trim() ||
      String(user.email ?? "").split("@")[0] ||
      "My Workspace";

    const workspaceError = await ensureWorkspaceForUser({
      adminClient,
      userId: user.id,
      businessName,
      fullName
    });

    if (workspaceError) {
      console.error("[provisioning] workspace bootstrap failed", {
        userId: user.id,
        message: workspaceError.message,
        details: workspaceError.details,
        hint: workspaceError.hint,
        code: workspaceError.code
      });
    }

    const { data: refreshedProfile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();
    profile = refreshedProfile;
  }

  if (profile?.org_id) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("onboarding_status, onboarding_step, onboarding_completed")
      .eq("id", profile.org_id)
      .maybeSingle();

    if (organization) {
      const isDone =
        String(organization.onboarding_status ?? "").trim().toLowerCase() === "completed" ||
        Boolean(organization.onboarding_completed) ||
        Number(organization.onboarding_step ?? 0) >= 4;

      if (isDone) {
        redirect("/dashboard");
      }

      redirect("/onboarding");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <div className="w-full rounded-xl border border-border/70 bg-card/95 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Workspace Provisioning</p>
        <h1 className="mt-3 text-2xl font-semibold">Setting up your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organization is being initialized securely. This usually takes a few seconds.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          <span>Please refresh in a moment.</span>
        </div>
      </div>
    </main>
  );
}
