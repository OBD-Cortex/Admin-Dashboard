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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm font-sans">
            <div className="w-full max-w-sm border border-border bg-card p-6 shadow-2xl rounded-2xl">
                <div className="mb-4">
                    <h3 className="text-base font-bold font-serif tracking-tight text-foreground mb-1">Provision New Nodes</h3>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Generate cryptographic identity tokens for onboarding manufacturer hardware.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="device-count" className="block text-[10px] font-bold text-muted-foreground">
                            Batch Size (1-50)
                        </label>
                        <input
                            id="device-count"
                            type="number"
                            min="1"
                            max="50"
                            value={count}
                            onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                            className="w-full px-3 py-2 text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#223A5E] focus:border-[#223A5E] transition-all rounded-xl font-sans"
                            required
                        />
                        <p className="text-[9px] text-muted-foreground/80">
                            Generates matching keys (e.g. OBD-AAAA-BBBB) per droplet pipeline rules.
                        </p>
                    </div>

                    {error && (
                        <div className="border border-destructive/20 bg-destructive/10 px-3 py-2 text-[10px] text-destructive rounded-xl font-medium">
                            Error: {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="h-8 border border-border bg-background hover:bg-muted px-4 text-[10px] font-bold text-foreground transition-colors cursor-pointer select-none rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || count < 1 || count > 50}
                            className="h-8 bg-[#223A5E] hover:bg-[#223A5E]/90 text-[#FAF8F5] disabled:opacity-50 px-4 text-[10px] font-bold transition-all cursor-pointer select-none flex items-center gap-1.5 rounded-xl"
                        >
                            {loading && (
                                <svg className="h-3 w-3 animate-spin text-[#FAF8F5]" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            <span>Generate</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
