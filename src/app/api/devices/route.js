import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export async function GET(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    try {
        const data = await fetchFromRag(
            `/api/admin/devices?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`,
            { cache: 'no-store' }
        );
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}
