import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import { TenantProvider } from "@/contexts/TenantContext";

export const metadata: Metadata = {
  title: "CLAUX",
  description: "Professional multi-tenant SEO SaaS onboarding"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}>
        <TenantProvider>{children}</TenantProvider>
      </body>
    </html>
  );
}
