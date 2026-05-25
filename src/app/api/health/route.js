import { NextResponse } from 'next/server';
import { getClient } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health — Health check
 */
export async function GET() {
    let dbStatus = 'unknown';
    let ragStatus = 'unknown';

    try {
        const client = await getClient();
        await client.db('admin').command({ ping: 1 });
        dbStatus = 'connected';
    } catch {
        dbStatus = 'disconnected';
    }

    // Temporarily mocked to disconnected to allow previewing the UI without RAG_API_URL configured
    ragStatus = 'disconnected';

    return NextResponse.json({
        status: (dbStatus === 'connected' && ragStatus === 'connected') ? 'ok' : 'degraded',
        database: dbStatus,
        rag: ragStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
