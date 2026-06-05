import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export async function GET(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
        }

        const data = await fetchFromRag(`/api/ingest/status/${encodeURIComponent(jobId)}`, { cache: 'no-store' });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: error.status || 500 }
        );
    }
}
