# Comprehensive Login Authentication Troubleshooting Plan

## Problem Statement
User receives "Invalid email or password" error during login despite successfully creating an account with the same credentials.

---

## Root Cause Analysis

### The Issue
The IP address parsing for authentication event logging is failing silently, which cascades into registration and login failures:

1. **IP Address Format**: The `x-forwarded-for` header contains comma-separated IPs: `"49.36.42.238, 10.128.97.167"`
2. **Database Type Mismatch**: PostgreSQL `INET` type only accepts single IP addresses
3. **Silent Failure**: Auth events fail to log, but the error is not surfaced to the user
4. **Cascading Effect**: Registration and login processes fail without clear error messages

### Current Status
- IP parsing function (`parseIpAddress`) exists but may have edge cases
- Enhanced logging added to track IP parsing and auth event logging
- Defensive null-handling for INET type compatibility

---

## Phase 1: Verify Account Creation

### Step 1.1: Check Database Directly

**Using Supabase Console:**
```
1. Go to Supabase Console → Your Project
2. Navigate to SQL Editor
3. Run: SELECT id, email, full_name, created_at FROM users WHERE email = 'your-test-email@example.com';
4. Verify:
   - User exists
   - Email matches exactly (including case)
   - full_name is populated
   - created_at timestamp is recent
```

**What Success Looks Like:**
```
id            | email                      | full_name  | created_at
──────────────┼────────────────────────────┼────────────┼─────────────────
550e8400-...  | testuser@example.com       | Test User  | 2024-02-25 10:30
```

### Step 1.2: Verify Password Hash

**Check Password Hash Exists:**
```sql
SELECT id, email, password_hash FROM users 
WHERE email = 'your-test-email@example.com';
```

**What to Look For:**
- `password_hash` should NOT be empty
- Should start with `$2a$` or `$2b$` (bcryptjs prefix)
- Should be approximately 60 characters long

**Example:**
```
$2b$12$R9h7cIPz0gi.URNN3kh2OPST9EHcNT0kODiKHXHHaYmRAk82lzjyu
```

### Step 1.3: Check Registration Logs

**View Registration Events:**
```sql
SELECT id, user_id, event_type, success, error_message, created_at 
FROM auth_logs 
WHERE event_type LIKE 'REGISTER%'
ORDER BY created_at DESC
LIMIT 10;
```

**Interpret Results:**
- `success = true` → Registration completed
- `success = false` with error_message → Identify the failure reason
- Multiple REGISTER_ATTEMPT entries → User tried multiple times

---

## Phase 2: Verify Credential Matching

### Step 2.1: Frontend Input Validation

**Check Console for Registration:**
1. Open DevTools (F12)
2. Go to Network tab
3. Fill out registration form
4. Look for POST request to `/api/auth/register`
5. Click on request → Payload tab
6. Verify:
   ```json
   {
     "email": "testuser@example.com",
     "password": "YourPassword@123",
     "confirmPassword": "YourPassword@123",
     "fullName": "Test User"
   }
   ```

**Common Issues:**
- Email has leading/trailing whitespace: `" testuser@example.com "`
- Password contains invisible characters (copy-paste issue)
- Special characters not properly encoded in JSON
- Confirm password doesn't match password exactly

### Step 2.2: Check Email Normalization

**Potential Issues:**
- Email case sensitivity: `TestUser@Example.com` vs `testuser@example.com`
- Whitespace: `"testuser@example.com "` (trailing space)
- Unicode characters: `tëst@example.com` vs `test@example.com`

**Database Query:**
```sql
-- Find exact email match
SELECT * FROM users 
WHERE email = LOWER('testuser@example.com');

-- Find with whitespace issues
SELECT email, LENGTH(email) as len, 
       '|' || email || '|' as display
FROM users 
WHERE email LIKE '%test%';
```

### Step 2.3: Check for Hidden Characters

**Frontend JavaScript Test:**
```javascript
const email = "testuser@example.com";
const password = "YourPassword@123";

console.log('[v0] Email bytes:', email.split('').map(c => c.charCodeAt(0)));
console.log('[v0] Password bytes:', password.split('').map(c => c.charCodeAt(0)));

// Look for unusual character codes (should be 0-127 for ASCII)
```

---

## Phase 3: Authentication Mechanism Review

### Step 3.1: Verify Password Hashing

**Current Implementation:**
- Algorithm: bcryptjs
- Salt rounds: 12
- Expected hash format: `$2a$12$...` or `$2b$12$...`

**Test Hash Function:**
```typescript
import bcrypt from 'bcryptjs';

const testPassword = 'YourPassword@123';
const testHash = '$2b$12$R9h7cIPz0gi.URNN3kh2OPST9EHcNT0kODiKHXHHaYmRAk82lzjyu';

bcrypt.compare(testPassword, testHash).then(isMatch => {
  console.log('[v0] Password matches:', isMatch);
});
```

