/**
 * Dynamic Environment Loader — OBD-Cortex
 * ────────────────────────────────────────
 * Bypassed for production hosting. We rely entirely on native process.env
 * injected by the host environment.
 */

export function loadEnvSecrets() {
    if (!process.env.RAG_API_URL) {
        console.warn("[!] Warning: RAG_API_URL is missing in environment.");
    }
    if (!process.env.MOBILE_API_KEY) {
        console.warn("[!] Warning: MOBILE_API_KEY is missing in environment.");
    }
    if (!process.env.ADMIN_PASSWORD_HASH) {
        console.warn("[!] Warning: ADMIN_PASSWORD_HASH is missing in environment.");
    }
    if (!process.env.SESSION_SECRET) {
        console.warn("[!] Warning: SESSION_SECRET is missing in environment.");
    }
}
