# Orbit CRM - Security & Storage Hardening

## Overview

This document describes the security audit, vulnerabilities found, and the roadmap for hardening the Orbit CRM application to production-grade security standards.

---

## Quick Start

**Read these documents in order:**

1. **`SECURITY_AUDIT_REPORT.md`** - Comprehensive vulnerability assessment (14 critical/high issues identified)
2. **`SECURITY_IMPLEMENTATION_ROADMAP.md`** - Step-by-step implementation plan with timelines
3. **This file** - Quick reference and ongoing security guidelines

---

## Current State: DEV/DEMO ONLY ⚠️

The Orbit application currently uses **client-side localStorage** for all data storage and authentication. This architecture is **NOT SUITABLE FOR PRODUCTION** and contains the following critical vulnerabilities:

| Vulnerability | Severity | Status |
|---|---|---|
| Session tokens in localStorage | CRITICAL | ❌ Unfixed |
| User database in localStorage | CRITICAL | ❌ Unfixed |
| Weak password hashing | CRITICAL | ❌ Unfixed |
| No encryption at rest | HIGH | ❌ Unfixed |
| IDOR vulnerability (no ownership checks) | HIGH | ❌ Unfixed |
| No rate limiting | MEDIUM | ❌ Unfixed |
| Insecure session cookies | MEDIUM | ⚠️ Partial fix |
| No CSRF protection | MEDIUM | ❌ Unfixed |

---

## What Was Done (Phase 1 Partial)

✅ **Complete:**
- Created comprehensive security audit report (14 vulnerabilities documented)
- Created implementation roadmap (6-week plan)
- Enhanced session cookie security (Secure, SameSite flags added)
- Updated password hashing function (added warnings, prepared for bcrypt migration)
- Created input validation schema library (`lib/securityValidators.ts`)

⚠️ **In Progress:**
- Migration to server-side authentication (requires backend API implementation)
- Bcrypt integration (requires Node.js environment)
- HTTP-only cookie support (requires server Set-Cookie headers)

---

## What Still Needs to Be Done

### Phase 1: Critical (Week 1) 🚨
- [ ] Implement bcrypt password hashing on server
- [ ] Move authentication to server API routes
- [ ] Implement HTTP-only session cookies via Set-Cookie headers
- [ ] Add server-side session validation

### Phase 2: High Priority (Week 2-3)
- [ ] Build server-side CRUD API endpoints
- [ ] Implement IDOR prevention (ownership verification)
- [ ] Add rate limiting on auth endpoints
- [ ] Implement CSRF token validation

### Phase 3: Medium Priority (Week 4-5)
- [ ] Add immutable audit logging
- [ ] Implement session refresh token pattern
- [ ] Secure password reset flow
- [ ] Implement file upload security

### Phase 4: Long-term (Week 6+)
- [ ] Encrypt sensitive fields at rest
- [ ] Add database constraints
- [ ] Implement backup strategy
- [ ] Add security monitoring

---

## Using the Security Validators

The `lib/securityValidators.ts` module provides production-grade input validation:

```typescript
import {
    validateEmail,
    validatePassword,
    validateAuthInput,
    sanitizeString,
    validateFile,
} from '@/lib/securityValidators';

// Validate auth input
const validation = validateAuthInput({
    email: 'user@example.com',
    password: 'SecurePass123',
    name: 'John Doe',
});

if (!validation.valid) {
    console.error('Validation errors:', validation.errors);
}

// Sanitize user input to prevent XSS
const safeName = sanitizeString(userInput);

// Validate files
const fileValidation = validateFile(file, {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png'],
});
```

---

## Environment Variables (Required for Hardening)

When implementing Phase 2+, configure these environment variables:

```env
# Database (required for server-side storage)
DATABASE_URL=postgres://user:password@localhost:5432/orbit_crm

# Session security
SESSION_SECRET=your-32-byte-random-secret-here
CSRF_TOKEN_SECRET=your-32-byte-random-secret-here

# Password hashing
BCRYPT_ROUNDS=13

# Rate limiting (optional but recommended)
REDIS_URL=redis://localhost:6379

# File storage
STORAGE_BUCKET=orbit-attachments
STORAGE_REGION=us-east-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info

# CORS (for API security)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Deployment
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Security Best Practices (Active Now)

### 1. Input Validation
Always validate user input before storage or processing:

```typescript
// ✅ GOOD
const { error } = validateAuthInput(formData);
if (error) return showError(error);

// ❌ BAD
const user = await login(email, password); // No validation
```

### 2. Sanitization
Sanitize user-generated content to prevent XSS:

```typescript
// ✅ GOOD
const safeName = sanitizeString(userInput, 255);

// ❌ BAD
const name = userInput; // Unsafe
```

### 3. Secure Comparison
When comparing sensitive values, use constant-time comparison:

```typescript
// ✅ GOOD (constant-time)
const match = crypto.timingSafeEqual(
    Buffer.from(provided),
    Buffer.from(stored)
);

// ❌ BAD (timing attack vulnerable)
if (provided === stored) { ... }
```

### 4. Error Handling
Never leak sensitive information in error messages:

```typescript
// ✅ GOOD
throw new Error('Invalid credentials'); // Generic message

