import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function POST(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    try {
        const body = await request.json();
        const count = parseInt(body.count) || 1;

        if (count < 1 || count > 100) {
            return NextResponse.json({ error: 'Count must be between 1 and 100' }, { status: 400 });
        }

        const res = await fetch(`${process.env.RAG_API_URL}/api/admin/devices/generate`, {
            method: 'POST',
            headers: { 
                'X-API-Key': process.env.MOBILE_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ count }),
            cache: 'no-store'
        });
        
        if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ error: `RAG API Error: ${err}` }, { status: res.status });
        }
        
        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to reach RAG API' }, { status: 502 });
    }
}
