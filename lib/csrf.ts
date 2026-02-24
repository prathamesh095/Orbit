import crypto from 'crypto';

// Store CSRF tokens temporarily (in production, use persistent storage like Redis)
const csrfTokenStore = new Map<string, { token: string; expiresAt: number }>();

const CSRF_TOKEN_VALIDITY = 24 * 60 * 60 * 1000; // 24 hours

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createCsrfToken(): string {
  const token = generateCsrfToken();
  const expiresAt = Date.now() + CSRF_TOKEN_VALIDITY;
  
  // Store token for validation
  csrfTokenStore.set(token, { token, expiresAt });
  
  return token;
}

export function validateCsrfToken(token: string): boolean {
  const record = csrfTokenStore.get(token);
  
  if (!record) {
    return false;
  }
  
  const now = Date.now();
  if (now > record.expiresAt) {
    csrfTokenStore.delete(token);
    return false;
  }
  
  // Valid token, remove it (one-time use)
  csrfTokenStore.delete(token);
  return true;
}

// Clean up expired tokens periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of csrfTokenStore.entries()) {
    if (now > record.expiresAt) {
      csrfTokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000); // Clean up every hour

export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

export function shouldSkipCsrfValidation(pathname: string): boolean {
  const publicPaths = ['/api/auth/login', '/api/auth/register'];
  // For auth endpoints, we might skip CSRF in favor of other security measures
  return publicPaths.some(path => pathname.includes(path));
}
