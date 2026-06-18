'use client';

import React, { useState, useEffect } from 'react';
import { getKnowledgeBase, deleteKnowledgeDocument } from '@/app/actions';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

interface Document {
    source: string;
    doc_type: string;
    chunks: number;
}

interface KnowledgeBaseProps {
    refreshTrigger: boolean;
}

export default function KnowledgeBase({ refreshTrigger }: KnowledgeBaseProps) {
    const { toast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Confirm Modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        source: string | null;
    }>({
        isOpen: false,
        source: null,
    });

    const fetchKnowledge = async () => {
        try {
            setLoading(true);
            const data = await getKnowledgeBase();
            if (data && data.documents) {
                setDocuments(data.documents);
            }
        } catch (err) {
            console.error('Failed to fetch knowledge', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKnowledge();
    }, [refreshTrigger]);

    const executeDelete = async (source: string) => {
        setDeleting(source);
        try {
            const res = await deleteKnowledgeDocument(source);
            if (res.success) {
                toast(`Document ${source} successfully deleted`, 'success');
                fetchKnowledge();
            } else {
                toast(res.error || 'Failed to delete document', 'error');
            }
        } catch (err) {
            toast('Failed to delete document', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const handleDeleteClick = (source: string) => {
        setConfirmModal({
            isOpen: true,
            source,
        });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 font-sans">
                <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest">Loading knowledge segments...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 font-sans text-xs">
            <div className="border border-border bg-card overflow-hidden rounded-2xl shadow-sm">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-dashed border border-border/80 m-4 bg-muted/20 rounded-md">
                        <svg className="h-8 w-8 text-muted-foreground/60 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <h3 className="font-bold text-xs text-foreground tracking-wider">No assets ingested</h3>
                        <p className="text-[10px] text-muted-foreground mt-1 max-w-sm leading-relaxed">
                            Upload manuals (PDF), DTC tables (CSV), or diagnostic guidelines using the "Ingest" action.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border text-muted-foreground font-bold tracking-wider text-[10px] bg-[#F3EFE7]">
                                <th className="p-3.5">Source File</th>
                                <th className="p-3.5">Type</th>
                                <th className="p-3.5">Ingested Chunks</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {documents.map((doc) => (
                                <tr key={doc.source} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3.5 font-semibold text-foreground truncate max-w-[250px] select-all">
                                        {doc.source}
                                    </td>
                                    <td className="p-3.5">
                                        <span className="inline-flex items-center border border-border bg-background px-2 py-0.5 text-[9px] font-bold text-foreground capitalize rounded-lg">
                                            {doc.doc_type}
                                        </span>
                                    </td>
                                    <td className="p-3.5 text-muted-foreground lowercase">
                                        {doc.chunks} segments
                                    </td>
                                    <td className="p-3.5 text-right">
                                        <button
                                            onClick={() => handleDeleteClick(doc.source)}
                                            disabled={deleting === doc.source}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-border bg-transparent text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-[#F3EFE7] transition-colors cursor-pointer disabled:opacity-50 rounded-md"
                                            title="Delete document"
                                        >
                                            {deleting === doc.source ? (
                                                <svg className="h-3 w-3 animate-spin text-destructive" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                </svg>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Ingestion Confirmation Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, source: null })}
                onConfirm={() => {
                    if (confirmModal.source) {
                        executeDelete(confirmModal.source);
                    }
                }}
                title="Delete Document"
                message={`Are you sure you want to delete ${confirmModal.source}?`}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
