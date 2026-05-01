import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
}

export async function GET(request: NextRequest) {
  const { searchParams, hash, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('Auth callback invoked:', {
    hasCode: !!code,
    hasHash: !!hash,
    url: request.url
  })

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

  // Check for hash fragment errors (implicit flow fallback)
  if (hash.includes('error=')) {
    const errorParams = new URLSearchParams(hash.slice(1))
    const errorCode = errorParams.get('error_code')
    const errorDesc = errorParams.get('error_description')
    console.error('Auth callback hash error:', errorCode, errorDesc)
    
    // Fallback: check if user already has a valid session despite hash error
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('Hash error but user has valid session, proceeding to provisioning')
      return NextResponse.redirect(`${origin}/onboarding/provisioning`)
    }
    
    return NextResponse.redirect(`${origin}/login?error=${errorCode || 'auth_error'}`)
  }

  if (!code) {
    // Fallback: check if user already has a valid session without code
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('No code but user has valid session, proceeding to provisioning')
      return NextResponse.redirect(`${origin}/onboarding/provisioning`)
    }
    
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback code exchange error:', error.message)
    
    // Fallback: check if user already has a valid session despite code exchange failure
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      console.log('Code exchange failed but user has valid session, proceeding to provisioning')
      return NextResponse.redirect(`${origin}/onboarding/provisioning`)
    }
    
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
  }

  console.log('Auth callback successful, redirecting to provisioning')
  return NextResponse.redirect(`${origin}/onboarding/provisioning`)
}
