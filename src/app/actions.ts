'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
// @ts-ignore
import { fetchFromAdminService } from '@/lib/adminServiceApi';
// @ts-ignore
import { validatePassword } from '@/lib/auth';

export async function deleteDevice(token: string, force: boolean = false) {
    try {
        const query = force ? `?token=${encodeURIComponent(token)}&force=true` : `?token=${encodeURIComponent(token)}`;
        await fetchFromAdminService(`/api/admin/devices/${token}${query}`, {
            method: 'DELETE',
        });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
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
        return { error: error.message || 'Failed to unpair device' };
    }
}

export async function generateDevices(count: number | string) {
    try {
        const data = await fetchFromAdminService('/api/admin/devices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: parseInt(count as string, 10) }),
        });
        revalidatePath('/');
        return { success: true, data };
    } catch (error: any) {
        return { error: error.message || 'Failed to generate devices' };
    }
}

export async function getKnowledgeBase() {
    try {
        const data = await fetchFromAdminService('/api/admin/knowledge', { method: 'GET' });
        return { documents: data.documents };
    } catch (error: any) {
        return { error: error.message || 'Failed to fetch knowledge base' };
    }
}

export async function deleteKnowledgeDocument(source: string) {
    try {
        await fetchFromAdminService(`/api/admin/knowledge/${encodeURIComponent(source)}`, { method: 'DELETE' });
        revalidatePath('/');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || 'Failed to delete document' };
    }
}

export async function ingestDocument(formData: FormData) {
    try {
        const data = await fetchFromAdminService('/api/ingest', {
            method: 'POST',
            body: formData,
        });
        return { success: true, ...data };
    } catch (error: any) {
        return { error: error.message || 'Upload to gateway failed' };
    }
}

export async function getIngestStatus(jobId: string) {
    try {
        const data = await fetchFromAdminService(`/api/ingest/status?jobId=${jobId}`, { method: 'GET' });
        return { success: true, ...data };
    } catch (error: any) {
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

        const cookieStore = await cookies();
        cookieStore.set('obd_session', 'authenticated', {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            maxAge: 24 * 60 * 60, // 24 hours
        });

        return { success: true };
    } catch (error) {
        return { error: 'Authentication failed' };
    }
}

export async function logout() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('obd_session');
        return { success: true };
    } catch (error) {
        return { error: 'Logout failed' };
    }
}
