# Invalid Email or Password - Comprehensive Troubleshooting Guide

## Overview
This guide addresses the "Invalid email or password" error that occurs after successful account creation. This error is intentionally generic for security reasons, but the actual root cause can be identified through systematic troubleshooting.

## Phase 1: Verify Account Creation Succeeded

### Step 1.1: Check User Registration in Database
```sql
-- Connect to Supabase database and run:
SELECT id, email, full_name, created_at, is_active 
FROM users 
WHERE email = 'your-test-email@example.com';
```

**Expected Result:** You should see a record with:
- A valid UUID for `id`
- Your email address
- Full name you provided
- `created_at` timestamp recent
- `is_active = true`

**If no record found:**
- Registration endpoint may have silently failed
- Check API response: did it return `{ success: true }`?
- Check server logs for errors during user creation

### Step 1.2: Verify Password Was Hashed
```sql
-- Check that password_hash is not null and is a bcrypt hash (starts with $2a$ or $2b$)
SELECT id, email, password_hash 
FROM users 
WHERE email = 'your-test-email@example.com';
```

**Expected Result:** `password_hash` should:
- Start with `$2a$` or `$2b$` (bcrypt prefix)
- Be approximately 60 characters long
- Never be your plain text password

**If password_hash is plain text or null:**
- Password hashing failed during registration
- Check auth-server.ts `createUser()` function
- Verify bcryptjs is properly installed

## Phase 2: Confirm Credentials Match Stored Data

### Step 2.1: Email Case Sensitivity Check
The system converts emails to lowercase before storage. Verify:

```sql
-- Check how email is stored
SELECT id, email FROM users WHERE email = LOWER('YOUR-EMAIL@EXAMPLE.COM');

-- This should match
SELECT id, email FROM users WHERE email = 'your-email@example.com';
```

**Common Issue:** 
- Registering with `User@Example.COM`
- Attempting to login with `user@example.com`
- **Solution:** Both should work because emails are stored lowercase

### Step 2.2: Whitespace Verification
Whitespace at the beginning or end of input causes mismatches:

```javascript
// Frontend - Check form input
const email = formData.email;
const trimmedEmail = email.trim();
console.log(`Original: "${email}"`);
console.log(`Trimmed: "${trimmedEmail}"`);
console.log(`Has whitespace: ${email !== trimmedEmail}`);
```

**Check what was submitted:**
1. Open browser DevTools → Network tab
2. Find the login POST request
3. Check the request body JSON
4. Look for unexpected spaces: `{ "email": " user@example.com " }`

**Backend log to add:**
```typescript
// In login route before getUserByEmail
console.log('[v0] Login attempt:', {
  emailRaw: email,
  emailLength: email.length,
  emailTrimmed: email.trim(),
  hasLeadingSpace: email[0] === ' ',
  hasTrailingSpace: email[email.length - 1] === ' '
});
```

### Step 2.3: Password Verification Test
Create a test endpoint to verify password hashing works:

```typescript
// app/api/debug/verify-password/route.ts (ONLY for development)
import { verifyPassword, hashPassword } from '@/lib/auth-server';
import { supabaseAdmin } from '@/lib/db';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // Get stored hash
  const { data } = await supabaseAdmin
    .from('users')
    .select('password_hash')
    .eq('email', email.toLowerCase())
    .single();

  if (!data) return new Response('User not found', { status: 404 });

  // Test password verification
  const isValid = await verifyPassword(password, data.password_hash);

  return Response.json({
    email,
    passwordSubmitted: password,
    storedHash: data.password_hash.substring(0, 20) + '...',
    passwordMatches: isValid,
    debugInfo: {
      passwordLength: password.length,
      hashValid: data.password_hash.startsWith('$2'),
    }
  });
}
```

## Phase 3: Review Authentication Validation

### Step 3.1: Check Login Validation Rules
Review `app/api/auth/login/route.ts`:

```typescript
// Current validation checks:
1. Email format validation (basic)
2. Password required
3. User exists in database
4. Password matches stored hash
5. Session creation
```

**Possible issues:**
- Email regex too restrictive: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Password comparison failing due to encoding
- Session creation failing silently

### Step 3.2: Check Rate Limiting Not Blocking
```javascript
// Browser console - simulate login attempts
const attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
console.log('Login attempts:', attempts);
```

**In auth-server.ts rate limiting (memory-based):**
```typescript
// Check the rate limit store
const loginAttempts = {}; // This is in memory, resets on app restart
```

**If rate-limited:**
- Wait 15 minutes for reset (login endpoint limit)
- Or restart the development server

