import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';



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
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    const edgeServiceUrl = process.env.EDGE_SERVICE_URL;
    const appServiceUrl = process.env.MOBILEAPP_SERVICE_URL;

    // Individual health check routes
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

    // If no valid service parameter is provided, return a 400 error
    return NextResponse.json(
        { error: 'Valid service parameter (admin, edge, app) is required' },
        { status: 400 }
    );
}
