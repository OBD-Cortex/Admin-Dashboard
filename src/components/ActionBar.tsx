'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manufactured', value: 'manufactured' },
    { label: 'Registered', value: 'registered' },
    { label: 'Paired', value: 'paired' },
];

interface ActionBarProps {
    onGenerateClick: () => void;
    onIngestClick: () => void;
    onPerformanceClick: () => void;
    onTransitionStart?: () => void;
    // Ingestion progress props -- passed from ClientDashboard
    ingestActive?: boolean;
    ingestProgressPercent?: number;
    ingestJobStatus?: string | null;
}

export default function ActionBar({
    onGenerateClick,
    onIngestClick,
    onPerformanceClick,
    onTransitionStart,
    ingestActive = false,
    ingestProgressPercent = 0,
    ingestJobStatus = null,
}: ActionBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const currentFilter = searchParams.get('status') || 'all';

    const [isPending, startTransition] = useTransition();
    const [optimisticFilter, setOptimisticFilter] = useState(currentFilter);

    // Sync state with URL params
    useEffect(() => {
        setOptimisticFilter(currentFilter);
    }, [currentFilter]);

    const updateUrl = useCallback((search: string, status: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (search) params.set('search', search);
        else params.delete('search');

        if (status !== 'all') params.set('status', status);
        else params.delete('status');

        router.push(`/?${params.toString()}`);
    }, [router, searchParams]);

    // Debounce search input changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== (searchParams.get('search') || '')) {
                if (onTransitionStart) onTransitionStart();
                startTransition(() => {
                    updateUrl(searchValue, currentFilter);
                });
            }
        }, 350);
        return () => clearTimeout(timer);
    }, [searchValue, currentFilter, updateUrl, searchParams, onTransitionStart]);

    const handleFilterChange = (filter: string) => {
        setOptimisticFilter(filter);
        if (onTransitionStart) onTransitionStart();
        startTransition(() => {
            updateUrl(searchValue, filter);
        });
    };

    const ingestCompleted = ingestJobStatus === 'completed';
    const ingestFailed = ingestJobStatus === 'failed';
    const showIngestStatus = ingestActive || ingestCompleted || ingestFailed;

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2 font-sans">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md w-full">
                <svg className="absolute left-3 top-2 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search hardware nodes..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full pl-9 pr-8 h-8 text-xs tracking-wider rounded-md border border-border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#223A5E] focus:border-[#223A5E] transition-all font-sans"
                />
                {isPending && (
                    <svg className="absolute right-3 top-2 h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
            </div>

            {/* Filter Group and Buttons */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter segments */}
                <div className="inline-flex h-8 items-center justify-center border border-border bg-card p-1 text-muted-foreground text-[10px] font-bold rounded-md">
                    {FILTERS.map((f) => {
                        const isActive = optimisticFilter === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => handleFilterChange(f.value)}
                                className={cn(
                                    "rounded-sm px-2.5 py-1.5 text-[9px] font-bold tracking-wider transition-all cursor-pointer",
                                    isActive
                                        ? "bg-accent text-accent-foreground font-extrabold shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <button
                    onClick={onPerformanceClick}
                    className="inline-flex h-8 items-center justify-center gap-1.5 border border-border bg-card hover:bg-muted px-3 text-[10px] font-sans font-bold text-foreground transition-colors cursor-pointer rounded-md select-none"
                >
                    <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Performance Tests</span>
                </button>

                {/* Ingest button with live progress indicator */}
                <button
                    onClick={onIngestClick}
                    className={cn(
                        "inline-flex h-8 items-center justify-center gap-1.5 border px-3 text-[10px] font-sans font-bold transition-colors cursor-pointer rounded-md select-none relative overflow-hidden",
                        ingestActive
                            ? "border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100"
                            : ingestCompleted
                            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                            : ingestFailed
                            ? "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100"
                            : "border-border bg-card hover:bg-muted text-foreground"
                    )}
                >
                    {/* Background progress fill bar */}
                    {showIngestStatus && (
                        <span
                            className={cn(
                                "absolute inset-0 origin-left transition-all duration-500",
                                ingestActive && "bg-blue-200/50",
                                ingestCompleted && "bg-emerald-200/50",
                                ingestFailed && "bg-rose-200/50"
                            )}
                            style={{ width: `${ingestProgressPercent}%` }}
                        />
                    )}

                    {/* Icon */}
                    <span className="relative z-10 flex items-center gap-1.5">
                        {ingestActive ? (
                            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : ingestCompleted ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : ingestFailed ? (
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        )}
                        <span>
                            {ingestActive
                                ? `Ingesting ${ingestProgressPercent}%`
                                : ingestCompleted
                                ? 'Ingestion Done'
                                : ingestFailed
                                ? 'Ingestion Failed'
                                : 'Ingest'}
                        </span>
                    </span>
                </button>

                <button
                    onClick={onGenerateClick}
                    className="inline-flex h-8 items-center justify-center gap-1.5 bg-[#223A5E] hover:bg-[#223A5E]/90 px-3 text-[10px] font-sans font-bold text-[#FAF8F5] transition-all cursor-pointer rounded-md select-none"
                >
                    <svg className="h-3.5 w-3.5 text-[#FAF8F5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Generate</span>
                </button>
            </div>
        </div>
    );
}
