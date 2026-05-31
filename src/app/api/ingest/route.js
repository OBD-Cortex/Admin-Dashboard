import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/requireAuth';

/**
 * POST /api/ingest — File Upload Forwarder
 * Receives multipart PDF/CSV files from the client browser and forwards them
 * server-side to the Python RAG API on the droplet VM.
 */
export async function POST(request) {
    try { requireAuth(request); } catch (e) {
        return NextResponse.json({ error: e.message }, { status: e.status });
    }
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const filename = file.name;
        if (!filename.endsWith('.pdf') && !filename.endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Unsupported file format. Only PDF and CSV files are allowed.' },
                { status: 400 }
            );
        }

        // Re-construct the FormData payload to forward to FastAPI RAG Server
        const uploadData = new FormData();
        uploadData.append('file', file, filename);

        // Retrieve system environment variables configured server-side
        const ragApiUrl = process.env.RAG_API_URL || 'http://localhost:8000';
        const apiKey = process.env.MOBILE_API_KEY;

        if (!apiKey) {
            console.error('[Ingest API] Server configuration error: MOBILE_API_KEY is missing.');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const targetUrl = `${ragApiUrl}/api/ingest`;
        console.log(`[Ingest API] Forwarding file to RAG API: ${targetUrl}`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
            },
            body: uploadData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorJson;
            try {
                errorJson = JSON.parse(errorText);
            } catch {
                // Not JSON
            }
            console.error(`[Ingest API] RAG Server returned error code ${response.status}: ${errorText}`);
            return NextResponse.json(
                { error: errorJson?.detail || errorText || 'Failed to start ingestion job on RAG API' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Ingest API] Exception during file upload forwarding:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error during upload forwarding' },
            { status: 500 }
        );
    }
}
