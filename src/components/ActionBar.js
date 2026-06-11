'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

const FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Manufactured', value: 'manufactured' },
    { label: 'Registered', value: 'registered' },
    { label: 'Paired', value: 'paired' },
];

export default function ActionBar({
    onGenerateClick,
    onIngestClick,
    onTransitionStart,
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
    const currentFilter = searchParams.get('status') || 'all';
    
    const [isPending, startTransition] = useTransition();
    const [optimisticFilter, setOptimisticFilter] = useState(currentFilter);

    // Sync optimistic state if URL changes externally
    useEffect(() => {
        setOptimisticFilter(currentFilter);
    }, [currentFilter]);

    const updateUrl = useCallback((search, status) => {
        const params = new URLSearchParams(searchParams);
        if (search) params.set('search', search);
        else params.delete('search');
        
        if (status !== 'all') params.set('status', status);
        else params.delete('status');
        
        router.push(`/?${params.toString()}`);
    }, [router, searchParams]);

    // Debounce search
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

    const handleFilterChange = (filter) => {
        setOptimisticFilter(filter);
        if (onTransitionStart) onTransitionStart();
        startTransition(() => {
            updateUrl(searchValue, filter);
        });
    };
    return (
        <div className="action-bar">
            {/* Search */}
            <div className="search-box">
                <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    placeholder="Search by token, VIN, brand, or model…"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </div>

            {/* Filter Group */}
            <div className="filter-group">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        className={`filter-btn${optimisticFilter === f.value ? ' active' : ''}`}
                        onClick={() => handleFilterChange(f.value)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Ingest Document Button */}
            <button
                className="btn-secondary"
                onClick={onIngestClick}
                style={{ marginLeft: 'auto' }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="btn-icon"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Ingest Document
            </button>

            {/* Generate Button */}
            <button className="generate-btn" onClick={onGenerateClick}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Generate Devices
            </button>
        </div>
    );
}
