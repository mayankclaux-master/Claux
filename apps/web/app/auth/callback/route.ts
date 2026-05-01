import { NextResponse, type NextRequest } from 'next/server'

// Obsolete Supabase auth callback - Clerk handles its own auth callbacks internally
// Redirect to login page for any legacy Supabase callback attempts
export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/login`)
}
