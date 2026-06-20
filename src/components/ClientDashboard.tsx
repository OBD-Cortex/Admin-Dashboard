'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import StatsGrid from '@/components/StatsGrid';
import ActionBar from '@/components/ActionBar';
import DeviceTable from '@/components/DeviceTable';
import KnowledgeBase from '@/components/KnowledgeBase';
import GenerateModal from '@/components/GenerateModal';
import QRModal from '@/components/QRModal';
import UploadModal from '@/components/UploadModal';
import ConfirmModal from '@/components/ConfirmModal';
import PerformanceModal from '@/components/PerformanceModal';
import { useToast } from '@/components/Toast';
import { ingestDocument, deleteDevice, unpairDevice, getIngestStatus, cancelIngestJob } from '@/app/actions';

import { Stats, Device } from '@/types';
import { useServiceHealth } from '@/hooks/useServiceHealth';
import { useConfirm } from '@/hooks/useConfirm';
interface Log {
    timestamp: string;
    text: string;
    type: 'info' | 'error' | 'success';
}

interface ClientDashboardProps {
    initialStats: Stats | null;
    initialDevices: Device[];
}

export default function ClientDashboard({ initialStats, initialDevices }: ClientDashboardProps) {
    const { toast } = useToast();

    // Modal open/close states
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [ingestModalOpen, setIngestModalOpen] = useState(false);
    const [performanceModalOpen, setPerformanceModalOpen] = useState(false);

    const { servicesStatus, refreshServiceHealth } = useServiceHealth();
    const { confirmModal, requestConfirm, closeConfirm } = useConfirm();

    const [tableLoading, setTableLoading] = useState(false);

    // ----------------------------------------------------------------
    // Ingestion state -- lifted here so it survives modal minimize/reopen
    // ----------------------------------------------------------------
    const [ingestFile, setIngestFile] = useState<File | null>(null);
    const [ingestDragging, setIngestDragging] = useState(false);
    const [ingestUploading, setIngestUploading] = useState(false);
    const [ingestJobId, setIngestJobId] = useState<string | null>(null);
    const [ingestJobStatus, setIngestJobStatus] = useState<string | null>(null);
    const [ingestProgressText, setIngestProgressText] = useState('');
    const [ingestProgressPercent, setIngestProgressPercent] = useState(0);
    const [ingestLogs, setIngestLogs] = useState<Log[]>([]);
    const [ingestEta, setIngestEta] = useState<number | 'calculating' | null>(null);

    const vectorizeStartRef = useRef<number | null>(null);
    const vectorizeInitialRef = useRef<number | null>(null);
    const vectorizeTotalRef = useRef<number | null>(null);

    const ingestPollRef = useRef<NodeJS.Timeout | null>(null);

    const formatEta = (eta: number | 'calculating' | null, short = false): string => {
        if (eta === null) return '';
        if (eta === 'calculating') return short ? 'calc...' : 'Calculating ETA...';
        if (eta <= 0) return 'Almost done';

        const totalSeconds = Math.round(eta);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (short) {
            if (hours > 0) return `${hours}h ${minutes}m`;
            if (minutes > 0) return `${minutes}m`;
            return `${seconds}s`;
        }

        const parts: string[] = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return `ETA: ~${parts.join(' ')}`;
    };

    const getTimestamp = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const addIngestLog = useCallback((text: string, type: 'info' | 'error' | 'success' = 'info') => {
        setIngestLogs((prev) => [...prev, { timestamp: getTimestamp(), text, type }]);
    }, []);

    const estimateProgress = (status: string, text: string) => {
        if (status === 'queued') return 5;
        if (status === 'failed') return 100;
        if (status === 'completed') return 100;

        // Primary: extract (current/total) fraction emitted by the backend.
        // Show the exact ratio so the bar is always in sync with vectorizing progress.
        const match = text.match(/(\d+)\/(\d+)/);
        if (match) {
            const current = parseInt(match[1], 10);
            const total = parseInt(match[2], 10);
            if (total > 0) {
                // Clamp to 1-99 so the bar never shows 0% or premature 100%
                return Math.min(99, Math.max(1, Math.round((current / total) * 100)));
            }
        }

        // Fallback for pre-vectorizing status messages
        const lowerText = (text || '').toLowerCase();
        if (lowerText.includes('checking') || lowerText.includes('reading')) return 5;
        if (lowerText.includes('connecting')) return 10;
        if (lowerText.includes('uploading')) return 15;
        if (lowerText.includes('parsing')) return 25;
        if (lowerText.includes('extracting')) return 40;
        if (lowerText.includes('resuming')) return 10;
        if (lowerText.includes('vectorizing')) return 50;
        return 10;
    };

    const stopIngestPolling = useCallback(() => {
        if (ingestPollRef.current) {
            clearInterval(ingestPollRef.current);
            ingestPollRef.current = null;
        }
        vectorizeStartRef.current = null;
        vectorizeInitialRef.current = null;
        vectorizeTotalRef.current = null;
        setIngestEta(null);
    }, []);

    const startIngestPolling = useCallback((id: string) => {
        stopIngestPolling();
        let lastProgress = '';
        let consecutiveErrors = 0;
        const startTime = Date.now();
        const timeoutMs = 15 * 60 * 1000; // 15 minutes

        ingestPollRef.current = setInterval(async () => {
            if (Date.now() - startTime > timeoutMs) {
                stopIngestPolling();
                setIngestUploading(false);
                setIngestJobStatus('failed');
                setIngestProgressPercent(100);
                setIngestProgressText('Ingestion timed out');
                setIngestLogs((prev) => [...prev, {
                    timestamp: getTimestamp(),
                    text: 'Error: Ingestion process timed out (server unresponsive or process terminated)',
                    type: 'error'
                }]);
                toast('Ingestion timed out', 'error');
                return;
            }

            try {
                const data = await getIngestStatus(id);
                if (data.error) {
                    consecutiveErrors++;
                    if (consecutiveErrors >= 3) {
                        setIngestLogs((prev) => [...prev, {
                            timestamp: getTimestamp(),
                            text: `Warning: Status polling degraded (${data.error}, retrying...)`,
                            type: 'error'
                        }]);
                    }
                    return;
                }

                consecutiveErrors = 0;

                setIngestJobStatus(data.status);
                const progressMsg = data.progress || '';
                setIngestProgressText(progressMsg);

                if (progressMsg && progressMsg !== lastProgress) {
                    const logType = data.status === 'failed' ? 'error' : data.status === 'completed' ? 'success' : 'info';
                    setIngestLogs((prev) => [...prev, {
                        timestamp: getTimestamp(),
                        text: progressMsg,
                        type: logType
                    }]);
                    lastProgress = progressMsg;
                }

                const calculatedPercent = estimateProgress(data.status, progressMsg);
                setIngestProgressPercent(calculatedPercent);

                // ETA calculation
                const match = progressMsg.match(/(\d+)\/(\d+)/);
                if (match) {
                    const current = parseInt(match[1], 10);
                    const total = parseInt(match[2], 10);
                    if (total > 0 && current > 0) {
                        const now = Date.now();
                        if (
                            !vectorizeStartRef.current ||
                            vectorizeTotalRef.current !== total ||
                            vectorizeInitialRef.current === null ||
                            vectorizeInitialRef.current > current
                        ) {
                            vectorizeStartRef.current = now;
                            vectorizeInitialRef.current = current;
                            vectorizeTotalRef.current = total;
                        }

                        const elapsedSec = (now - vectorizeStartRef.current) / 1000;
                        const processedSinceStart = current - vectorizeInitialRef.current;

                        if (elapsedSec > 2 && processedSinceStart > 0) {
                            const rate = processedSinceStart / elapsedSec;
                            const remaining = total - current;
                            setIngestEta(remaining / rate);
                        } else {
                            setIngestEta('calculating');
                        }
                    } else {
                        setIngestEta(null);
                    }
                } else {
                    setIngestEta(null);
                }

                if (data.status === 'completed') {
                    stopIngestPolling();
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('active_ingest_job_id');
                        localStorage.removeItem('active_ingest_filename');
                    }
                    setIngestUploading(false);
                    setIngestProgressPercent(100);
                    toast('Document ingestion completed successfully!', 'success');
                } else if (data.status === 'failed') {
                    stopIngestPolling();
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('active_ingest_job_id');
                        localStorage.removeItem('active_ingest_filename');
                    }
                    setIngestUploading(false);
                    setIngestProgressPercent(100);
                    const errorDetail = data.error_message || 'An error occurred during embedding generation';
                    setIngestLogs((prev) => [...prev, {
                        timestamp: getTimestamp(),
                        text: `Ingestion Error: ${errorDetail}`,
                        type: 'error'
                    }]);
                    toast('Document Ingestion Failed', 'error');
                }
            } catch (err) {
                consecutiveErrors++;
                if (consecutiveErrors >= 3) {
                    setIngestLogs((prev) => [...prev, {
                        timestamp: getTimestamp(),
                        text: 'Warning: Status polling degraded (Network failure, retrying...)',
                        type: 'error'
                    }]);
                }
            }
        }, 5000);
    }, [stopIngestPolling, toast]);

    // Resume polling for an active job stored in localStorage on first mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedJobId = localStorage.getItem('active_ingest_job_id');
            const savedFilename = localStorage.getItem('active_ingest_filename');
            if (savedJobId) {
                setIngestJobId(savedJobId);
                setIngestUploading(true);
                setIngestJobStatus('processing');
                setIngestProgressPercent(10);
                setIngestProgressText('Resuming active ingestion monitoring...');
                setIngestLogs([{
                    timestamp: getTimestamp(),
                    text: `Reconnected to job ${savedJobId} (${savedFilename || 'Unknown file'})`,
                    type: 'info'
                }]);
                startIngestPolling(savedJobId);
            }
        }
        return () => stopIngestPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ----------------------------------------------------------------
    // File selection handlers
    // ----------------------------------------------------------------
    const validateAndSetFile = (selectedFile: File) => {
        const name = selectedFile.name.toLowerCase();
        if (!name.endsWith('.pdf') && !name.endsWith('.csv') && !name.endsWith('.md') && !name.endsWith('.txt')) {
            toast('Unsupported format. Upload PDF, CSV, MD, or TXT.', 'error');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast('File size exceeds 10MB limit.', 'error');
            return;
        }
        setIngestFile(selectedFile);
    };

    const handleIngestDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIngestDragging(true);
    };

    const handleIngestDragLeave = () => setIngestDragging(false);

    const handleIngestDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIngestDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleIngestFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleIngestRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIngestFile(null);
    };

    // ----------------------------------------------------------------
    // Upload handler
    // ----------------------------------------------------------------
    const handleIngestUpload = async () => {
        if (!ingestFile) return;
        setIngestUploading(true);
        setIngestJobStatus('queued');
        setIngestProgressPercent(10);
        setIngestProgressText('Uploading file to gateway...');
        addIngestLog(`Selected file: ${ingestFile.name} (${(ingestFile.size / 1024 / 1024).toFixed(2)} MB)`);
        addIngestLog('Initiating secure file transfer...');

        const formData = new FormData();
        formData.append('file', ingestFile);

        try {
            const res = await ingestDocument(formData);

            if (res.error) {
                const errMsg = res.error || 'Upload to gateway failed';
                setIngestJobStatus('failed');
                setIngestProgressPercent(100);
                setIngestProgressText('Upload failed');
                addIngestLog(`Error: ${errMsg}`, 'error');
                toast(errMsg, 'error');
                setIngestUploading(false);
                return;
            }

            const jobId = res.job_id;
            setIngestJobId(jobId);
            setIngestJobStatus(res.status || 'queued');
            if (typeof window !== 'undefined') {
                localStorage.setItem('active_ingest_job_id', jobId);
                localStorage.setItem('active_ingest_filename', ingestFile.name);
            }
            addIngestLog(`Ingestion job registered. Job ID: ${jobId}`);
            addIngestLog('Asynchronous worker thread started on droplet VM.');

            startIngestPolling(jobId);
        } catch (err) {
            const errMsg = 'Network communication failure during upload';
            setIngestJobStatus('failed');
            setIngestProgressPercent(100);
            setIngestProgressText('Upload failed');
            addIngestLog(`Error: ${errMsg}`, 'error');
            toast(errMsg, 'error');
            setIngestUploading(false);
        }
    };

    // ----------------------------------------------------------------
    // Cancel handler
    // ----------------------------------------------------------------
    const handleCancelIngestJob = async () => {
        if (!ingestJobId) return;
        addIngestLog('Sending cancellation request to Admin Service...', 'info');
        try {
            const res = await cancelIngestJob(ingestJobId);
            if (res.error) {
                addIngestLog(`Cancellation failed: ${res.error}`, 'error');
                toast(`Failed to cancel: ${res.error}`, 'error');
            } else {
                addIngestLog('Cancellation signal received by backend. Aborting...', 'info');
                stopIngestPolling();
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('active_ingest_job_id');
                    localStorage.removeItem('active_ingest_filename');
                }
                setIngestUploading(false);
                setIngestJobStatus('failed');
                setIngestProgressPercent(100);
                setIngestProgressText('Ingestion cancelled by user');
            }
        } catch (err) {
            addIngestLog('Network failure sending cancellation signal', 'error');
        }
    };

    // Minimize: just close the modal — polling continues at dashboard level
    const handleIngestMinimize = () => setIngestModalOpen(false);

    // Full close: only called when job is done or user discards a pending upload
    const handleIngestClose = () => {
        // If a job is active don't allow closing via the button
        if (ingestUploading && ingestJobStatus !== 'completed' && ingestJobStatus !== 'failed') {
            setIngestModalOpen(false);
            return;
        }
        // Reset state after a completed/failed/cancelled job or a no-job cancel
        setIngestFile(null);
        setIngestDragging(false);
        setIngestUploading(false);
        setIngestJobId(null);
        setIngestJobStatus(null);
        setIngestProgressText('');
        setIngestProgressPercent(0);
        setIngestLogs([]);
        stopIngestPolling();
        setIngestModalOpen(false);
    };

    // ----------------------------------------------------------------
    // Re-open modal handler: open the modal; do NOT reset state
    // ----------------------------------------------------------------
    const handleIngestClick = () => setIngestModalOpen(true);

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
            if (res.error.includes('paired') && !force) {
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

    // Is an ingestion job actively running in the background?
    const isIngestActive = ingestUploading &&
        ingestJobStatus !== 'completed' &&
        ingestJobStatus !== 'failed';

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
                        onIngestClick={handleIngestClick}
                        onPerformanceClick={() => setPerformanceModalOpen(true)}
                        onTransitionStart={() => setTableLoading(true)}
                        ingestActive={isIngestActive}
                        ingestProgressPercent={ingestProgressPercent}
                        ingestJobStatus={ingestJobStatus}
                        ingestEtaText={formatEta(ingestEta, true)}
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

            {/* UploadModal receives all state from here -- minimizing does not reset progress */}
            <UploadModal
                isOpen={ingestModalOpen}
                file={ingestFile}
                dragging={ingestDragging}
                onDragOver={handleIngestDragOver}
                onDragLeave={handleIngestDragLeave}
                onDrop={handleIngestDrop}
                onFileSelect={handleIngestFileSelect}
                onRemoveFile={handleIngestRemoveFile}
                uploading={ingestUploading}
                jobStatus={ingestJobStatus}
                progressText={ingestProgressText}
                progressPercent={ingestProgressPercent}
                etaText={formatEta(ingestEta, false)}
                logs={ingestLogs}
                onUpload={handleIngestUpload}
                onCancelJob={handleCancelIngestJob}
                onMinimize={handleIngestMinimize}
                onClose={handleIngestClose}
            />

            <PerformanceModal
                isOpen={performanceModalOpen}
                onClose={() => setPerformanceModalOpen(false)}
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
