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
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { deleteDevice, unpairDevice } from '@/app/actions';

import { Stats, Device } from '@/types';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { useConfirm } from '@/hooks/useConfirm';



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

    const { servicesStatus, refreshServiceHealth } = useServiceHealth();
    const { confirmModal, requestConfirm, closeConfirm } = useConfirm();

    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        setTableLoading(false);
    }, [initialDevices]);



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

    const executeDelete = async (token: string, force: boolean) => {
        const res = await deleteDevice(token, force);
        if (res.error) {
            if (res.error.includes("paired") && !force) {
                // Trigger confirmation for force delete if device is paired
                requestConfirm({
                    title: 'Force Delete Device',
                    message: `${res.error}\n\nDo you want to FORCE delete this device? This will unlink the device from the owner's account.`,
                    confirmText: 'Force Delete',
                    variant: 'danger',
                    onConfirm: () => executeDelete(token, true),
                });
            } else {
                toast(res.error || 'Delete failed', 'error');
            }
            return;
        }

        toast(`Device ${token} deleted`, 'success');
    };

    const handleDeleteClick = (token: string) => {
        requestConfirm({
            title: 'Delete Device',
            message: `Delete device ${token}? This action cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
            onConfirm: () => executeDelete(token, false),
        });
    };

    const executeUnpair = async (token: string) => {
        const res = await unpairDevice(token);
        if (res.error) {
            toast(res.error || 'Unpair failed', 'error');
            return;
        }

        toast(`Device ${token} successfully unpaired`, 'success');
    };

    const handleUnpairClick = (token: string) => {
        requestConfirm({
            title: 'Unpair Device',
            message: `Are you sure you want to unpair device ${token} from its owner?`,
            confirmText: 'Unpair',
            variant: 'danger',
            onConfirm: () => executeUnpair(token),
        });
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-background">
            <SiteHeader 
                servicesStatus={servicesStatus} 
                onRefreshServiceHealth={refreshServiceHealth} 
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
                {/* Section 1: Dashboard Metrics */}
                <StatsGrid stats={initialStats} />

                {/* Section 2: Device Manager */}
                <div className="space-y-4 border-t border-border/20 pt-6">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-semibold tracking-tight">Device Management</h2>
                    </div>
                    <ActionBar
                        onGenerateClick={() => setGenerateModalOpen(true)}
                        onIngestClick={() => setIngestModalOpen(true)}
                        onTransitionStart={() => setTableLoading(true)}
                    />
                    <DeviceTable
                        devices={initialDevices}
                        onShowQR={handleShowQR}
                        onDelete={handleDeleteClick}
                        onUnpair={handleUnpairClick}
                        loading={tableLoading}
                    />
                </div>

                {/* Section 3: Knowledge Base Catalog */}
                <div className="space-y-4 border-t border-border/20 pt-6">
                    <div className="space-y-0.5">
                        <h2 className="text-base font-semibold tracking-tight">Knowledge Base</h2>
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
            
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
        </div>
    );
}
