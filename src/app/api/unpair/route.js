import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export async function POST(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    try {
        const targetToken = token.trim().toUpperCase();
        const data = await fetchFromRag(
            `/api/admin/devices/${encodeURIComponent(targetToken)}/unpair`,
            {
                method: 'POST',
                cache: 'no-store'
            }
        );
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}
