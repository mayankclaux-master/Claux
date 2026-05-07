import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { getToken } = auth();
  const token = await getToken({ template: "supabase" });

  return Response.json({
    success: true,
    token
  });
}
