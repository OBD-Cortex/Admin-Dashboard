'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AppSidebar } from '@/components/layout/app-sidebar';
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

    // Layout states
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

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
        <div className="flex min-h-screen w-full bg-background overflow-hidden">
            {/* Left Sidebar */}
            <AppSidebar
                collapsed={sidebarCollapsed}
                setCollapsed={setSidebarCollapsed}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* Right Main Container */}
            <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
                <SiteHeader
                    adminServiceStatus={adminServiceStatus}
                    activeTab={activeTab}
                    sidebarOpen={!sidebarCollapsed}
                    setSidebarOpen={(open) => setSidebarCollapsed(!open)}
                />

                <main className="flex-1 p-6 space-y-6">
                    {activeTab === 'overview' && (
                        <>
                            {/* Overview Heading */}
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
                                <p className="text-sm text-muted-foreground">
                                    Manage, provision, and decommission physical diagnostic hardware tokens.
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <StatsGrid stats={initialStats} />

                            {/* Filters & Actions */}
                            <ActionBar
                                onGenerateClick={() => setGenerateModalOpen(true)}
                                onIngestClick={() => setIngestModalOpen(true)}
                                onTransitionStart={() => setTableLoading(true)}
                            />

                            {/* Table */}
                            <DeviceTable
                                devices={initialDevices}
                                onShowQR={handleShowQR}
                                onDelete={handleDelete}
                                onUnpair={handleUnpair}
                                loading={tableLoading}
                            />
                        </>
                    )}

                    {activeTab === 'knowledge' && (
                        <>
                            {/* Knowledge Base Heading */}
                            <div className="space-y-1">
                                <h1 className="text-2xl font-bold tracking-tight">RAG Ingestion Center</h1>
                                <p className="text-sm text-muted-foreground">
                                    Sync service manuals and vehicle databases to fuel context search on mobile endpoints.
                                </p>
                            </div>

                            <KnowledgeBase refreshTrigger={ingestModalOpen} />
                        </>
                    )}
                </main>
            </div>

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
