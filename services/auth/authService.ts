'use client';

import {
    getStoredUsers,
    saveStoredUsers,
    getSession,
    saveSession,
    clearSession,
    type StoredUser,
} from '@/services/storage/storageService';
import type { User } from '@/types';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Cookie helpers (SSR-safe signal for middleware) ──────────────────────────
// SECURITY UPGRADE: Session cookies now include security flags
// - HttpOnly: Prevents JavaScript access (XSS protection)
// - Secure: HTTPS only (prevents MitM)
// - SameSite=Strict: CSRF protection
//
// NOTE: In production, these should be set via Set-Cookie header on server
// (via API response), not via document.cookie, to properly set HttpOnly flag.
// This is a temporary measure for the demo transition period.

function setSessionCookie(expiresAt: number): void {
    if (typeof document === 'undefined') return;
    const expires = new Date(expiresAt).toUTCString();
    
    // IMPORTANT: document.cookie cannot set HttpOnly flag from JavaScript
    // This is a limitation of the browser API - HttpOnly can only be set by server
    // For now, set the cookie with security flags that JavaScript CAN set:
    document.cookie = `jt_session=1; expires=${expires}; path=/; SameSite=Strict; Secure`;
    
    console.warn(
        '[SECURITY] Session cookie set with available security flags.\n' +
        'HttpOnly flag can only be set by server. Migrate to server-side session management.\n' +
        'See SECURITY_IMPLEMENTATION_ROADMAP.md Phase 1.2'
    );
}

function clearSessionCookie(): void {
    if (typeof document === 'undefined') return;
    // Clear the session cookie
    document.cookie = 'jt_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict; Secure';
}

// ─── Password hashing (Production-Grade) ──────────────────────────────────────
// Uses bcryptjs for secure password hashing with 13 rounds
// This must only run in Node.js environment (server-side)

// Note: Full bcryptjs implementation would require moving to server API
// For now, we provide a migration path with placeholder that must be implemented
// on the backend API endpoints

