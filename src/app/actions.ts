'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { fetchFromAdminService } from '@/lib/adminServiceApi';
import { validatePassword } from '@/lib/auth';
import { signSession } from '@/lib/session';

export async function deleteDevice(token: string, force: boolean = false) {
    try {
        const query = force ? '?force=true' : '';
        await fetchFromAdminService(`/api/admin/devices/${encodeURIComponent(token)}${query}`, {
            method: 'DELETE',
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('[Actions] deleteDevice error:', error.stack || error);
        return { error: error.message || 'Failed to delete device' };
    }
}

export async function unpairDevice(token: string) {
    try {
        await fetchFromAdminService(`/api/admin/devices/${encodeURIComponent(token)}/unpair`, {
            method: 'POST',
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('[Actions] unpairDevice error:', error.stack || error);
        return { error: error.message || 'Failed to unpair device' };
    }
}

export async function generateDevices(count: number | string) {
    try {
        const parsedCount = parseInt(count as string, 10);
        const sanitizedCount = isNaN(parsedCount) ? 1 : Math.min(100, Math.max(1, parsedCount));
        const generatedDevices = await fetchFromAdminService('/api/admin/devices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: sanitizedCount }),
        });
        revalidatePath('/');
        return { success: true, data: generatedDevices };
    } catch (error: any) {
        console.error('[Actions] generateDevices error:', error.stack || error);
        return { error: error.message || 'Failed to generate devices' };
    }
}

export async function getKnowledgeBase() {
    try {
        const knowledgeBaseData = await fetchFromAdminService('/api/admin/knowledge', { 
            method: 'GET',
            cache: 'no-store'
        });
        return { documents: knowledgeBaseData.documents };
    } catch (error: any) {
        console.error('[Actions] getKnowledgeBase error:', error.stack || error);
        return { error: error.message || 'Failed to fetch knowledge base' };
    }
}

export async function deleteKnowledgeDocument(source: string) {
    try {
        await fetchFromAdminService(`/api/admin/knowledge/${encodeURIComponent(source)}`, { method: 'DELETE' });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        console.error('[Actions] deleteKnowledgeDocument error:', error.stack || error);
        return { error: error.message || 'Failed to delete document' };
    }
}

export async function ingestDocument(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        if (!file) throw new Error("No file found in request");

        // WORKAROUND: Next.js consumes the FormData stream. We must read it into
        // a fresh buffer and recreate the FormData before forwarding to FastAPI, 
        // otherwise Node.js fetch() will hang forever waiting for an empty stream.
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        
        const newFormData = new FormData();
        newFormData.append('file', blob, file.name);

        const ingestJob = await fetchFromAdminService('/api/ingest', {
            method: 'POST',
            body: newFormData,
            timeout: 30000, // 30 seconds for large uploads
        });
        return { success: true, ...ingestJob };
    } catch (error: any) {
        console.error('[Actions] ingestDocument error:', error.stack || error);
        return { error: error.message || 'Upload to gateway failed' };
    }
}

export async function getIngestStatus(jobId: string) {
    try {
        const jobStatus = await fetchFromAdminService(`/api/ingest/status/${jobId}`, { 
            method: 'GET',
            cache: 'no-store'
        });
        return { success: true, ...jobStatus };
    } catch (error: any) {
        console.error('[Actions] getIngestStatus error:', error.stack || error);
        return { error: error.message || 'Failed to check status' };
    }
}

export async function login(password: string) {
    try {
        if (!password) {
            return { error: 'Password is required' };
        }

        if (!validatePassword(password)) {
            return { error: 'Invalid password' };
        }

        const secret = process.env.ADMIN_JWT_SECRET;
        if (!secret) {
            console.error('[Actions] ADMIN_JWT_SECRET is not configured.');
            return { error: 'Server configuration error' };
        }

        const sessionToken = await signSession(
            { exp: Date.now() + 24 * 60 * 60 * 1000 },
            secret
        );

        const cookieStore = await cookies();
        cookieStore.set('obd_session', sessionToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            maxAge: 24 * 60 * 60, // 24 hours
        });

        return { success: true };
    } catch (error: any) {
        console.error('[Actions] Login exception:', error.stack || error);
        return { error: 'Authentication failed' };
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('obd_session');
        return { success: true };
    } catch (error: any) {
        console.error('[Actions] Logout exception:', error.stack || error);
        return { error: 'Logout failed' };
    }
}
