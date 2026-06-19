'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
    servicesStatus: {
        admin: string;
        edge: string;
        app: string;
    };
    onRefreshServiceHealth?: (service: 'admin' | 'edge' | 'app') => void;
}

export function SiteHeader({ servicesStatus, onRefreshServiceHealth }: SiteHeaderProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    const getStatusColorClass = (status: string) => {
        if (status === 'loading') return 'bg-blue-500 animate-pulse';
        if (status === 'connected') return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]';
        if (status === 'disconnected') return 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]';
        return 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]';
    };

    const getStatusBadgeClass = (status: string) => {
        const base = "inline-flex h-8 items-center gap-1.5 border border-border/80 px-2.5 py-1 text-[10px] font-sans font-bold select-none bg-[#F3EFE7] text-[#191919] hover:bg-[#E6E1D6] transition-colors rounded-md";
        if (status === 'loading') {
            return cn(base, "cursor-wait opacity-80");
        }
        return cn(base, "cursor-pointer");
    };

    const getStatusText = (status: string, label: string) => {
        if (status === 'loading') return `${label}: ...`;
        if (status === 'connected') return `${label}: Online`;
        if (status === 'disconnected') return `${label}: Offline`;
        return `${label}: Unconfigured`;
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur px-6 shadow-sm">
            {/* Header Left */}
            <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-bold tracking-tight text-foreground">
                    OBD-Cortex // Admin
                </span>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-3">
                {/* Unified Health Status badges */}
                <div className="flex items-center gap-2">
                    {/* Admin Service */}
                    <button
                        type="button"
                        onClick={() => onRefreshServiceHealth?.('admin')}
                        disabled={servicesStatus.admin === 'loading'}
                        className={getStatusBadgeClass(servicesStatus.admin)}
                        title="Click to refresh health: Admin-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.admin))} />
                        <span>{getStatusText(servicesStatus.admin, 'Admin-Service')}</span>
                    </button>

                    {/* Edge Service */}
                    <button
                        type="button"
                        onClick={() => onRefreshServiceHealth?.('edge')}
                        disabled={servicesStatus.edge === 'loading'}
                        className={getStatusBadgeClass(servicesStatus.edge)}
                        title="Click to refresh health: Edge-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.edge))} />
                        <span>{getStatusText(servicesStatus.edge, 'Edge-Service')}</span>
                    </button>

                    {/* MobileApp Service */}
                    <button
                        type="button"
                        onClick={() => onRefreshServiceHealth?.('app')}
                        disabled={servicesStatus.app === 'loading'}
                        className={getStatusBadgeClass(servicesStatus.app)}
                        title="Click to refresh health: MobileApp-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.app))} />
                        <span>{getStatusText(servicesStatus.app, 'MobileApp-Service')}</span>
                    </button>
                </div>

                {/* Log Out Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-8 items-center gap-1.5 bg-[#223A5E] hover:bg-[#223A5E]/90 px-3 text-[10px] font-sans font-bold text-[#FAF8F5] transition-all cursor-pointer select-none rounded-md"
                    title="Sign Out"
                >
                    <svg className="h-3.5 w-3.5 text-[#FAF8F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
