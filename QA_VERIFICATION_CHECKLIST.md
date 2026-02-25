# MANUAL QA VERIFICATION CHECKLIST

## PHASE 1: RENDERING & UI

### 1.1 Initial Page Load
- [ ] Go to `http://localhost:3000`
- [ ] Expected: Redirects to `/login` page
- [ ] Expected: Login form is fully visible (not white screen)
- [ ] Expected: No console errors

### 1.2 Mobile Responsiveness
- [ ] Open dev tools, toggle mobile view
- [ ] Expected: Layout adjusts properly
- [ ] Expected: Form is readable on small screens
- [ ] Expected: Branding section hides on mobile (hidden lg:flex)

### 1.3 Dark Mode Support
- [ ] Open browser settings, enable dark mode
- [ ] Expected: App colors adjust automatically
- [ ] Expected: Text remains readable
- [ ] Expected: No white-on-white or black-on-black text

### 1.4 Error Boundary
- [ ] Open browser console
- [ ] Type: `throw new Error('test')`
- [ ] Expected: Error boundary catches it
- [ ] Expected: Shows error UI with "Try again" button
- [ ] Expected: Button works and resets app

---

## PHASE 2: AUTHENTICATION - REGISTER

### 2.1 Successful Registration
- [ ] Go to `/register`
- [ ] Fill form:
  - [ ] Name: "John Doe"
  - [ ] Email: "john@example.com"
  - [ ] Password: "TestPass123!"
  - [ ] Confirm Password: "TestPass123!"
- [ ] Click "Create account"
- [ ] Expected: Redirects to `/dashboard`
- [ ] Expected: Dashboard displays with user name in header
- [ ] Expected: No console errors

### 2.2 Registration Validation
- [ ] Try registering without name
- [ ] Expected: Error message appears
- [ ] Try registering with invalid email
- [ ] Expected: Error message appears
- [ ] Try registering with password < 8 chars
- [ ] Expected: Error message appears
- [ ] Try registering with mismatched passwords
- [ ] Expected: Error message appears

### 2.3 Duplicate Email Prevention
- [ ] Register with "alice@test.com"
- [ ] Try registering again with same email
- [ ] Expected: Error message: "Account already exists"
- [ ] Expected: Not redirected to dashboard

### 2.4 Password Visibility Toggle
- [ ] On register form, password field
- [ ] Click eye icon to show password
- [ ] Expected: Password reveals in plain text
- [ ] Click eye icon again
- [ ] Expected: Password is masked again

---

## PHASE 2B: AUTHENTICATION - LOGIN

### 2.5 Successful Login
- [ ] Go to `/login`
- [ ] Fill form:
  - [ ] Email: "john@example.com" (from 2.1)
  - [ ] Password: "TestPass123!"
- [ ] Click "Sign in"
- [ ] Expected: Redirects to `/dashboard`
- [ ] Expected: Dashboard displays with user name
- [ ] Expected: No console errors

### 2.6 Failed Login - Wrong Password
- [ ] Go to `/login`
- [ ] Enter email: "john@example.com"
- [ ] Enter password: "WrongPassword"
- [ ] Click "Sign in"
- [ ] Expected: Shows error: "Invalid email or password"
- [ ] Expected: Stays on `/login` page
- [ ] Expected: Form is still fillable for retry

### 2.7 Failed Login - Non-existent Email
- [ ] Go to `/login`
- [ ] Enter email: "nonexistent@test.com"
- [ ] Enter password: "SomePass123!"
- [ ] Click "Sign in"
- [ ] Expected: Shows error: "Invalid email or password"
- [ ] Expected: Error message doesn't reveal user doesn't exist

### 2.8 Login Form Validation
- [ ] Try clicking "Sign in" with empty form
- [ ] Expected: Shows validation errors
- [ ] Try entering invalid email format
- [ ] Expected: Shows email validation error
- [ ] Enter valid email, empty password
- [ ] Expected: Shows password required error

