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

    const ragApiUrl = process.env.RAG_API_URL;

    if (!ragApiUrl) {
        ragStatus = 'not_configured';
    } else {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);

            const res = await fetch(`${ragApiUrl}/api/health`, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                ragStatus = data.status === 'ok' ? 'connected' : 'disconnected';
            } else {
                ragStatus = 'disconnected';
            }
        } catch {
            ragStatus = 'disconnected';
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
