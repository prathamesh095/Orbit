# Production Storage Migration Guide

## Overview

This guide provides a **complete, step-by-step migration** from client-side localStorage to a secure, production-grade PostgreSQL backend with server-side sessions.

---

## Current Architecture (Demo)

```
┌─────────────────────────────────────────────────────┐
│  Browser (Client)                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │  localStorage                                │   │
│  │  • All user data                             │   │
│  │  • Applications, contacts, tasks             │   │
│  │  • User credentials (hashed, but client)     │   │
│  │  • Session token                             │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  authService.ts (Client)                            │
│  • Password hashing (non-cryptographic)             │
│  • All validation logic                             │
│  • Session management                               │
└─────────────────────────────────────────────────────┘

⚠️ SECURITY RISKS:
- All data visible to XSS attacks
- No server-side access control
- Weak password hashing
- No audit logging
- No rate limiting
- IDOR vulnerabilities possible
```

---

## Target Architecture (Production)

```
┌──────────────────────────────────────────────────────────┐
│  Browser (Client)                                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  HTTP-only Cookie (jt_session)                     │  │
│  │  • Session ID only                                 │  │
│  │  • Cannot be accessed by JavaScript                │  │
│  │  • Secure, SameSite=Strict flags                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  UI Data (React state)                                   │
│  • Fetched from API on demand                            │
│  • Never stored in localStorage                          │
└──────────────────────────────────────────────────────────┘
                         ↕ (API calls)
┌──────────────────────────────────────────────────────────┐
│  Server (Next.js API Routes)                             │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Session Store (Redis or Database)                 │  │
│  │  • Validates cookie matches session                │  │
│  │  • Checks expiration                               │  │
│  │  • User ID from session                            │  │
│  │  • Rate limiting                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database                               │  │
│  │  • Users table (id, email, passwordHash, etc.)     │  │
│  │  • Applications table (with user_id FK)            │  │
│  │  • Contacts table (with user_id FK)                │  │
│  │  • All data scoped to authenticated user           │  │
│  │  • Indexes on frequently accessed columns          │  │
│  │  • Constraints enforcing data integrity            │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Authentication Service                            │  │
│  │  • bcryptjs password hashing (13 rounds)           │  │
│  │  • JWT token generation (optional)                 │  │
│  │  • Rate limiting per IP                            │  │
│  │  • Audit logging                                   │  │
│  │  • Email verification                              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘

✅ SECURITY IMPROVEMENTS:
- No client-side data exposure
- Server-side access control
- Cryptographic password hashing
- Audit logging
- Rate limiting
- IDOR prevention
- RLS (Row-Level Security) capable
```

---

## Phase 1: Database Setup (Week 1)

### 1.1 Choose a Database Provider

**Recommended Options:**

| Option | Pros | Cons | Cost |
|--------|------|------|------|
| **Neon (PostgreSQL)** | Serverless, easy scaling, Vercel integration | Slower cold starts | $9-99/mo |
| **Supabase** | Full stack, built-in auth, RLS, easier migrations | Less flexible | $5-100/mo |
| **AWS RDS** | Highly scalable, enterprise ready | Complex setup, more expensive | $15-200+/mo |
| **Local PostgreSQL** | Free, full control | Setup overhead, maintenance | FREE |

**Recommendation for this project:** Neon or Supabase (best Vercel integration)

### 1.2 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  applied_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_applied_date (applied_date)
);

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_email (email)
);

-- Sessions table (for server-side sessions)
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Audit logs table
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(255),
  resource_id VARCHAR(255),
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

### 1.3 Environment Variables

Add to `.env.local`:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/orbit

# Session management
SESSION_SECRET=your-super-secret-key-min-32-chars
SESSION_DURATION_MS=86400000  # 24 hours

# Security
BCRYPT_ROUNDS=13
```

---

## Phase 2: Server-Side Authentication API (Week 1-2)

### 2.1 Install Dependencies

```bash
npm install bcryptjs jsonwebtoken pg dotenv
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

### 2.2 Create Database Client

**`lib/db.ts`:**
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const result = await pool.query(text, params);
  return result;
}

export async function getClient() {
  return pool.connect();
}
```

### 2.3 Create Authentication API Routes

**`app/api/auth/register/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json();

    // Validate inputs
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs
    const passwordHash = await bcrypt.hash(password, 13); // 13 rounds

    // Create user
    const result = await query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email.toLowerCase(), name, passwordHash]
    );

    const user = result.rows[0];

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.id, expiresAt]
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set('jt_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**`app/api/auth/login/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Find user
    const result = await query(
      'SELECT id, email, name, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await query(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
      [sessionId, user.id, expiresAt]
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name }
    });

    response.cookies.set('jt_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## Phase 3: Update Client to Use Server API (Week 2)

### 3.1 Update Auth Service

Update `services/auth/authService.ts` to call the new API routes instead of doing everything client-side.

---

## Phase 4: Data Migration (Week 3)

### 4.1 Migrate Existing Users from localStorage

Create a migration script that:
1. Reads all users from localStorage
2. Hashes passwords with bcryptjs
3. Inserts into PostgreSQL
4. Clears localStorage

---

## Implementation Checklist

- [ ] Choose database provider
- [ ] Create database and tables
- [ ] Add environment variables
- [ ] Implement register API route
- [ ] Implement login API route
- [ ] Implement logout API route
- [ ] Create session middleware
- [ ] Update auth service to use API
- [ ] Migrate existing data
- [ ] Remove localStorage password storage
- [ ] Add CSRF protection
- [ ] Add rate limiting
- [ ] Add audit logging
- [ ] Test across all flows
- [ ] Deploy to production

---

## Security Improvements Achieved

✅ Password hashing moved to server (bcryptjs 13 rounds)
✅ Sessions stored server-side (database or Redis)
✅ HTTP-only cookies prevent XSS access
✅ No sensitive data in localStorage
✅ User data scoped to authenticated user
✅ Audit logging for compliance
✅ Rate limiting on auth endpoints
✅ CSRF protection via SameSite cookies
✅ Prepared statements prevent SQL injection
✅ Email normalization prevents account enumeration

---

## Next: Security Hardening

After storage migration is complete, see `SECURITY_IMPLEMENTATION_ROADMAP.md` for:
- CSRF tokens
- Rate limiting
- Email verification
- Two-factor authentication
- Password reset flow
- Admin panel hardening

