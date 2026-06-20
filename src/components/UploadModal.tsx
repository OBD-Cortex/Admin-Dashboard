'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

interface Log {
    timestamp: string;
    text: string;
    type: 'info' | 'error' | 'success';
}

interface UploadModalProps {
    isOpen: boolean;

    // File selection (pre-upload)
    file: File | null;
    dragging: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveFile: (e: React.MouseEvent) => void;

    // Job state (lifted from parent)
    uploading: boolean;
    jobStatus: string | null;
    progressText: string;
    progressPercent: number;
    logs: Log[];

    // Actions
    onUpload: () => void;
    onCancelJob: () => void;
    onMinimize: () => void;
    onClose: () => void;
}

export default function UploadModal({
    isOpen,
    file,
    dragging,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onRemoveFile,
    uploading,
    jobStatus,
    progressText,
    progressPercent,
    logs,
    onUpload,
    onCancelJob,
    onMinimize,
    onClose,
}: UploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const isActive = uploading && jobStatus && jobStatus !== 'completed' && jobStatus !== 'failed';
    const isDone = jobStatus === 'completed' || jobStatus === 'failed';

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
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={cn(
                                "flex flex-col items-center justify-center border border-dashed rounded-md p-8 text-center cursor-pointer transition-colors",
                                dragging ? "border-primary bg-muted" : "border-border bg-background hover:bg-muted/40"
                            )}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileSelect}
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
                        <div className="flex items-center gap-3 border border-border p-4 bg-background rounded-md relative group">
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
                                    onClick={onRemoveFile}
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
                                <div className="border border-border bg-background p-3 font-mono text-[10px] leading-relaxed text-muted-foreground max-h-[140px] overflow-y-auto space-y-1 rounded-md">
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
                    {isActive ? (
                        <>
                            <button
                                onClick={onCancelJob}
                                className="h-8 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 text-[10px] font-bold transition-colors cursor-pointer select-none rounded-md"
                            >
                                Stop Ingestion
                            </button>
                            <button
                                onClick={onMinimize}
                                className="h-8 border border-border bg-background hover:bg-muted px-4 text-[10px] font-bold text-foreground transition-colors cursor-pointer select-none rounded-md"
                            >
                                Minimize (Keep Running)
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={isDone ? onClose : onClose}
                            className="h-8 border border-border bg-background hover:bg-muted px-4 text-[10px] font-bold text-foreground transition-colors cursor-pointer select-none rounded-md"
                        >
                            {isDone ? 'Close' : 'Cancel'}
                        </button>
                    )}
                    {!jobStatus && file && (
                        <button
                            onClick={onUpload}
                            disabled={uploading}
                            className="h-8 bg-[#223A5E] hover:bg-[#223A5E]/90 disabled:opacity-50 px-4 text-[10px] font-bold text-[#FAF8F5] transition-all cursor-pointer select-none flex items-center gap-1.5 rounded-md"
                        >
                            {uploading && (
                                <svg className="h-3 w-3 animate-spin text-[#FAF8F5]" fill="none" viewBox="0 0 24 24">
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
