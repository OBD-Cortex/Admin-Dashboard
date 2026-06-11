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

