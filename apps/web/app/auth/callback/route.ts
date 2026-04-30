import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
  const { searchParams, hash, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // Check for hash fragment errors (implicit flow fallback)
  if (hash.includes('error=')) {
    const errorParams = new URLSearchParams(hash.slice(1))
    const errorCode = errorParams.get('error_code')
    const errorDesc = errorParams.get('error_description')
    console.error('Auth callback hash error:', errorCode, errorDesc)
    return NextResponse.redirect(`${origin}/login?error=${errorCode || 'auth_error'}`)
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }: any) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  return NextResponse.redirect(`${origin}/onboarding/provisioning`)
}