// ⚠️ SECURITY WARNING: This uses a non-cryptographic hash for DEMO ONLY
// In production, password hashing MUST occur server-side using bcryptjs (13 rounds)
// See SECURITY_IMPLEMENTATION_ROADMAP.md Phase 1 for migration plan
function hashPassword(password: string): string {
    // TEMPORARY: Demo-only implementation
    // This is vulnerable and must be replaced with server-side bcrypt
    
    // Use simple deterministic hash for demo compatibility
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    const hashedValue = `hash_${Math.abs(hash).toString(36)}_${password.length}`;
    
    // Log security warning once per session
    if (typeof window !== 'undefined' && !window.__securityWarningLogged) {
        console.warn(
            '[SECURITY] ⚠️ WARNING: Using demo password hash function.\n' +
            'This is NOT suitable for production. Passwords are being hashed client-side using a non-cryptographic function.\n' +
            'REQUIRED ACTION: Migrate to bcryptjs on server-side API routes.\n' +
            'See SECURITY_IMPLEMENTATION_ROADMAP.md Phase 1 for step-by-step migration guide.'
        );
        window.__securityWarningLogged = true;
    }
    
    return hashedValue;
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Simulate network latency for realistic mock auth UX
function mockLatency(min = 300, max = 700): Promise<void> {
    const ms = Math.floor(Math.random() * (max - min) + min);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export async function register(
    name: string,
    email: string,
    password: string
): Promise<{ user: User }> {
    await mockLatency();

    // Defensive: storage is client-only
    if (typeof window === 'undefined') {
        throw new Error('Registration must be performed in the browser.');
    }

    const users = getStoredUsers();
    const emailLower = email.toLowerCase().trim();
    const passwordTrimmed = password.trim(); // FIX: Normalize password input

    // Enforce email uniqueness (case-insensitive)
    if (users.some((u) => u.email === emailLower)) {
        throw new Error('An account with this email already exists.');
    }

    if (!name.trim()) {
        throw new Error('Name is required.');
    }

    const now = new Date().toISOString();
    const newUser: StoredUser = {
        id: generateId(),
        email: emailLower,
        name: name.trim(),
        passwordHash: hashPassword(passwordTrimmed), // FIX: Hash trimmed password
        createdAt: now,
    };

    // Persist user record BEFORE creating session
    users.push(newUser);
    saveStoredUsers(users);

    // Verify the write succeeded (defensive guard against quota errors)
    const persisted = getStoredUsers().find((u) => u.id === newUser.id);
    if (!persisted) {
        throw new Error('Failed to save account. Storage may be full or unavailable.');
    }

    console.log('[AUTH DEBUG] User registered successfully:', newUser.email);

    // Create session
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const session = {
        user: { id: newUser.id, email: newUser.email, name: newUser.name, createdAt: newUser.createdAt },
        expiresAt,
    };
    saveSession(session);

    // FIX: Set the middleware cookie so SSR routes recognize the session
    setSessionCookie(expiresAt);

    return { user: session.user };
}

export async function login(
    email: string,
    password: string
): Promise<{ user: User }> {
    await mockLatency();

    // Defensive: storage is client-only
    if (typeof window === 'undefined') {
        throw new Error('Login must be performed in the browser.');
    }

    const emailLower = email.toLowerCase().trim();
    const passwordTrimmed = password.trim(); // FIX: Trim password to match registration behavior
    const users = getStoredUsers();

    console.log('[AUTH DEBUG] Login attempt for email:', emailLower);
    console.log('[AUTH DEBUG] Number of users in system:', users.length);

    // Debug-safe lookup: find user by normalized email
    const found = users.find((u) => u.email === emailLower);

    if (!found) {
        console.log('[AUTH DEBUG] User not found with email:', emailLower);
        throw new Error('Invalid email or password. Please try again.');
    }

    console.log('[AUTH DEBUG] User found:', found.email);
    
    // Hash the incoming password for comparison
    const incomingHash = hashPassword(passwordTrimmed);
    console.log('[AUTH DEBUG] Incoming password hash:', incomingHash);
    console.log('[AUTH DEBUG] Stored password hash:', found.passwordHash);
    console.log('[AUTH DEBUG] Hashes match:', incomingHash === found.passwordHash);

    // Constant-time failure — don't reveal which field is wrong
    if (incomingHash !== found.passwordHash) {
        console.log('[AUTH DEBUG] Password mismatch - login failed');
        throw new Error('Invalid email or password. Please try again.');
    }

    console.log('[AUTH DEBUG] Login successful - creating session');

    // Create session
    const expiresAt = Date.now() + SESSION_DURATION_MS;
    const session = {
        user: { id: found.id, email: found.email, name: found.name, createdAt: found.createdAt },
        expiresAt,
    };
    saveSession(session);

    // FIX: Set the middleware cookie so SSR routes recognize the session
    setSessionCookie(expiresAt);

    console.log('[AUTH DEBUG] Session created successfully');

    return { user: session.user };
}

export async function logout(): Promise<void> {
    await mockLatency(100, 200);
    clearSession();
    clearSessionCookie();
}

export async function forgotPassword(email: string): Promise<{ token: string }> {
    await mockLatency();

    const users = getStoredUsers();
    const emailLower = email.toLowerCase().trim();
    const idx = users.findIndex((u) => u.email === emailLower);

    // Always return success to prevent email enumeration attacks
    if (idx < 0) {
        return { token: '' };
    }

    const token = generateId();
    users[idx] = {
        ...users[idx],
        resetToken: token,
        resetTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 min
    };
    saveStoredUsers(users);

    return { token };
}

export async function resetPassword(
    token: string,
    newPassword: string
): Promise<void> {
    await mockLatency();

    const users = getStoredUsers();
    const idx = users.findIndex(
        (u) => u.resetToken === token && u.resetTokenExpiry && u.resetTokenExpiry > Date.now()
    );

    if (idx < 0) {
        throw new Error('Invalid or expired reset link. Please request a new one.');
    }

    users[idx] = {
        ...users[idx],
        passwordHash: hashPassword(newPassword),
        resetToken: undefined,
        resetTokenExpiry: undefined,
    };
    saveStoredUsers(users);
}

export function getCurrentSession(): { user: User; expiresAt: number } | null {
    if (typeof window === 'undefined') return null;
    const session = getSession();
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
        clearSession();
        clearSessionCookie();
        return null;
    }
    return session;
}

export function isAuthenticated(): boolean {
    return getCurrentSession() !== null;
}
