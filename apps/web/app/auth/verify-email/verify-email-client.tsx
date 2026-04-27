"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const RESEND_COOLDOWN_SECONDS = 45;

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const initialEmail = String(searchParams.get("email") ?? "").trim();

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const errorCode = String(searchParams.get("error") ?? "").trim();

    if (errorCode === "auth_session_not_found") {
      setError("Auth session missing. Open the email link again to continue securely.");
    }

    if (errorCode === "invalid_or_expired_link") {
      setError("This verification link is invalid or expired. Request a fresh verification email.");
    }
  }, [searchParams]);

  useEffect(() => {
    async function autoContinueIfVerified() {
      const { data } = await supabase.auth.getUser();

      if (data.user?.email_confirmed_at) {
        router.replace(`/onboarding?t=${Date.now()}`);
        router.refresh();
      }
    }

    void autoContinueIfVerified();
  }, [router, supabase]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((seconds) => Math.max(seconds - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds]);

  async function checkVerificationAndContinue() {
    setChecking(true);
    setError(null);

    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      await supabase.auth.refreshSession();
    }

    const { data, error: userError } = await supabase.auth.getUser();

    setChecking(false);

    if (userError) {
      setError(userError.message ?? "Could not verify account status.");
      return;
    }

    if (!data.user) {
      setError("Open the verification link from your email first, then continue.");
      return;
    }

    if (!data.user.email_confirmed_at) {
      setError("Your email is not verified yet. Please check your inbox or spam folder.");
      return;
    }

    router.replace(`/onboarding?t=${Date.now()}`);
    router.refresh();
  }

  async function resendVerificationEmail() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email to resend the verification link.");
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: normalizedEmail })
    });

    const result = (await response.json()) as { error?: string };

    setResending(false);

    if (!response.ok) {
      setError(result.error ?? "Could not resend verification email.");
      return;
    }

    setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    setMessage("Verification email sent. Please open the secure link in your inbox.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>
            We sent a verification link to your inbox. Confirm your email to activate your workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@gmail.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

          <Button className="w-full" size="lg" onClick={() => void checkVerificationAndContinue()} disabled={checking}>
            {checking ? "Checking verification..." : "I verified my email"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => void resendVerificationEmail()}
            disabled={resending || cooldownSeconds > 0}
          >
            {resending
              ? "Sending verification email..."
              : cooldownSeconds > 0
                ? `Resend available in ${cooldownSeconds}s`
                : "Resend verification email"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Need to recover account access?{" "}
            <Link href="/auth/reset-password" className="text-primary underline-offset-4 hover:underline">
              Reset password
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Back to{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
