import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

type ScanRequest = {
  websiteUrl: string;
};

function detectTechStackFromSignals(headers: Headers, html: string) {
  const headerBlob = `${headers.get("x-powered-by") ?? ""} ${headers.get("server") ?? ""}`.toLowerCase();
  const page = html.toLowerCase();

  if (page.includes("cdn.shopify.com") || page.includes("shopify") || page.includes("myshopify")) {
    return { techStack: "shopify", detectedLabel: "Shopify Detected" };
  }

  if (page.includes("wp-content") || page.includes("wp-includes") || headerBlob.includes("wordpress")) {
    return { techStack: "wordpress", detectedLabel: "WordPress Detected" };
  }

  if (headerBlob.includes("next.js") || page.includes("__next") || page.includes("next/script")) {
    return { techStack: "react", detectedLabel: "Next.js Detected" };
  }

  if (page.includes("laravel") || headerBlob.includes("laravel")) {
    return { techStack: "laravel", detectedLabel: "Laravel Detected" };
  }

  return { techStack: "unknown", detectedLabel: "Custom Stack Detected" };
}

export async function POST(request: Request) {
  // Verify Clerk authentication and extract JWT
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "supabase" });

  if (!userId || !token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { websiteUrl } = (await request.json()) as ScanRequest;

  if (!websiteUrl) {
    return NextResponse.json({ error: "Website URL is required." }, { status: 400 });
  }

  let normalizedUrl: URL;
  try {
    normalizedUrl = new URL(websiteUrl);
  } catch {
    return NextResponse.json({ error: "Invalid website URL." }, { status: 400 });
  }

  if (normalizedUrl.protocol !== "http:" && normalizedUrl.protocol !== "https:") {
    return NextResponse.json({ error: "Website URL must start with http or https." }, { status: 400 });
  }

  const response = await fetch(normalizedUrl.toString(), {
    method: "GET",
    redirect: "follow",
    headers: {
      "user-agent": "CLAUX Onboarding Scanner"
    }
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Could not scan website." }, { status: 502 });
  }

  const html = await response.text();
  const detection = detectTechStackFromSignals(response.headers, html);

  const robotsUrl = new URL("/robots.txt", normalizedUrl.origin).toString();
  let hasRobotsTxt = false;
  try {
    const robotsResponse = await fetch(robotsUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "user-agent": "CLAUX Onboarding Scanner"
      }
    });
    hasRobotsTxt = robotsResponse.ok;
  } catch {
    hasRobotsTxt = false;
  }

  return NextResponse.json({
    techStack: detection.techStack,
    detectedLabel: detection.detectedLabel,
    seoHealth: {
      hasSsl: normalizedUrl.protocol === "https:",
      hasRobotsTxt
    }
  });
}
