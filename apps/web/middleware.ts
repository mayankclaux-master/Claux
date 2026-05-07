import { clerkMiddleware } from "@clerk/nextjs/server";

const publicRoutes = [
  "/sign-in",
  "/sign-up",
  "/login",
  "/auth/signup"
];

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

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
