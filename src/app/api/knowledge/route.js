import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    try {
        const res = await fetch(`${process.env.RAG_API_URL}/api/admin/knowledge`, {
            headers: { 'X-API-Key': process.env.MOBILE_API_KEY },
            cache: 'no-store'
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch knowledge base documents' }, { status: 500 });
    }
}
