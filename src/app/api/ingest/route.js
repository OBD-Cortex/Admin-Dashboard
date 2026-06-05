import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';
import { fetchFromRag } from '@/lib/ragApi';

/**
 * POST /api/ingest — File Upload Forwarder
 * Receives multipart PDF/CSV files from the client browser and forwards them
 * server-side to the Python RAG API on the droplet VM.
 */
export async function POST(request) {
    try {
        requireAuth(request);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status || 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = file.name;
        if (
            !filename.endsWith('.pdf') &&
            !filename.endsWith('.csv') &&
            !filename.endsWith('.md') &&
            !filename.endsWith('.txt')
        ) {
            return NextResponse.json(
                { error: 'Unsupported file format. Only PDF, CSV, MD, and TXT files are allowed.' },
                { status: 400 }
            );
        }

        // Re-construct the FormData payload to forward to FastAPI RAG Server
        const uploadData = new FormData();
        uploadData.append('file', file, filename);

        const data = await fetchFromRag('/api/ingest', {
            method: 'POST',
            body: uploadData,
        });

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error.message || 'Internal server error during upload forwarding' },
            { status: error.status || 500 }
        );
    }
}
