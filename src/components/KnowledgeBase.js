'use client';
import { useState, useEffect } from 'react';
import { getKnowledgeBase, deleteKnowledgeDocument } from '@/app/actions';

export default function KnowledgeBase({ refreshTrigger }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

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

    const handleDelete = async (source) => {
        if (!confirm(`Are you sure you want to delete ${source}?`)) return;
        setDeleting(source);
        try {
            const res = await deleteKnowledgeDocument(source);
            if (res.success) {
                fetchKnowledge();
            } else {
                alert(res.error || 'Failed to delete document');
            }
        } catch (err) {
            alert('Failed to delete document');
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Knowledge Base
            </h2>
            <div className="table-wrapper">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <div>Loading documents…</div>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon" style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', marginBottom: '8px' }}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <div className="empty-state-title">No documents ingested</div>
                        <div className="empty-state-text">Use the "Ingest Document" button above to upload PDF manuals, DTC CSVs, or text files.</div>
                    </div>
                ) : (
                    <table className="device-table">
                        <thead>
                            <tr>
                                <th>Source File</th>
                                <th>Type</th>
                                <th>Chunks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc) => (
                                <tr key={doc.source}>
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{doc.source}</span>
                                    </td>
                                    <td>
                                        <span className="status-badge" style={{ background: 'var(--bg-glass)' }}>
                                            {doc.doc_type}
                                        </span>
                                    </td>
                                    <td>
                                        <span style={{ color: 'var(--text-muted)' }}>{doc.chunks} chunks</span>
                                    </td>
                                    <td>
                                        <div className="cell-actions">
                                            <button
                                                className="icon-btn danger"
                                                onClick={() => handleDelete(doc.source)}
                                                disabled={deleting === doc.source}
                                                title="Delete document"
                                            >
                                                {deleting === doc.source ? '...' : (
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                        <path d="M10 11v6" />
                                                        <path d="M14 11v6" />
                                                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
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
