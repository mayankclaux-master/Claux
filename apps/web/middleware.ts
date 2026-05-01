import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

// Force Node.js runtime on Vercel to prevent handshake issues
export const runtime = 'nodejs';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
