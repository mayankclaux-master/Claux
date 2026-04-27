"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function hydrateRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError("Recovery link is invalid or expired. Request a new one.");
          setSessionReady(false);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      setSessionReady(Boolean(data.session));

      if (!data.session) {
        setError("Recovery session not found. Request a new reset link.");
      }
    }

    void hydrateRecoverySession();
  }, [supabase]);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const password = String(formData.get("password") ?? "").trim();
    const confirmPassword = String(formData.get("confirmPassword") ?? "").trim();

    if (password.length < 8) {
      setLoading(false);
      setError("New password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setLoading(false);
      setError("Passwords do not match.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message ?? "Could not update password.");
      return;
    }

    await supabase.auth.refreshSession();

    setLoading(false);
    setMessage("Password updated successfully. Redirecting to your workspace...");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Create a new password</CardTitle>
          <CardDescription>Use a strong password to secure your CLAUX workspace.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" minLength={8} required />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

            <Button className="w-full shadow-lg shadow-primary/20" size="lg" disabled={loading || !sessionReady}>
              {loading ? "Updating password..." : "Update password"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Need another reset email?{" "}
              <Link href="/auth/reset-password" className="text-primary underline-offset-4 hover:underline">
                Request new link
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