### 2.9 Loading State
- [ ] Slow down network: Dev Tools → Network → Slow 3G
- [ ] Click "Sign in"
- [ ] Expected: Button shows "Signing in..." text
- [ ] Expected: Button is disabled during request
- [ ] Expected: After login completes, button text returns

---

## PHASE 3: SESSION MANAGEMENT

### 3.1 Session Persistence
- [ ] Login successfully
- [ ] Refresh page (F5)
- [ ] Expected: Still logged in
- [ ] Expected: Dashboard still shows
- [ ] Expected: User name still visible

### 3.2 Multi-Tab Session Sync
- [ ] Login in Tab 1
- [ ] Open Tab 2, go to `http://localhost:3000/dashboard`
- [ ] Expected: Tab 2 recognizes session from Tab 1
- [ ] Expected: Dashboard loads without login

### 3.3 Session Expiry (if implemented)
- [ ] Login and wait (or manipulate session time)
- [ ] Expected: After expiry, redirected to login
- [ ] Expected: Error message about session expiration

### 3.4 Logout
- [ ] Login successfully
- [ ] Click profile menu → "Logout"
- [ ] Expected: Redirects to `/login`
- [ ] Expected: Session cleared
- [ ] Try accessing `/dashboard`
- [ ] Expected: Redirected back to `/login`

### 3.5 Logout Clears Everything
- [ ] Login and go to `/dashboard`
- [ ] Open browser console
- [ ] Check localStorage
- [ ] Expected: Session data should not contain sensitive credentials
- [ ] Logout
- [ ] Check localStorage again
- [ ] Expected: Session data cleared

---

## PHASE 4: PROTECTED ROUTES

### 4.1 Unauthorized Access
- [ ] Open new incognito window
- [ ] Go to `http://localhost:3000/dashboard`
- [ ] Expected: Redirected to `/login`
- [ ] Expected: URL shows `?next=/dashboard`

### 4.2 After Logout Access
- [ ] Login and see dashboard
- [ ] Logout
- [ ] Try directly visiting `/dashboard`
- [ ] Expected: Redirected to `/login`
- [ ] Expected: No errors or hanging page

### 4.3 All Protected Routes
- [ ] Test accessing these without login:
  - [ ] `/dashboard` → Redirect to `/login`
  - [ ] `/applications` → Redirect to `/login`
  - [ ] `/contacts` → Redirect to `/login`
  - [ ] `/settings` → Redirect to `/login`

### 4.4 Auth Routes Redirect When Logged In
- [ ] Login successfully
- [ ] Visit `/login`
- [ ] Expected: Redirected to `/dashboard`
- [ ] Visit `/register`
- [ ] Expected: Redirected to `/dashboard`

---

## PHASE 5: ERROR HANDLING

### 5.1 Network Error During Login
- [ ] Slow down network to offline: Dev Tools → Network → Offline
- [ ] Try to login
- [ ] Expected: Error message displayed
- [ ] Expected: User can retry

### 5.2 Invalid API Response
- [ ] This tests error boundary
- [ ] Intentionally cause an error
- [ ] Expected: Error boundary catches it
- [ ] Expected: Shows error UI
- [ ] Expected: Can recover with "Try again"

### 5.3 Middleware Errors
- [ ] Check middleware logs
- [ ] Expected: No errors during requests
- [ ] Expected: All redirects work smoothly

---

## PHASE 6: DATA SECURITY

### 6.1 No Sensitive Data in localStorage
- [ ] Login
- [ ] Open DevTools → Application → localStorage
- [ ] Check stored data
- [ ] Expected: No passwords stored
- [ ] Expected: No auth tokens visible
- [ ] Expected: Session ID only (no credentials)

### 6.2 HTTP-Only Cookie Set
- [ ] Login
- [ ] Open DevTools → Application → Cookies
- [ ] Check `jt_session_id` or `jt_authenticated` cookie
- [ ] Expected: Cookie marked as "HttpOnly"
- [ ] Expected: Cookie marked as "Secure" (in production)
- [ ] Expected: Cookie marked as "SameSite=Strict"

