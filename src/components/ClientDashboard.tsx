'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import StatsGrid from '@/components/StatsGrid';
import ActionBar from '@/components/ActionBar';
import DeviceTable from '@/components/DeviceTable';
import KnowledgeBase from '@/components/KnowledgeBase';
import GenerateModal from '@/components/GenerateModal';
import QRModal from '@/components/QRModal';
import UploadModal from '@/components/UploadModal';
import { useToast } from '@/components/Toast';
import { deleteDevice, unpairDevice } from '@/app/actions';

import { Stats, Device } from '@/types';

interface ClientDashboardProps {
    initialStats: Stats | null;
    initialDevices: Device[];
}

export default function ClientDashboard({ initialStats, initialDevices }: ClientDashboardProps) {
    const { toast } = useToast();

    // Modals states
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [ingestModalOpen, setIngestModalOpen] = useState(false);

    // Dynamic states
    const [adminServiceStatus, setAdminServiceStatus] = useState('loading');
    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        setTableLoading(false);
    }, [initialDevices]);

    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setAdminServiceStatus(data.adminService || 'disconnected');
        } catch {
            setAdminServiceStatus('disconnected');
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const healthPoll = setInterval(fetchHealth, 30000);
        return () => clearInterval(healthPoll);
    }, [fetchHealth]);

    const handleGenerated = (data: any) => {
        toast(`Successfully generated ${data.generated} device${data.generated > 1 ? 's' : ''}`, 'success');
        if (data.tokens && data.tokens.length === 1) {
            setSelectedToken(data.tokens[0]);
            setQrModalOpen(true);
        }
    };

    const handleShowQR = (token: string) => {
        setSelectedToken(token);
        setQrModalOpen(true);
    };

    const handleDelete = async (token: string) => {
        if (!confirm(`Delete device ${token}? This action cannot be undone.`)) return;

        const res = await deleteDevice(token, false);
        if (res.error) {
            if (res.error.includes("paired")) {
                if (confirm(`${res.error}\n\nDo you want to FORCE delete this device? This will unlink the device from the owner's account.`)) {
                    const forceRes = await deleteDevice(token, true);
                    if (forceRes.error) {
                        toast(forceRes.error || 'Force delete failed', 'error');
                        return;
                    }
                    toast(`Device ${token} force decommissioned`, 'success');
                    return;
                }
            } else {
                toast(res.error || 'Delete failed', 'error');
            }
            return;
        }

        toast(`Device ${token} decommissioned`, 'success');
    };

    const handleUnpair = async (token: string) => {
        if (!confirm(`Are you sure you want to unpair device ${token} from its owner?`)) return;

        const res = await unpairDevice(token);
        if (res.error) {
            toast(res.error || 'Unpair failed', 'error');
            return;
        }

        toast(`Device ${token} successfully unpaired`, 'success');
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <SiteHeader adminServiceStatus={adminServiceStatus} />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
                {/* Section 1: Dashboard Metrics */}
                <StatsGrid stats={initialStats} />

                {/* Section 2: Device Manager */}
                <div className="space-y-4 border-t border-border/20 pt-6">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-semibold tracking-tight">Device Management</h2>
                        <p className="text-xs text-muted-foreground">Filter, register, and pair physical diagnostic keys.</p>
                    </div>
                    <ActionBar
                        onGenerateClick={() => setGenerateModalOpen(true)}
                        onIngestClick={() => setIngestModalOpen(true)}
                        onTransitionStart={() => setTableLoading(true)}
                    />
                    <DeviceTable
                        devices={initialDevices}
                        onShowQR={handleShowQR}
                        onDelete={handleDelete}
                        onUnpair={handleUnpair}
                        loading={tableLoading}
                    />
                </div>

                {/* Section 3: Knowledge Base Catalog */}
                <div className="space-y-4 border-t border-border/20 pt-6">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-semibold tracking-tight">Vehicle Knowledge Base</h2>
                        <p className="text-xs text-muted-foreground">Sync repair manuals and databases to feed mobile diagnostics.</p>
                    </div>
                    <KnowledgeBase refreshTrigger={ingestModalOpen} />
                </div>
            </main>

            {/* Modals Container */}
            <GenerateModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onGenerated={handleGenerated}
            />
            <QRModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                token={selectedToken}
            />
            <UploadModal
                isOpen={ingestModalOpen}
                onClose={() => setIngestModalOpen(false)}
            />
        </div>
    );
}
