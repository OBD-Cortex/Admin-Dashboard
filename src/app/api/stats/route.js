import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        requireAuth(request);
        
        const res = await fetch(`${process.env.RAG_API_URL}/api/admin/stats`, {
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
