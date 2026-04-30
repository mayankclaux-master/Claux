import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function normalizeSupabaseUrl(value: string) {
  return value.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const PUBLIC_ROUTES = ['/', '/login', '/auth/signup', '/auth/callback',
  '/auth/verify-email', '/auth/reset-password', '/auth/update-password']

const AUTH_ONLY_ROUTES = ['/login', '/auth/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL!),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.includes(pathname)
  const isProvisioningRoute = pathname === '/onboarding/provisioning'
  const isOnboardingRoute = pathname === '/onboarding'
  const isDashboardRoute = pathname.startsWith('/dashboard')

  if (!user || userError) {
    if (isPublicRoute) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthOnlyRoute) {
    return NextResponse.redirect(new URL('/onboarding/provisioning', request.url))
  }

  // Email verification disabled for smooth SaaS-like signup experience
  // Users can proceed immediately after signup without waiting for email confirmation

  if (isProvisioningRoute) {
    return response
  }

  if (isOnboardingRoute) {
    // Allow onboarding page to handle its own logic
    return response
  }

  if (isDashboardRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, provisioning_status')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id || profile.provisioning_status !== 'completed') {
      return NextResponse.redirect(new URL('/onboarding/provisioning', request.url))
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('onboarding_completed')
      .eq('id', profile.tenant_id)
      .single()

    if (!tenant?.onboarding_completed) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
