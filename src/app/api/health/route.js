import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Dynamically derives a subdomain URL from a base URL.
 * If the hostname starts with "admin.", it replaces it with the target subdomain.
 * If it contains "admin" elsewhere, it replaces that pattern.
 * Otherwise, it prefixes the target subdomain.
 *
 * @param {string} baseUrl The base URL to transform.
 * @param {string} targetSubdomain The target subdomain (e.g. 'edge', 'app').
 * @returns {string} The transformed URL.
 */
function getSubdomainUrl(baseUrl, targetSubdomain) {
    if (!baseUrl) return null;
    try {
        const url = new URL(baseUrl);
        const hostname = url.hostname;
        if (hostname.startsWith('admin.')) {
            url.hostname = hostname.replace(/^admin\./, `${targetSubdomain}.`);
        } else if (hostname.includes('admin')) {
            url.hostname = hostname.replace('admin', targetSubdomain);
        } else {
            url.hostname = `${targetSubdomain}.${hostname}`;
        }
        return url.toString().replace(/\/$/, '');
    } catch {
        return baseUrl.replace('admin', targetSubdomain);
    }
}

/**
 * Checks the health status of a service endpoint by sending a GET request.
 * Returns 'connected' if the service returns a 200 OK status, and 'disconnected' otherwise.
 * If the URL is not provided, returns 'not_configured'.
 *
 * @param {string} url The service endpoint URL to check.
 * @returns {Promise<'connected' | 'disconnected' | 'not_configured'>} The resolved health state.
 */
async function checkServiceHealth(url) {
    if (!url) return 'not_configured';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${url}/api/health`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
            },
        });
        clearTimeout(timeoutId);

        return res.ok ? 'connected' : 'disconnected';
    } catch {
        return 'disconnected';
    }
}

/**
 * GET /api/health
 *
 * Queries the health states of Admin-Service, Edge-Service, and MobileApp-Service in parallel.
 * Returns a JSON payload containing the aggregate and individual service statuses.
 */
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    
    // Check if distinct environment variables are defined, otherwise derive from admin url
    const edgeServiceUrl = process.env.EDGE_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'edge');
    const appServiceUrl = process.env.MOBILEAPP_SERVICE_URL || process.env.APP_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'app');

    if (service === 'admin') {
        const adminStatus = await checkServiceHealth(adminServiceUrl);
        return NextResponse.json({ adminService: adminStatus });
    }
    if (service === 'edge') {
        const edgeStatus = await checkServiceHealth(edgeServiceUrl);
        return NextResponse.json({ edgeService: edgeStatus });
    }
    if (service === 'app') {
        const appStatus = await checkServiceHealth(appServiceUrl);
        return NextResponse.json({ appService: appStatus });
    }

    // Run health checks in parallel
    const [adminStatus, edgeStatus, appStatus] = await Promise.all([
        checkServiceHealth(adminServiceUrl),
        checkServiceHealth(edgeServiceUrl),
        checkServiceHealth(appServiceUrl),
    ]);

    // Retrieve database status from admin service if connected
    let dbStatus = 'unknown';
    if (adminStatus === 'connected' && adminServiceUrl) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            const res = await fetch(`${adminServiceUrl}/api/health`, {
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);
            
            if (res.ok) {
                const data = await res.json();
                dbStatus = data.database || 'unknown';
            }
        } catch {
            dbStatus = 'disconnected';
        }
    }

    const allConnected = adminStatus === 'connected' && edgeStatus === 'connected' && appStatus === 'connected';

    return NextResponse.json({
        status: allConnected ? 'ok' : 'degraded',
        database: dbStatus,
        adminService: adminStatus,
        edgeService: edgeStatus,
        appService: appStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
