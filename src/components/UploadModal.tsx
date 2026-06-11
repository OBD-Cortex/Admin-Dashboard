'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { ingestDocument, getIngestStatus } from '@/app/actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileUp, FileText, Loader2, RefreshCw, XCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Log {
    timestamp: string;
    text: string;
    type: 'info' | 'error' | 'success';
}

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [file, setFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<string | null>(null);
    const [progressText, setProgressText] = useState('');
    const [logs, setLogs] = useState<Log[]>([]);
    const [progressPercent, setProgressPercent] = useState(0);

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isOpen) {
            resetState();
        } else {
            stopPolling();
        }
        return () => stopPolling();
    }, [isOpen]);

    const resetState = () => {
        setFile(null);
        setDragging(false);
        setUploading(false);
        setJobId(null);
        setJobStatus(null);
        setProgressText('');
        setLogs([]);
        setProgressPercent(0);
        stopPolling();
    };

    const stopPolling = () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    };

    const getTimestamp = () => {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const addLog = (text: string, type: 'info' | 'error' | 'success' = 'info') => {
        setLogs((prev) => [...prev, { timestamp: getTimestamp(), text, type }]);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (selectedFile: File) => {
        const name = selectedFile.name.toLowerCase();
        if (!name.endsWith('.pdf') && !name.endsWith('.csv') && !name.endsWith('.md') && !name.endsWith('.txt')) {
            toast('Unsupported file format. Upload PDF, CSV, MD, or TXT.', 'error');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast('File too large. Maximum size is 10MB.', 'error');
            return;
        }
        setFile(selectedFile);
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const estimateProgress = (status: string, text: string) => {
        if (status === 'queued') return 10;
        if (status === 'failed') return 100;
        if (status === 'completed') return 100;

        const lowerText = (text || '').toLowerCase();
        if (lowerText.includes('checking duplicates')) return 20;
        if (lowerText.includes('connecting')) return 30;
        if (lowerText.includes('uploading')) return 40;
        if (lowerText.includes('parsing')) return 60;
        if (lowerText.includes('extracting')) return 75;
        if (lowerText.includes('vectorizing')) return 90;
        return 50;
    };

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setJobStatus('queued');
        setProgressPercent(10);
        setProgressText('Uploading file to gateway...');
        addLog(`Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        addLog('Initiating secure file transfer...');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await ingestDocument(formData);

            if (res.error) {
                const errMsg = res.error || 'Upload to gateway failed';
                setJobStatus('failed');
                setProgressPercent(100);
                setProgressText('Upload failed');
                addLog(`Error: ${errMsg}`, 'error');
                toast(errMsg, 'error');
                setUploading(false);
                return;
            }

            setJobId(res.job_id);
            setJobStatus(res.status || 'queued');
            addLog(`Ingestion job registered. Job ID: ${res.job_id}`);
            addLog('Asynchronous worker thread started on droplet VM.');

            startPolling(res.job_id);
        } catch (err) {
            const errMsg = 'Network communication failure during upload';
            setJobStatus('failed');
            setProgressPercent(100);
            setProgressText('Upload failed');
            addLog(`Error: ${errMsg}`, 'error');
            toast(errMsg, 'error');
            setUploading(false);
        }
    };

    const startPolling = (id: string) => {
        stopPolling();
        let lastProgress = '';

        pollIntervalRef.current = setInterval(async () => {
            try {
                const data = await getIngestStatus(id);
                if (data.error) return;

                setJobStatus(data.status);
                const progressMsg = data.progress || '';
                setProgressText(progressMsg);

                if (progressMsg && progressMsg !== lastProgress) {
                    const logType = data.status === 'failed' ? 'error' : data.status === 'completed' ? 'success' : 'info';
                    addLog(progressMsg, logType);
                    lastProgress = progressMsg;
                }

                const calculatedPercent = estimateProgress(data.status, progressMsg);
                setProgressPercent(calculatedPercent);

                if (data.status === 'completed') {
                    stopPolling();
                    setUploading(false);
                    toast('Document ingestion completed successfully!', 'success');
                } else if (data.status === 'failed') {
                    stopPolling();
                    setUploading(false);
                    const errorDetail = data.error_message || 'An error occurred during embedding generation';
                    addLog(`Ingestion Error: ${errorDetail}`, 'error');
                    toast('Document ingestion failed.', 'error');
                }
            } catch (err) {
                // Fail silently and retry on next tick
            }
        }, 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !uploading && !open && onClose()}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Ingest RAG Knowledge</DialogTitle>
                    <DialogDescription>
                        Upload manuals (PDF), DTC catalogs (CSV), or notes (MD/TXT) directly to the OBD-Cortex knowledge-base. Embedding generation runs automatically.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* File Upload Zone */}
                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                                dragging ? "border-primary bg-muted/40" : "border-muted-foreground/25 hover:bg-muted/30"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.csv,.md,.txt"
                                className="hidden"
                            />
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-4">
                                <FileUp className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">Click or drag files here</p>
                            <p className="text-xs text-muted-foreground mt-1">Supports PDF, CSV, MD, and TXT up to 10MB</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/30 relative group">
                            <FileText className={cn("h-8 w-8", file.name.endsWith('.pdf') ? 'text-red-500' : 'text-blue-500')} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate pr-6">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB — {
                                        file.name.endsWith('.pdf') ? 'PDF Manual' : 
                                        file.name.endsWith('.csv') ? 'CSV Catalog' : 
                                        file.name.endsWith('.md') ? 'Markdown Doc' : 'Text Doc'
                                    }
                                </p>
                            </div>
                            {!uploading && (
                                <button
                                    onClick={handleRemoveFile}
                                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded-full p-1"
                                    title="Remove file"
                                >
                                    <XCircle className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Progress indicators & Logs */}
                    {jobStatus && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground truncate max-w-[80%]">
                                    {progressText || 'Ingestion registered...'}
                                </span>
                                <span className="font-mono text-foreground">{progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300",
                                        jobStatus === 'failed' ? "bg-destructive" : jobStatus === 'completed' ? "bg-green-500" : "bg-primary"
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            {/* Logs console */}
                            {logs.length > 0 && (
                                <div className="rounded-lg border bg-black p-3 font-mono text-[11px] leading-relaxed text-slate-300 max-h-[140px] overflow-y-auto space-y-1">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-slate-500">[{log.timestamp}]</span>
                                            <span className={cn(
                                                log.type === 'error' && "text-red-400",
                                                log.type === 'success' && "text-green-400"
                                            )}>
                                                {log.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        {jobStatus === 'completed' ? 'Close' : 'Cancel'}
                    </Button>
                    {!jobStatus && file && (
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Start Ingestion
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
