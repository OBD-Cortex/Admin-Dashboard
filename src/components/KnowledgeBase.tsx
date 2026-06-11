'use client';

import React, { useState, useEffect } from 'react';
import { getKnowledgeBase, deleteKnowledgeDocument } from '@/app/actions';
import { useToast } from '@/components/Toast';

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

    const handleDelete = async (source: string) => {
        if (!confirm(`Are you sure you want to delete ${source}?`)) return;
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 gap-3 font-mono">
                <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-[10px] font-bold tracking-widest uppercase">LOADING KNOWLEDGE SEGMENTS...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                <svg className="h-4 w-4 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
                <h2 className="text-xs font-bold tracking-widest uppercase text-white">KNOWLEDGE REPOSITORY</h2>
            </div>
            
            <div className="border border-neutral-900 bg-black overflow-hidden">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-dashed border border-neutral-800 m-4 bg-neutral-950/20">
                        <svg className="h-8 w-8 text-neutral-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <h3 className="font-bold text-xs text-white uppercase tracking-wider">No assets ingested</h3>
                        <p className="text-[10px] text-neutral-500 mt-1 uppercase max-w-sm leading-relaxed">
                            Upload manuals (PDF), DTC tables (CSV), or diagnostic guidelines using the "Ingest" action.
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-900 text-neutral-400 font-bold uppercase tracking-wider text-[10px] bg-neutral-950/40">
                                <th className="p-3">Source File</th>
                                <th className="p-3">Type</th>
                                <th className="p-3">Ingested Chunks</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                            {documents.map((doc) => (
                                <tr key={doc.source} className="hover:bg-neutral-950/40 transition-colors">
                                    <td className="p-3 font-semibold text-white truncate max-w-[250px] select-all">
                                        {doc.source}
                                    </td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center border border-neutral-800 bg-neutral-950 px-2 py-0.5 text-[9px] font-bold text-neutral-400 uppercase">
                                            {doc.doc_type}
                                        </span>
                                    </td>
                                    <td className="p-3 text-neutral-400">
                                        {doc.chunks} VECTOR SEGMENTS
                                    </td>
                                    <td className="p-3 text-right">
                                        <button
                                            onClick={() => handleDelete(doc.source)}
                                            disabled={deleting === doc.source}
                                            className="inline-flex h-7 w-7 items-center justify-center border border-neutral-800 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                                            title="DELETE DOCUMENT"
                                        >
                                            {deleting === doc.source ? (
                                                <svg className="h-3 w-3 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                            ) : (
                                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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
        </div>
    );
}
