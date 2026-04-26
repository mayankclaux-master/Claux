import { Suspense } from "react";

import { OnboardingWizard } from "@/components/onboarding-wizard";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
      <Suspense fallback={<div className="w-full text-center text-sm text-muted-foreground">Loading onboarding...</div>}>
        <OnboardingWizard />
      </Suspense>
    </main>
  );
}
