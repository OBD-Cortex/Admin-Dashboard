import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function GET(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';

    const ragUrl = `${process.env.RAG_API_URL}/api/admin/devices?status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`;
    
    try {
        const res = await fetch(ragUrl, {
            headers: { 'X-API-Key': process.env.MOBILE_API_KEY },
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
