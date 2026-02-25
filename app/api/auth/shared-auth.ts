// Shared server-side authentication storage
// This module maintains user data in memory for demo purposes
// In production, replace with real database (PostgreSQL, Neon, etc.)

export interface StoredUser {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt: string;
}

// In-memory user store (persists for the lifetime of the Node.js process)
// Multiple requests to the same server will share this data
// Different server instances (horizontal scaling) will have separate stores
const serverUserStore: Map<string, StoredUser> = new Map();

/**
 * Get all users from server-side storage
 * In production: Query from database
 */
export function getServerUsers(): StoredUser[] {
    return Array.from(serverUserStore.values());
}

/**
 * Save users to server-side storage
 * In production: Persist to database
 */
export function setServerUsers(users: StoredUser[]): void {
    serverUserStore.clear();
    users.forEach((user) => {
        serverUserStore.set(user.id, user);
    });
}

/**
 * Add a user to server-side storage
 * In production: INSERT into database
 */
export function addServerUser(user: StoredUser): void {
    serverUserStore.set(user.id, user);
}

/**
 * Find user by email
 * In production: SELECT * FROM users WHERE email = ?
 */
export function findUserByEmail(email: string): StoredUser | undefined {
    const emailLower = email.toLowerCase().trim();
    return Array.from(serverUserStore.values()).find((u) => u.email === emailLower);
}

/**
 * Find user by ID
 * In production: SELECT * FROM users WHERE id = ?
 */
export function findUserById(id: string): StoredUser | undefined {
    return serverUserStore.get(id);
}

/**
 * Validate user credentials
 * Returns true if email exists and password hash matches
 */
export function validateUserPassword(email: string, passwordHash: string): boolean {
    const user = findUserByEmail(email);
    return user ? user.passwordHash === passwordHash : false;
}

/**
 * Check if email is already registered
 * In production: SELECT COUNT(*) FROM users WHERE email = ?
 */
export function emailExists(email: string): boolean {
    return findUserByEmail(email) !== undefined;
}