### Step 3.2: Review verifyPassword Function

**Location:** `/vercel/share/v0-project/lib/auth-server.ts`

**Function Flow:**
1. User enters password → Frontend sends to `/api/auth/login`
2. Server retrieves user from database
3. Server calls `verifyPassword(plaintext, storedHash)`
4. bcrypt compares passwords
5. Returns true/false

**Debug Logging:**
Add this to verify flow:
```typescript
const user = await getUserByEmail(email);
console.log('[v0] User found:', !!user);
console.log('[v0] User email:', user?.email);

const isPasswordValid = await verifyPassword(password, user.password_hash);
console.log('[v0] Password valid:', isPasswordValid);
```

### Step 3.3: Check Email Lookup Function

**Function:** `getUserByEmail()`

**Expected Query:**
```sql
SELECT id, email, password_hash, full_name, is_active, created_at, updated_at
FROM users
WHERE LOWER(email) = LOWER($1);
```

**Verify:**
- Email is case-insensitive (using LOWER())
- Only active users are returned (`is_active = true`)
- Password hash is included in response

---

## Phase 4: Backend Verification Logic Analysis

### Step 4.1: Login API Response Inspection

**In DevTools Network Tab:**

1. POST to `/api/auth/login`
2. Request payload:
   ```json
   {
     "email": "testuser@example.com",
     "password": "YourPassword@123"
   }
   ```

3. Expected Response (Success):
   ```json
   {
     "success": true,
     "message": "Login successful"
   }
   ```

4. Expected Response (Failure):
   ```json
   {
     "success": false,
     "message": "Invalid email or password"
   }
   ```

5. Check HTTP Status:
   - 200 = Success
   - 400 = Validation error (email/password missing)
   - 401 = Invalid credentials
   - 429 = Rate limited
   - 500 = Server error

### Step 4.2: Analyze Server Logs

**Check for IP Parsing Errors:**
```
[v0] parseIpAddress - input: "49.36.42.238, 10.128.97.167"
[v0] parseIpAddress - extracted: "49.36.42.238"
[v0] parseIpAddress - isValidIPv4: true
```

**Check for Password Verification:**
```
[v0] logAuthEvent called with ipAddress: "49.36.42.238"
[v0] logAuthEvent cleanIpAddress: "49.36.42.238"
[v0] logAuthEvent dbIpAddress: "49.36.42.238"
```

**Look for Errors:**
```
[v0] Error logging auth event: {
  code: '22P02',
  message: 'invalid input syntax for type inet: "49.36.42.238, 10.128.97.167"'
}
```

---

## Phase 5: Network Request Analysis

### Step 5.1: Request/Response Inspection

**Registration Request:**
```
POST /api/auth/register HTTP/1.1
Content-Type: application/json
Cookie: [any session cookies]

{
  "email": "testuser@example.com",
  "password": "YourPassword@123",
  "confirmPassword": "YourPassword@123",
  "fullName": "Test User"
}
```

**Registration Response:**
```
HTTP/1.1 201 Created
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict

{
  "success": true,
  "message": "Registration successful. Please log in."
}
```

**Login Request:**
```
POST /api/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "YourPassword@123"
}
```

**Login Response:**
```
HTTP/1.1 200 OK
Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict

{
  "success": true,
  "message": "Login successful"
}
```

### Step 5.2: Cookie Inspection

**Check Session Cookie:**
1. DevTools → Application tab
2. Cookies → Your domain
3. Look for `session` cookie
4. Verify:
   - HttpOnly flag: ✓ (should not be visible in JavaScript)
   - Secure flag: ✓ (in production)
   - SameSite: Strict
   - Expiration: Within 7 days

---

## Phase 6: Testing & Verification

### Test Case 1: Basic Registration & Login
```
1. Register: email="test1@example.com", password="Test1234@!"
2. Check DB: User exists with correct password hash
3. Login: email="test1@example.com", password="Test1234@!"
4. Expected: Success
```

### Test Case 2: Password Case Sensitivity
```
1. Register: password="Test1234@!"
2. Login: password="test1234@!"
3. Expected: Failure (passwords are case-sensitive)
```

### Test Case 3: Email Normalization
```
1. Register: email="Test1@Example.Com"
2. Login: email="test1@example.com"
3. Expected: Success (email is case-insensitive)
```

### Test Case 4: Whitespace Handling
```
1. Register: email=" test2@example.com " (with spaces)
2. Check: Email should be trimmed to "test2@example.com"
3. Login: email="test2@example.com"
4. Expected: Success
```

### Test Case 5: Wrong Password
```
1. Register: password="Test1234@!"
2. Login: password="Wrong1234@!"
3. Expected: Failure with "Invalid email or password"
```

### Test Case 6: Non-existent User
```
1. Login: email="nonexistent@example.com", password="Test1234@!"
2. Expected: Failure with "Invalid email or password"
```

---

## Phase 7: Solutions & Implementations

