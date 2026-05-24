/**
 * Authentication & Session Management Utilities — OBD-Cortex Admin
 * ───────────────────────────────────────────────────────────────
 * Implements a lightweight, zero-dependency, stateless cookie-based session manager
 * using HMAC-SHA256 signatures. Built natively on Node's cryptographic primitives.
 * 
 * Flow Chart:
 * 1. POST /api/auth verifies password against process.env.ADMIN_PASSWORD
 * 2. Generates signed token: `base64url(payload) + '.' + hmac_hex(payload)`
 * 3. Sets an HttpOnly cookie with token payload
 * 4. middleware.js verifies signature on every incoming page/API route
 *
 * Maintainability Considerations:
 * - Security: HTTP-Only cookie flag prevents Cross-Site Scripting (XSS) token extraction.
 * - Performance: Stateless design does not query MongoDB on route requests.
 * - Zero Dependencies: Native `crypto` module avoids `jsonwebtoken` package updates.
 */

import crypto from 'crypto';
import { loadEnvSecrets } from './env';

// Ensure environment secrets are mapped before reading credentials
loadEnvSecrets();

// The standard cookie name used to store token keys
const COOKIE_NAME = 'obd_session';

// Session lifetime configuration (24 hours)
const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;

/**
 * Retrieves the cryptographic secret key used for signing session tokens.
 * Falls back to the admin password or a static string if undefined.
 * @returns {string} HMAC secret key.
 */
function getSecret() {
    return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'obd-cortex-fallback-secret';
}

/**
 * Retrieves the required password from server environment.
 * @returns {string} The password required for login page validation.
 */
function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || 'admin';
}

/**
 * Validates user-supplied passwords.
 * @param {string} password The password supplied during authentication.
 * @returns {boolean} True if password matches the configured secret.
 */
export function validatePassword(password) {
    return password === getAdminPassword();
}

/**
 * Generates a signed session token.
 * Payload format: `{"ts": timestamp, "exp": expiration_timestamp}`
 * Signature format: `base64url(payload).hmac_hex`
 * @returns {string} Signed token string.
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
 * Verifies the signature and expiration of a session token.
 * Uses a timing-safe equality check to mitigate timing attack vectors.
 * @param {string} token Raw token string from the request cookie.
 * @returns {Object|null} Decoded payload object if valid, null if signature/expiration check fails.
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

    // Generate expected HMAC signature
    const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
    
    // Timing-Safe check prevents attackers from harvesting signatures by measuring execution latency differences.
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) {
        return null;
    }

    // Verify token expiration limits
    try {
        const data = JSON.parse(payload);
        if (Date.now() > data.exp) return null;
        return data;
    } catch {
        return null;
    }
}

/**
 * Formats a Set-Cookie header string to store the session.
 * @param {string} token Signed session token.
 * @returns {string} Formatted Set-Cookie header.
 */
export function buildSessionCookie(token) {
    const maxAge = Math.floor(TOKEN_LIFETIME_MS / 1000);
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/**
 * Formats a Set-Cookie header string that clears the session (logout).
 * @returns {string} Formatted header string with Max-Age=0.
 */
export function buildClearCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export { COOKIE_NAME };
