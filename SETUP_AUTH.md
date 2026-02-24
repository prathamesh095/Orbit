# Setup Guide: Secure Authentication System

This guide walks you through integrating and testing the production-grade authentication system.

## Prerequisites

- Supabase project created and configured
- Next.js 16+ project initialized
- Node.js 18+ installed

## Step 1: Database Setup

### Option A: Automatic Setup (Recommended)
Run the migration script we created:

```bash
# First, ensure your Supabase credentials are in .env
npx ts-node scripts/setup-auth-db.js
```

### Option B: Manual Setup via Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to SQL Editor
4. Copy the contents of `scripts/01-create-auth-tables.sql`
5. Run the SQL query
6. Verify tables are created in the Tables view

## Step 2: Environment Variables

Add the following to your `.env.local`:

```env
# Supabase
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_JWT_SECRET=[YOUR-JWT-SECRET]
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/[DATABASE]
```

You can find these values in your Supabase project settings:
- Dashboard → Settings → API
- Dashboard → Database → Connection String (for POSTGRES_URL)

## Step 3: Install Dependencies

The dependencies are already in `package.json`. Run:

```bash
npm install
# or
pnpm install
# or
yarn install
```

Required packages:
- `@supabase/supabase-js` - Supabase client
- `bcryptjs` - Password hashing
- `cookie` - Cookie manipulation

## Step 4: Verify Installation

### Test Database Connection
```bash
# Create a simple test script
cat > test-auth.js << 'EOF'
import { supabaseAdmin } from './lib/db.ts';

async function test() {
  const { data: tables, error } = await supabaseAdmin
    .from('users')
    .select('count', { count: 'exact' });
  
  if (error) {
    console.error('Database error:', error);
    return;
  }
  
  console.log('Database connection successful!');
}

test();
EOF

npx ts-node test-auth.js
```

### Check API Routes
The following API routes should be available:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/session`

## Step 5: Update Your Components

### Update Login Page
If you have an existing login page, update it to use the new auth context:

```typescript
// app/(auth)/login/page.tsx
'use client';

import { useAuth } from '@/lib/authContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const { login, error, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/workspace');
    } catch (err) {
      // Error is set in context
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

### Update Registration Page
```typescript
// app/(auth)/register/page.tsx
'use client';

import { useAuth } from '@/lib/authContext';
import { useState } from 'react';

export default function RegisterPage() {
  const { register, error, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(fullName, email, password, confirmPassword);
      setSuccess(true);
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full Name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm Password"
        required
      />
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Registration successful! Please log in.</div>}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}
```

### Update Protected Routes
```typescript
// app/workspace/page.tsx
import { useAuth } from '@/lib/authContext';

export default function WorkspacePage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Redirecting to login...</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}
```

## Step 6: Test the Flow

### Manual Testing

1. **Register a new user:**
   ```
   Email: test@example.com
   Password: TestPass123!
   Full Name: Test User
   ```

2. **Login with the user:**
   ```
   Email: test@example.com
   Password: TestPass123!
   ```

3. **Verify session:**
   - Check browser cookies for `session` cookie
   - Should be HTTP-only, Secure, SameSite=Strict

4. **Check database:**
   - Users table should have the new user
   - Sessions table should have an active session
   - Auth_logs should show REGISTER_SUCCESS and LOGIN_SUCCESS events

### Testing Password Requirements
Try registering with weak passwords:
- ✗ `pass` - Too short
- ✗ `password123` - No uppercase
- ✗ `PASSWORD123` - No lowercase  
- ✗ `PassWord123` - No special character
- ✓ `PassWord123!` - Valid

### Testing Rate Limiting
Try logging in 6 times with wrong password:
- First 5 attempts: `Invalid email or password`
- 6th attempt: `Too many login attempts. Please try again in X seconds.`

## Step 7: Production Deployment

### Before Deploying:

1. **Test in staging environment**
   - Verify all API routes work
   - Test session persistence
   - Verify rate limiting

2. **Security review**
   - [ ] HTTPS/TLS enabled
   - [ ] Environment variables configured
   - [ ] Rate limits appropriate for traffic
   - [ ] Error messages don't leak information
   - [ ] CORS policies set correctly

3. **Database backup**
   - Enable Supabase backups
   - Test restore procedure

4. **Monitoring setup**
   - Monitor auth_logs table for suspicious activity
   - Alert on failed login attempts
   - Track registration rates

### Deployment Steps:

```bash
# 1. Build the application
npm run build

# 2. Run database migration in production
npm run migrate

# 3. Deploy to Vercel/hosting platform
vercel deploy

# 4. Verify in production
# Test login/register flows
# Check database tables populated
```

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution:** Verify all required env vars are set in `.env.local` and restarted dev server.

### Issue: "PGRST116" errors from Supabase
**Solution:** This is a "No rows returned" error (expected for non-existent users). Check the error handling in auth-server.ts.

### Issue: Session cookie not being set
**Solution:** 
- Check response headers for Set-Cookie
- Verify `credentials: 'include'` in fetch requests
- Check HTTPS in production (secure cookies require HTTPS)

### Issue: Login always fails even with correct credentials
**Solution:**
- Verify password hash stored correctly in database
- Check bcryptjs version compatibility
- Enable debug logging in auth-server.ts

### Issue: Rate limiting too aggressive
**Solution:** Adjust limits in `lib/rate-limit.ts`:
```typescript
const DEFAULT_CONFIGS = {
  login: { maxRequests: 10, windowMs: 10 * 60 * 1000 }, // 10 attempts per 10 minutes
  register: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 attempts per hour
};
```

## Next Steps

1. **Add email verification** - Send confirmation email on registration
2. **Implement forgot password** - Password reset flow
3. **Add MFA support** - TOTP or SMS
4. **Setup OAuth** - Google/GitHub login
5. **Enhanced monitoring** - Track suspicious activity

## Support

For issues or questions:
1. Check `AUTH_IMPLEMENTATION.md` for detailed documentation
2. Review browser console for error messages
3. Check application logs for server-side errors
4. Verify database directly in Supabase dashboard
