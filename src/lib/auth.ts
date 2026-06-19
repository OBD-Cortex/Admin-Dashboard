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
export function validatePassword(password: string): boolean {
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
