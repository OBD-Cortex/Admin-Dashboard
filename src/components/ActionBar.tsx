'use client';

import React, { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, FileUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manufactured', value: 'manufactured' },
    { label: 'Registered', value: 'registered' },
    { label: 'Paired', value: 'paired' },
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-1">
            {/* Search Box */}
            <div className="relative flex-1 max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search devices..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                {isPending && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {/* Filter Group and Buttons */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter segments */}
                <div className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground text-xs font-semibold">
                    {FILTERS.map((f) => {
                        const isActive = optimisticFilter === f.value;
                        return (
                            <button
                                key={f.value}
                                onClick={() => handleFilterChange(f.value)}
                                className={cn(
                                    "rounded-md px-3 py-1 text-xs font-semibold transition-all hover:text-foreground",
                                    isActive 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground"
                                )}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Actions */}
                <Button variant="outline" size="sm" onClick={onIngestClick} className="gap-2 text-xs">
                    <FileUp className="h-4 w-4" />
                    Ingest
                </Button>
                
                <Button size="sm" onClick={onGenerateClick} className="gap-2 text-xs">
                    <Plus className="h-4 w-4" />
                    Generate
                </Button>
            </div>
        </div>
    );
}
