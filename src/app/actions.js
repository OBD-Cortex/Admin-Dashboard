'use server';

import { revalidatePath } from 'next/cache';
import { fetchFromRag } from '@/lib/ragApi';

export async function deleteDevice(token, force = false) {
    try {
        const query = force ? `?token=${encodeURIComponent(token)}&force=true` : `?token=${encodeURIComponent(token)}`;
        await fetchFromRag(`/api/admin/devices/${token}${query}`, {
            method: 'DELETE',
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: error.message || 'Failed to delete device' };
    }
}

export async function unpairDevice(token) {
    try {
        await fetchFromRag(`/api/admin/devices/${encodeURIComponent(token)}/unpair`, {
            method: 'POST',
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: error.message || 'Failed to unpair device' };
    }
}

export async function generateDevices(count) {
    try {
        const data = await fetchFromRag('/api/admin/devices/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: parseInt(count, 10) }),
        });
        revalidatePath('/');
        return { success: true, data };
    } catch (error) {
        return { error: error.message || 'Failed to generate devices' };
    }
}
