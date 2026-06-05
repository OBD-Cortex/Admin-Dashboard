import { NextResponse } from 'next/server';
import { validatePassword, createSessionToken, verifySessionToken, buildSessionCookie, buildClearCookie, COOKIE_NAME } from '@/lib/auth';

/**
 * POST /api/auth — Login
 * Body: { password: string }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        if (!validatePassword(password)) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const token = createSessionToken();
        const response = NextResponse.json({ status: 'authenticated' });
        response.headers.set('Set-Cookie', buildSessionCookie(token));
        return response;
    } catch (err) {
        console.error('[Auth API] Login exception:', err);
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
    }
}

/**
 * GET /api/auth — Check session status
 */
export async function GET(request) {
    const cookie = request.cookies.get(COOKIE_NAME);

    if (!cookie || !cookie.value) {
        return NextResponse.json({ authenticated: false });
    }

    const payload = verifySessionToken(cookie.value);
    return NextResponse.json({ authenticated: !!payload });
}

/**
 * DELETE /api/auth — Logout
 */
export async function DELETE() {
    const response = NextResponse.json({ status: 'logged_out' });
    response.headers.set('Set-Cookie', buildClearCookie());
    return response;
}
