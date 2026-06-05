'use client';
import React, { useState } from 'react';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function DeviceTable({ devices, onShowQR, onDelete, onUnpair, loading }) {
    const [expandedTokens, setExpandedTokens] = useState({});
    
    const toggleExpand = (token) => {
        setExpandedTokens(prev => ({ ...prev, [token]: !prev[token] }));
    };
    if (loading) {
        return (
            <div className="table-wrapper">
                <div className="loading-state">
                    <div className="loading-spinner" />
                    <div>Loading devices…</div>
                </div>
            </div>
        );
    }

    if (!devices || devices.length === 0) {
        return (
            <div className="table-wrapper">
                <div className="empty-state">
                    <div className="empty-state-icon">⬡</div>
                    <div className="empty-state-title">No devices found</div>
                    <div className="empty-state-text">
                        Generate new devices or adjust your filters.
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="device-table">
                <thead>
                    <tr>
                        <th>Device Token</th>
                        <th>Vehicle</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => {
                        const hasHistory = device.vehicles && device.vehicles.length > 1;
                        const isExpanded = expandedTokens[device.device_token];
                        return (
                        <React.Fragment key={device.device_token}>
                        <tr>
                            <td>
                                <span className="cell-token">{device.device_token}</span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="cell-vin">{device.vin || '—'}</span>
                                        {hasHistory && (
                                            <button 
                                                onClick={() => toggleExpand(device.device_token)}
                                                style={{
                                                    background: 'var(--bg-glass)',
                                                    border: '1px solid var(--border)',
                                                    color: 'var(--text-secondary)',
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                {device.vehicles.length} Cars {isExpanded ? '▲' : '▼'}
                                            </button>
                                        )}
                                    </div>
                                    {device.brand && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {device.brand} {device.model} ({device.year})
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`status-badge ${device.status}`}>
                                    <span className="dot" />
                                    {device.status}
                                </span>
                            </td>
                            <td>
                                <span className="cell-date">
                                    {formatDate(device.created_at)}
                                </span>
                            </td>
                            <td>
                                <div className="cell-actions">
                                    {/* QR Code */}
                                    <button
                                        className="icon-btn"
                                        onClick={() => onShowQR(device.device_token)}
                                        title="View QR code"
                                        aria-label="View QR code"
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
                                            <rect x="3" y="3" width="7" height="7" rx="1" />
                                            <rect x="14" y="3" width="7" height="7" rx="1" />
                                            <rect x="3" y="14" width="7" height="7" rx="1" />
                                            <rect x="14" y="14" width="3" height="3" />
                                            <line x1="21" y1="14" x2="21" y2="14.01" />
                                            <line x1="21" y1="21" x2="21" y2="21.01" />
                                            <line x1="17" y1="18" x2="17" y2="18.01" />
                                        </svg>
                                    </button>

                                    {/* Unpair (Only if device is paired) */}
                                    {device.status === 'paired' && onUnpair && (
                                        <button
                                            className="icon-btn warning"
                                            onClick={() => onUnpair(device.device_token)}
                                            title="Unpair device"
                                            aria-label="Unpair device"
                                            style={{ color: 'var(--accent-amber)', marginRight: '6px' }}
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
                                                <path d="M18.36 6.64a9 9 0 0 1-3.03 12.91M5.64 17.36A9 9 0 0 1 8.67 4.45" />
                                                <line x1="8" y1="16" x2="16" y2="8" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Delete */}
                                    <button
                                        className="icon-btn danger"
                                        onClick={() => onDelete(device.device_token)}
                                        title="Delete device"
                                        aria-label="Delete device"
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
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {isExpanded && hasHistory && (
                            <tr style={{ background: 'var(--bg-card-hover)' }}>
                                <td colSpan="5" style={{ padding: 0 }}>
                                    <div style={{ padding: '16px 24px', fontSize: '12px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Vehicle History:</div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {device.vehicles.map((v, i) => (
                                                <li key={i} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <span className="cell-vin">{v.vin}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{v.brand} {v.model} ({v.year})</span>
                                                    <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                                        Paired: {formatDate(v.paired_at)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