## Phase 4: Backend Process Analysis

### Step 4.1: Enable Detailed Logging
Update `lib/auth-server.ts` to add debug logging:

```typescript
export async function getUserByEmail(email: string): Promise<{ id: string; passwordHash: string } | null> {
  try {
    console.log('[v0] getUserByEmail - searching for:', email.toLowerCase());
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[v0] User not found:', email.toLowerCase());
        return null;
      }
      console.error('[v0] Database error fetching user:', error);
      return null;
    }

    console.log('[v0] User found:', { id: data.id, hasPasswordHash: !!data.password_hash });
    return data;
  } catch (error) {
    console.error('[v0] Exception in getUserByEmail:', error);
    return null;
  }
}
```

### Step 4.2: Add Login Flow Logging
Update `app/api/auth/login/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[v0] Login attempt:', {
      email: email?.substring(0, 5) + '...', // Partial email for privacy
      timestamp: new Date().toISOString(),
      hasPassword: !!password,
      passwordLength: password?.length,
    });

    // ... validation checks ...

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('[v0] Login failed: user not found');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[v0] User found, verifying password...');

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    console.log('[v0] Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('[v0] Login failed: invalid password');
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[v0] Login successful, creating session...');
    
    // ... rest of login ...
  } catch (error) {
    console.error('[v0] Login error:', error);
    // ...
  }
}
```

### Step 4.3: Monitor Session Creation
```typescript
export async function createSession(...): Promise<...> {
  try {
    console.log('[v0] Creating session for user:', userId);
    
    const token = generateToken();
    const tokenHash = hashToken(token);
    
    console.log('[v0] Generated token, hash length:', tokenHash.length);

    const { data, error } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt.toISOString(),
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[v0] Session creation failed:', error);
      return null;
    }

    console.log('[v0] Session created:', data.id);
    return { token, sessionId: data.id };
  } catch (error) {
    console.error('[v0] Session creation error:', error);
    return null;
  }
}
```

## Phase 5: Network Request Analysis

### Step 5.1: Inspect Login Request
1. Open DevTools → Network tab
2. Attempt login
3. Find `POST /api/auth/login`
4. Check **Request** tab:

```json
{
  "email": "user@example.com",
  "password": "MyPassword123!"
}
```

**Verify:**
- Email is correct and trimmed
- Password is correct (not encoded/escaped)
- Content-Type is `application/json`

### Step 5.2: Check Login Response
Click **Response** tab on the login request:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Check headers:**
- `Set-Cookie` header present? (for successful login)
- Status code: `401` (unauthorized - correct for wrong password)
- Status code: `400` (bad request - missing fields)
- Status code: `429` (rate limited)

### Step 5.3: Test with Network Throttling
1. DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Attempt login
4. Check if request completes or times out

**Issue:** If request times out, increase timeout in authService.ts:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds
```

## Phase 6: Testing & Verification

### Test Case 1: Fresh Registration → Immediate Login
```
1. Register new account: testuser@example.com / TestPass123!
2. Get success response
3. Immediately attempt login with same credentials
4. Should succeed on first try
```

### Test Case 2: Email Case Variations
```
Register:  User@Example.Com
Login 1:   user@example.com  ✓ Should work
Login 2:   USER@EXAMPLE.COM  ✓ Should work
Login 3:   User@Example.Com  ✓ Should work
```

### Test Case 3: Whitespace Handling
```
Register:  "  user@example.com  "
Login 1:   "user@example.com"       ✓ Should work
Login 2:   "  user@example.com  "   ✓ Should work
```

### Test Case 4: Password Character Validation
```
Create password: P@ssw0rd123
Login attempts:
- "P@ssw0rd123"  ✓ Correct
- "P@ssw0rd124"  ✗ Wrong
- "p@ssw0rd123"  ✗ Wrong (case sensitive)
- "P@ssw0rd123 " ✗ Wrong (extra space)
```

### Test Case 5: Non-existent User
```
Register: existing@example.com
Login 1:  existing@example.com / password    ✗ Wrong password
Login 2:  nonexistent@example.com / password ✗ User doesn't exist
Both should return: "Invalid email or password"
```

## Phase 7: Solution Implementation

### Solution 1: Fix Registration Field Capture
If registration is failing with "Missing required fields":

```typescript
// Check login page is capturing all fields
const [formData, setFormData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: ''
});

