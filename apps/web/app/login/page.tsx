"use client";

import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Sign in to CLAUX</CardTitle>
          <CardDescription>Access your SEO workspace and continue onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn
            afterSignInUrl="/onboarding/provisioning"
            signUpUrl="/auth/signup"
            redirectUrl="/onboarding/provisioning"
          />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
              Create account
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