### 6.3 Password Not Transmitted in Plain Text
- [ ] Open DevTools → Network
- [ ] Login
- [ ] Check POST `/api/auth/login` request
- [ ] Expected: Request is HTTPS (in production)
- [ ] Expected: Password in request body, not in URL

---

## PHASE 7: EDGE CASES

### 7.1 Rapid Clicks
- [ ] Login form
- [ ] Rapidly click "Sign in" multiple times
- [ ] Expected: Only one request sent
- [ ] Expected: Button disabled during request
- [ ] Expected: No duplicate submissions

### 7.2 Browser Back Button
- [ ] Login successfully
- [ ] Go to another page
- [ ] Click browser back button
- [ ] Expected: Works correctly
- [ ] Expected: No logged out warnings

### 7.3 Browser Forward Button After Logout
- [ ] Login → Logout → Browser forward button
- [ ] Expected: Stays on login page
- [ ] Expected: Not back to dashboard

### 7.4 Concurrent Operations
- [ ] Login in Tab 1
- [ ] Login with different account in Tab 2
- [ ] Expected: Both work independently (depending on session model)
- [ ] Expected: No state collision

---

## PHASE 8: ACCESSIBILITY

### 8.1 Keyboard Navigation
- [ ] Login page - Tab through form fields
- [ ] Expected: Focus visible on each field
- [ ] Expected: Can submit with Enter key

### 8.2 Screen Reader (if ARIA implemented)
- [ ] Use screen reader (NVDA/JAWS/VoiceOver)
- [ ] Expected: Form labels read correctly
- [ ] Expected: Error messages announced

### 8.3 Color Contrast
- [ ] Use accessibility checker
- [ ] Expected: Text/background contrast >= 4.5:1 for normal text
- [ ] Expected: >= 3:1 for large text

---

## PHASE 9: PERFORMANCE

### 9.1 Page Load Time
- [ ] Slow network: Throttle to Slow 3G
- [ ] Load `/login`
- [ ] Expected: Loads within 5 seconds
- [ ] Expected: Content visible before full load

### 9.2 Login Request Speed
- [ ] Slow 3G network
- [ ] Submit login form
- [ ] Expected: Completes within 10 seconds
- [ ] Expected: User sees loading state

### 9.3 Dashboard Load Time
- [ ] After login with Slow 3G
- [ ] Expected: Dashboard loads within 5 seconds
- [ ] Expected: Data loads without lag

---

## PHASE 10: BROWSER COMPATIBILITY

Test on:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

For each browser:
- [ ] Can register
- [ ] Can login
- [ ] Can logout
- [ ] Session persists
- [ ] No console errors

---

## SIGN-OFF

After completing all checklist items:

- [ ] All tests passed
- [ ] No unexpected behavior
- [ ] No console errors
- [ ] No broken links
- [ ] Ready for production deployment

**Tested By:** _______________
**Date:** _______________
**Notes:** 
```
[Add any additional observations here]
```

---

## COMMON ISSUES & TROUBLESHOOTING

If you encounter issues:

1. **White screen persists:**
   - Clear `.next` cache: `rm -rf .next`
   - Rebuild: `npm run dev`
   - Check console for errors

2. **Login not working:**
   - Verify `CORS_ORIGIN` env var is set
   - Check API route at `/api/auth/login`
   - Look for network errors in DevTools

3. **Session not persisting:**
   - Check cookies are set: DevTools → Application → Cookies
   - Verify localStorage isn't being cleared
   - Check browser privacy mode settings

4. **Slow performance:**
   - Check Network tab for large requests
   - Look for infinite loops in console
   - Profile with Chrome DevTools Performance tab

5. **Logout not working:**
   - Check `/api/auth/logout` exists
   - Verify cookies are being cleared
   - Look for errors in browser console

---

## NEXT STEPS AFTER QA PASSES

1. Deploy to staging environment
2. Run same tests in staging
3. Load test with multiple concurrent users
4. Security scan (OWASP)
5. Production deployment
