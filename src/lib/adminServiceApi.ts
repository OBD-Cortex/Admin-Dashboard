import { generateAdminJwt } from './auth';


export class AdminServiceError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'AdminServiceError';
        this.status = status;
    }
}

export async function fetchFromAdminService(path: string, options: RequestInit & { timeout?: number } = {}): Promise<any> {
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    const secret = process.env.ADMIN_JWT_SECRET;

    if (!adminServiceUrl || !secret) {
        console.error('[Admin Service API Client] Server configuration error: ADMIN_SERVICE_URL or ADMIN_JWT_SECRET is missing.');
        throw new AdminServiceError(500, 'Server configuration error: Backend credentials are not configured.');
    }

    const url = `${adminServiceUrl.replace(/\/$/, '')}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Inject the native HS256 JWT
    headers.set('Authorization', `Bearer ${generateAdminJwt(secret)}`);

    const controller = new AbortController();
    const timeoutValue = options.timeout ?? 5000; // Default 5 seconds
    const timeoutId = setTimeout(() => controller.abort(), timeoutValue);

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
            throw new AdminServiceError(504, 'Connection timed out while reaching Admin Service backend');
        }
        console.error(`[Admin Service API Client] Connection failed to ${url}:`, networkError);
        throw new AdminServiceError(502, 'Failed to reach Admin Service API backend server');
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
        throw new AdminServiceError(response.status, errorMessage);
    }

    try {
        return await response.json();
    } catch (parseError) {
        console.error('[Admin Service API Client] Failed to parse backend JSON response:', parseError);
        throw new AdminServiceError(502, 'Invalid response format received from Admin Service API');
    }
}
