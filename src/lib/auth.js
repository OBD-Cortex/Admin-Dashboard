/**
 * Authentication Utilities — OBD-Cortex Admin
 * ────────────────────────────────────────────
 * Stateless cookie-based auth using HMAC-SHA256 signed tokens.
 * No external dependencies — uses Node.js built-in crypto module.
 *
 * Flow:
 *  1. User enters ADMIN_PASSWORD on /login
 *  2. POST /api/auth → validates password → sets HttpOnly cookie
 *  3. middleware.js checks cookie on every protected route
 *  4. Cookie expires after 24 hours
 */

import crypto from 'crypto';
import { loadEnvSecrets } from './env';

loadEnvSecrets();

const COOKIE_NAME = 'obd_session';
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecret() {
    return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'obd-cortex-fallback-secret';
}

function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || 'admin';
}

/**
 * Validate the provided password against ADMIN_PASSWORD env var.
 */
export function validatePassword(password) {
    return password === getAdminPassword();
}

/**
 * Create a signed session token.
 * Format: base64url(payload) + "." + hmac_hex
 */
export function createSessionToken() {
    const payload = JSON.stringify({
        ts: Date.now(),
        exp: Date.now() + TOKEN_LIFETIME_MS,
    });
    const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    const payloadB64 = Buffer.from(payload).toString('base64url');
    return `${payloadB64}.${hmac}`;
}

/**
 * Verify a session token. Returns the payload if valid, null if invalid/expired.
 */
export function verifySessionToken(token) {
    if (!token || typeof token !== 'string') return null;

    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) return null;

    const payloadB64 = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);

    let payload;
    try {
        payload = Buffer.from(payloadB64, 'base64url').toString('utf-8');
    } catch {
        return null;
    }

    // Verify HMAC signature
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
        return null;
    }

    // Check expiration
    try {
        const data = JSON.parse(payload);
        if (Date.now() > data.exp) return null;
        return data;
    } catch {
        return null;
    }
}

/**
 * Build the Set-Cookie header value for the session cookie.
 */
export function buildSessionCookie(token) {
    const maxAge = Math.floor(TOKEN_LIFETIME_MS / 1000);
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Build a Set-Cookie header that clears the session cookie.
 */
export function buildClearCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
