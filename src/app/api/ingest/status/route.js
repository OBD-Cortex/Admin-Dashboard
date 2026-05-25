import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

/**
 * GET /api/ingest/status — Direct Database Ingestion Progress Poller
 * Queries MongoDB Atlas directly for status updates of the RAG worker.
 * Query Parameters: jobId (UUID format)
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get('jobId');

        if (!jobId) {
            return NextResponse.json({ error: 'Missing jobId parameter' }, { status: 400 });
        }

        const client = await clientPromise;
        const col = client.db('rag_db').collection('ingestion_jobs');

        const job = await col.findOne({ _id: jobId });

        if (!job) {
            return NextResponse.json({ error: 'Job not found or already expired' }, { status: 404 });
        }

        return NextResponse.json({
            job_id: job._id,
            filename: job.filename,
            status: job.status,
            progress: job.progress,
            error_message: job.error_message,
            updated_at: job.updated_at,
        });
    } catch (error) {
        console.error('[Ingest Status API] Exception during status lookup:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
