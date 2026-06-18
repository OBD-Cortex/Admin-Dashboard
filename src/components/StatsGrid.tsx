'use client';

import React from 'react';
import { Stats } from '@/types';

interface StatsGridProps {
    stats: Stats | null;
}

export default function StatsGrid({ stats }: StatsGridProps) {
    const cards = [
        {
            label: 'Total Devices',
            key: 'total',
            icon: (
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="7.5" cy="15.5" r="5.5" />
                    <path d="m21 2-9.6 9.6" />
                    <path d="m15.5 7.5 3 3L22 7l-3-3" />
                </svg>
            )
        },
        {
            label: 'Manufactured',
            key: 'manufactured',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
            )
        },
        {
            label: 'Registered',
            key: 'registered',
            icon: (
                <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )
        },
        {
            label: 'Paired',
            key: 'paired',
            icon: (
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 13v3c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                </svg>
            )
        },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-sans">
            {cards.map((card) => {
                const value = stats ? stats[card.key] : null;
                return (
                    <div key={card.key} className="border border-border bg-card p-5 rounded-2xl flex flex-col justify-between min-h-[100px] shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-muted-foreground">
                                {card.label}
                            </span>
                            {card.icon}
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-bold font-serif tracking-tight text-foreground">
                                {value !== null ? String(value).padStart(2, '0') : '——'}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
