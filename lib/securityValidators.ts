/**
 * Security-Focused Input Validation Schemas
 * 
 * These schemas enforce strict input validation to prevent:
 * - SQL injection
 * - XSS attacks
 * - Data corruption
 * - Oversized payloads
 * 
 * SECURITY: Use these validators on BOTH client and server
 * Server-side validation is mandatory and takes precedence
 */

// ─── Email Validation ──────────────────────────────────────────────────────────
// RFC 5322 simplified regex (production use stricter validation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > 254) return false; // RFC 5321
    if (!EMAIL_REGEX.test(trimmed)) return false;
    return true;
}

// ─── Password Validation ──────────────────────────────────────────────────────────
export interface PasswordValidationResult {
    valid: boolean;
    errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (!password || typeof password !== 'string') {
        errors.push('Password is required');
        return { valid: false, errors };
    }

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }

    if (password.length > 128) {
        errors.push('Password must not exceed 128 characters');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain lowercase letters');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain uppercase letters');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain numbers');
    }

    // Optional: Require special characters for higher security
    // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    //     errors.push('Password must contain special characters');
    // }

    return {
        valid: errors.length === 0,
        errors,
    };
}

// ─── String Sanitization ──────────────────────────────────────────────────────────
/**
 * Sanitize a string to prevent XSS attacks
 * Removes/escapes potentially dangerous characters
 */
export function sanitizeString(input: string, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') return '';

    let result = input
        .trim()
        .slice(0, maxLength)
        // Escape HTML special characters
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    return result;
}

/**
 * Remove null bytes and control characters
 */
export function removeNullBytes(input: string): string {
    if (!input) return '';
    return input.replace(/[\x00-\x1F\x7F]/g, '');
}

// ─── Name Validation ──────────────────────────────────────────────────────────────
export function validateName(name: string): boolean {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 255) return false;
    // Allow letters, spaces, hyphens, apostrophes
    if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) return false;
    return true;
}

// ─── URL Validation ──────────────────────────────────────────────────────────────
export function validateUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    try {
        const parsed = new URL(url);
        // Only allow http and https
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

// ─── Phone Validation ──────────────────────────────────────────────────────────────
// Basic international phone validation
export function validatePhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    const cleaned = phone.replace(/\D/g, '');
    // Allow 10-15 digit numbers (international standard)
    return cleaned.length >= 10 && cleaned.length <= 15;
}

// ─── UUID Validation ──────────────────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateUUID(id: string): boolean {
    if (!id || typeof id !== 'string') return false;
    return UUID_REGEX.test(id);
}

// ─── Payload Size Validation ──────────────────────────────────────────────────────
/**
 * Check if a payload is within acceptable size limits
 */
export function validatePayloadSize(data: any, maxSizeBytes: number = 1024 * 1024): boolean {
    try {
        const json = JSON.stringify(data);
        const bytes = new TextEncoder().encode(json).length;
        return bytes <= maxSizeBytes;
    } catch {
        return false;
    }
}

// ─── File Validation ──────────────────────────────────────────────────────────────
export interface FileValidationOptions {
    maxSizeBytes?: number;
    allowedMimeTypes?: string[];
    allowedExtensions?: string[];
}

const DEFAULT_FILE_OPTIONS: FileValidationOptions = {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'],
};

export function validateFile(
    file: File | undefined,
    options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
    const opts = { ...DEFAULT_FILE_OPTIONS, ...options };

    if (!file) {
        return { valid: false, error: 'File is required' };
    }

    // Check size
    if (opts.maxSizeBytes && file.size > opts.maxSizeBytes) {
        return {
            valid: false,
            error: `File size exceeds maximum of ${opts.maxSizeBytes / 1024 / 1024}MB`,
        };
    }

    // Check MIME type
    if (opts.allowedMimeTypes && !opts.allowedMimeTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type ${file.type} is not allowed`,
        };
    }

    // Check extension
    if (opts.allowedExtensions) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !opts.allowedExtensions.includes(ext)) {
            return {
                valid: false,
                error: `File extension .${ext} is not allowed`,
            };
        }
    }

    return { valid: true };
}

// ─── Application Status Validation ────────────────────────────────────────────────
const VALID_APPLICATION_STATUSES = ['draft', 'applied', 'interviewing', 'offer', 'rejected'] as const;

export function validateApplicationStatus(status: any): boolean {
    return VALID_APPLICATION_STATUSES.includes(status);
}

// ─── Date Validation ──────────────────────────────────────────────────────────────
export function validateDateString(dateStr: string): boolean {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

export function validateDateRange(start: string, end: string): boolean {
    if (!validateDateString(start) || !validateDateString(end)) return false;
    return new Date(start) <= new Date(end);
}

// ─── Composite Validators ─────────────────────────────────────────────────────────

export interface AuthInputValidation {
    email: string;
    password: string;
    name?: string;
}

export function validateAuthInput(data: any): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    if (!validateEmail(data?.email)) {
        errors.email = 'Invalid email address';
    }

    const passwordValidation = validatePassword(data?.password);
    if (!passwordValidation.valid) {
        errors.password = passwordValidation.errors.join('; ');
    }

    if (data?.name && !validateName(data.name)) {
        errors.name = 'Name must be 2-255 characters and contain only letters, spaces, hyphens, or apostrophes';
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
    };
}

// ─── Security Headers ─────────────────────────────────────────────────────────────
/**
 * Generate security headers for API responses
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        // Prevent clickjacking
        'X-Frame-Options': 'DENY',
        // Prevent MIME sniffing
        'X-Content-Type-Options': 'nosniff',
        // Enable XSS protection (deprecated but still useful)
        'X-XSS-Protection': '1; mode=block',
        // Referrer policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        // Permissions policy
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
        // HSTS (preload if safe)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };
}

// ─── CORS Configuration ───────────────────────────────────────────────────────────
export const CORS_CONFIG = {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 3600,
};

// ─── Logging & Monitoring ─────────────────────────────────────────────────────────
export function logSecurityEvent(
    eventType: string,
    details: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
): void {
    const timestamp = new Date().toISOString();
    const message = {
        timestamp,
        eventType,
        severity,
        ...details,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        const color = {
            info: '\x1b[36m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            critical: '\x1b[35m',
        }[severity];
        console.log(`${color}[SECURITY ${eventType}]\x1b[0m`, message);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        // Integration with Sentry or similar service would go here
        console.log('[SECURITY EVENT]', message);
    }
}

// ─── Rate Limiting Constants ──────────────────────────────────────────────────────
export const RATE_LIMITS = {
    login: { attempts: 5, windowMs: 60 * 1000 }, // 5 per minute
    register: { attempts: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    forgotPassword: { attempts: 3, windowMs: 24 * 60 * 60 * 1000 }, // 3 per day
    api: { requests: 100, windowMs: 60 * 1000 }, // 100 per minute
};

export default {
    validateEmail,
    validatePassword,
    sanitizeString,
    validateName,
    validateUrl,
    validatePhone,
    validateUUID,
    validateFile,
    validateAuthInput,
    getSecurityHeaders,
    logSecurityEvent,
};
