'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Cpu, Factory, Key, Link as LinkIcon } from 'lucide-react';

import { Stats } from '@/types';

interface StatsGridProps {
    stats: Stats | null;
}

export default function StatsGrid({ stats }: StatsGridProps) {
    const cards = [
        { label: 'Total Devices', key: 'total', icon: Cpu, desc: 'All generated keys' },
        { label: 'Manufactured', key: 'manufactured', icon: Factory, desc: 'Offline stage keys' },
        { label: 'Registered', key: 'registered', icon: Key, desc: 'Provisioned on servers' },
        { label: 'Paired', key: 'paired', icon: LinkIcon, desc: 'Actively linked to vehicles' },
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                const value = stats ? stats[card.key] : null;
                return (
                    <Card key={card.key} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-semibold text-muted-foreground">
                                {card.label}
                            </CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold tracking-tight text-foreground">
                                {value !== null ? value : '—'}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                {card.desc}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
