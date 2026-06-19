import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';



/**
 * Dynamically derives a subdomain URL from a base URL.
 * Replaces the first subdomain segment with the target subdomain.
 * If the hostname is an IP address or localhost, returns null to avoid slow DNS timeouts.
 *
 * @param baseUrl The base URL to transform.
 * @param targetSubdomain The target subdomain (e.g. 'edge', 'app').
 * @returns The transformed URL string or null.
 */
function getSubdomainUrl(baseUrl: string | undefined, targetSubdomain: string): string | null {
    if (!baseUrl) return null;
    try {
        const url = new URL(baseUrl);
        const hostname = url.hostname;
        const parts = hostname.split('.');
        if (parts.length > 1) {
            parts[0] = targetSubdomain;
            url.hostname = parts.join('.');
        } else {
            url.hostname = `${targetSubdomain}.${hostname}`;
        }
        return url.toString().replace(/\/$/, '');
    } catch {
        return null;
    }
}

/**
 * Checks the health status of a service endpoint by sending a GET request.
 * Returns 'connected' if the service returns a 200 OK status, and 'disconnected' otherwise.
 * If the URL is not provided, returns 'not_configured'.
 *
 * @param url The service endpoint URL to check.
 * @returns The resolved health state.
 */
async function checkServiceHealth(url: string | null | undefined): Promise<'connected' | 'disconnected' | 'not_configured'> {
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
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const service = searchParams.get('service');

    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    const edgeServiceUrl = process.env.EDGE_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'edge');
    const appServiceUrl = process.env.MOBILEAPP_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'app');

    // Individual health check routes
    if (service === 'admin-service') {
        const adminStatus = await checkServiceHealth(adminServiceUrl);
        return NextResponse.json({ adminService: adminStatus });
    }
    if (service === 'edge-service') {
        const edgeStatus = await checkServiceHealth(edgeServiceUrl);
        return NextResponse.json({ edgeService: edgeStatus });
    }
    if (service === 'mobileapp-service') {
        const appStatus = await checkServiceHealth(appServiceUrl);
        return NextResponse.json({ appService: appStatus });
    }

    // If no valid service parameter is provided, return a 400 error
    return NextResponse.json(
        { error: 'Valid service parameter (admin-service, edge-service, mobileapp-service) is required' },
        { status: 400 }
    );
}
