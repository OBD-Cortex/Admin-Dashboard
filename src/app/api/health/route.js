import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check
 */
export async function GET() {
    let dbStatus = 'unknown';
    let ragStatus = 'unknown';
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;

    if (!adminServiceUrl) {
        ragStatus = 'not_configured';
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
                ragStatus = 'connected';
                dbStatus = data.database || 'unknown';
            } else {
                ragStatus = 'disconnected';
                dbStatus = 'disconnected';
            }
        } catch {
            ragStatus = 'disconnected';
            dbStatus = 'disconnected';
        }
    }

    return NextResponse.json({
        status: (dbStatus === 'connected' && ragStatus === 'connected') ? 'ok' : 'degraded',
        database: dbStatus,
        rag: ragStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
