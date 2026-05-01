"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignIn } from "@clerk/nextjs";

export default function UpdatePasswordPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to login after 3 seconds - Clerk handles password reset internally
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Password Reset</CardTitle>
          <CardDescription>Password reset is now handled by Clerk. Redirecting to login...</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn afterSignInUrl="/dashboard" />
        </CardContent>
      </Card>
    </main>
  );
}
