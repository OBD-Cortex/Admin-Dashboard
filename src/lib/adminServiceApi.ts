import crypto from 'crypto';

/**
 * Generates a native HS256 JWT using native Node crypto.
 */
function generateAdminJwt(secret: string): string {
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

export async function fetchFromAdminService(path: string, options: RequestInit = {}): Promise<any> {
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!adminServiceUrl || !secret) {
        console.error('[Admin Service API Client] Server configuration error: ADMIN_SERVICE_URL or ADMIN_JWT_SECRET is missing.');
        throw { status: 500, message: 'Server configuration error: Backend credentials are not configured.' };
    }

    const url = `${adminServiceUrl.replace(/\/$/, '')}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Inject the native HS256 JWT
    headers.set('Authorization', `Bearer ${generateAdminJwt(secret)}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds for large uploads

    // Merge headers back into options. Do not explicitly set 'Content-Type' for FormData 
    // to allow the browser/runtime to automatically compute the boundary string.
    const fetchOptions = {
        ...options,
        headers,
        signal: controller.signal,
    };

    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (networkError: any) {
        if (networkError.name === 'AbortError') {
            console.error(`[Admin Service API Client] Connection timed out to ${url}`);
            throw { status: 504, message: 'Connection timed out while reaching Admin Service backend' };
        }
        console.error(`[Admin Service API Client] Connection failed to ${url}:`, networkError);
        throw { status: 502, message: 'Failed to reach Admin Service API backend server' };
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        let errorMessage = 'An error occurred while communicating with the backend';
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
            try {
                const text = await response.text();
                if (text) errorMessage = text;
            } catch {
                // Keep default message
            }
        }
        console.error(`[Admin Service API Client] Backend returned status ${response.status}: ${errorMessage}`);
        throw { status: response.status, message: errorMessage };
    }

    try {
        return await response.json();
    } catch (parseError) {
        console.error('[Admin Service API Client] Failed to parse backend JSON response:', parseError);
        throw { status: 502, message: 'Invalid response format received from Admin Service API' };
    }
}
