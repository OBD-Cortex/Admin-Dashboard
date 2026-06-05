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
 * Requires process.env.SESSION_SECRET to be defined.
 * @returns {string} HMAC secret key.
 */
function getSecret() {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        throw new Error('SESSION_SECRET is not configured in the environment.');
    }
    return secret;
}

/**
 * Validates user-supplied passwords against the SHA-256 hash in the environment.
 * Uses a timing-safe equality check to prevent timing attack vectors.
 * @param {string} password The password supplied during authentication.
 * @returns {boolean} True if password matches the configured SHA-256 hash.
 */
export function validatePassword(password) {
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!hash) {
        throw new Error('ADMIN_PASSWORD_HASH is not configured in the environment.');
    }

    const inputHash = crypto.createHash('sha256').update(password).digest('hex');
    const expectedBuffer = Buffer.from(hash, 'hex');
    const inputBuffer = Buffer.from(inputHash, 'hex');

    if (expectedBuffer.length !== inputBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(expectedBuffer, inputBuffer);
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
    
    const sigBuffer = Buffer.from(sig, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
        return null;
    }
    
    // Timing-Safe check prevents attackers from harvesting signatures by measuring execution latency differences.
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
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
    return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
}

/**
 * Formats a Set-Cookie header string that clears the session (logout).
 * @returns {string} Formatted header string with Max-Age=0.
 */
export function buildClearCookie() {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

export { COOKIE_NAME };
