'use client';

import React, { useState, useEffect } from 'react';
import { getKnowledgeBase, deleteKnowledgeDocument } from '@/app/actions';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FileText, Trash2, Loader2, Database, AlertCircle } from 'lucide-react';
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
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-medium">Loading knowledge assets...</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1">
                <Database className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-bold tracking-tight">System Knowledge Base</h2>
            </div>
            
            <div className="rounded-md border bg-card overflow-hidden">
                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-dashed border-2 rounded-md m-4">
                        <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                        <h3 className="font-semibold text-sm">No knowledge manual ingested</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                            Click on the "Ingest Document" button in the Dashboard view to upload repair manuals (PDF), error sheets (CSV), or diagnostic guidelines.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Source File</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Ingested Chunks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.source} className="hover:bg-muted/30">
                                    <TableCell className="font-mono text-xs font-semibold max-w-[250px] truncate">
                                        {doc.source}
                                    </TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/10 text-[10px]">
                                            {doc.doc_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs">
                                        {doc.chunks} vector segments
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(doc.source)}
                                            disabled={deleting === doc.source}
                                            className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-500"
                                            title="Delete manual asset"
                                        >
                                            {deleting === doc.source ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}
