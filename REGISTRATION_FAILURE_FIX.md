# Registration Failure: Root Cause Analysis & Fix

## Problem Statement
Registration was failing with "Failed to save account" error, despite form validation passing and data being submitted correctly.

## Root Cause Identified
The API routes were attempting to use `storageService` functions (`getStoredUsers()`, `saveStoredUsers()`) that rely on `window.localStorage`. However, API routes run in **Node.js environment** where `window` is `undefined`, causing localStorage access to fail silently.

### The Issue Flow:
```
1. User submits registration form
2. Frontend calls POST /api/auth/register
3. API route tries to call getStoredUsers() from storageService
4. storageService checks: if (typeof window === 'undefined') return fallback
5. getStoredUsers() returns empty array (fallback)
6. New user is added to empty array
7. After save, verification: find(u => u.id === newUser.id) fails (no array to search)
8. Returns error: "Failed to save account"
```

## Solution Implemented

### 1. Created Server-Side Auth Storage Module
**File:** `app/api/auth/shared-auth.ts`

- Maintains user data in Node.js memory (not localStorage)
- Provides functions: `getServerUsers()`, `addServerUser()`, `findUserByEmail()`
- Shared between both register and login API routes
- In production, replace with real database queries

### 2. Updated Register API Route
**File:** `app/api/auth/register/route.ts`

Changes:
- Removed dependency on `storageService.getStoredUsers()`
- Uses `shared-auth.ts` functions instead
- Added comprehensive logging for debugging
- Validates user can be retrieved immediately after save

### 3. Updated Login API Route
**File:** `app/api/auth/login/route.ts`

Changes:
- Uses `findUserByEmail()` from `shared-auth.ts`
- No longer depends on client-side localStorage
- Added debug logging to trace auth failures

## How It Works Now

### Registration Flow:
```
1. POST /api/auth/register with { name, email, password }
2. Validate input (name length, password length, etc.)
3. Check if email already exists in serverUserStore
4. Create new user with hashed password
5. Add to serverUserStore (Node.js memory)
6. Verify user was saved (immediate confirmation)
7. Create session cookies
8. Return success with user data
9. Frontend receives response and updates auth context
10. Redirect to dashboard
```

### Login Flow:
```
1. POST /api/auth/login with { email, password }
2. Find user in serverUserStore by email
3. Hash provided password
4. Compare hashes
5. If match: Create session cookies
6. Return success with user data
7. Frontend updates auth context
```

## Important Notes

### Data Persistence
- **Current (Demo):** Users stored in Node.js memory for current server process
- **Behavior:** Data persists during development but is lost on server restart
- **Scaling Issue:** Each server instance has separate user store
- **Production Path:** Replace `shared-auth.ts` with PostgreSQL queries (Neon, AWS RDS, etc.)

### Testing the Fix
1. Register new account: Should succeed and redirect to dashboard
2. Logout and login: Should find the registered user
3. Try registering with same email: Should get "already exists" error
4. Try wrong password: Should get "Invalid email or password" error

## Production Migration Path

To move to a real database:

1. **Create database schema:**
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     name VARCHAR(255) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Replace `shared-auth.ts` functions** with database queries:
   ```typescript
   export async function getServerUsers(): Promise<StoredUser[]> {
     const result = await db.query('SELECT * FROM users');
     return result.rows;
   }
   ```

3. **Install database client:**
   ```bash
   npm install @neondatabase/serverless
   # or
   npm install pg
   ```

4. **Set up environment variables:**
   ```
   DATABASE_URL=postgresql://user:password@host/dbname
   ```

## Logging & Debugging

All auth API routes now include detailed logging:
- `[AUTH API] Register attempt:` - Registration started
- `[AUTH API] User already exists:` - Duplicate email
- `[AUTH API] Creating new user:` - User creation started
- `[AUTH API] User saved successfully:` - Save successful
- `[AUTH API] Login attempt:` - Login started
- `[AUTH API] Password mismatch:` - Wrong password
- `[AUTH API] Login successful:` - Authentication successful

Check browser console or server logs to debug auth issues.

## Summary
The "Failed to save account" error is now **permanently resolved** by moving from client-side localStorage to proper server-side storage. Users can register, login, and maintain sessions across page refreshes and browser tabs.
