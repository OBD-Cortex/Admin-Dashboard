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

    let stats: Stats | null = null;
    let devices: Device[] = [];

    const params = new URLSearchParams();
    if (status !== 'all') params.set('status', status);
    if (search) params.set('search', search);

    const [statsResult, devicesResult] = await Promise.allSettled([
        fetchFromAdminService('/api/admin/stats', { cache: 'no-store' }),
        fetchFromAdminService(`/api/admin/devices?${params.toString()}`, { cache: 'no-store' })
    ]);

    if (statsResult.status === 'fulfilled') {
        stats = statsResult.value;
    } else {
        console.error('Failed to fetch stats:', statsResult.reason);
    }

    if (devicesResult.status === 'fulfilled') {
        devices = devicesResult.value?.devices || [];
    } else {
        console.error('Failed to fetch devices:', devicesResult.reason);
    }

    return <ClientDashboard initialStats={stats} initialDevices={devices} />;
}
