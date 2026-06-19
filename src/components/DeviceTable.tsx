'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Device } from '@/types';

interface DeviceTableProps {
    devices: Device[];
    onShowQR: (token: string) => void;
    onDelete: (token: string) => void;
    onUnpair: (token: string) => void;
    loading: boolean;
}

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function DeviceTable({
    devices,
    onShowQR,
    onDelete,
    onUnpair,
    loading
}: DeviceTableProps) {
    const [expandedTokens, setExpandedTokens] = useState<{ [key: string]: boolean }>({});

    const toggleExpand = (token: string) => {
        setExpandedTokens((prev) => ({ ...prev, [token]: !prev[token] }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 font-sans">
                <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest">Loading hardware registry...</span>
            </div>
        );
    }

    if (!devices || devices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center border border-border bg-card/50 py-16 text-center font-sans rounded-2xl">
                <svg className="h-8 w-8 text-muted-foreground/60 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <h3 className="font-bold text-xs text-foreground tracking-wider">No nodes registered</h3>
                <p className="text-[10px] text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Check search arguments or register a new cohort of tokens.
                </p>
            </div>
        );
    }

    return (
        <div className="border border-border bg-card overflow-x-auto font-sans rounded-2xl shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
                <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold tracking-wider text-[10px] bg-[#F3EFE7]">
                        <th className="p-3.5">Device Token</th>
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Vehicle Link</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {devices.map((device) => {
                        const hasHistory = device.vehicles && device.vehicles.length > 1;
                        const isExpanded = !!expandedTokens[device.device_token];
                        return (
                            <React.Fragment key={device.device_token}>
                                <tr className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3.5 font-mono font-semibold select-all text-foreground">
                                        {device.device_token}
                                    </td>
                                    <td className="p-3.5 text-muted-foreground">
                                        {device.device_id ? (
                                            <span className="font-bold text-foreground">
                                                #{device.device_id}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground/60 italic text-[10px]">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="p-3.5">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold select-all text-foreground">
                                                    {device.vin || '—————'}
                                                </span>
                                                {hasHistory && (
                                                    <button
                                                        onClick={() => toggleExpand(device.device_token)}
                                                        className="h-5 px-2 border border-border bg-background hover:bg-muted text-[9px] font-bold text-foreground transition-colors flex items-center gap-1 cursor-pointer rounded-lg"
                                                    >
                                                        <span>{device.vehicles.length} cohorts</span>
                                                        {isExpanded ? (
                                                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            {device.brand && (
                                                <span className="text-[10px] text-muted-foreground tracking-tight">
                                                    {device.brand} {device.model} ({device.year})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3.5">
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 border px-2.5 py-0.5 text-[9px] font-bold select-none bg-black rounded-md",
                                            device.status === 'paired' && "text-emerald-500 border-emerald-950",
                                            device.status === 'registered' && "text-blue-500 border-blue-950",
                                            device.status === 'manufactured' && "text-neutral-400 border-neutral-800/80",
                                            device.status === 'failed' && "text-rose-500 border-rose-950"
                                        )}>
                                            <span
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                    device.status === 'paired' && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
                                                    device.status === 'registered' && "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]",
                                                    device.status === 'manufactured' && "bg-neutral-500",
                                                    device.status === 'failed' && "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]"
                                                )}
                                            />
                                            <span>
                                                {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3.5 text-muted-foreground">
                                        {formatDate(device.created_at)}
                                    </td>
                                    <td className="p-3.5 text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            {/* QR Code trigger */}
                                            <button
                                                onClick={() => onShowQR(device.device_token)}
                                                className="inline-flex h-7 w-7 items-center justify-center border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-[#F3EFE7] transition-colors cursor-pointer rounded-md"
                                                title="View QR"
                                            >
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="3" width="6" height="6" rx="1" />
                                                    <rect x="15" y="3" width="6" height="6" rx="1" />
                                                    <rect x="3" y="15" width="6" height="6" rx="1" />
                                                    <path d="M15 15h2v2h-2zm2 2h2v2h-2zm-2 2h2v-2h-2zm4-4h2v2h-2zm0 2h-2v2h2zm2 2v-2h-2v2z" />
                                                </svg>
                                            </button>

                                            {/* Unpair Trigger (Only if paired) */}
                                            {device.status === 'paired' && (
                                                <button
                                                    onClick={() => onUnpair(device.device_token)}
                                                    className="inline-flex h-7 w-7 items-center justify-center border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-[#F3EFE7] transition-colors cursor-pointer rounded-md"
                                                    title="Unpair vehicle"
                                                >
                                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                                        <line x1="8" y1="16" x2="16" y2="8" />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Delete Trigger */}
                                            <button
                                                onClick={() => onDelete(device.device_token)}
                                                className="inline-flex h-7 w-7 items-center justify-center border border-border bg-[#191919] text-[#FAF8F5]/80 hover:text-rose-500 hover:bg-[#191919]/80 transition-colors cursor-pointer rounded-md"
                                                title="Decommission node"
                                            >
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Nested Vehicles History View */}
                                {isExpanded && hasHistory && (
                                    <tr className="bg-muted/35">
                                        <td colSpan={6} className="p-0 border-t border-b border-border">
                                            <div className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground mb-3">
                                                    <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 1 13v3c0 .6.4 1 1 1h2" />
                                                        <circle cx="7" cy="17" r="2" />
                                                        <circle cx="17" cy="17" r="2" />
                                                    </svg>
                                                    <span>Cohort Association Logs</span>
                                                </div>
                                                <div className="space-y-2 max-w-2xl divide-y divide-border/50">
                                                    {device.vehicles.map((v, i) => (
                                                        <div key={i} className="flex items-center justify-between text-[10px] py-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-semibold text-foreground">{v.vin}</span>
                                                                <span className="text-muted-foreground">
                                                                    {v.brand} {v.model} ({v.year})
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                                    <line x1="3" y1="10" x2="21" y2="10" />
                                                                </svg>
                                                                <span>Paired: {formatDate(v.paired_at)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
