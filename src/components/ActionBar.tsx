'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const FILTERS = [
    { label: 'ALL', value: 'all' },
    { label: 'MANUFACTURED', value: 'manufactured' },
    { label: 'REGISTERED', value: 'registered' },
    { label: 'PAIRED', value: 'paired' },
];

interface ActionBarProps {
    onGenerateClick: () => void;
    onIngestClick: () => void;
    onTransitionStart?: () => void;
}

export default function ActionBar({
    onGenerateClick,
    onIngestClick,
    onTransitionStart,
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

    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-2 font-mono">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md w-full">
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="SEARCH HARDWARE NODES..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full pl-9 pr-8 h-9 text-xs tracking-wider rounded border border-neutral-900 bg-neutral-950 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 transition-all font-mono"
                />
                {isPending && (
                    <svg className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
            </div>

            {/* Filter Group and Buttons */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter segments */}
                <div className="inline-flex h-9 items-center justify-center border border-neutral-900 bg-neutral-950 p-1 text-neutral-400 text-[10px] font-bold">
                    {FILTERS.map((f) => {
                        const isActive = optimisticFilter === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => handleFilterChange(f.value)}
                                className={cn(
                                    "rounded px-2.5 py-1 text-[9px] font-bold tracking-wider transition-all cursor-pointer uppercase",
                                    isActive 
                                        ? "bg-primary text-primary-foreground font-extrabold" 
                                        : "text-neutral-500 hover:text-white"
                                )}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <button 
                    onClick={onIngestClick} 
                    className="inline-flex h-9 items-center justify-center gap-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-white transition-colors cursor-pointer"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>INGEST</span>
                </button>
                
                <button 
                    onClick={onGenerateClick} 
                    className="inline-flex h-9 items-center justify-center gap-1.5 border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-white transition-colors cursor-pointer"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>GENERATE</span>
                </button>
            </div>
        </div>
    );
}
