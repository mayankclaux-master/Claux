"use client";

import Link from "next/link";
import { SignUp } from "@clerk/nextjs";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Start your SEO Growth Plan</CardTitle>
          <CardDescription>
            Join 1,000+ businesses using autonomous AI to dominate Google Search and Maps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUp
            afterSignUpUrl="/dashboard"
            signInUrl="/login"
            redirectUrl="/dashboard"
          />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
