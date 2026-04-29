import { createSupabaseServerClient } from "@/lib/supabase/server";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (session) {
    const { data: profile } = await supabase.from("profiles").select("tenant_id, provisioning_status").eq("id", session.user.id).maybeSingle();

    if (profile?.tenant_id) {
      const { data: tenant } = await supabase.from("tenants").select("status").eq("id", profile.tenant_id).maybeSingle();

      const isProvisioningComplete = profile.provisioning_status === "completed";
      const isTenantActive = tenant?.status === "active";
      const isFullySetup = isProvisioningComplete && isTenantActive;

      if (isFullySetup) {
        redirect("/dashboard");
      } else {
        redirect("/onboarding");
      }
    } else {
      redirect("/onboarding/provisioning");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 rounded-full border border-border bg-card px-4 py-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        CLAUX Enterprise Onboarding
      </p>
      <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
        Launch your SEO operating system with secure tenant-first onboarding.
      </h1>
      <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
        Create your workspace, connect your website, and activate intelligence syncing in under 3 minutes.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/auth/signup" className={cn(buttonVariants({ size: "lg" }))}>
          Get Started
        </Link>
      </div>
    </main>
  );
}
