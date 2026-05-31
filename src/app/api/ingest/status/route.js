import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
        }

        const res = await fetch(`${process.env.RAG_API_URL}/api/ingest/status/${encodeURIComponent(jobId)}`, {
            headers: { 'X-API-Key': process.env.MOBILE_API_KEY },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json({ error: errData.detail || 'Job not found' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Ingest Status API] Exception during status lookup:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
