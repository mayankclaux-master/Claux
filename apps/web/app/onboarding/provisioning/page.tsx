import { redirect } from "next/navigation";

import { ensureWorkspaceForUser } from "@/lib/auth/ensure-workspace";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingProvisioningPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(user.user_metadata?.full_name ?? "").trim() || null;
  const businessName =
    String(user.user_metadata?.business_name ?? "").trim() ||
    String(user.email ?? "").split("@")[0] ||
    "My Workspace";

  const workspaceResult = await ensureWorkspaceForUser(user.id);

  if (workspaceResult.status === "healthy" && workspaceResult.tenantId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("provisioning_status")
      .eq("id", user.id)
      .maybeSingle();

    const isDone = profile?.provisioning_status === "completed";

    redirect(isDone ? "/dashboard" : "/onboarding");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <div className="w-full rounded-xl border border-border/70 bg-card/95 p-8 text-center backdrop-blur">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">Workspace Provisioning</p>
        <h1 className="mt-3 text-2xl font-semibold">Setting up your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your workspace is being initialized securely. This usually takes a few seconds.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-emerald-400" />
          <span>{workspaceResult.error ?? "Please refresh in a moment."}</span>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Event ID: {workspaceResult.eventId}</p>
      </div>
    </main>
  );
}
