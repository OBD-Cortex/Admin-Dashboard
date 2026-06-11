'use client';

import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { QrCode, Unlink, Trash2, ChevronDown, ChevronUp, Calendar, Car, AlertTriangle } from 'lucide-react';

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
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm font-medium">Loading devices...</span>
            </div>
        );
    }

    if (!devices || devices.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center border border-dashed rounded-lg py-16 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold text-sm">No devices found</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Try altering your query parameters or generate some devices.
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Device Token</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Vehicle Info</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {devices.map((device) => {
                        const hasHistory = device.vehicles && device.vehicles.length > 1;
                        const isExpanded = !!expandedTokens[device.device_token];
                        return (
                            <React.Fragment key={device.device_token}>
                                <TableRow className="hover:bg-muted/30">
                                    <TableCell className="font-mono font-medium text-xs max-w-[150px] truncate select-all">
                                        {device.device_token}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {device.device_id ? (
                                            <span className="text-foreground font-semibold">
                                                #{device.device_id}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic text-[11px]">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-medium text-xs select-all">
                                                    {device.vin || '—'}
                                                </span>
                                                {hasHistory && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleExpand(device.device_token)}
                                                        className="h-6 px-1.5 py-0.5 text-[10px] gap-1 hover:bg-muted"
                                                    >
                                                        {device.vehicles.length} vehicles
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-3 w-3" />
                                                        ) : (
                                                            <ChevronDown className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                            {device.brand && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    {device.brand} {device.model} ({device.year})
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold select-none border">
                                            <span
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full shrink-0",
                                                    device.status === 'paired' && "bg-foreground",
                                                    device.status === 'registered' && "bg-muted-foreground",
                                                    device.status === 'manufactured' && "bg-muted-foreground/40",
                                                    device.status === 'failed' && "bg-transparent border border-muted-foreground"
                                                )}
                                            />
                                            <span className="capitalize text-[11px]">
                                                {device.status}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                                        {formatDate(device.created_at)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1.5">
                                            {/* QR Code trigger */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onShowQR(device.device_token)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                title="View connection QR"
                                            >
                                                <QrCode className="h-4 w-4" />
                                            </Button>

                                            {/* Unpair Trigger (Only if paired) */}
                                            {device.status === 'paired' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => onUnpair(device.device_token)}
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                    title="Unpair vehicle"
                                                >
                                                    <Unlink className="h-4 w-4" />
                                                </Button>
                                            )}

                                            {/* Delete Trigger */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(device.device_token)}
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                title="Decommission device"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>

                                {/* Nested Vehicles History View */}
                                {isExpanded && hasHistory && (
                                    <TableRow className="bg-muted/10">
                                        <TableCell colSpan={6} className="p-0">
                                            <div className="px-6 py-4 border-b">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                                                    <Car className="h-3.5 w-3.5 text-muted-foreground" />
                                                    Device Association History
                                                </div>
                                                <div className="space-y-2 max-w-2xl">
                                                    {device.vehicles.map((v, i) => (
                                                        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-dashed border-muted-foreground/15 last:border-0">
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-mono font-medium">{v.vin}</span>
                                                                <span className="text-muted-foreground">
                                                                    {v.brand} {v.model} ({v.year})
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Calendar className="h-3.5 w-3.5" />
                                                                <span>Paired: {formatDate(v.paired_at)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
