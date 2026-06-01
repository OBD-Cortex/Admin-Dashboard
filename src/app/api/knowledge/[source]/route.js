import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function DELETE(request, { params }) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    try {
        const source = params.source;
        if (!source) {
            return NextResponse.json({ error: 'Missing source parameter' }, { status: 400 });
        }
        
        const res = await fetch(`${process.env.RAG_API_URL}/api/admin/knowledge/${encodeURIComponent(source)}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': process.env.MOBILE_API_KEY }
        });
        
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete knowledge base document' }, { status: 500 });
    }
}
