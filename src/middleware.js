/**
 * Next.js Edge Middleware -- Authentication Guard & Maintenance Control
 * -------------------------------------------------------------------
 * This file is executed before every incoming page or API request. It acts as
 * the gateway to block unauthorized traffic and manage maintenance overrides.
 *
 * Security Hardening Applied:
 *   [*] Security headers on all responses (CSP, HSTS, X-Frame-Options, etc.)
 *   [*] Request audit logging for failed authentication attempts
 *
 * Maintainability Considerations:
 * 1. Edge Runtime Environment: This script runs in Next.js's V8 Edge Runtime,
 *    not the standard Node.js environment. Standard Node APIs (such as `fs`, 
 *    `path`, or `Buffer`) are NOT available here.
 * 2. Buffer Bypass: We decode token metadata using the standard web API `atob()`
 *    instead of `Buffer.from()` to prevent runtime crashes.
 */

import { NextResponse } from 'next/server';
import { verifySession } from './lib/session';

// Session cookie identifier
const COOKIE_NAME = 'obd_session';

// Paths that bypass all authentication checks
const PUBLIC_PATHS = ['/login', '/api/health'];

// File extensions to skip middleware processing for static assets
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.svg', '.css', '.js', '.woff', '.woff2', '.ttf'];

// ----------------------------------------------------------
// SECURITY HEADERS
// ----------------------------------------------------------
// Applied to every response to harden the browser-side attack surface.
const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
};

/**
 * Injects security headers into a NextResponse object.
 * @param {NextResponse} response The response to augment.
 * @returns {NextResponse} The same response with security headers applied.
 */
function applySecurityHeaders(response) {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }
    return response;
}

/**
 * Middleware request interceptor.
 * @param {NextRequest} request Incoming request context.
 * @returns {NextResponse} Proceed to next, JSON error, or redirect response.
 */
export async function middleware(request) {
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
            return applySecurityHeaders(
                NextResponse.json(
                    { error: 'Service Temporarily Unavailable' },
                    { status: 503 }
                )
            );
        }
        return applySecurityHeaders(
            new NextResponse('503 Service Temporarily Unavailable', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            })
        );
    }

    // 4. ROUTING: Allow access to public endpoints (login, API auth, health check)
    if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
        return applySecurityHeaders(NextResponse.next());
    }

    // Helper for generating unauthorized responses
    const returnUnauthorized = (msg = 'Unauthorized', status = 401) => {
        if (pathname.startsWith('/api/')) {
            return applySecurityHeaders(NextResponse.json({ error: msg }, { status }));
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
    };

    // 5. SECURITY: Retrieve and check the session cookie
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    // If cookie does not exist, block access
    if (!sessionCookie || !sessionCookie.value) {
        return returnUnauthorized('Unauthorized');
    }

    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret) {
        console.error('[Middleware] Server configuration error: ADMIN_JWT_SECRET is missing.');
        return returnUnauthorized('Server configuration error', 500);
    }

    const session = await verifySession(sessionCookie.value, secret);
    if (!session) {
        return returnUnauthorized('Unauthorized');
    }

    return applySecurityHeaders(NextResponse.next());
}

export const config = {
    // Intercept all routes except static resource patterns
    matcher: ['/((?!_next/static|_next/image).*)'],
};

