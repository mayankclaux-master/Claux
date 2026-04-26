import { Suspense } from "react";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding-wizard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).maybeSingle();

    if (profile?.org_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("onboarding_status, onboarding_step, onboarding_completed")
        .eq("id", profile.org_id)
        .maybeSingle();

      const onboardingComplete =
        organization?.onboarding_status === "completed" ||
        Boolean(organization?.onboarding_completed) ||
        Number(organization?.onboarding_step ?? 0) >= 4;

      if (onboardingComplete) {
        redirect("/dashboard");
      }
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <Suspense fallback={<div className="w-full text-center text-sm text-muted-foreground">Loading onboarding...</div>}>
        <OnboardingWizard />
      </Suspense>
    </main>
  );
}
