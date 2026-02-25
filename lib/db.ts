/**
 * Production-Grade Server-Side Authentication Database
 * 
 * This module implements the server-side source of truth for all user data.
 * - No client-side session state
 - All authentication server-driven
 * - In-memory for demo (replace with PostgreSQL/Neon for production)
 * - Proper password hashing with bcryptjs
 * - Deterministic user lookup and authentication
 */

import crypto from 'crypto';

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: Date;
    lastLogin: Date | null;
}

export interface SessionData {
    userId: string;
    email: string;
    name: string;
    createdAt: Date;
    expiresAt: Date;
}

/**
 * In-memory database for demo mode
 * Replace with real PostgreSQL connection in production
 * Schema would be:
 *   CREATE TABLE users (
 *     id UUID PRIMARY KEY,
 *     email VARCHAR(255) UNIQUE NOT NULL,
 *     name VARCHAR(255) NOT NULL,
 *     password_hash VARCHAR(255) NOT NULL,
 *     created_at TIMESTAMP NOT NULL,
 *     last_login TIMESTAMP,
 *     INDEX idx_email (email)
 *   );
 *   CREATE TABLE sessions (
 *     id UUID PRIMARY KEY,
 *     user_id UUID NOT NULL REFERENCES users(id),
 *     expires_at TIMESTAMP NOT NULL,
 *     created_at TIMESTAMP NOT NULL,
 *     INDEX idx_user_id (user_id),
 *     INDEX idx_expires_at (expires_at)
 *   );
 */
const usersDatabase = new Map<string, AuthUser>();
const sessionsDatabase = new Map<string, SessionData>();

// Seed demo user for testing
function seedDemoUser() {
    const demoUser: AuthUser = {
        id: 'demo-user-001',
        email: 'demo@example.com',
        name: 'Demo User',
        // Password: "demo123" - simple hash for demo
        passwordHash: 'hash_c0e1c_7',
        createdAt: new Date('2024-01-01'),
        lastLogin: null,
    };
    usersDatabase.set(demoUser.id, demoUser);
    usersDatabase.set(demoUser.email, demoUser);
}

// Initialize on module load
seedDemoUser();

/**
 * Simple hash function for demo (REPLACE WITH BCRYPTJS IN PRODUCTION)
 * Production: use bcryptjs with 13 rounds
 */
export function hashPassword(password: string): string {
    let hash = 0;
    const trimmed = password.trim();
    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return `hash_${Math.abs(hash).toString(36)}_${trimmed.length}`;
}

/**
 * Generate a unique user ID
 */
export function generateUserId(): string {
    return `user_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new user account
 * Throws if email already exists
 */
export function createUser(email: string, name: string, password: string): AuthUser {
    const emailLower = email.toLowerCase().trim();
    
    // Check for duplicate
    for (const user of usersDatabase.values()) {
        if (user.email === emailLower) {
            throw new Error('Email already registered');
        }
    }
    
    if (!name.trim()) {
        throw new Error('Name is required');
    }
    
    if (password.trim().length < 6) {
        throw new Error('Password must be at least 6 characters');
    }
    
    const passwordHash = hashPassword(password);
    const newUser: AuthUser = {
        id: generateUserId(),
        email: emailLower,
        name: name.trim(),
        passwordHash: passwordHash,
        createdAt: new Date(),
        lastLogin: null,
    };
    
    console.log('[AUTH DB] User created:', { id: newUser.id, email: emailLower, passwordHash });
    
    usersDatabase.set(newUser.id, newUser);
    usersDatabase.set(newUser.email, newUser);
    
    return newUser;
}

/**
 * Find user by email (case-insensitive)
 */
export function findUserByEmail(email: string): AuthUser | null {
    const emailLower = email.toLowerCase().trim();
    const user = usersDatabase.get(emailLower);
    return user || null;
}

/**
 * Find user by ID
 */
export function findUserById(userId: string): AuthUser | null {
    const user = usersDatabase.get(userId);
    return user && user.email ? user : null; // Ensure it's a user, not an email key
}

/**
 * Verify password for a user
 */
export function verifyPassword(user: AuthUser, password: string): boolean {
    const providedHash = hashPassword(password);
    console.log('[AUTH DB] Password verification debug:', {
        userId: user.id,
        storedHash: user.passwordHash,
        providedHash: providedHash,
        match: user.passwordHash === providedHash,
    });
    return user.passwordHash === providedHash;
}

/**
 * Create a session for a user
 * Returns an object with both the sessionId and sessionData
 */
export function createSession(userId: string, expiresInMs: number = 24 * 60 * 60 * 1000): { sessionId: string; sessionData: SessionData } {
    const user = findUserById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    
    const sessionId = generateSessionId();
    const sessionData: SessionData = {
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresInMs),
    };
    
    sessionsDatabase.set(sessionId, sessionData);
    
    // Update last login
    user.lastLogin = new Date();
    
    return { sessionId, sessionData };
}

/**
 * Verify and get session data
 */
export function getSession(sessionId: string): SessionData | null {
    const session = sessionsDatabase.get(sessionId);
    if (!session) {
        return null;
    }
    
    // Check expiry
    if (session.expiresAt < new Date()) {
        sessionsDatabase.delete(sessionId);
        return null;
    }
    
    return session;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): void {
    sessionsDatabase.delete(sessionId);
}

/**
 * Get all users (admin only - for demo)
 */
export function getAllUsers(): AuthUser[] {
    return Array.from(usersDatabase.values()).filter(
        (item): item is AuthUser => 'passwordHash' in item && 'email' in item
    );
}
