import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

export async function DELETE(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    try {
        const targetToken = token.trim().toUpperCase();
        const res = await fetch(`${process.env.RAG_API_URL}/api/admin/devices/${encodeURIComponent(targetToken)}`, {
            method: 'DELETE',
            headers: { 'X-API-Key': process.env.MOBILE_API_KEY },
            cache: 'no-store'
        });
        
        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            return NextResponse.json({ error: errData.detail || 'Failed to delete device' }, { status: res.status });
        }
        
        const data = await res.json();
        return NextResponse.json({ status: 'deleted', token: targetToken });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to reach RAG API' }, { status: 502 });
    }
}
