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

    try {
        const ragApiUrl = process.env.RAG_API_URL;
        if (ragApiUrl) {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000); // 2-second timeout
            
            const res = await fetch(`${ragApiUrl}/`, {
                signal: controller.signal,
            });
            clearTimeout(id);
            ragStatus = res.ok || res.status === 404 ? 'connected' : 'disconnected';
        } else {
            ragStatus = 'not_configured';
        }
    } catch {
        ragStatus = 'disconnected';
    }

    return NextResponse.json({
        status: (dbStatus === 'connected' && ragStatus === 'connected') ? 'ok' : 'degraded',
        database: dbStatus,
        rag: ragStatus,
        uptime: Math.floor(process.uptime()),
        node: process.version,
    });
}
