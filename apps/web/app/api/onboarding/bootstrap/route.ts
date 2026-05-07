import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile?.tenant_id) {
    return NextResponse.json({
      success: true,
      tenant_id: existingProfile.tenant_id
    });
  }

  const body = await request.json();
  const { businessName, fullName } = body;

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc("bootstrap_tenant_for_user", {
      p_user_id: userId,
      p_tenant_name: businessName,
      p_full_name: fullName,
    });

    if (rpcError) {
      console.error("BOOTSTRAP ERROR:", rpcError);
      return NextResponse.json({
        error: rpcError?.message || "Unknown error",
        details: rpcError
      }, { status: 500 });
    }

    if (!rpcData) {
      console.error("BOOTSTRAP ERROR: No data returned from RPC");
      return NextResponse.json({
        error: "No data returned from RPC",
        details: null
      }, { status: 500 });
    }

    const result = rpcData as { status: string; tenant_id: string };

    if (!result.tenant_id) {
      console.error("BOOTSTRAP ERROR: No tenant_id in result");
      return NextResponse.json({
        error: "No tenant_id in result",
        details: result
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tenant_id: result.tenant_id
    });
  } catch (error) {
    console.error("BOOTSTRAP ERROR:", error);
    return NextResponse.json({
      error: (error as any)?.message || "Unknown error",
      details: error
    }, { status: 500 });
  }
}
