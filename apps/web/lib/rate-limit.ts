// Simple in-memory rate limiter (temporary solution)
// For production, consider using Upstash Redis or a dedicated rate limiting service

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const LIMIT = 5; // requests
const WINDOW = 60 * 1000; // 1 minute in milliseconds

export function checkRateLimit(userId: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(userId);

  // Clean up expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(userId);
  }

  const currentEntry = rateLimitStore.get(userId);

  if (!currentEntry) {
    // First request in window
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + WINDOW,
    });
    return { allowed: true };
  }

  if (currentEntry.count >= LIMIT) {
    // Rate limit exceeded
    return {
      allowed: false,
      resetTime: currentEntry.resetTime,
    };
  }

  // Increment counter
  currentEntry.count++;
  return { allowed: true };
}

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}
