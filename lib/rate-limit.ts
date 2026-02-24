// In-memory rate limiting (for production, consider using Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  default: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
};

export function getRateLimitKey(endpoint: string, identifier: string): string {
  return `${endpoint}:${identifier}`;
}

export function checkRateLimit(key: string, config: RateLimitConfig = DEFAULT_CONFIGS.default): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    // First request
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return true;
  }

  if (now > record.resetTime) {
    // Window expired, reset
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return true;
  }

  if (record.count >= config.maxRequests) {
    // Rate limit exceeded
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

export function getRateLimitRemaining(key: string, config: RateLimitConfig = DEFAULT_CONFIGS.default): number {
  const record = rateLimitStore.get(key);
  if (!record) return config.maxRequests;

  const now = Date.now();
  if (now > record.resetTime) {
    return config.maxRequests;
  }

  return Math.max(0, config.maxRequests - record.count);
}

export function getRateLimitResetTime(key: string): number {
  const record = rateLimitStore.get(key);
  if (!record) return 0;
  return Math.max(0, record.resetTime - Date.now());
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + 60000) {
      // Remove entries that are 1 minute past expiration
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes

export const RATE_LIMIT_CONFIGS = DEFAULT_CONFIGS;
