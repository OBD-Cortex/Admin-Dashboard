'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import StatsGrid from '@/components/StatsGrid';
import ActionBar from '@/components/ActionBar';
import DeviceTable from '@/components/DeviceTable';
import GenerateModal from '@/components/GenerateModal';
import QRModal from '@/components/QRModal';
import UploadModal from '@/components/UploadModal';
import { useToast } from '@/components/Toast';
import KnowledgeBase from '@/components/KnowledgeBase';
import { deleteDevice, unpairDevice } from '@/app/actions';

export default function ClientDashboard({ initialStats, initialDevices }) {
    const { toast } = useToast();

    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);
    const [ingestModalOpen, setIngestModalOpen] = useState(false);
    const [ragStatus, setRagStatus] = useState('loading');
    const [tableLoading, setTableLoading] = useState(false);

    // Turn off loading whenever new data arrives from SSR
    useEffect(() => {
        setTableLoading(false);
    }, [initialDevices]);

    // Health polling
    const fetchHealth = useCallback(async () => {
        try {
            const res = await fetch('/api/health');
            const data = await res.json();
            setRagStatus(data.rag || 'disconnected');
        } catch {
            setRagStatus('disconnected');
        }
    }, []);

    useEffect(() => {
        fetchHealth();
        const healthPoll = setInterval(fetchHealth, 30000);
        return () => clearInterval(healthPoll);
    }, [fetchHealth]);

    const handleGenerated = (data) => {
        toast(`Successfully generated ${data.generated} device${data.generated > 1 ? 's' : ''}`, 'success');
        if (data.tokens && data.tokens.length === 1) {
            setSelectedToken(data.tokens[0]);
            setQrModalOpen(true);
        }
    };

    const handleShowQR = (token) => {
        setSelectedToken(token);
        setQrModalOpen(true);
    };

    const handleDelete = async (token) => {
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
                    toast(`Device ${token} force deleted`, 'success');
                    return;
                }
            } else {
                toast(res.error || 'Delete failed', 'error');
            }
            return;
        }

        toast(`Device ${token} deleted`, 'success');
    };

    const handleUnpair = async (token) => {
        if (!confirm(`Are you sure you want to unpair device ${token} from its owner? This will decouple the user account without deleting the device or the user.`)) return;

        const res = await unpairDevice(token);
        if (res.error) {
            toast(res.error || 'Unpair failed', 'error');
            return;
        }

        toast(`Device ${token} successfully unpaired`, 'success');
    };

    return (
        <div className="app-container">
            <Header ragStatus={ragStatus} />
            <StatsGrid stats={initialStats} />
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
            <KnowledgeBase refreshTrigger={ingestModalOpen} />
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
