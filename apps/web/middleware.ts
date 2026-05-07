import { clerkMiddleware } from "@clerk/nextjs/server";

const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/login",
  "/auth/signup",
  "/api/integrations/google/connect",
  "/api/integrations/google/callback"
];

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Debug logging for middleware execution
  console.log("[Middleware] Request:", {
    pathname,
    isPublic: publicRoutes.some(route => pathname.startsWith(route)),
    method: req.method
  });

  const isPublic = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (!isPublic) {
    auth().protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
  ],
};