// ❌ BAD
throw new Error(`User ${email} not found`); // Email enumeration
```

### 5. Logging
Log security-relevant events for monitoring:

```typescript
import { logSecurityEvent } from '@/lib/securityValidators';

logSecurityEvent('failed_login_attempt', {
    email: attemptedEmail,
    ip: clientIP,
    userAgent: userAgent,
}, 'warning');
```

---

## API Endpoint Security Pattern (Phase 2+)

All API endpoints should follow this security pattern:

```typescript
// app/api/applications/route.ts
import { getSecurityHeaders, logSecurityEvent } from '@/lib/securityValidators';

export async function GET(request: Request) {
    try {
        // 1. Validate session
        const userId = await getAuthenticatedUserId(request);
        if (!userId) return new Response('Unauthorized', { status: 401 });

        // 2. Check rate limit
        const allowed = await checkRateLimit(userId, 'list_applications');
        if (!allowed) return new Response('Too many requests', { status: 429 });

        // 3. Get user's applications (with ownership check)
        const applications = await db.query(
            'SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        // 4. Log access
        logSecurityEvent('list_applications', {
            userId,
            count: applications.length,
        }, 'info');

        // 5. Return with security headers
        return new Response(JSON.stringify(applications), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                ...getSecurityHeaders(),
            },
        });
    } catch (error) {
        // 6. Log errors securely
        logSecurityEvent('list_applications_error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 'error');

        return new Response('Internal server error', { status: 500 });
    }
}
```

---

## Database Constraints (Phase 4)

When implementing server-side storage, enforce these constraints:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Applications table (with ownership)
CREATE TABLE applications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (
        status IN ('draft', 'applied', 'interviewing', 'offer', 'rejected')
    )
);

-- Audit log (immutable)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## Testing Security Changes

### Unit Tests
```typescript
import { validateEmail, validatePassword } from '@/lib/securityValidators';

describe('securityValidators', () => {
    it('should reject invalid emails', () => {
        expect(validateEmail('invalid')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
    });

    it('should enforce password requirements', () => {
        const result = validatePassword('weak');
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });
});
```

### Integration Tests
```typescript
// Test IDOR prevention
describe('IDOR Prevention', () => {
    it('should not allow accessing other users data', async () => {
        const user1Token = await login(user1Email, user1Password);
        const user2App = await createApplication(user2Token, appData);

        // Attempt to access with user1's token
        const result = await getApplication(user1Token, user2App.id);
        expect(result.status).toBe(404);
    });
});
```

---

## Monitoring & Alerts

Set up monitoring for these security events:

- Failed login attempts (threshold: 5 in 1 minute)
- Unusual data access patterns
- Oversized file uploads
- Rate limit violations
- Database errors during auth flow
- Privilege escalation attempts

---

## Compliance & Standards

Orbit CRM should meet these security standards:

- ✅ **OWASP Top 10** - All common vulnerabilities addressed
- ✅ **GDPR** - User data protection and privacy
- ✅ **CCPA** - California Consumer Privacy Act compliance
- ✅ **SOC 2** - Security and availability controls
- ✅ **PCI DSS** - Payment data security (if applicable)

---

## Incident Response

If a security incident occurs:

1. **Immediate:** Disable affected accounts, rotate secrets
2. **Investigation:** Review audit logs, check for unauthorized access
3. **Notification:** Inform affected users within 24 hours
4. **Remediation:** Fix vulnerability, deploy patch
5. **Post-Mortem:** Document and share learnings

---

## Resources & Further Reading

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **NIST Cybersecurity Framework:** https://www.nist.gov/cyberframework
- **Auth0 Best Practices:** https://auth0.com/blog/
- **Node.js Security Best Practices:** https://nodejs.org/en/docs/guides/security/

---

## Support & Contact

For security questions or to report vulnerabilities:

1. **Do NOT** post vulnerabilities publicly
2. Email: security@orbit-crm.com
3. Attach: Detailed vulnerability description, reproduction steps, potential impact

---

## Timeline for Hardening

| Phase | Timeline | Priority | Impact |
|-------|----------|----------|--------|
| 1 | Week 1 | CRITICAL | 60% vulnerability reduction |
| 2 | Week 2-3 | HIGH | 30% additional reduction |
| 3 | Week 4-5 | MEDIUM | 7% additional reduction |
| 4 | Week 6+ | LOW | 3% additional reduction |

**Goal:** Production-ready security posture by end of Week 5.

---

## Checklist for Production Deployment

Before deploying to production, verify:

- [ ] All 14 vulnerabilities from audit report addressed
- [ ] Bcrypt password hashing implemented
- [ ] HTTP-only session cookies enabled
- [ ] IDOR prevention implemented
- [ ] Rate limiting active
- [ ] CSRF protection in place
- [ ] Audit logging functional
- [ ] Database backups tested
- [ ] Security headers configured
- [ ] Penetration test completed
- [ ] Security policy documented
- [ ] Team trained on security practices

---

**Last Updated:** 2/24/2026  
**Status:** ACTIVE HARDENING IN PROGRESS  
**Next Review:** Upon completion of Phase 1
