import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbConnected = false;
  let webhookActive = false;

  // Check database connection
  try {
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase.from("tenants").select("id").limit(1);
    dbConnected = !error;
  } catch (err) {
    console.error("[Health Check] Database connection failed:", err);
    dbConnected = false;
  }

  // Check webhook configuration (check if secret is set)
  webhookActive = !!env.CLERK_WEBHOOK_SECRET;

  // Optional: Check recent webhook activity (if we have a logs table)
  // This is a placeholder for future implementation

  const healthStatus = {
    status: dbConnected ? "ok" : "degraded",
    timestamp,
    db_connected: dbConnected,
    webhook_active: webhookActive,
  };

  const statusCode = dbConnected ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
