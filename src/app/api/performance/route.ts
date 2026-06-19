import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

async function measureLatency(url: string | null | undefined): Promise<{ status: string, latencyMs: number | null }> {
    if (!url) return { status: 'not_configured', latencyMs: null };
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const startTime = Date.now();
        const res = await fetch(`${url}/api/health`, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' },
            cache: 'no-store',
        });
        const endTime = Date.now();
        
        clearTimeout(timeoutId);

        if (res.ok) {
            return { status: 'connected', latencyMs: endTime - startTime };
        } else {
            return { status: `error_${res.status}`, latencyMs: null };
        }
    } catch (e: any) {
        if (e.name === 'AbortError') {
            return { status: 'timeout', latencyMs: null };
        }
        return { status: 'disconnected', latencyMs: null };
    }
}

export async function GET(request: NextRequest) {
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;
    const edgeServiceUrl = process.env.EDGE_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'edge');
    const appServiceUrl = process.env.MOBILEAPP_SERVICE_URL || getSubdomainUrl(adminServiceUrl, 'app');

    const [adminResult, edgeResult, appResult] = await Promise.all([
        measureLatency(adminServiceUrl),
        measureLatency(edgeServiceUrl),
        measureLatency(appServiceUrl)
    ]);

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        results: [
            {
                service: 'Admin-Service',
                targetUrl: adminServiceUrl || 'Not Configured',
                status: adminResult.status,
                latencyMs: adminResult.latencyMs
            },
            {
                service: 'Edge-Service',
                targetUrl: edgeServiceUrl || 'Not Configured',
                status: edgeResult.status,
                latencyMs: edgeResult.latencyMs
            },
            {
                service: 'MobileApp-Service',
                targetUrl: appServiceUrl || 'Not Configured',
                status: appResult.status,
                latencyMs: appResult.latencyMs
            }
        ]
    });
}
