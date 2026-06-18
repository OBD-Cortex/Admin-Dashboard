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

// Helper to check health of specific service subdomains or use local fallback
const checkHealthFor = async (service: 'admin' | 'edge' | 'app') => {
    if (typeof window === 'undefined') return 'disconnected';
    try {
        const host = window.location.host;
        const protocol = window.location.protocol;
        
        let url = '';
        if (host.startsWith('admin.')) {
            const subdomain = service === 'admin' ? 'admin' : service === 'edge' ? 'edge' : 'app';
            url = `${protocol}//${host.replace(/^admin\./, `${subdomain}.`)}/api/health`;
        } else {
            // Local dev fallback proxy URL
            url = `/api/health?service=${service}`;
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        
        if (res.ok) {
            if (url.startsWith('/api/health')) {
                const data = await res.json();
                if (service === 'admin') return data.adminService || 'disconnected';
                if (service === 'edge') return data.edgeService || 'disconnected';
                if (service === 'app') return data.appService || 'disconnected';
            }
            return 'connected';
        }
        return 'disconnected';
    } catch {
        return 'disconnected';
    }
};

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

    // Confirmation Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        variant: 'danger' | 'warning' | 'primary';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: '',
        variant: 'primary',
        onConfirm: () => {},
    });

    // Dynamic states for services health checks
    const [servicesStatus, setServicesStatus] = useState<{
        admin: string;
        edge: string;
        app: string;
    }>({
        admin: 'loading',
        edge: 'loading',
        app: 'loading',
    });

    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        setTableLoading(false);
    }, [initialDevices]);

    const refreshServiceHealth = useCallback(async (service: 'admin' | 'edge' | 'app') => {
        setServicesStatus((prev) => ({ ...prev, [service]: 'loading' }));
        const status = await checkHealthFor(service);
        setServicesStatus((prev) => ({ ...prev, [service]: status }));
    }, []);

    useEffect(() => {
        refreshServiceHealth('admin');
        refreshServiceHealth('edge');
        refreshServiceHealth('app');
    }, [refreshServiceHealth]);

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
                setConfirmModal({
                    isOpen: true,
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
        setConfirmModal({
            isOpen: true,
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
        setConfirmModal({
            isOpen: true,
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
                onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                variant={confirmModal.variant}
            />
        </div>
    );
}
