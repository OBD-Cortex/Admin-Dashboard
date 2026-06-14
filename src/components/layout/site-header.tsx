'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
    adminServiceStatus: string;
    onRefreshHealth?: () => void;
    adminServiceUrl?: string;
}

export function SiteHeader({ adminServiceStatus, onRefreshHealth, adminServiceUrl }: SiteHeaderProps) {
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
        <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur px-6 shadow-sm">
            {/* Header Left */}
            <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-bold tracking-tight text-foreground uppercase">
                    OBD-CORTEX // ADMIN
                </span>
            </div>

            {/* Header Right */}
            <div className="flex items-center gap-3">
                {/* Test App Link */}
                <a
                    href={`${adminServiceUrl ? adminServiceUrl.replace(/\/$/, '') : ''}/test-app`}
                    target="_blank"
                    relative="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 border border-border bg-background hover:bg-muted px-3 text-[10px] font-sans font-bold uppercase text-foreground transition-colors cursor-pointer select-none rounded-lg"
                    title="Open Test App"
                >
                    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span>TEST APP</span>
                </a>

                {/* Health Status badge (Clickable to refresh) */}
                <button 
                    type="button"
                    onClick={onRefreshHealth}
                    disabled={adminServiceStatus === 'loading'}
                    className={cn(
                        "inline-flex h-8 items-center gap-1.5 border px-2.5 py-1 text-[10px] font-sans font-bold uppercase select-none transition-colors hover:opacity-90 rounded-lg",
                        adminServiceStatus === 'loading' ? "cursor-wait opacity-80" : "cursor-pointer",
                        adminServiceStatus === 'connected' ? "border-emerald-600/20 bg-emerald-500/10 text-emerald-800" :
                        adminServiceStatus === 'disconnected' ? "border-rose-600/20 bg-rose-500/10 text-rose-800" :
                        "border-blue-600/20 bg-blue-500/10 text-blue-800"
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
                            adminServiceStatus === 'connected' ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" :
                            adminServiceStatus === 'disconnected' ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" :
                            "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
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
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-8 items-center gap-1.5 bg-primary hover:opacity-90 px-3 text-[10px] font-sans font-bold uppercase text-primary-foreground transition-all cursor-pointer select-none rounded-lg"
                    title="Sign Out"
                >
                    <svg className="h-3.5 w-3.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>LOGOUT</span>
                </button>
            </div>
        </header>
    );
}
