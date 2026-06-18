'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';
import { ingestDocument, getIngestStatus } from '@/app/actions';
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
            toast('Unsupported format. Upload PDF, CSV, MD, or TXT.', 'error');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast('File size exceeds 10MB limit.', 'error');
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
                    toast('Document Ingestion Failed', 'error');
                }
            } catch (err) {
                // Fail silently and retry on next tick
            }
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans">
            <div className="w-full max-w-[480px] border border-border bg-card p-6 shadow-2xl rounded-2xl">
                <div className="mb-4">
                    <h3 className="text-base font-bold font-serif tracking-tight text-foreground mb-1">Ingest RAG Knowledge</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Upload repair manuals, catalogs, or notes. Chunking and indexing run automatically.
                    </p>
                </div>

                <div className="space-y-4 py-2">
                    {/* File Upload Zone */}
                    {!file ? (
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex flex-col items-center justify-center border border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                                dragging ? "border-primary bg-muted" : "border-border bg-background hover:bg-muted/40"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept=".pdf,.csv,.md,.txt"
                                className="hidden"
                            />
                            <div className="flex h-10 w-10 items-center justify-center border border-border bg-card rounded-lg mb-3">
                                <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <p className="text-[10px] font-bold text-foreground tracking-wider">Drag file or click to browse</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Supports PDF, CSV, MD, TXT up to 10MB</p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 border border-border p-4 bg-background rounded-xl relative group">
                            <svg className="h-8 w-8 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-foreground truncate pr-6 select-all">{file.name}</p>
                                <p className="text-[9px] text-muted-foreground tracking-tight">
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
                                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors cursor-pointer"
                                    title="Remove file"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Progress indicators & Logs */}
                    {jobStatus && (
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-bold">
                                <span className={cn(
                                    "truncate max-w-[80%]",
                                    jobStatus === 'completed' && "text-emerald-800",
                                    jobStatus === 'failed' && "text-rose-800",
                                    jobStatus !== 'completed' && jobStatus !== 'failed' && "text-blue-800"
                                )}>
                                    {progressText || 'Ingestion queued...'}
                                </span>
                                <span className={cn(
                                    "font-mono",
                                    jobStatus === 'completed' && "text-emerald-800",
                                    jobStatus === 'failed' && "text-rose-800",
                                    jobStatus !== 'completed' && jobStatus !== 'failed' && "text-blue-800"
                                )}>{progressPercent}%</span>
                            </div>
                            <div className="h-2 w-full bg-background border border-border overflow-hidden rounded-full">
                                <div
                                    className={cn(
                                        "h-full transition-all duration-300 rounded-full",
                                        jobStatus === 'completed' && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]",
                                        jobStatus === 'failed' && "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]",
                                        jobStatus !== 'completed' && jobStatus !== 'failed' && "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.4)]"
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>

                            {/* Logs console */}
                            {logs.length > 0 && (
                                <div className="border border-border bg-background p-3 font-mono text-[10px] leading-relaxed text-muted-foreground max-h-[140px] overflow-y-auto space-y-1 rounded-xl">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-muted-foreground/60">[{log.timestamp}]</span>
                                            <span className={cn(
                                                log.type === 'error' && "text-rose-600 font-semibold",
                                                log.type === 'success' && "text-emerald-600 font-bold",
                                                log.type === 'info' && "text-foreground"
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

                <div className="flex justify-end gap-3 border-t border-border pt-4">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="h-8 border border-border bg-background hover:bg-muted px-4 text-[10px] font-bold text-foreground transition-colors cursor-pointer select-none rounded-xl"
                    >
                        {jobStatus === 'completed' ? 'Close' : 'Cancel'}
                    </button>
                    {!jobStatus && file && (
                        <button 
                            onClick={handleUpload} 
                            disabled={uploading}
                            className="h-8 bg-primary hover:opacity-90 disabled:opacity-50 px-4 text-[10px] font-bold text-primary-foreground transition-all cursor-pointer select-none flex items-center gap-1.5 rounded-xl"
                        >
                            {uploading && (
                                <svg className="h-3 w-3 animate-spin text-primary-foreground" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            <span>Start Ingestion</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
