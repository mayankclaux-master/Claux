"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [magicLinkMessage, setMagicLinkMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  function isVerificationError(message: string | undefined) {
    const normalized = (message ?? "").toLowerCase();
    return normalized.includes("email not confirmed") || normalized.includes("email_not_confirmed");
  }

  async function resendVerificationEmail() {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Enter your email to resend verification.");
      return;
    }

    setResendLoading(true);
    setError(null);
    setInfo(null);

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: normalizedEmail })
    });

    const result = (await response.json()) as { error?: string };

    setResendLoading(false);

    if (!response.ok) {
      setError(result.error ?? "Could not resend verification email.");
      return;
    }

    setInfo("Verification email sent. Open the link and continue.");
  }

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setInfo(null);

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setLoading(false);

      if (isVerificationError(signInError.message)) {
        setError("Please verify your email before signing in.");
        return;
      }

      setError(signInError.message ?? "Sign in failed.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function sendMagicLink() {
    setMagicLinkLoading(true);
    setMagicLinkMessage(null);
    setError(null);
    setInfo(null);

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setMagicLinkLoading(false);
      setError("Enter your email to receive a magic link.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });

    setMagicLinkLoading(false);

    if (otpError) {
      if (isVerificationError(otpError.message)) {
        setError("Your account is not verified yet. Verify email before using secure sign-in links.");
        return;
      }

      setError(otpError.message ?? "Could not send magic link.");
      return;
    }

    setMagicLinkMessage("Magic link sent. Check your email and open the secure sign-in link.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Sign in to CLAUX</CardTitle>
          <CardDescription>Access your SEO workspace and continue onboarding.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="text-right">
              <Link href="/auth/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
                Forgot password?
              </Link>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {info ? <p className="text-sm text-emerald-400">{info}</p> : null}
            {error?.toLowerCase().includes("verify") ? (
              <Button type="button" variant="secondary" className="w-full" onClick={() => void resendVerificationEmail()} disabled={resendLoading}>
                {resendLoading ? "Sending verification..." : "Resend verification email"}
              </Button>
            ) : null}
            <Button className="w-full shadow-lg shadow-primary/20" size="lg" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <div className="rounded-md border border-border/70 bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Troubleshooting</p>
              <p className="mt-1 text-sm text-muted-foreground">If your password fails repeatedly, request a secure magic link.</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-3 w-full"
                disabled={magicLinkLoading}
                onClick={() => {
                  void sendMagicLink();
                }}
              >
                {magicLinkLoading ? "Sending link..." : "Send magic link"}
              </Button>
              {magicLinkMessage ? <p className="mt-2 text-sm text-emerald-400">{magicLinkMessage}</p> : null}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
                Create account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
