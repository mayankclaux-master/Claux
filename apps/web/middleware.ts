import { clerkMiddleware } from "@clerk/nextjs/server";

const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/login",
  "/auth/signup",
  "/api/integrations/google/connect",
  "/api/integrations/google/callback"
];

// Internal admin routes - require admin role
const internalAdminRoutes = [
  "/internal/admin"
];

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Debug logging for middleware execution
  console.log("[Middleware] Request:", {
    pathname,
    isPublic: publicRoutes.some(route => pathname.startsWith(route)),
    isInternalAdmin: internalAdminRoutes.some(route => pathname.startsWith(route)),
    method: req.method
  });

  const isPublic = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  const isInternalAdmin = internalAdminRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isPublic) {
    if (isInternalAdmin) {
      // Internal admin routes require authentication and admin role
      auth().protect();
      // Additional role check should be done in the page component
      // This is a placeholder for role-based access control
      const session = auth();
      // In production, verify user has admin role before allowing access
    } else {
      auth().protect();
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
