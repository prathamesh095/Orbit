# QA Verification Checklist: Login/Register/Session Bug Fix

## Pre-Testing Setup
- [ ] Clear browser cache/cookies for the app domain
- [ ] Open DevTools → Application → Cookies to monitor HTTP-only cookies
- [ ] Open DevTools → Console to see debug logs
- [ ] Open DevTools → Network tab to monitor API calls

---

## TEST 1: New User Registration

### Steps:
1. Navigate to `http://localhost:3000/register`
2. Fill form:
   - Name: "Test User"
   - Email: "testuser@example.com"
   - Password: "password123"
3. Click "Create account"

### Expected Results:
- [ ] No error messages
- [ ] Redirects to `/dashboard`
- [ ] Dashboard displays: User name, email, or profile info
- [ ] Logout button visible
- [ ] Console shows: `[AUTH] Registration successful`
- [ ] DevTools → Cookies shows: `jt_session_id` (HttpOnly=true)
- [ ] DevTools → Cookies shows: `jt_authenticated=1`

### What's Being Verified:
- Register API creates user and session
- sessionId is stored in database
- Cookie is set with correct sessionId
- Frontend receives success and redirects
- **This was broken before:** sessionId in cookie didn't match DB

---

## TEST 2: Login with Correct Credentials

### Setup:
- Clear cookies for the domain
- Should have test@example.com account from TEST 1

### Steps:
1. Navigate to `http://localhost:3000/login`
2. Enter:
   - Email: "testuser@example.com"
   - Password: "password123"
3. Click "Sign in"

### Expected Results:
- [ ] No error messages
- [ ] Redirects to `/dashboard`
- [ ] Dashboard displays user info
- [ ] Logout button visible
- [ ] Console shows: `[AUTH] Password verified` and `[AUTH] Login successful`
- [ ] HTTP-only cookies set correctly

### What's Being Verified:
- User lookup works
- Password verification works
- Session is created with correct sessionId
- Cookie contains sessionId that exists in DB
- **This was broken before:** "Invalid email or password" error due to sessionId mismatch

---

## TEST 3: Page Refresh - Session Restoration

### Setup:
- Must be logged in from TEST 2

### Steps:
1. On dashboard page, press F5 (or Cmd+R on Mac)
2. Wait for page to reload
3. Observe if you're still logged in

### Expected Results:
- [ ] Page reloads without redirect to login
- [ ] Dashboard shows user info (not blank)
- [ ] Logout button still visible
- [ ] No 401 errors in console
- [ ] Console shows: `[AUTH] Session valid` from /api/auth/me
- [ ] User remains authenticated

### What's Being Verified:
- Cookie persists after refresh
- `/api/auth/me` endpoint can find session in DB
- Session data is correct
- Client state is restored
- **This was broken before:** sessionId couldn't be found in DB, returned 401

---

## TEST 4: Login with Incorrect Password

### Setup:
- Must have registered user from TEST 1

### Steps:
1. Go to `/login`
2. Enter:
   - Email: "testuser@example.com"
   - Password: "wrongpassword"
3. Click "Sign in"

### Expected Results:
- [ ] Error message appears: "Invalid email or password"
- [ ] NOT redirected to dashboard
- [ ] Stays on login page
- [ ] Can try again
- [ ] Console shows: `[AUTH] Password mismatch for user`

### What's Being Verified:
- Password verification is working
- Proper error feedback
- No session created for failed login

---

## TEST 5: Logout

### Setup:
- Must be logged in from TEST 2

### Steps:
1. On dashboard, click "Logout" button
2. Observe redirect and cookies

### Expected Results:
- [ ] Redirected to `/login` page
- [ ] Cookies cleared (jt_session_id and jt_authenticated gone)
- [ ] Console shows: `[AUTH] Logout successful`
- [ ] Cannot access `/dashboard` (redirects to login)

### What's Being Verified:
- Logout API works
- Cookies properly cleared
- Session destroyed
- Auth state reset

---

## TEST 6: Duplicate Email Prevention

### Setup:
- Already have user account from TEST 1

### Steps:
1. Go to `/register`
2. Try to register with same email:
   - Name: "Another User"
   - Email: "testuser@example.com"
   - Password: "pass456"
