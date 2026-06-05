import { loadEnvSecrets } from './env';

// Ensure environment variables are registered
loadEnvSecrets();

/**
 * Standard utility to communicate with the FastAPI RAG backend.
 * Provides unified request proxying, environment verification, header handling,
 * and robust error mapping.
 *
 * @param {string} path API endpoint path (e.g., '/api/admin/devices')
 * @param {object} options Fetch options (method, body, headers, cache, etc.)
 * @returns {Promise<any>} Parsed JSON response from the backend.
 */
export async function fetchFromRag(path, options = {}) {
    const ragApiUrl = process.env.RAG_API_URL;
    const apiKey = process.env.MOBILE_API_KEY;

    if (!ragApiUrl || !apiKey) {
        console.error('[RAG API Client] Server configuration error: RAG_API_URL or MOBILE_API_KEY is missing.');
        throw { status: 500, message: 'Server configuration error: Backend credentials are not configured.' };
    }

    const url = `${ragApiUrl.replace(/\/$/, '')}${path}`;
    const headers = new Headers(options.headers || {});
    
    // Inject the secure mobile API key required by the FastAPI server
    headers.set('X-API-Key', apiKey);

    // Merge headers back into options. Do not explicitly set 'Content-Type' for FormData 
    // to allow the browser/runtime to automatically compute the boundary string.
    const fetchOptions = {
        ...options,
        headers,
    };

    let response;
    try {
        response = await fetch(url, fetchOptions);
    } catch (networkError) {
        console.error(`[RAG API Client] Connection failed to ${url}:`, networkError);
        throw { status: 502, message: 'Failed to reach RAG API backend server' };
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
        console.error(`[RAG API Client] Backend returned status ${response.status}: ${errorMessage}`);
        throw { status: response.status, message: errorMessage };
    }

    try {
        return await response.json();
    } catch (parseError) {
        console.error('[RAG API Client] Failed to parse backend JSON response:', parseError);
        throw { status: 502, message: 'Invalid response format received from RAG API' };
    }
}
