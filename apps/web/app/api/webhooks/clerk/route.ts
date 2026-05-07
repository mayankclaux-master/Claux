import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  console.log("WEBHOOK HIT");
  
  const payload = await request.text();
  const headers = request.headers;

  console.log("Headers:", Object.fromEntries(headers.entries()));
  console.log("Raw body received:", payload);

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[Clerk Webhook] Missing required svix headers");
    return NextResponse.json({ error: "Missing required headers" }, { status: 400 });
  }

  const wh = new Webhook(env.CLERK_WEBHOOK_SECRET);

  let event: any;

  try {
    event = wh.verify(payload || "", {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    console.error("[Clerk Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log("Event type:", event.type);

  const eventType = event.type;

  if (eventType === "user.created") {
    const userData = event.data;
    const clerkUserId = userData.id;
    const firstName = userData.first_name || "";
    const lastName = userData.last_name || "";
    const emailAddress = userData.email_addresses?.[0]?.email_address || "";

    const fullName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : firstName || lastName || emailAddress;

    console.log("USER CREATED EVENT RECEIVED", {
      userId: clerkUserId,
      email: emailAddress,
      fullName,
    });

    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
      // Check if tenant already exists (idempotency check)
      const { data: existingProfile, error: profileError } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", clerkUserId)
        .maybeSingle();

      if (profileError) {
        console.error("[Clerk Webhook] Profile query error:", profileError);
        return NextResponse.json({ error: "Failed to query profile" }, { status: 500 });
      }

      if (existingProfile?.tenant_id) {
        console.log("[Clerk Webhook] Webhook duplicate ignored - tenant already exists", {
          userId: clerkUserId,
          tenant_id: existingProfile.tenant_id,
        });
        return NextResponse.json({ success: true, message: "Tenant already exists" }, { status: 200 });
      }

      // Only bootstrap if tenant is missing
      console.log("CALLING bootstrap_tenant_for_user");
      const { data: rpcData, error: rpcError } = await supabase.rpc("bootstrap_tenant_for_user", {
        p_user_id: clerkUserId,
        p_tenant_name: "My Business",
        p_full_name: fullName,
      });

      if (rpcError) {
        console.error("WEBHOOK ERROR:", rpcError);
        console.error("[Clerk Webhook] bootstrap_tenant_for_user RPC error:", rpcError);
        return NextResponse.json({ error: "Failed to bootstrap tenant" }, { status: 500 });
      }

      const result = rpcData as { status: string; tenant_id: string };

      console.log("BOOTSTRAP RESULT:", result);

      console.log("[Observability] Tenant created for userId", {
        userId: clerkUserId,
        tenant_id: result.tenant_id,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
      console.error("[Clerk Webhook] Exception during tenant bootstrap:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  console.log("[Clerk Webhook] Unhandled event type:", eventType);
  return NextResponse.json({ success: true }, { status: 200 });
}
