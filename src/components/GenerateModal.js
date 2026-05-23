'use client';

import { useState, useEffect } from 'react';

export default function GenerateModal({ isOpen, onClose, onGenerated }) {
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setCount(1);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: parseInt(count) }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Generation failed');
                setLoading(false);
                return;
            }

            onGenerated(data);
            onClose();
        } catch (err) {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className={`modal-overlay${isOpen ? ' active' : ''}`} onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose} aria-label="Close">
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

                <h2 className="modal-title">Provision New Devices</h2>
                <p className="modal-subtitle">
                    Generate new device tokens. Each device receives a unique token for
                    pairing with the OBD-Cortex mobile app.
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="device-count">
                            Number of Devices
                        </label>
                        <input
                            id="device-count"
                            className="form-input"
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                        />
                        <p className="form-hint">
                            Each device will receive a unique token (e.g. OBD-XKFM-R4PB).
                            Maximum 50 devices per batch.
                        </p>
                    </div>

                    {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <button
                        className="form-submit"
                        type="submit"
                        disabled={loading || count < 1 || count > 50}
                    >
                        {loading ? 'Generating…' : `Generate ${count} Device${count > 1 ? 's' : ''}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
