import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export async function POST(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    try {
        const body = await request.json();
        const count = parseInt(body.count) || 1;

        if (count < 1 || count > 100) {
            return NextResponse.json({ error: 'Count must be between 1 and 100' }, { status: 400 });
        }

        const data = await fetchFromRag('/api/admin/devices/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ count }),
            cache: 'no-store'
        });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}
