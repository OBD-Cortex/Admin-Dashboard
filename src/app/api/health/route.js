import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check
 */
export async function GET() {
    let dbStatus = 'unknown';
    let adminServiceStatus = 'unknown';
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;

    if (!adminServiceUrl) {
        adminServiceStatus = 'not_configured';
    } else {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`${adminServiceUrl}/api/health`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                adminServiceStatus = 'connected';
                dbStatus = data.database || 'unknown';
            } else {
                adminServiceStatus = 'disconnected';
                dbStatus = 'disconnected';
            }
        } catch {
            adminServiceStatus = 'disconnected';
            dbStatus = 'disconnected';
        }
    }

    return NextResponse.json({
        status: (dbStatus === 'connected' && adminServiceStatus === 'connected') ? 'ok' : 'degraded',
        database: dbStatus,
        adminService: adminServiceStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
