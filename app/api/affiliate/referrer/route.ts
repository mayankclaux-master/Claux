import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code')?.trim()

  if (!code) {
    return NextResponse.json({ name: null }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ name: null }, { status: 500 })
  }

  const db = createClient(supabaseUrl, serviceRoleKey, {
    db: { schema: 'affiliates' },
    auth: { persistSession: false, autoRefreshToken: false },
  }) as any

  const { data } = await db
    .from('affiliates')
    .select('full_name')
    .eq('affiliate_code', code)
    .maybeSingle()

  return NextResponse.json(
    { name: (data?.full_name as string | null) ?? null },
    {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    }
  )
}
