import { useState, useCallback, useEffect } from 'react';

type ServiceType = 'admin-service' | 'edge-service' | 'mobileapp-service';

// Helper to check health of specific services via dashboard server-side proxy
const checkHealthFor = async (service: ServiceType) => {
    try {
        const url = `/api/health?service=${service}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
            const data = await res.json();
            if (service === 'admin-service') return data.adminService || 'disconnected';
            if (service === 'edge-service') return data.edgeService || 'disconnected';
            if (service === 'mobileapp-service') return data.appService || 'disconnected';
        }
        return 'disconnected';
    } catch {
        return 'disconnected';
    }
};

export function useServiceHealth() {
    const [servicesStatus, setServicesStatus] = useState<{
        'admin-service': string;
        'edge-service': string;
        'mobileapp-service': string;
    }>({
        'admin-service': 'loading',
        'edge-service': 'loading',
        'mobileapp-service': 'loading',
    });

    const refreshServiceHealth = useCallback(async (service: ServiceType) => {
        setServicesStatus((prev) => ({ ...prev, [service]: 'loading' }));
        const status = await checkHealthFor(service);
        setServicesStatus((prev) => ({ ...prev, [service]: status }));
    }, []);

    useEffect(() => {
        refreshServiceHealth('admin-service');
        refreshServiceHealth('edge-service');
        refreshServiceHealth('mobileapp-service');
    }, [refreshServiceHealth]);

    return { servicesStatus, refreshServiceHealth };
}
