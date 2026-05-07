import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { TenantProvider } from "@/contexts/TenantContext";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "CLAUX",
  description: "Professional multi-tenant SEO SaaS onboarding"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <TenantProvider>{children}</TenantProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
