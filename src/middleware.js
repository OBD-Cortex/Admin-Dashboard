/**
 * Next.js Edge Middleware — Authentication Guard & Maintenance Control
 * ───────────────────────────────────────────────────────────────────
 * This file is executed before every incoming page or API request. It acts as
 * the gateway to block unauthorized traffic and manage maintenance overrides.
 *
 * Maintainability Considerations:
 * 1. Edge Runtime Environment: This script runs in Next.js's V8 Edge Runtime,
 *    not the standard Node.js environment. Standard Node APIs (such as `fs`, 
 *    `path`, or `Buffer`) are NOT available here.
 * 2. Buffer Bypass: We decode token metadata using the standard web API `atob()`
 *    instead of `Buffer.from()` to prevent runtime crashes.
 */

import { NextResponse } from 'next/server';

// Session cookie identifier
const COOKIE_NAME = 'obd_session';

// Paths that bypass all authentication checks
const PUBLIC_PATHS = ['/login', '/api/auth', '/api/health'];

// File extensions to skip middleware processing for static assets
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'];

/**
 * Middleware request interceptor.
 * @param {NextRequest} request Incoming request context.
 * @returns {NextResponse} Proceed to next, JSON error, or redirect response.
 */
export function middleware(request) {
    const { pathname } = request.nextUrl;

    // 1. PERFORMANCE: Skip processing for Next.js internal files and favicon
    if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon')) {
        return NextResponse.next();
    }

    // 2. PERFORMANCE: Skip processing for static assets (css, images, fonts)
    if (STATIC_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
        return NextResponse.next();
    }

    // 3. SYSTEM CONTROL: Maintenance Mode Check
    // If MAINTENANCE=1 is defined in the host OS environment, return a 503 error.
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

    // 4. ROUTING: Allow access to public endpoints (login, API auth, health check)
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return NextResponse.next();
    }

    // 5. SECURITY: Retrieve and check the session cookie
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    // If cookie does not exist, block access
    if (!sessionCookie || !sessionCookie.value) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    const token = sessionCookie.value;

    // Fast format check: HMAC tokens are structured as "payload.signature"
    if (!token.includes('.')) {
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // 6. SECURITY: Verify expiration date from the token payload.
    // This provides a quick client-side check to prevent expired requests.
    // HMAC signature validation still happens inside route handlers for double security.
    try {
        const payloadB64 = token.split('.')[0];
        // Convert base64url string to standard base64
        let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        // Decrypt using Web-Standard 'atob' (available in Edge runtime, unlike Buffer)
        const decoded = atob(base64);
        const payload = JSON.parse(decoded);
        
        // Block request if current timestamp exceeds expiration
        if (Date.now() > payload.exp) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Session expired' }, { status: 401 });
            }
            const loginUrl = new URL('/login', request.url);
            return NextResponse.redirect(loginUrl);
        }
    } catch {
        // Intercept malformed token payloads
        if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Intercept all routes except static resource patterns
    matcher: ['/((?!_next/static|_next/image).*)'],
};
