import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    try {
        const data = await fetchFromRag('/api/admin/knowledge', { cache: 'no-store' });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}