### Solution 1: Ensure Proper Email Normalization

**Frontend (Register Page):**
```typescript
const email = formData.email.toLowerCase().trim();
```

**Backend (Auth Service):**
```typescript
export async function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('email', normalizedEmail)
    .single();
  return data;
}
```

### Solution 2: Synchronize Frontend-Backend Validation

**Frontend Validation (register/page.tsx):**
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  setServerError('Invalid email format');
  return;
}

const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
if (!passwordRegex.test(password)) {
  setServerError('Password must be 8+ chars with uppercase, lowercase, number, and special character');
  return;
}
```

**Backend Validation (register/route.ts):**
- Same regex patterns
- Returns descriptive error messages
- Logs validation failures

### Solution 3: Enhanced Error Messages

**Current:** `"Invalid email or password"`

**Enhanced:**
```typescript
// Check if user exists
if (!user) {
  // Log generic message for security
  await logAuthEvent(null, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'User not found');
  // Return generic message to user
  return { success: false, message: 'Invalid email or password' };
}

// Check if user is active
if (!user.is_active) {
  await logAuthEvent(user.id, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Account inactive');
  return { success: false, message: 'Your account has been deactivated. Contact support.' };
}

// Check password
const isValid = await verifyPassword(password, user.password_hash);
if (!isValid) {
  await logAuthEvent(user.id, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Invalid password');
  return { success: false, message: 'Invalid email or password' };
}
```

### Solution 4: Password Reset Mechanism

**Add to Database:**
```sql
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires_at TIMESTAMPTZ;
CREATE INDEX idx_users_reset_token ON users(reset_token);
```

**Frontend Flow:**
1. User clicks "Forgot Password?"
2. Enters email address
3. Backend generates unique token, stores in DB with 1-hour expiration
4. Sends reset link to email
5. User clicks link, sets new password
6. Backend validates token and updates password hash

### Solution 5: Add Detailed Audit Logging

**Log Structure:**
```json
{
  "timestamp": "2024-02-25T10:30:45Z",
  "eventType": "LOGIN_ATTEMPT",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "testuser@example.com",
  "ipAddress": "49.36.42.238",
  "userAgent": "Mozilla/5.0...",
  "success": false,
  "reason": "INVALID_PASSWORD",
  "attemptNumber": 3,
  "retryAfter": 120
}
```

**Implementation:**
```typescript
export async function logDetailedAuthEvent(
  userId: string | null,
  eventType: string,
  email: string | null,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  reason?: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  const cleanIpAddress = parseIpAddress(ipAddress);
  const dbIpAddress = cleanIpAddress === 'unknown' ? null : cleanIpAddress;
  
  const { error } = await supabaseAdmin
    .from('auth_logs')
    .insert({
      user_id: userId,
      event_type: eventType,
      email,
      ip_address: dbIpAddress,
      user_agent: userAgent,
      success,
      error_message: reason,
      metadata,
    });
    
  if (error) {
    console.error('[v0] Error in detailed auth logging:', error);
    return false;
  }
  return true;
}
```

---

## Phase 8: Debugging Checklist

**Database Verification:**
- [ ] User exists in users table
- [ ] Email matches exactly (check case)
- [ ] password_hash is populated and starts with $2a$ or $2b$
- [ ] is_active = true
- [ ] No duplicate users with same email

**Frontend Verification:**
- [ ] Email input is trimmed: `email.trim()`
- [ ] Password input is not modified: `password as-is`
- [ ] No extra spaces in password field
- [ ] Form submission captures all required fields
- [ ] No validation errors before submission

**Backend Verification:**
- [ ] getUserByEmail returns user
- [ ] verifyPassword returns true with correct password
- [ ] Session cookie is set after login
- [ ] IP parsing logs show correct extraction
- [ ] No "invalid input syntax for type inet" errors

**Network Verification:**
- [ ] POST to /api/auth/register returns 201
- [ ] POST to /api/auth/login returns 200
- [ ] Session cookie is present in response headers
- [ ] No 400/401/429/500 errors
- [ ] Response JSON has success=true

**Security Verification:**
- [ ] Passwords are hashed with bcryptjs (12 rounds)
- [ ] Session cookies are HTTP-only
- [ ] Session cookies have SameSite=Strict
- [ ] Credentials are never logged in plaintext
- [ ] Error messages don't reveal user existence

---

## Summary

The "Invalid email or password" error typically indicates ONE of:

1. **User not created** - Registration failed, but error wasn't shown
2. **Email mismatch** - Case sensitivity or whitespace issues
3. **Password mismatch** - Different password stored than entered
4. **Hidden characters** - Invisible Unicode or encoding issues
5. **Authentication logic failure** - verifyPassword function broken
6. **Rate limiting** - Too many attempts from same IP
7. **Account deactivated** - User is_active = false

Follow this guide systematically to identify which category your issue falls into, then apply the appropriate solution.
