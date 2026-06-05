import { fetchFromRag } from '@/lib/ragApi';
import ClientDashboard from '@/components/ClientDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }) {
    // Note: in Next.js 15, searchParams is technically a Promise, so we should await it if needed,
    // but in 14 it's an object. Let's handle it safely by awaiting it if it's a promise,
    // or just accessing it directly.
    const resolvedParams = await searchParams;
    const search = resolvedParams?.search || '';
    const status = resolvedParams?.status || 'all';

    // Fetch stats
    let stats = null;
    try {
        stats = await fetchFromRag('/api/admin/stats', { cache: 'no-store' });
    } catch (e) {
        console.error('Failed to fetch stats:', e);
    }

    // Fetch devices
    let devices = [];
    try {
        const params = new URLSearchParams();
        if (status !== 'all') params.set('status', status);
        if (search) params.set('search', search);
        
        const data = await fetchFromRag(`/api/admin/devices?${params.toString()}`, { cache: 'no-store' });
        devices = data.devices || [];
    } catch (e) {
        console.error('Failed to fetch devices:', e);
    }

    return <ClientDashboard initialStats={stats} initialDevices={devices} />;
}
