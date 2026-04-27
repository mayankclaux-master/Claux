import { Suspense } from "react";

import { VerifyEmailClient } from "./verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10" />}>
      <VerifyEmailClient />
    </Suspense>
  );
}
