'use client';

import React, { useState, useEffect } from 'react';
import { generateDevices } from '@/app/actions';

interface GenerateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (data: any) => void;
}

export default function GenerateModal({ isOpen, onClose, onGenerated }: GenerateModalProps) {
    const [count, setCount] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCount(1);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <div className="w-full max-w-sm border border-neutral-900 bg-black p-6 shadow-2xl">
                <div className="mb-4">
                    <h3 className="text-xs font-bold tracking-widest text-white uppercase mb-1">PROVISION NEW NODES</h3>
                    <p className="text-[10px] text-neutral-500 uppercase leading-relaxed">
                        Generate cryptographic identity tokens for onboarding manufacturer hardware.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="device-count" className="block text-[10px] font-bold text-neutral-400 uppercase">
                            BATCH SIZE (1-50)
                        </label>
                        <input
                            id="device-count"
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-full px-3 py-2 text-xs border border-neutral-900 bg-neutral-950 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 transition-all font-mono"
                            required
                        />
                        <p className="text-[9px] text-neutral-600 uppercase">
                            Generates matching keys (e.g. OBD-AAAA-BBBB) per droplet pipeline rules.
                        </p>
                    </div>

                    {error && (
                        <div className="border border-neutral-900 bg-neutral-950 px-3 py-2 text-[10px] text-neutral-400 uppercase">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="h-8 border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-neutral-400 transition-colors cursor-pointer select-none"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            disabled={loading || count < 1 || count > 50}
                            className="h-8 border border-neutral-850 bg-neutral-950 hover:bg-neutral-900 px-3 text-[10px] font-bold uppercase text-white transition-colors cursor-pointer select-none flex items-center gap-1.5"
                        >
                            {loading && (
                                <svg className="h-3 w-3 animate-spin text-neutral-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            <span>GENERATE</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
