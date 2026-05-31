import { verifySessionToken, COOKIE_NAME } from '@/lib/auth';

export function requireAuth(request) {
    const cookie = request.cookies.get(COOKIE_NAME);
    if (!cookie || !cookie.value) {
        throw { status: 401, message: 'Unauthorized' };
    }
    const payload = verifySessionToken(cookie.value);
    if (!payload) {
        throw { status: 401, message: 'Invalid or expired session' };
    }
    return payload;
}
