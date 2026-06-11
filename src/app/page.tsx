// @ts-ignore
import { fetchFromAdminService } from '@/lib/adminServiceApi';
import ClientDashboard from '@/components/ClientDashboard';

import { Stats, Device } from '@/types';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{
        search?: string;
        status?: string;
    }>;
}

export default async function HomePage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams;
    const search = resolvedParams?.search || '';
    const status = resolvedParams?.status || 'all';

    // Fetch stats
    let stats: Stats | null = null;
    try {
        stats = await fetchFromAdminService('/api/admin/stats', { cache: 'no-store' });
    } catch (e) {
        console.error('Failed to fetch stats:', e);
    }

    // Fetch devices
    let devices: Device[] = [];
    try {
        const params = new URLSearchParams();
        if (status !== 'all') params.set('status', status);
        if (search) params.set('search', search);
        
        const data = await fetchFromAdminService(`/api/admin/devices?${params.toString()}`, { cache: 'no-store' });
        devices = data.devices || [];
    } catch (e) {
        console.error('Failed to fetch devices:', e);
    }

    return <ClientDashboard initialStats={stats} initialDevices={devices} />;
}
