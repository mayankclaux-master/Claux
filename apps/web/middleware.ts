import { NextResponse, type NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const PUBLIC_ROUTES = ['/', '/login', '/auth/signup', '/auth/callback',
  '/auth/verify-email', '/auth/reset-password', '/auth/update-password']

const AUTH_ONLY_ROUTES = ['/login', '/auth/signup']

const isPublicRoute = createRouteMatcher([...PUBLIC_ROUTES].map(route => route))
const isAuthOnlyRoute = createRouteMatcher([...AUTH_ONLY_ROUTES].map(route => route))
const isProvisioningRoute = createRouteMatcher(['/onboarding/provisioning'])
const isOnboardingRoute = createRouteMatcher(['/onboarding'])
const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const { userId } = await auth()

  // Allow public routes without authentication
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth-only routes
  if (isAuthOnlyRoute(request) && userId) {
    return NextResponse.redirect(new URL('/onboarding/provisioning', request.url))
  }

  // Require authentication for protected routes
  if (!userId) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Allow provisioning and onboarding routes to handle their own logic
  if (isProvisioningRoute(request) || isOnboardingRoute(request)) {
    return NextResponse.next()
  }

  // Dashboard routes require profile/tenant checks (will be handled by page logic)
  if (isDashboardRoute(request)) {
    return NextResponse.next()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
