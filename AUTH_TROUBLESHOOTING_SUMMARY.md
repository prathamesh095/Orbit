# Authentication Troubleshooting Summary

## Quick Reference Guide

You have a **"Invalid email or password"** error during login despite successful registration with the same credentials.

### Root Cause Categories

| Category | Symptoms | Solution |
|----------|----------|----------|
| **User Not Created** | Registration shows success but user not in DB | Check auth_logs table for registration failures |
| **Email Mismatch** | Email case sensitivity (Test@Email vs test@email) | Use lowercase for all email comparisons |
| **Whitespace Issues** | Spaces before/after email or password | Trim inputs on both frontend and backend |
| **Password Hash Mismatch** | Password entered correctly but still fails | Verify bcryptjs is hashing correctly |
| **Rate Limiting** | Works first attempt, fails after multiple tries | Check rate limit configuration (5 attempts/15 min) |
| **Account Inactive** | Login fails after registration | Verify is_active = true in users table |

---

## 8-Phase Troubleshooting Process

### Phase 1: Verify Account Creation
- Run SQL to check if user exists in database
- Verify password_hash starts with `$2a$` or `$2b$`
- Check registration event logs for failure reasons

### Phase 2: Verify Credential Matching
- Check frontend form data in Network tab
- Look for whitespace in email/password fields
- Verify exact character encoding (no invisible Unicode)

### Phase 3: Authentication Mechanism Review
- Test bcryptjs password comparison function
- Verify getUserByEmail uses case-insensitive matching
- Check email normalization (LOWER, TRIM)

### Phase 4: Backend Verification Logic
- Inspect API response status codes (200, 400, 401, 429, 500)
- Check server logs for IP parsing errors
- Verify password verification function returns correct boolean

### Phase 5: Network Request Analysis
- Inspect request/response headers and body
- Check for session cookie in Set-Cookie header
- Verify Content-Type is application/json

### Phase 6: Testing & Verification
- Test basic registration → login flow
- Test password case sensitivity
- Test email case normalization
- Test whitespace handling
- Test wrong password error
- Test non-existent user error

### Phase 7: Solutions & Implementations
- Normalize email: `email.toLowerCase().trim()`
- Synchronize frontend/backend validation
- Enhance error messages (keep generic for security)
- Implement password reset mechanism
- Add detailed audit logging

### Phase 8: Debugging Checklist
- [ ] Database verification complete
- [ ] Frontend input validation correct
- [ ] Backend logic verified
- [ ] Network requests analyzed
- [ ] Security practices verified

---

## Key Files & Locations

| File | Purpose |
|------|---------|
| `/lib/auth-server.ts` | Core auth functions: createUser, verifyPassword, logAuthEvent |
| `/app/api/auth/login/route.ts` | Login endpoint with IP parsing |
| `/app/api/auth/register/route.ts` | Registration endpoint with validation |
| `/lib/authContext.tsx` | Frontend auth state management |
| `/services/auth/authService.ts` | Client-side API calls |
| `/app/(auth)/login/page.tsx` | Login UI |
| `/app/(auth)/register/page.tsx` | Registration UI |

---

## Critical SQL Queries

**Check User Exists:**
```sql
SELECT * FROM users WHERE email = 'your-email@example.com';
```

**Check Password Hash:**
```sql
SELECT id, email, password_hash FROM users 
WHERE email = 'your-email@example.com';
```

**Check Registration Events:**
```sql
SELECT * FROM auth_logs 
WHERE event_type LIKE 'REGISTER%' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Check Login Attempts:**
```sql
SELECT * FROM auth_logs 
WHERE event_type = 'LOGIN_ATTEMPT' 
AND email = 'your-email@example.com'
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Security Best Practices Implemented

✓ Passwords hashed with bcryptjs (12 rounds)  
✓ Session cookies are HTTP-only  
✓ Session cookies have SameSite=Strict  
✓ Email is case-insensitive  
✓ Generic error messages ("Invalid email or password")  
✓ Rate limiting on auth endpoints  
✓ Audit trail of all auth events  
✓ No plaintext passwords in logs  
✓ IP tracking for suspicious activity  

---

## Next Steps

1. **Read Full Guide:** `AUTH_LOGIN_TROUBLESHOOTING.md` (579 lines)
2. **Follow Phase 1:** Verify account actually exists in database
3. **Follow Phase 2-8:** Work systematically through each phase
4. **Check Logs:** Look for IP parsing or auth event logging errors
5. **Test Solutions:** Implement fixes and verify with test cases

---

## Common Quick Fixes

**Fix 1: Email Case/Whitespace**
```typescript
const email = formData.email.toLowerCase().trim();
```

**Fix 2: Verify Password Hash**
```bash
# In database
SELECT password_hash FROM users WHERE email = 'test@example.com';
# Should be ~60 char bcrypt hash starting with $2a$ or $2b$
```

**Fix 3: Check Rate Limiting**
```typescript
// Maximum 5 login attempts per IP per 15 minutes
// If getting "Too many attempts" error, wait 15 minutes
```

**Fix 4: Verify Session Cookie**
```javascript
// In DevTools console
document.cookie  // Should show no session (HTTP-only)
// Check Application → Cookies for session cookie with HttpOnly flag
```

---

## Support Resources

- **Full Troubleshooting Guide:** `AUTH_LOGIN_TROUBLESHOOTING.md`
- **Registration Issues:** `MISSING_FIELDS_TROUBLESHOOTING.md`
- **Invalid Credentials:** `INVALID_CREDENTIALS_TROUBLESHOOTING.md`
- **Architecture Details:** `ARCHITECTURE_REPLACEMENT_REPORT.md`
