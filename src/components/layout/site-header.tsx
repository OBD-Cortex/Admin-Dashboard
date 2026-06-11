'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/app/actions';
import { LogOut, RefreshCw, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SiteHeaderProps {
    adminServiceStatus: string;
}

export function SiteHeader({ adminServiceStatus }: SiteHeaderProps) {
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
        <header className="sticky top-0 z-10 flex h-16 w-full items-center justify-between border-b bg-background/80 backdrop-blur px-6 shadow-sm">
            {/* Header Left (Brand title only) */}
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight font-title uppercase">
                    OBD-Cortex Console
                </span>
            </div>

            {/* Header Right (Admin Service Health Status & User Profile Dropdown) */}
            <div className="flex items-center gap-4">
                {/* Health Indicator */}
                <div 
                    className={cn(
                        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold select-none transition-colors",
                        adminServiceStatus === 'connected' && "border-green-500/20 bg-green-500/5 text-green-600 dark:text-green-500",
                        adminServiceStatus === 'disconnected' && "border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-500",
                        adminServiceStatus === 'not_configured' && "border-yellow-500/20 bg-yellow-500/5 text-yellow-600 dark:text-yellow-500",
                        adminServiceStatus === 'loading' && "border-slate-500/20 bg-slate-500/5 text-slate-500 dark:text-slate-500"
                    )}
                    title={
                        adminServiceStatus === 'connected' ? 'Admin Service is online' :
                        adminServiceStatus === 'disconnected' ? 'Admin Service is offline' :
                        adminServiceStatus === 'not_configured' ? 'Admin Service URL is not configured' : 'Checking status...'
                    }
                >
                    {adminServiceStatus === 'loading' ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Activity className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="hidden sm:inline font-mono">
                        {
                            adminServiceStatus === 'connected' ? 'Admin-Service Connected' :
                            adminServiceStatus === 'disconnected' ? 'Admin-Service Offline' :
                            adminServiceStatus === 'not_configured' ? 'Admin-Service Unconfigured' : 'Admin-Service Checking...'
                        }
                    </span>
                </div>

                {/* Log Out Button */}
                <button
                    onClick={handleLogout}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </header>
    );
}
