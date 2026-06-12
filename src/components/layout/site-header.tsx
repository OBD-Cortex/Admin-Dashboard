'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
    adminServiceStatus: string;
    onRefreshHealth?: () => void;
}

export function SiteHeader({ adminServiceStatus, onRefreshHealth }: SiteHeaderProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (err) {
            console.error('Logout failed', err);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-neutral-900 bg-black/90 backdrop-blur px-6">
            {/* Header Left */}
            <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-white uppercase">
                    OBD-CORTEX // DASHBOARD
                </span>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-4">
                {/* Test App Link */}
                <a
                    href="https://mydomain/test-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-mono font-medium uppercase text-white transition-colors cursor-pointer select-none"
                    title="Open Test App"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>TEST APP</span>
                </a>

                {/* Health Status badge (Clickable to refresh) */}
                <button 
                    onClick={onRefreshHealth}
                    className={cn(
                        "inline-flex h-8 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-mono font-medium uppercase select-none transition-colors cursor-pointer hover:opacity-80",
                        adminServiceStatus === 'connected' ? "border-emerald-950 bg-emerald-950/10 text-emerald-400" :
                        adminServiceStatus === 'disconnected' ? "border-rose-950 bg-rose-950/10 text-rose-400" :
                        "border-blue-950 bg-blue-950/10 text-blue-400"
                    )}
                    title={
                        adminServiceStatus === 'connected' ? 'Connected - Click to refresh' :
                        adminServiceStatus === 'disconnected' ? 'Offline - Click to refresh' :
                        adminServiceStatus === 'not_configured' ? 'Unconfigured' : 'Loading'
                    }
                >
                    {adminServiceStatus === 'loading' ? (
                        <svg className="h-3 w-3 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <span className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            adminServiceStatus === 'connected' ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" :
                            adminServiceStatus === 'disconnected' ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" :
                            "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                        )} />
                    )}
                    <span>
                        {
                            adminServiceStatus === 'connected' ? 'SVC: ONLINE' :
                            adminServiceStatus === 'disconnected' ? 'SVC: OFFLINE' :
                            adminServiceStatus === 'not_configured' ? 'SVC: UNCONFIGURED' : 'SVC: CHECK'
                        }
                    </span>
                </button>

                {/* Log Out Button */}
                <button
                    onClick={handleLogout}
                    className="inline-flex h-8 items-center gap-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-mono font-medium uppercase text-white transition-colors cursor-pointer select-none"
                    title="Sign Out"
                >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>LOGOUT</span>
                </button>
            </div>
        </header>
    );
}
