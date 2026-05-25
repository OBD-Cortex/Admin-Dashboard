'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/components/Toast';

/**
 * UploadModal Component
 * Handles the secure drag-and-drop file upload of PDF/CSV manuals and
 * polls the direct Next.js status API in the background.
 */
export default function UploadModal({ isOpen, onClose }) {
    const { toast } = useToast();
    const fileInputRef = useRef(null);

    // Core States
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null); // 'queued', 'processing', 'completed', 'failed'
    const [progressText, setProgressText] = useState('');
    const [logs, setLogs] = useState([]);
    const [progressPercent, setProgressPercent] = useState(0);

    // Ref to hold the polling interval timer
    const pollIntervalRef = useRef(null);

    // Reset state whenever the modal visibility changes
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

    const addLog = (text, type = 'info') => {
        setLogs((prev) => [...prev, { timestamp: getTimestamp(), text, type }]);
    };

    // Drag & Drop event handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => {
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    // File validation: PDF/CSV format and 10MB size limit
    const validateAndSetFile = (selectedFile) => {
        const name = selectedFile.name.toLowerCase();
        if (!name.endsWith('.pdf') && !name.endsWith('.csv')) {
            toast('Unsupported file format. Please upload a PDF or CSV manual.', 'error');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast('File too large. Maximum size allowed is 10MB.', 'error');
            return;
        }
        setFile(selectedFile);
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Dynamically calculate approximate progress based on status log strings
    const estimateProgress = (status, text) => {
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

    // Start Ingestion Upload
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
            const res = await fetch('/api/ingest', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                const errMsg = data.error || 'Upload to gateway failed';
                setJobStatus('failed');
                setProgressPercent(100);
                setProgressText('Upload failed');
                addLog(`Error: ${errMsg}`, 'error');
                toast(errMsg, 'error');
                setUploading(false);
                return;
            }

            setJobId(data.job_id);
            setJobStatus(data.status || 'queued');
            addLog(`Ingestion job registered. Job ID: ${data.job_id}`);
            addLog('Asynchronous worker thread started on droplet VM.');

            // Start polling status from MongoDB directly
            startPolling(data.job_id);
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

    // Poll status from MongoDB via Next.js api
    const startPolling = (id) => {
        stopPolling();
        let lastProgress = '';

        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/ingest/status?jobId=${id}`);
                if (!res.ok) {
                    return;
                }
                const data = await res.json();

                setJobStatus(data.status);
                const progressMsg = data.progress || '';
                setProgressText(progressMsg);

                // Add log only if progress text changed to avoid duplicate spam
                if (progressMsg && progressMsg !== lastProgress) {
                    const logType = data.status === 'failed' ? 'error' : data.status === 'completed' ? 'success' : 'info';
                    addLog(progressMsg, logType);
                    lastProgress = progressMsg;
                }

                // Update progress percentage
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
        <div className={`modal-overlay${isOpen ? ' active' : ''}`} onClick={() => !uploading && onClose()}>
            <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                
                {/* Modal close icon */}
                <button
                    className="modal-close"
                    onClick={onClose}
                    disabled={uploading}
                    style={{ opacity: uploading ? 0.3 : 1 }}
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <h2 className="modal-title">Ingest RAG Knowledge</h2>
                <p className="modal-subtitle">
                    Upload manuals (PDF) or DTC catalogs (CSV) directly to the 
                    OBD-Cortex knowledge-base. Embedding generation and vector syncing run in the background.
                </p>

                {/* File Upload Zone */}
                {!file ? (
                    <div
                        className={`upload-zone${dragging ? ' dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".pdf,.csv"
                            className="sr-only"
                        />
                        <div className="upload-icon-wrap">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <div className="upload-text-main">Drag & drop manual PDF or CSV here</div>
                        <div className="upload-text-sub">Supports PDF manuals & CSV code catalogs up to 10MB</div>
                    </div>
                ) : (
                    <div className="file-selected-box">
                        <div className="file-icon">
                            {file.name.endsWith('.pdf') ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                    <polyline points="10 9 9 9 8 9" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="8" y1="13" x2="8" y2="17" />
                                    <line x1="12" y1="13" x2="12" y2="17" />
                                    <line x1="16" y1="13" x2="16" y2="17" />
                                </svg>
                            )}
                        </div>
                        <div className="file-info">
                            <div className="file-name">{file.name}</div>
                            <div className="file-size">{(file.size / 1024).toFixed(1)} KB — {file.name.endsWith('.pdf') ? 'PDF Manual' : 'CSV catalog'}</div>
                        </div>
                        <button
                            className="remove-file-btn"
                            onClick={handleRemoveFile}
                            disabled={uploading}
                            style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                            title="Remove file"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Progress Indicators & Terminal Log Consolidation */}
                {jobStatus && (
                    <div className="progress-container">
                        <div className="progress-header">
                            <span className="progress-status">{progressText || 'Processing...'}</span>
                            <span className="progress-percent">{progressPercent}%</span>
                        </div>
                        <div className="progress-track" style={{ marginBottom: '16px' }}>
                            <div
                                className="progress-fill"
                                style={{
                                    width: `${progressPercent}%`,
                                    background: jobStatus === 'failed' ? 'var(--accent-red)' : jobStatus === 'completed' ? 'var(--accent-green)' : 'var(--gradient-hero)'
                                }}
                            />
                        </div>

                        {logs.length > 0 && (
                            <div className="job-logs-window">
                                {logs.map((log, idx) => (
                                    <div key={idx} className="job-log-line">
                                        <span className="job-log-timestamp">[{log.timestamp}]</span>
                                        <span className={`job-log-text ${log.type}`}>
                                            {log.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Modal Controls */}
                <div className="modal-footer">
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={uploading}
                    >
                        {jobStatus === 'completed' ? 'Close' : 'Cancel'}
                    </button>

                    {!jobStatus && file && (
                        <button
                            className="btn-primary"
                            onClick={handleUpload}
                        >
                            Start Ingestion
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
