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
    onRefreshHealth?: () => void;
}

export function SiteHeader({ servicesStatus, onRefreshHealth }: SiteHeaderProps) {
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

    const getStatusText = (status: string, label: string) => {
        if (status === 'loading') return `${label}: ...`;
        if (status === 'connected') return `${label}: Online`;
        if (status === 'disconnected') return `${label}: Offline`;
        return `${label}: Unconfigured`;
    };

    const isAnyLoading = 
        servicesStatus.admin === 'loading' || 
        servicesStatus.edge === 'loading' || 
        servicesStatus.app === 'loading';

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
                        onClick={onRefreshHealth}
                        disabled={isAnyLoading}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-sans font-bold select-none bg-black hover:bg-neutral-900 transition-colors rounded-lg",
                            isAnyLoading ? "cursor-wait opacity-80" : "cursor-pointer",
                            servicesStatus.admin === 'connected' ? "border-emerald-500/25 text-emerald-400" :
                            servicesStatus.admin === 'disconnected' ? "border-rose-500/25 text-rose-400" :
                            "border-blue-500/25 text-blue-400"
                        )}
                        title="Click to refresh health: Admin-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.admin))} />
                        <span>{getStatusText(servicesStatus.admin, 'Adm')}</span>
                    </button>

                    {/* Edge Service */}
                    <button
                        type="button"
                        onClick={onRefreshHealth}
                        disabled={isAnyLoading}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-sans font-bold select-none bg-black hover:bg-neutral-900 transition-colors rounded-lg",
                            isAnyLoading ? "cursor-wait opacity-80" : "cursor-pointer",
                            servicesStatus.edge === 'connected' ? "border-emerald-500/25 text-emerald-400" :
                            servicesStatus.edge === 'disconnected' ? "border-rose-500/25 text-rose-400" :
                            "border-blue-500/25 text-blue-400"
                        )}
                        title="Click to refresh health: Edge-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.edge))} />
                        <span>{getStatusText(servicesStatus.edge, 'Edg')}</span>
                    </button>

                    {/* MobileApp Service */}
                    <button
                        type="button"
                        onClick={onRefreshHealth}
                        disabled={isAnyLoading}
                        className={cn(
                            "inline-flex h-8 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-sans font-bold select-none bg-black hover:bg-neutral-900 transition-colors rounded-lg",
                            isAnyLoading ? "cursor-wait opacity-80" : "cursor-pointer",
                            servicesStatus.app === 'connected' ? "border-emerald-500/25 text-emerald-400" :
                            servicesStatus.app === 'disconnected' ? "border-rose-500/25 text-rose-400" :
                            "border-blue-500/25 text-blue-400"
                        )}
                        title="Click to refresh health: MobileApp-Service"
                    >
                        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", getStatusColorClass(servicesStatus.app))} />
                        <span>{getStatusText(servicesStatus.app, 'App')}</span>
                    </button>
                </div>

                {/* Log Out Button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-8 items-center gap-1.5 bg-secondary hover:bg-secondary/90 px-3 text-[10px] font-sans font-bold text-secondary-foreground transition-all cursor-pointer select-none rounded-lg"
                    title="Sign Out"
                >
                    <svg className="h-3.5 w-3.5 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>
        </header>
    );
}
