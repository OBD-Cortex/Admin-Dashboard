import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/qr — Stream QR code from external API
 * Query params: token, format (png|svg), download
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const format = searchParams.get('format');
    const download = searchParams.get('download');

    if (!token) {
        return NextResponse.json({ error: 'Token parameter is required' }, { status: 400 });
    }

    const targetToken = token.trim().toUpperCase();
    const payload = targetToken;
    
    let qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payload)}`;
    let contentType = 'image/png';
    let ext = 'png';

    if (format === 'svg') {
        qrUrl += '&format=svg';
        contentType = 'image/svg+xml';
        ext = 'svg';
    } else {
        qrUrl += '&size=300x300&format=png&margin=1';
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const upstream = await fetch(qrUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!upstream.ok) {
            return NextResponse.json({ error: 'QR code service returned an error' }, { status: 502 });
        }

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=86400'); // Cache 24h

        if (download !== null) {
            headers.set('Content-Disposition', `attachment; filename="${targetToken}.${ext}"`);
        }

        return new NextResponse(upstream.body, {
            status: 200,
            headers,
        });
    } catch (err: any) {
        return NextResponse.json({ error: 'Failed to reach QR code service: ' + err.message }, { status: 502 });
    }
}
