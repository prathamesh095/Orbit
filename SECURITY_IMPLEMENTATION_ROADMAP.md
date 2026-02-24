# Security & Storage Hardening - Implementation Roadmap

## Overview
This document outlines the step-by-step implementation of production-grade security and storage architecture for Orbit CRM.

---

## PHASE 1: IMMEDIATE FIXES (Critical Path - Week 1)

### 1.1 Implement Bcrypt Password Hashing
**File:** `services/auth/authService.ts`
- [ ] Install `bcryptjs` package
- [ ] Replace `hashPassword()` with bcrypt implementation
- [ ] Update register/login/resetPassword flows
- [ ] Test password verification

**Impact:** Eliminates CRITICAL password vulnerability

### 1.2 Add HTTP-Only Session Cookies
**File:** `services/auth/authService.ts`, `proxy.ts`
- [ ] Update `setSessionCookie()` to include `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Ensure session validation happens server-side (via proxy/middleware)
- [ ] Test that JavaScript cannot access session cookie

**Impact:** Prevents XSS-based token theft

### 1.3 Add Basic Input Validation
**New File:** `lib/validators.ts`
- [ ] Create Zod schemas for all entities
- [ ] Validate email format
- [ ] Validate password requirements
- [ ] Validate application/contact data

**Impact:** Prevents malformed/malicious data storage

---

## PHASE 2: SHORT-TERM HARDENING (Week 2-3)

### 2.1 Implement Server-Side Storage (Next.js API Routes)
**New Files:** `app/api/auth/*`, `app/api/applications/*`, `app/api/contacts/*`
- [ ] Create API endpoints for CRUD operations
- [ ] Move business logic to server
- [ ] Implement proper error handling
- [ ] Add request logging

**Impact:** Shifts sensitive logic to secure server environment

### 2.2 Add Ownership Verification (IDOR Prevention)
**Pattern:** Apply to all data access
```typescript
async function getApplication(userId: string, appId: string) {
  const app = await db.query(
    'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
    [appId, userId]
  );
  if (!app) throw new Error('Not found');
  return app;
}
```
- [ ] Verify user_id on every read
- [ ] Verify user_id on every write/delete
- [ ] Never trust client-provided userId
- [ ] Return generic errors

**Impact:** Prevents horizontal privilege escalation

### 2.3 Implement Rate Limiting
**New File:** `lib/rateLimit.ts`
- [ ] Install `ioredis` and `redis` for distributed rate limiting
- [ ] Create rate limiter middleware
- [ ] Apply to: `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password`
- [ ] Limits: 5/min (login), 3/hour (register), 3/day (forgot-password)

**Impact:** Prevents brute force attacks

### 2.4 Add CSRF Protection
**File:** `lib/csrf.ts`
- [ ] Generate CSRF tokens per session
- [ ] Store in session/database
- [ ] Validate on POST/PUT/DELETE requests
- [ ] Implement double-submit pattern

**Impact:** Prevents cross-site request forgery

---

## PHASE 3: MEDIUM-TERM ENHANCEMENTS (Week 4-5)

### 3.1 Add Audit Logging
**New File:** `services/audit/auditService.ts`
- [ ] Create audit log table
- [ ] Log all auth events
- [ ] Log all data mutations
- [ ] Include: timestamp, user, action, IP, user-agent
- [ ] Make audit log immutable

**Impact:** Full accountability and forensics

### 3.2 Implement Session Refresh Token Pattern
**File:** `services/auth/authService.ts`
- [ ] Create short-lived access tokens (15 min)
- [ ] Create long-lived refresh tokens (7 days)
- [ ] Implement token refresh endpoint
- [ ] Store refresh tokens in secure HTTP-only cookie

**Impact:** Limits window of token compromise

### 3.3 Add Password Reset Security
**File:** `services/auth/authService.ts`
- [ ] Generate secure reset tokens (cryptographically random)
- [ ] Store reset tokens in database (not localStorage)
- [ ] Set expiration (15 minutes)
- [ ] Use time-constant comparison
- [ ] One-time use enforcement

**Impact:** Secures password recovery flow

### 3.4 Implement File Upload Security
**New File:** `services/file/fileService.ts`
- [ ] Validate MIME type
- [ ] Validate file size (max 10MB)
- [ ] Generate safe filenames (UUID)
- [ ] Store with user_id ownership
- [ ] Implement virus scanning hook
- [ ] Require auth to download

**Impact:** Secure file handling

---

## PHASE 4: LONG-TERM SECURITY (Week 6+)

### 4.1 Encrypt Sensitive Fields at Rest
**File:** `services/encryption/encryptionService.ts`
- [ ] Implement field-level encryption
- [ ] Encrypt: email, phone, address
- [ ] Use AES-256-GCM
- [ ] Store encryption key in environment variable
- [ ] Implement key rotation strategy

**Impact:** Protection against database breaches

### 4.2 Add Database Constraints
**Migration:** `scripts/001_initial_schema.sql`
- [ ] Add UNIQUE constraint on email
- [ ] Add NOT NULL constraints
- [ ] Add foreign keys
- [ ] Add check constraints
- [ ] Create indexes for performance

**Impact:** Data integrity at database level

### 4.3 Implement Backup & Disaster Recovery
**File:** `services/backup/backupService.ts`
- [ ] Daily automated backups
- [ ] 30-day retention policy
- [ ] Test restore procedures
- [ ] Document recovery plan
- [ ] Implement point-in-time recovery

**Impact:** Business continuity

### 4.4 Add Security Monitoring & Alerting
**File:** `lib/monitoring/securityMonitoring.ts`
- [ ] Integrate with Sentry for error tracking
- [ ] Create alerts for suspicious activity
- [ ] Monitor failed login attempts
- [ ] Monitor unusual data access patterns
- [ ] Alert on security-relevant events

**Impact:** Real-time threat detection

---

## IMPLEMENTATION STRATEGY

### Technology Stack

**Backend Storage:**
- Primary: PostgreSQL (for ACID guarantees)
- Caching: Redis (for rate limiting, sessions)
- ORM: Prisma or Drizzle
- Password Hashing: bcryptjs
- Encryption: `crypto` (Node.js built-in)

**Security Libraries:**
- Rate Limiting: `redis` + custom middleware
- CSRF: `csrf` package or custom
- Audit Logging: Custom service
- Validation: `zod`

### Database Schema (Initial)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP, -- soft delete
  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('draft', 'applied', 'interviewing', 'offer', 'rejected'))
);

-- Audit log table (immutable)
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT immutable CHECK (created_at IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_users_email ON users(email);
```

### API Endpoint Security Pattern

```typescript
// lib/api/secureEndpoint.ts
export async function secureEndpoint<T>(
  request: NextRequest,
  handler: (userId: string, data: any) => Promise<T>,
  options?: {
    rateLimit?: boolean;
    validateSchema?: any;
  }
) {
  // 1. Validate session cookie
  const session = getSessionFromCookie(request);
  if (!session) return unauthorized();

  // 2. Rate limit if enabled
  if (options?.rateLimit) {
    const allowed = await checkRateLimit(session.userId);
    if (!allowed) return tooManyRequests();
  }

  // 3. Validate request body
  if (options?.validateSchema) {
    const body = await request.json();
    const validated = options.validateSchema.parse(body);
    // ... continue with validated data
  }

  // 4. Extract user ID from session (never from request)
  const userId = session.userId;

  // 5. Call handler with user ID
  const result = await handler(userId, validated);

  // 6. Log action to audit trail
  await auditLog(userId, 'action_name', result);

  return result;
}
```

---

## RISK MITIGATION TIMELINE

| Week | Task | Risk Reduction |
|------|------|---|
| 1 | Bcrypt + HTTP-only cookies + Input validation | 60% |
| 2-3 | Server API + IDOR prevention + Rate limiting | 30% |
| 4-5 | Audit logging + Session refresh + Password reset | 7% |
| 6+ | Encryption + Backups + Monitoring | 3% |

---

## SUCCESS CRITERIA

- [ ] All passwords hashed with bcrypt (13+ rounds)
- [ ] Session tokens in HTTP-only cookies only
- [ ] All data mutations require server validation
- [ ] Ownership verified on every resource access
- [ ] Rate limiting active on auth endpoints
- [ ] CSRF tokens validated on state changes
- [ ] Audit log immutable and searchable
- [ ] No client-side storage of sensitive data
- [ ] All API endpoints require authentication
- [ ] Security headers configured
- [ ] HTTPS enforced with HSTS
- [ ] Database constraints enforced
- [ ] Backup strategy tested
- [ ] Penetration test passed
- [ ] OWASP Top 10 checklist completed

---

## TEAM RESPONSIBILITIES

- **Backend Engineer:** API implementation, database design, rate limiting
- **Security Engineer:** Threat modeling, penetration testing, audit logging
- **DevOps:** Infrastructure hardening, monitoring, backup strategy
- **Frontend Engineer:** API integration, secure session handling, CSRF token management

---

**Status:** Ready for implementation  
**Priority:** CRITICAL - Complete before production
**Estimated Effort:** 40-60 hours
