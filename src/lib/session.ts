const encoder = new TextEncoder();

async function getHmacKey(secret: string): Promise<CryptoKey> {
    const keyData = encoder.encode(secret);
    return await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/**
 * Signs a session payload and returns a secure base64url token string.
 */
export async function signSession(payload: any, secret: string): Promise<string> {
    const payloadStr = JSON.stringify(payload);
    const encodedPayload = btoa(payloadStr)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const key = await getHmacKey(secret);
    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(encodedPayload)
    );

    const signatureBytes = new Uint8Array(signatureBuffer);
    let signatureBin = '';
    for (let i = 0; i < signatureBytes.length; i++) {
        signatureBin += String.fromCharCode(signatureBytes[i]);
    }

    const signatureStr = btoa(signatureBin)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return `${encodedPayload}.${signatureStr}`;
}

/**
 * Verifies a session token string, checks expiration, and returns the payload if valid.
 */
export async function verifySession(token: string, secret: string): Promise<any | null> {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signatureStr] = parts;

    try {
        const key = await getHmacKey(secret);
        
        // Reconstruct signature bytes from base64url
        const signatureBin = atob(signatureStr.replace(/-/g, '+').replace(/_/g, '/'));
        const signatureBytes = new Uint8Array(signatureBin.length);
        for (let i = 0; i < signatureBin.length; i++) {
            signatureBytes[i] = signatureBin.charCodeAt(i);
        }

        const isValid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBytes,
            encoder.encode(encodedPayload)
        );

        if (!isValid) return null;

        const payloadStr = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadStr);

        // Check expiration
        if (payload.exp && Date.now() > payload.exp) {
            return null;
        }

        return payload;
    } catch (err) {
        return null;
    }
}
