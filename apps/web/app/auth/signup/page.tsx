"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, businessName, fullName })
    });

    const result = (await response.json()) as {
      error?: string;
      email?: string;
      next?: "verify_email" | "dashboard";
      requiresEmailVerification?: boolean;
    };

    if (!response.ok) {
      setLoading(false);
      setError(result.error ?? "Signup failed.");
      return;
    }

    if (result.next === "verify_email" || result.requiresEmailVerification) {
      setLoading(false);
      setMessage("Account created. Check your inbox to verify email before first sign-in.");
      router.push(`/auth/verify-email?email=${encodeURIComponent(result.email ?? email)}`);
      return;
    }

    router.push("/login");
    router.refresh();
  }

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
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" name="businessName" placeholder="Acme Health" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="jane@gmail.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            <Button className="w-full shadow-lg shadow-primary/20" size="lg" disabled={loading}>
              {loading ? "Creating workspace..." : "Create account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive verification email?{" "}
              <Link href="/auth/verify-email" className="text-primary underline-offset-4 hover:underline">
                Verify account
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
