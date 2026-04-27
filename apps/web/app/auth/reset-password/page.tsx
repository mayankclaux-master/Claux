"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setMessage(null);

    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setLoading(false);
      setError("Please enter your account email.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message ?? "Could not send password reset email.");
      return;
    }

    setMessage("Reset link sent. Please check your email and open the secure recovery link.");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6 sm:py-10">
      <Card className="w-full border-border/70 bg-card/95 backdrop-blur">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>We will email you a secure password reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="jane@gmail.com" required />
            </div>

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

            <Button className="w-full shadow-lg shadow-primary/20" size="lg" disabled={loading}>
              {loading ? "Sending reset link..." : "Send reset link"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Remembered your password?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