3. Click "Create account"

### Expected Results:
- [ ] Error message: "Email already registered"
- [ ] Not redirected
- [ ] Stays on register page
- [ ] Can modify email and try again

### What's Being Verified:
- Email uniqueness constraint works
- Proper error handling

---

## TEST 7: Auto-Login After Registration

### Setup:
- Clear cookies/cache
- Use new email address

### Steps:
1. Register brand new account
2. On success redirect to dashboard
3. Refresh page immediately

### Expected Results:
- [ ] Still logged in after refresh
- [ ] Dashboard shows correct user
- [ ] Session persists

### What's Being Verified:
- Registration sets session AND cookie
- Session is immediately usable
- **This was broken before:** Register would set wrong sessionId

---

## TEST 8: Network Request Verification

### Using DevTools Network Tab:

### During Login:
1. Filter by "login"
2. Should see POST request to `/api/auth/login`
3. Response should have:
   - [ ] Status: 200
   - [ ] Body: `{ success: true, user: {...} }`
   - [ ] Set-Cookie header with `jt_session_id`

### During /api/auth/me call:
1. Filter by "me"
2. Should see GET request to `/api/auth/me` after redirect
3. Response should have:
   - [ ] Status: 200
   - [ ] Body: `{ success: true, user: {...} }`

### What's Being Verified:
- API responses are correct
- Cookies are being sent in requests
- Correct HTTP status codes

---

## TEST 9: Browser Compatibility

### Repeat all tests in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browser (if applicable)

### Focus on:
- [ ] HTTP-only cookies work (not visible in JS console)
- [ ] Redirects work properly
- [ ] No CORS errors

---

## TEST 10: Session Expiration (Advanced)

### Manual Test:
1. Login successfully
2. Open DevTools → Console
3. Run: `document.cookie = "jt_session_id=invalid-session"`
4. Refresh page
5. Should redirect to login

### Expected:
- [ ] Redirects to login when session invalid
- [ ] Error message or blank redirect

---

## CONSOLE LOG VERIFICATION

### Expected logs during successful registration:
```
[AUTH] Registration attempt: { email: 'testuser@example.com' }
[AUTH DB] User created: { id: 'user_...', email: '...', passwordHash: 'hash_...' }
[AUTH] User created: { id: 'user_...', email: '...@example.com' }
[AUTH] Session created: { sessionId: '...' }
[AUTH] Registration successful: ...
```

### Expected logs during successful login:
```
[AUTH] Login attempt: { email: 'testuser@example.com' }
[AUTH] User found: { id: 'user_...' }
[AUTH DB] Password verification debug: { ..., match: true }
[AUTH] Password verified: testuser@example.com
[AUTH] Session created: { sessionId: '...' }
[AUTH] Login successful: testuser@example.com
```

### Expected logs on page refresh:
```
[AUTH] Get current user attempt
[AUTH] Session valid: { userId: 'user_...' }
[AUTH] Current user retrieved: testuser@example.com
```

---

## TROUBLESHOOTING

### If seeing "Invalid email or password":
1. Check console logs for `[AUTH DB] Password verification debug`
2. Verify storedHash === providedHash
3. If not matching: password not being hashed consistently
4. Clear cookies and try registering a new account

### If page redirects to login after refresh:
1. Check `/api/auth/me` response in Network tab
2. Should have status 200, not 401
3. If 401: session not found in database
4. Verify sessionId in cookie matches one in DB

### If cookies not setting:
1. Check Domain/Path in DevTools → Cookies
2. Should be: Path=/  Domain=localhost (or your domain)
3. Should have: HttpOnly ✓, Secure (in HTTPS), SameSite=Strict

### If registration succeeds but not logged in:
1. Check that createSession() returns { sessionId, sessionData }
2. Verify sessionId is being used in response.cookies.set()
3. Check console: `[AUTH] Session created` should show sessionId

---

## SIGN-OFF

Once all tests pass:
- [ ] Dev verified all 10 tests
- [ ] QA verified in all browsers
- [ ] No errors in console
- [ ] No network errors
- [ ] Cookies properly set/cleared
- [ ] Sessions correctly created/destroyed
- [ ] Ready for production deployment
