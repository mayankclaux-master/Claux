"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function ProvisioningPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return null;
  }

  const businessName = (user.unsafeMetadata?.businessName as string) || user.firstName || "My Business";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "";

  async function handleStartSetup() {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, fullName })
      });

      if (!response.ok) {
        setError("Failed to initialize tenant. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.success) {
        router.replace("/onboarding");
      } else {
        setError("Failed to initialize tenant. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="text-center max-w-md">
        <h1 className="text-white text-2xl font-semibold mb-4">Setup Your Workspace</h1>
        <p className="text-gray-400 text-sm mb-8">
          Initialize your SEO operating system with a few quick steps.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleStartSetup}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? "Setting up..." : "Start Setup"}
        </Button>
      </div>
    </div>
  );
}