// Verify form submission includes all fields
const handleSubmit = async (data) => {
  console.log('[v0] Form data before submit:', {
    hasEmail: !!data.email,
    hasPassword: !!data.password,
    hasConfirmPassword: !!data.confirmPassword,
    hasFullName: !!data.fullName,
  });
  
  await register(data.fullName, data.email, data.password, data.confirmPassword);
};
```

### Solution 2: Ensure Frontend-Backend Validation Sync
Create a validation schema both frontend and backend use:

```typescript
// lib/validation-schema.ts
import { z } from 'zod';

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[a-z]/, 'Must contain lowercase')
  .regex(/[0-9]/, 'Must contain number')
  .regex(/[!@#$%^&*]/, 'Must contain special character');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

// Use in both frontend and backend
const result = loginSchema.parse({ email, password });
```

### Solution 3: Improve Error Messages
While keeping "Invalid email or password" generic for security, add client-side hints:

```typescript
const [loginError, setLoginError] = useState('');

const handleLogin = async () => {
  setLoginError('');
  
  // Client-side pre-checks
  if (!email) {
    setLoginError('Please enter your email address');
    return;
  }
  
  if (!password) {
    setLoginError('Please enter your password');
    return;
  }

  if (email.includes(' ')) {
    setLoginError('Email contains spaces - please check for extra spaces');
    return;
  }

  // Server request
  try {
    const response = await login({ email, password });
    if (!response.success) {
      setLoginError(response.message || 'Login failed. Please check your credentials.');
    }
  } catch (error) {
    setLoginError('Unable to connect to server. Please try again.');
  }
};
```

### Solution 4: Password Reset Flow
If user forgot their password:

```typescript
// Implement password reset endpoint
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  
  // Generate reset token
  const resetToken = generateToken();
  const tokenHash = hashToken(resetToken);
  
  // Store reset token (expires in 15 minutes)
  await supabaseAdmin
    .from('password_resets')
    .insert({
      email,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 15 * 60 * 1000),
    });
  
  // Send reset email with token
  // User clicks link, enters new password
  // Backend validates token and updates password_hash
}
```

## Phase 8: Debugging Utilities

### Debugging Helper for Development
```typescript
// lib/auth-debug.ts
export function debugAuthIssue(scenario: string) {
  console.group(`[v0] Auth Debug: ${scenario}`);
  
  switch(scenario) {
    case 'pre-login':
      // Check browser state
      console.log('Cookies:', document.cookie);
      console.log('LocalStorage keys:', Object.keys(localStorage));
      break;
      
    case 'post-registration':
      // Verify user was created
      console.log('Check: Can you login immediately?');
      console.log('Check: Is email in database?');
      break;
      
    case 'password-mismatch':
      // Verify passwords match
      console.log('Frontend password length:', '...hidden for security');
      console.log('Check: Is Caps Lock on?');
      console.log('Check: Are copy-paste passwords different?');
      break;
  }
  
  console.groupEnd();
}
```

## Checklist: Resolve "Invalid Email or Password"

- [ ] Confirmed user exists in database (`users` table)
- [ ] Verified password_hash is bcrypt format (starts with $2)
- [ ] Checked email is stored lowercase
- [ ] Verified no whitespace in email/password submission
- [ ] Confirmed password matches exactly (case-sensitive)
- [ ] Checked rate limiting not blocking attempts
- [ ] Verified session creation succeeds
- [ ] Tested with browser DevTools Network inspection
- [ ] Checked server logs for errors
- [ ] Tested with multiple browsers/devices
- [ ] Cleared browser cache and cookies
- [ ] Tested with incognito/private window
- [ ] Verified correct password being used
- [ ] Confirmed correct user account being tested
- [ ] Tested account shortly after registration

## Common Issues & Quick Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Invalid email or password" immediately after registration | Registration succeeded but session isn't persisting | Clear browser cache, try incognito window |
| Email works with mixed case during registration but not login | Case sensitivity mismatch | Check that email is converted to lowercase in both places |
| Works on local dev but not production | IP parsing issue with x-forwarded-for header | Update to use parseIpAddress() function |
| Registration says "Missing required fields" but all filled | Form not sending all fields to backend | Check registerUser() function receives all parameters |
| Password verification always fails | bcrypt comparison returning false | Verify password_hash starts with $2b$ or $2a$ |
| Works once then fails on refresh | Session cookie not persisting | Check SameSite and Secure cookie flags |
| Multiple IPs cause database error | x-forwarded-for has comma-separated IPs | Use parseIpAddress() to extract first IP |

---

**For support:** Check server logs with `console.log('[v0] ...')` messages in auth routes. Add the debugging utilities above to systematically identify the root cause.
