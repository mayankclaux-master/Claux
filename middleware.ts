import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest): NextResponse {
  if (request.nextUrl.pathname.startsWith('/admin/claux-crm')) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!admin/claux-crm|api/whatsapp/crm|_next/static|_next/image|favicon.ico).*)',
  ]
}
