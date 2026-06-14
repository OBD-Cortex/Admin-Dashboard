'use client';

import React from 'react';
import { Stats } from '@/types';

interface StatsGridProps {
    stats: Stats | null;
}

export default function StatsGrid({ stats }: StatsGridProps) {
    const cards = [
        {
            label: 'TOTAL DEVICES',
            key: 'total',
            desc: 'ALL CRYPTOGRAPHIC HARDWARE KEYS',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            )
        },
        {
            label: 'MANUFACTURED',
            key: 'manufactured',
            desc: 'KEYS GENERATED BUT UNASSIGNED',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            )
        },
        {
            label: 'REGISTERED',
            key: 'registered',
            desc: 'PROVISIONED IN COGNITO USERPOOL',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 8a5 5 0 1110 0a5 5 0 01-10 0zm-2 0H3m3-3L3 17m3 3L3 17" />
                </svg>
            )
        },
        {
            label: 'PAIRED',
            key: 'paired',
            desc: 'CONNECTED TO AN OWNER VEHICLE',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
            )
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-sans">
            {cards.map((card) => {
                const value = stats ? stats[card.key] : null;
                return (
                    <div key={card.key} className="border border-border bg-card p-5 rounded-2xl flex flex-col justify-between min-h-[120px] shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
                                {card.label}
                            </span>
                            {card.icon}
                        </div>
                        <div className="mt-4 flex flex-col gap-1">
                            <span className="text-3xl font-bold font-serif tracking-tight text-foreground">
                                {value !== null ? String(value).padStart(2, '0') : '——'}
                            </span>
                            <span className="text-[9px] font-bold tracking-wider text-muted-foreground/80">
                                {card.desc}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
