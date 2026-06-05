'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { generateDevices } from '@/app/actions';

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
            const res = await generateDevices(count);

            if (res.error) {
                setError(res.error);
                setLoading(false);
                return;
            }

            onGenerated(res.data);
            onClose();
        } catch (err) {
            setError('Network error. Please try again.');
            setLoading(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Provision New Devices"
            subtitle="Generate new device tokens. Each device receives a unique token for pairing with the OBD-Cortex mobile app."
        >

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
        </Modal>
    );
}
