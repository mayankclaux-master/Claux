import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: contextData, error: contextError } = await supabase
    .from("dashboard_context_v1")
    .select("full_name, business_name, tenant_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (contextError) {
    console.error("[Dashboard Context] Query error:", contextError);
    return NextResponse.json({ error: "Failed to query dashboard context" }, { status: 500 });
  }

  if (!contextData) {
    console.warn("[Dashboard Context] No context found for user:", userId);
    return NextResponse.json({ error: "Dashboard context not found" }, { status: 404 });
  }

  console.log("[Dashboard Context] Response:", {
    userId,
    tenant_id: contextData.tenant_id,
    full_name: contextData.full_name,
    business_name: contextData.business_name,
    timestamp: new Date().toISOString()
  });

  return NextResponse.json(contextData);
}
