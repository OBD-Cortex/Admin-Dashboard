import crypto from 'crypto';

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

/**
 * Generates a native HS256 JWT using native Node crypto.
 */
export function generateAdminJwt(secret: string): string {
    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
        iss: "obd-cortex-admin",
        aud: "obd-cortex-admin-api",
        exp: Math.floor(Date.now() / 1000) + 60 // 60 seconds
    };
    
    const encodeBase64Url = (obj: object) => {
        return Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    };
    
    const encodedHeader = encodeBase64Url(header);
    const encodedPayload = encodeBase64Url(payload);
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const signature = crypto.createHmac('sha256', secret)
        .update(signatureInput)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
        
    return `${signatureInput}.${signature}`;
}
