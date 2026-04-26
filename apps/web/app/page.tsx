import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
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
      <div className="mt-10 flex gap-3">
        <Link href="/auth/signup" className={cn(buttonVariants({ size: "lg" }))}>
          Create account
        </Link>
        <Link href="/onboarding" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>
          Resume onboarding
        </Link>
      </div>
    </main>
  );
}
