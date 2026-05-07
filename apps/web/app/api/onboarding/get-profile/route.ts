import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { userId, getToken } = await auth();

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });

  if (!token) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClerkSupabaseClient(token);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: "Failed to fetch profile" }, { status: 500 });
  }

  if (!profile) {
    return Response.json({ profile: null, tenant: null });
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", profile.tenant_id)
    .maybeSingle();

  if (tenantError) {
    return Response.json({ error: "Failed to fetch tenant" }, { status: 500 });
  }

  return Response.json({ profile, tenant });
}
