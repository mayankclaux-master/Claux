import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { userId, getToken } = await auth();

  if (!userId) {
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

  const token = await getToken({ template: "supabase" });

  if (!token) {
    redirect("/auth/signup");
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id, provisioning_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile?.tenant_id) {
    redirect("/dashboard");
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("status, onboarding_completed")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError || !tenant) {
    redirect("/dashboard");
  }

  redirect("/dashboard");
}
