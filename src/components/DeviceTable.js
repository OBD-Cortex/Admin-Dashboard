'use client';

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function DeviceTable({ devices, onShowQR, onDelete, loading }) {
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
                        <th>VIN</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map((device) => (
                        <tr key={device.device_token}>
                            <td>
                                <span className="cell-token">{device.device_token}</span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span className="cell-vin">{device.vin || '—'}</span>
                                    {device.brand && (
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
                    ))}
                </tbody>
            </table>
        </div>
    );
}
