import bcrypt from 'bcryptjs';
import { supabaseAdmin } from './db';
import crypto from 'crypto';

const SALT_ROUNDS = 12;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Parse IP address from x-forwarded-for header (takes first IP if multiple)
export function parseIpAddress(ipString: string): string {
  if (!ipString || ipString === 'unknown') return 'unknown';
  // x-forwarded-for can be "IP1, IP2, IP3" - extract first IP
  const ips = ipString.split(',').map(ip => ip.trim());
  const firstIp = ips[0];
  
  // Validate IP format (basic check)
  if (firstIp && /^[\d.]+$|^[\da-f:]+$/i.test(firstIp)) {
    return firstIp;
  }
  return 'unknown';
}

// Password validation rules
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return { valid: errors.length === 0, errors };
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('[v0] Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

// Verify password with timing-safe comparison
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    console.error('[v0] Error verifying password:', error);
    return false;
  }
}

// Generate secure token
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Hash token for storage
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Create user session
export async function createSession(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ token: string; sessionId: string } | null> {
  try {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

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
      console.error('[v0] Error creating session:', error);
      return null;
    }

    return { token, sessionId: data.id };
  } catch (error) {
    console.error('[v0] Error creating session:', error);
    return null;
  }
}

// Verify session token
export async function verifySessionToken(tokenHash: string): Promise<{ userId: string; sessionId: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('sessions')
      .select('id, user_id, expires_at, is_active')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !data) {
      return null;
    }

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date() || !data.is_active) {
      return null;
    }

    return { userId: data.user_id, sessionId: data.id };
  } catch (error) {
    console.error('[v0] Error verifying session:', error);
    return null;
  }
}

// Invalidate session
export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('[v0] Error invalidating session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[v0] Error invalidating session:', error);
    return false;
  }
}

// Create user
export async function createUser(
  email: string,
  password: string,
  fullName: string
): Promise<{ userId: string } | null> {
  try {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[v0] Error creating user:', error);
      throw error;
    }

    return { userId: data.id };
  } catch (error) {
    console.error('[v0] Error in createUser:', error);
    return null;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<{ id: string; passwordHash: string } | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No user found
      }
      console.error('[v0] Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[v0] Error in getUserByEmail:', error);
    return null;
  }
}

// Update last login
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[v0] Error updating last login:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[v0] Error in updateLastLogin:', error);
    return false;
  }
}

// Log authentication event
export async function logAuthEvent(
  userId: string | null,
  eventType: string,
  ipAddress: string,
  userAgent: string,
  success: boolean,
  errorMessage?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('auth_logs')
      .insert({
        user_id: userId,
        event_type: eventType,
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        error_message: errorMessage || null,
      });

    if (error) {
      console.error('[v0] Error logging auth event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[v0] Error in logAuthEvent:', error);
    return false;
  }
}
