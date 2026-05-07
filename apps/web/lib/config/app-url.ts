export function getAppUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (envUrl) {
    return envUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL is required in production"
    );
  }

  return "http://localhost:3000";
}
