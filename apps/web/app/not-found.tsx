import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="mb-4 rounded-full border border-border bg-card px-4 py-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        404
      </p>
      <h1 className="text-3xl font-semibold md:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
        The page you are looking for is unavailable or may have moved. Return to your workspace to continue execution.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
          Go to dashboard
        </Link>
        <Link href="/" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>
          Back to home
        </Link>
      </div>
    </main>
  );
}
