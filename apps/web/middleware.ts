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

  // TEMPORARY BYPASS: Commenting out to allow testing without SMTP confirmation
  /*
  if (!user.email_confirmed_at) {
    if (pathname === '/auth/verify-email' || pathname === '/auth/callback') {
      return response
    }
    return NextResponse.redirect(new URL('/auth/verify-email', request.url))
  }
  */

  if (isProvisioningRoute) {
    return response
  }

  if (isOnboardingRoute || isDashboardRoute) {
    // EXCEPTION: If user is already on /onboarding, don't redirect back to provisioning
    if (isOnboardingRoute) return response;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, provisioning_status')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id || profile.provisioning_status !== 'completed') {
      return NextResponse.redirect(new URL('/onboarding/provisioning', request.url))
    }

    if (isDashboardRoute) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('onboarding_completed')
        .eq('id', profile.tenant_id)
        .single()

      if (!tenant?.onboarding_completed) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
