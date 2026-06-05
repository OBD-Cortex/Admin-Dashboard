import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

export async function DELETE(request, { params }) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    try {
        const resolvedParams = await params;
        const source = resolvedParams.source;
        if (!source) {
            return NextResponse.json({ error: 'Missing source parameter' }, { status: 400 });
        }
        
        const data = await fetchFromRag(`/api/admin/knowledge/${encodeURIComponent(source)}`, {
            method: 'DELETE'
        });
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 500 });
    }
}
