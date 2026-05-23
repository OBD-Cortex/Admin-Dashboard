/**
 * Next.js Middleware — Auth Guard
 * ───────────────────────────────
 * Runs before every request. Redirects unauthenticated users to /login.
 * API routes (/api/*) return 401 JSON instead of redirecting.
 * The login page, auth API, and health endpoint are always accessible.
 */

import { NextResponse } from 'next/server';

const COOKIE_NAME = 'obd_session';

// Routes that do NOT require authentication
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/health'];

// Static file extensions to skip
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'];

export function middleware(request) {
    const { pathname } = request.nextUrl;

    // Skip Next.js internals and static files
    if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
        return NextResponse.next();
    }

    // Skip static file requests
    if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
        return NextResponse.next();
    }

    // Maintenance mode check
    if (process.env.MAINTENANCE === '1') {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Service Temporarily Unavailable' },
                { status: 503 }
            );
        }
        return new NextResponse('503 Service Temporarily Unavailable', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }

    // Allow public paths
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
        // API routes: return 401 JSON
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Pages: redirect to login
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Cookie exists — do a basic format check (full crypto verification happens server-side)
    const token = sessionCookie.value;
    if (!token.includes('.')) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // Check expiration from the payload (base64url-encoded JSON before the dot)
    try {
        const payloadB64 = token.split('.')[0];
        let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const decoded = atob(base64);
        const payload = JSON.parse(decoded);
        if (Date.now() > payload.exp) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Session expired' }, { status: 401 });
            }
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    } catch {
        // Malformed token — redirect to login
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Match all routes except Next.js internals
    matcher: ['/((?!_next/static|_next/image).*)'],
};
