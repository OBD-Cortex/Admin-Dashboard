import { NextResponse } from 'next/server';
import { getClient } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check
 */
export async function GET() {
    let dbStatus = 'unknown';

    try {
        const client = await getClient();
        await client.db('admin').command({ ping: 1 });
        dbStatus = 'connected';
    } catch {
        dbStatus = 'disconnected';
    }

    return NextResponse.json({
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        database: dbStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
